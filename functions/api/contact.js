import { EmailMessage } from "cloudflare:email";

const RECIPIENT = "pastor@lastchristian.com";
const SENDER = "website@lastchristian.com";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const contentType = request.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await request.json()
      : Object.fromEntries(await request.formData());

    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim();
    const subject = String(payload.subject || "").trim();
    const message = String(payload.message || "").trim();
    const company = String(payload.company || "").trim();

    if (company) {
      return jsonResponse({ ok: true, message: "Message sent." });
    }

    if (!name || !email || !subject || !message) {
      return jsonResponse({ ok: false, message: "Please complete every required field." }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ ok: false, message: "Please enter a valid email address." }, 400);
    }

    const rawMessage = buildRawEmail({
      fromName: "Last Christian Ministries Website",
      fromAddress: SENDER,
      replyTo: email,
      subject: `Website Contact: ${subject}`,
      body: [
        "A new message was submitted through the Last Christian Ministries contact form.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        "",
        "Message:",
        message
      ].join("\r\n")
    });

    const emailMessage = new EmailMessage(SENDER, RECIPIENT, rawMessage);
    await env.CONTACT_EMAIL.send(emailMessage);

    return jsonResponse({ ok: true, message: "Your message has been sent." });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        message: "The message could not be sent right now. Please try again in a moment."
      },
      500
    );
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS"
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildRawEmail({ fromName, fromAddress, replyTo, subject, body }) {
  const encodedSubject = encodeHeader(subject);
  const senderName = sanitizeHeaderValue(fromName);
  const senderAddress = sanitizeHeaderValue(fromAddress);
  const replyToValue = sanitizeHeaderValue(replyTo);

  return [
    `From: ${senderName} <${senderAddress}>`,
    `To: ${RECIPIENT}`,
    `Reply-To: ${replyToValue}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body.replace(/\r?\n/g, "\r\n")
  ].join("\r\n");
}

function sanitizeHeaderValue(value) {
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

function encodeHeader(value) {
  const safeValue = sanitizeHeaderValue(value);
  return /[^\x20-\x7E]/.test(safeValue)
    ? `=?UTF-8?B?${btoa(unescape(encodeURIComponent(safeValue)))}?=`
    : safeValue;
}
