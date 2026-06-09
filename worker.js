// Cloudflare Worker — Little Minds, Big Futures
//
// Serves the static site (via the ASSETS binding) and handles POST /api/lead:
// creates/updates a GoHighLevel contact on Leslie's subaccount and attaches the
// child details as a note. Creating the contact with the `new-inquiry` tag fires
// the "Lead Inquiry Auto-Reply" workflow (parent email/SMS + internal alert).
//
// Secret: env.GHL_PIT — the Little Minds Private Integration token. Set it under
// the Worker's Settings → Variables and secrets (as an encrypted secret). Never commit it.

const GHL_LOCATION_ID = "LB9ohDvUS0nHKwJ9w8wr"; // Little Minds, Big Futures
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

const PROGRAM_LABELS = {
  jumpstart: "Jumpstart · Kindergarten Readiness (Ages 3–4)",
  leaping: "Leaping · Early Literacy (Ages 5–6)",
  soaring: "Soaring Into Success (Ages 7–8)",
  other: "Multiple kids / Other",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405);
      }
      return handleLead(request, env);
    }
    // Everything else → static assets (the website).
    return env.ASSETS.fetch(request);
  },
};

// TODO (enhancement): once the Little Minds custom-field IDs are pulled from the
// subaccount, map childName→Student Name, childAge→Student Age, program→Program,
// story→Learning Goals via `customFields: [{ id, field_value }]` in the upsert.
// Until then child details ride in the note below so nothing is lost, and the
// upsert stays minimal so an unknown field ID can never block contact creation.

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

  const parts = parentName.split(/\s+/);
  const firstName = parts.shift();
  const lastName = parts.join(" ");

  const headers = {
    Authorization: `Bearer ${env.GHL_PIT}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

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
        source: "Website Contact Form",
        tags: ["new-inquiry", "website-lead"],
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
