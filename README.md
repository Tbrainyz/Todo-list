# Todo (Next.js)
```
npm install
npm run dev     # http://localhost:3000 — no setup needed, data is saved in your browser
npm test         # tests for the browser storage layer and the API routes
```

**Storage today: your browser only.** Each device keeps its own list in `localStorage`. No sign-in, no shared server list, nothing typed in to identify yourself. The trade-off: clearing your browser's site data or switching devices loses that list.

**Want a shared list across devices later instead?** A MongoDB-backed API already exists and is tested (`app/api/todos/`). To switch to it:
1. Replace the contents of `lib/api.ts` with: `export * from "./remoteApi";`
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI`.
3. Deploy: import the repo into Vercel, add `MONGODB_URI` in Environment Variables, deploy. In MongoDB Atlas > Network Access, allow `0.0.0.0/0` (Vercel's IPs are dynamic).

Going that route makes the list shared by anyone with the URL, since there's still no login — see the project's chat notes on this trade-off before flipping the switch.

See Agents.md for the endpoint/testing rules.
