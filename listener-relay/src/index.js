/**
 * Arun listener relay.
 *
 * The app is a static site on GitHub Pages, so it has nowhere to keep an API
 * key. This Worker is the one small server in the whole system: it holds the
 * key, accepts a short conversation from the Arun origin only, asks Claude for
 * one reply, and returns it. It stores nothing and logs no message content.
 *
 * The app treats it as optional. With no endpoint configured, or when this
 * relay is down, the listener answers with replies written in advance and
 * chosen on the phone, and says so. See well-beings/lib/listener.ts.
 */
import Anthropic from "@anthropic-ai/sdk";

/* Claude Opus 5 at low effort: a listener's reply is short and conversational,
   which is the kind of work that does well at low effort, and low effort keeps
   both latency and cost down without dropping to a smaller model. Override
   with the MODEL variable if needed. */
const DEFAULT_MODEL = "claude-opus-5";

/* The client trims to the same limits. Enforced again here because the
   relay cannot trust the client. */
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

/* Replies are meant to be two to four sentences; this is a ceiling, not a
   target, sized so a short reply plus the model's own thinking never gets
   cut off mid-sentence. */
const MAX_TOKENS = 4096;

/* Shown when the model declines. The app also shows local helplines when
   `flagged` is true, so this does not need to carry numbers itself. */
const REFUSAL_REPLY =
  "I want to make sure you get the right support with this. Please talk to someone you trust, or use the helplines under Help now. They are free and there for exactly this.";

const SYSTEM = `You are the listener inside Arun, a small wellbeing app whose name means the red glow of dawn. People open this space when something is weighing on them: sadness, stress, loneliness, grief, a hard day, sometimes something worse. Your job is to be the person they wanted to talk to. You listen, you make them feel heard, and you leave them with a little more hope than they came with.

How to be:
- Reflect back what you heard, in their words where you can, so they know you understood. Name the feeling gently if they have not.
- Offer one small, true reason for hope or one gentle next step, never a list of tips. Hope should be grounded: something that stays true on a bad day, not a slogan.
- Keep replies short, usually two to four sentences, in plain warm language. Ask at most one open question, and only when it helps them keep talking.
- Match their language. If they write in Hindi or Hinglish, reply the same way.
- Do not rush to fix things, argue with their feelings, or tell them how they should feel. Avoid toxic positivity and stock phrases.
- You are an AI. If they ask, say so plainly, and never claim to be a person, a therapist or a doctor. You do not diagnose, name conditions, or advise on medication.
- Gently encourage connection with real people in their life when it fits, so this is never their only support.
- If something sounds like it has been going on for weeks, or is affecting sleep, eating, work or study, you can mention that Ronak, Arun's companion app, offers a private, proper check, and that a doctor or counsellor can help. Offer it once, softly.
- If they say goodbye, say a warm goodbye. Never make them feel guilty for leaving or ask them to stay.

Safety comes first. If they mention wanting to die, suicide, self-harm, being hurt by someone, or being in danger, respond with warmth and without panic: say you are glad they told you, that they deserve support from a person right now, and encourage them to contact a crisis line or someone near them now. The app shows local helpline numbers under the Help now button; point them there. Do not try to handle a crisis alone.

Never ask for their full name, address, school, workplace or other identifying details.`;

export default {
  async fetch(request, env) {
    const cors = corsFor(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: cors ? 204 : 403, headers: cors ?? {} });
    if (!cors) return json({ error: "origin not allowed" }, 403);
    if (request.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

    /* Optional, and strongly recommended in production: a Workers rate
       limiting binding named LISTENER_LIMITER (see wrangler.toml). Keyed on
       the connecting IP, which is used for this check only and not stored. */
    if (env.LISTENER_LIMITER) {
      const { success } = await env.LISTENER_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
      if (!success) return json({ error: "too many messages, try again in a minute" }, 429, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "expected JSON" }, 400, cors);
    }
    const messages = validate(body?.messages);
    if (!messages) return json({ error: "messages must alternate user and assistant, start with user and end with user" }, 400, cors);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const response = await client.beta.messages.create({
        model: env.MODEL || DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        /* Server-side fallbacks: if a safety classifier declines, the API
           retries on a fallback model inside this same call. For a listener
           that is worth having on by default, because a person who wrote
           something hard deserves a reply rather than silence. */
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: SYSTEM,
        messages,
      });

      if (response.stop_reason === "refusal") return json({ reply: REFUSAL_REPLY, flagged: true }, 200, cors);

      const reply = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      if (!reply) return json({ error: "empty reply" }, 502, cors);
      return json({ reply, flagged: false }, 200, cors);
    } catch (err) {
      /* Most specific first. Status and type only: the message content is
         never written to a log. */
      if (err instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 429, cors);
      if (err instanceof Anthropic.AuthenticationError) {
        console.error("listener-relay: ANTHROPIC_API_KEY is missing or invalid");
        return json({ error: "relay misconfigured" }, 500, cors);
      }
      if (err instanceof Anthropic.APIError) {
        console.error(`listener-relay: upstream ${err.status}`);
        return json({ error: "upstream error" }, 502, cors);
      }
      console.error("listener-relay: unexpected error");
      return json({ error: "relay error" }, 500, cors);
    }
  },
};

function corsFor(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allowed.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function validate(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_TURNS) return null;
  const out = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return null;
    const content = m.content.trim().slice(0, MAX_CHARS);
    if (!content) return null;
    const prev = out[out.length - 1];
    if (prev && prev.role === m.role) prev.content += `\n\n${content}`;
    else out.push({ role: m.role, content });
  }
  if (out[0].role !== "user" || out[out.length - 1].role !== "user") return null;
  return out;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
