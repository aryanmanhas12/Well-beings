# Arun listener relay

The optional AI listener in Arun needs somewhere to keep an API key, and a
static GitHub Pages site has nowhere. This Cloudflare Worker is that place. It
is the only server in the system, and it is small on purpose:

- It accepts a short conversation (at most 12 turns, 2,000 characters each)
  from the Arun origin only (CORS allow-list).
- It asks Claude (`claude-opus-5`, low effort) for one short reply, with a
  system prompt that keeps it a listener: no diagnosis, no therapy claims,
  crisis lines first, and Ronak offered for anything long-running.
- Server-side refusal fallbacks are on, so a declined request is retried on a
  fallback model instead of leaving someone who just wrote something hard with
  no answer. If the whole chain declines, the app shows helplines.
- It stores nothing and never logs message content. Errors are logged by
  status code only.

Without it, the listener still works: it answers with replies written in
advance and chosen on the phone, and says so. Nothing breaks when this is
down; the app falls back to the on-device replies for that message.

## Deploy

```bash
cd listener-relay
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

Wrangler prints the Worker's URL. Then build the app with it:

```bash
cd ../well-beings
NEXT_PUBLIC_LISTENER_ENDPOINT=https://arun-listener-relay.<you>.workers.dev npm run build
```

For the live site, add `NEXT_PUBLIC_LISTENER_ENDPOINT` to the "Build static
export" step's `env:` in `.github/workflows/deploy.yml`. It is a public URL,
not a secret; the key stays in Cloudflare.

## Before sharing widely

- **Turn on rate limiting.** Uncomment the `[[ratelimits]]` block in
  `wrangler.toml` (check Cloudflare's current syntax first). Without it, one
  visitor could run up the bill.
- **Set a spend limit** on the Anthropic workspace that owns the key.
- **Update the privacy page** if you change the model, the provider or what
  the relay does. It currently says words go to Anthropic to write a reply
  and are not stored by Arun.

## Test locally

```bash
npx wrangler dev
curl -s localhost:8787 -H 'Origin: https://aryanmanhas12.github.io' \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"I had a really rough day"}]}'
```
