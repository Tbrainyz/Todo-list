# Todo (Next.js)
```
npm install
cp .env.example .env.local   # add MONGODB_URI (optional in dev)
npm run dev                  # http://localhost:3000
npm test                     # API tests
```
Deploy to Vercel: import the repo, add `MONGODB_URI` in Environment Variables, deploy. In MongoDB Atlas > Network Access allow `0.0.0.0/0` (Vercel uses dynamic IPs).
See Agents.md for the endpoint testing rules.
