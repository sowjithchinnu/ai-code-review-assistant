# AI Code Review Assistant

## Stack
- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Authentication: JWT
- AI: Groq (Llama 3.3 70B)
- Static Analysis: ESLint, Pylint, JSCPD, Prettier
- Complexity: escomplex
- Deployment: Vercel + Render (planned)

## Rules
- Reuse existing components.
- Never create duplicate APIs.
- Keep TypeScript and ESLint clean.
- Preserve the existing architecture.
- Finish requested features completely before stopping.
- Run lint/build after changes whenever possible.
