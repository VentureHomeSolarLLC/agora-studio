# Agora Studio Site

Venture Home Knowledge Base - Built with Next.js + NextAuth + Tailwind CSS

![Deploy Status](https://github.com/VentureHomeSolarLLC/agora-studio/actions/workflows/deploy.yml/badge.svg)

**Live Site:** https://help.venturehome.com

## Features

- 🔐 Google OAuth (restricted to @venturehome.com)
- 📚 58+ Concepts (knowledge articles)
- ⚡ 6 Engrams (AI skills)
- 🔍 Full-text search
- 🎨 Venture Home brand colors & Bagoss font
- 📱 Responsive design

## Auto-Deployment

Pushes to `main` branch automatically deploy to https://help.venturehome.com via GitHub Actions.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Production Setup

1. Copy `.env.example` to `.env.local`
2. Set up Google OAuth credentials
3. Generate NEXTAUTH_SECRET
4. Configure environment variables

### Environment Variables

```bash
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-domain.com
ALLOWED_DOMAIN=venturehome.com
```

### Build

```bash
npm run build
npm start
```

## Brand Colors

- Charcoal: #231F20
- Yellow: #F7FF96
- Mint: #7AEFB1
- Sage: #B1C3BD
- Off-white: #F3F3EA

## File Structure

```
site/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   └── lib/           # Utilities & auth
├── public/            # Static assets
└── next.config.ts
```

---

*Last auto-deployed: $(date)*
