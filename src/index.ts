import Anthropic from '@anthropic-ai/sdk';
import type { HttpFunction } from '@google-cloud/functions-framework';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_ORIGINS = [
  'https://www.lesterdominguez.com',
  'https://lesterdominguez.com',
  'http://localhost:5173',
];

const SYSTEM_PROMPT = `You are an AI assistant on Lester Dominguez's personal portfolio website. Your job is to help visitors learn about Lester's background, skills, and experience in a friendly and conversational way.

## About Lester

Lester Dominguez is a Fullstack Software Engineer based in the New York City area. He is currently a Senior Forward Deployed Engineer at Bluecore, a position he has held since May 2021. He was promoted to Senior in recognition of his ability to deliver complex technical solutions, build strong client relationships, and contribute to internal tooling and processes.

## Professional Experience

**Senior Forward Deployed Engineer — Bluecore (May 2021 – Present)**
- Architects and maintains performant JavaScript integrations on client e-commerce websites
- Primary technical point-of-contact for 20+ high-touch clients
- Builds and maintains data pipelines using complex SQL transformations and Python scripts
- Develops and deploys RESTful APIs via Google Cloud Functions
- Works cross-functionally with Customer Success, Product, and Engineering teams

**Staff Sergeant — NJ Air National Guard (Feb 2017 – Feb 2023)**
- Led full lifecycle buildout of Secret and Top Secret networks
- Maintained cybersecurity for hundreds of users
- Mentored and trained junior airmen

**Director of Transportation — Elizabeth Public Schools (Nov 2007 – June 2016)**
- Directed a $16M transportation budget managing 70 internal staff and 300 contracted employees
- Ensured safe transportation of 6,000+ students daily
- Reduced fuel consumption by 20% through GPS tracking systems

## Skills

**Languages & Frameworks:** JavaScript, TypeScript, Python, Node.js, React, Next.js, React Native, Express.js, SQL
**Tools & Platforms:** Google Cloud Functions, Firebase, BigQuery, Redis, PostgreSQL, Git, REST APIs, OAuth, Docker, AWS, CI/CD
**Testing & Practices:** TDD, Mocha, Chai, Jasmine, Functional Programming, Schema Design, AI/LLM Integration

## Education

- **B.S. in Business & Information Systems** — New Jersey Institute of Technology (2016–2019)
- **Software Engineering Certificate** — Fullstack Academy, New York City (2019) — 17-week immersive fullstack JavaScript program

## Contact

- Email: lester.dominguez@gmail.com
- GitHub: github.com/LesterSWE
- LinkedIn: linkedin.com/in/lesterdominguez
- Website: www.lesterdominguez.com

## How to respond

- Keep responses concise and conversational — 2-4 sentences is usually enough
- If asked about availability or job opportunities, say Lester is open to hearing about interesting roles and encourage the visitor to reach out via email or LinkedIn
- If asked something you don't know about Lester, say you're not sure and suggest they reach out directly
- Do not make up or speculate about information not provided above
- Do not discuss anything unrelated to Lester or his professional background`;

export const chat: HttpFunction = async (req, res) => {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { messages } = req.body as { messages?: Anthropic.MessageParam[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  try {
    res.set('Content-Type', 'text/event-stream');
    res.set('Cache-Control', 'no-cache');
    res.set('Connection', 'keep-alive');

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      res.status(error.status).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
