// Cloudflare Worker — Little Minds, Big Futures
//
// Serves the static site (via the ASSETS binding) and handles POST /api/lead:
// creates/updates a GoHighLevel contact on Leslie's subaccount, maps child details
// into structured custom fields, and attaches a note as backup.
// Creating the contact with the `new-inquiry` tag fires the Lead Inquiry Auto-Reply workflow.
//
// Secret: env.GHL_PIT — the Little Minds Private Integration token. Set it under
// the Worker's Settings → Variables and secrets (as an encrypted secret). Never commit it.

const GHL_LOCATION_ID = "LB9ohDvUS0nHKwJ9w8wr"; // Little Minds, Big Futures
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

// Branded short links → GHL booking calendars. Lets SMS/email use clean on-brand
// URLs (littlemindsbigfutures.com/book) instead of raw leadconnector links —
// prettier and better for SMS deliverability. Add/repoint calendars here.
const BOOKING_LINKS = {
  // Free consultation calendar
  "/book":       "https://api.leadconnectorhq.com/widget/booking/0d60bsnGsPQOfypyORK7",
  "/schedule":   "https://api.leadconnectorhq.com/widget/booking/0d60bsnGsPQOfypyORK7",
  "/consult":    "https://api.leadconnectorhq.com/widget/booking/0d60bsnGsPQOfypyORK7",
  "/booking":    "https://api.leadconnectorhq.com/widget/booking/0d60bsnGsPQOfypyORK7",
  // Reading assessment calendar
  "/assessment": "https://api.leadconnectorhq.com/widget/booking/CHtiOArmZ1iBRP2wDGEx",
  "/assess":     "https://api.leadconnectorhq.com/widget/booking/CHtiOArmZ1iBRP2wDGEx",
};

// GHL custom field IDs — contact model, Little Minds subaccount
const FIELD_STUDENT_NAME = "hCvYhnw11tKc2t8e1p3v";
const FIELD_STUDENT_AGE  = "LUO3wWfw8X4yThgUY0vS";
const FIELD_PROGRAM      = "aAavyXaaNan5Vz95dycw";
const FIELD_LEARNING_GOALS = "yo8GeHPO1rCaSJGvqXbf";

// Maps form program keys → GHL picklist labels
const PROGRAM_FIELD_VALUES = {
  jumpstart: "Jumpstart (Ages 3-4)",
  leaping:   "Leaping to Literacy (Ages 5-6)",
  soaring:   "Soaring Into Success (Ages 7-8)",
};

const PROGRAM_LABELS = {
  jumpstart: "Jumpstart · Kindergarten Readiness (Ages 3–4)",
  leaping:   "Leaping · Early Literacy (Ages 5–6)",
  soaring:   "Soaring Into Success (Ages 7–8)",
  other:     "Multiple kids / Other",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Canonical origin: force https + apex (drop www). Any http:// or www. request
    // 301s to https://littlemindsbigfutures.com/<same path+query>. Collapses the 3
    // duplicate URL variants Google was flagging as "Alternate page with canonical".
    const CANONICAL_HOST = "littlemindsbigfutures.com";
    if (url.protocol !== "https:" || url.hostname !== CANONICAL_HOST) {
      url.protocol = "https:";
      url.hostname = CANONICAL_HOST;
      url.port = "";
      return Response.redirect(url.toString(), 301);
    }
    // Branded booking short links → 302 to the GHL calendar (trailing slash tolerant).
    const bookingDest = BOOKING_LINKS[url.pathname.replace(/\/$/, "").toLowerCase()];
    if (bookingDest) {
      return Response.redirect(bookingDest, 302);
    }
    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405);
      }
      return handleLead(request, env);
    }
    // Everything else → static assets (the website), with sane caching.
    const res = await env.ASSETS.fetch(request);
    return withCacheHeaders(url, res);
  },
};

// The ASSETS binding serves everything with max-age=0 by default, which disables
// browser caching and tanks repeat-visit performance. Add reasonable cache-control:
// long-lived for static media/styles, short for HTML so content edits still surface.
function withCacheHeaders(url, res) {
  if (!res || res.status >= 400) return res;
  const path = url.pathname.toLowerCase();
  let cc;
  if (/\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|pdf)$/.test(path)) {
    cc = "public, max-age=86400, stale-while-revalidate=604800"; // 1 day (non-hashed names)
  } else if (/\.(css|js)$/.test(path)) {
    cc = "public, max-age=86400, stale-while-revalidate=604800";
  } else {
    cc = "public, max-age=300, must-revalidate"; // HTML / clean URLs
  }
  const out = new Response(res.body, res);
  out.headers.set("cache-control", cc);
  return out;
}

async function handleLead(request, env) {
  if (!env.GHL_PIT) {
    return json({ ok: false, error: "server_not_configured" }, 500);
  }

  let data;
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await request.json();
    } else {
      const fd = await request.formData();
      data = Object.fromEntries(fd.entries());
    }
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const str = (v) => (v == null ? "" : String(v).trim());

  // Honeypot: a hidden "company" field that real users never see/fill. If it has
  // a value, it's a bot — return a fake success so the bot moves on, skip GHL.
  if (str(data.company)) {
    return json({ ok: true });
  }

  const parentName = str(data.parentName);
  const email = str(data.email);
  const phone = str(data.phone);
  const childName = str(data.childName);
  const childAge = str(data.childAge);
  const program = str(data.program);
  const story = str(data.story);

  if (!parentName || !email) {
    return json({ ok: false, error: "missing_required" }, 422);
  }

  // Lead magnet downloads (e.g. the Kindergarten Readiness Checklist) are tagged
  // separately so Leslie can tell a checklist subscriber from a consult request.
  const isLeadMagnet = str(data.formType) === "lead-magnet";

  const parts = parentName.split(/\s+/);
  const firstName = parts.shift();
  const lastName = parts.join(" ");

  const headers = {
    Authorization: `Bearer ${env.GHL_PIT}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Build custom fields — only include fields that have values
  const customFields = [];
  if (childName) customFields.push({ id: FIELD_STUDENT_NAME, field_value: childName });
  if (childAge)  customFields.push({ id: FIELD_STUDENT_AGE,  field_value: Number(childAge) || childAge });
  if (story)     customFields.push({ id: FIELD_LEARNING_GOALS, field_value: story });
  const programFieldValue = PROGRAM_FIELD_VALUES[program];
  if (programFieldValue) customFields.push({ id: FIELD_PROGRAM, field_value: programFieldValue });

  // 1) Upsert the contact — fires the Lead Inquiry Auto-Reply workflow.
  let contactId;
  try {
    const res = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        firstName,
        lastName,
        name: parentName,
        email,
        phone: phone || undefined,
        source: isLeadMagnet ? "Kindergarten Checklist Download" : "Website Contact Form",
        tags: isLeadMagnet
          ? ["website-lead", "lead-magnet", "checklist-download", "source-checklist"]
          : ["new-inquiry", "website-lead", "source-webform"],
        customFields: customFields.length ? customFields : undefined,
      }),
    });
    if (!res.ok) {
      return json({ ok: false, error: "ghl_upsert_failed", status: res.status }, 502);
    }
    const body = await res.json().catch(() => ({}));
    contactId = body?.contact?.id || body?.id;
  } catch {
    return json({ ok: false, error: "ghl_unreachable" }, 502);
  }

  // 2) Attach child details as a note (no custom-field IDs needed → never drops data).
  if (contactId) {
    const noteLines = [
      "— Website consultation request —",
      childName && `Child: ${childName}`,
      childAge && `Age: ${childAge}`,
      program && `Program interest: ${PROGRAM_LABELS[program] || program}`,
      story && `Message: ${story}`,
    ].filter(Boolean);
    if (noteLines.length > 1) {
      try {
        await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
          method: "POST",
          headers,
          body: JSON.stringify({ body: noteLines.join("\n") }),
        });
      } catch {
        // Non-fatal: contact already created and the workflow already fired.
      }
    }
  }

  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
