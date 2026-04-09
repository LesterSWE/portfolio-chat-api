# portfolio-chat-api

A Google Cloud Function that serves as the backend for the AI chat widget on [lesterdominguez.com](https://lesterdominguez.com). It proxies requests to the Anthropic API and streams responses back to the client.

## How it works

- Accepts `POST` requests with a `messages` array
- Forwards the conversation to Claude with a system prompt about Lester's background
- Streams the response back as Server-Sent Events (SSE)
- Rate limits to 20 requests per IP per hour
- CORS-restricted to `lesterdominguez.com` and `localhost:5173`

## Local development

### Prerequisites

- Node.js 20+
- A Google Cloud account with the `gcloud` CLI installed
- An Anthropic API key

### Setup

```bash
npm install
```

Set your API key:

```bash
export ANTHROPIC_API_KEY=your-key-here
```

### Run locally

```bash
npm run build
npm start
```

The function will be available at `http://localhost:8080`.

### Example request

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What does Lester do?"}]}'
```

## Deployment

```bash
npm run build
npm run deploy
```

Deploys to Google Cloud Functions (gen2) in `us-east1` under the `lester-portfolio-chat` project.

**Required before deploying:**
- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- Active project set (`gcloud config set project lester-portfolio-chat`)
- Billing enabled on the project
- `ANTHROPIC_API_KEY` set in your shell

## Tech stack

- TypeScript
- Google Cloud Functions (gen2)
- Anthropic SDK (`claude-opus-4-6`)
- Server-Sent Events for streaming
