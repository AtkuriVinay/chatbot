Chatbot Project — Ready Scaffold
================================

What's included
- docker-compose.yml (Postgres + Hasura + n8n)
- hasura/ (schema.sql, policies.sql, action_sendMessage.yaml)
- n8n/ (workflow_send_message.json) — import into n8n after starting
- frontend/ (Vite + React app using Nhost auth + Apollo GraphQL)
- README explains setup steps and env variables

Important placeholders to replace after unzip:
- OPENROUTER_API_KEY (in n8n credentials)
- HASURA_GRAPHQL_ADMIN_SECRET (in docker-compose and n8n)
- Nhost: create project and set VITE_NHOST_BACKEND_URL in frontend/.env

Quick local run (one-liner):
1) Install Docker & Docker Compose v2+
2) cd to the extracted folder
3) docker compose up -d
4) Wait for Hasura and n8n to be ready, then import the n8n workflow and apply Hasura SQL & action metadata.
5) Configure n8n credentials (Hasura admin secret and OpenRouter API key)
6) Frontend: cd frontend && npm install && cp .env.example .env && edit .env -> npm run dev

If you want, I can also create an automated script to apply Hasura metadata via Hasura CLI. Ask me for it.