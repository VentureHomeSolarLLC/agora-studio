# Agora Studio Site

Venture Home Knowledge Base - Built with Next.js + NextAuth + Tailwind CSS

## Features

- 🔐 Google OAuth (restricted to @venturehome.com)
- 📚 58+ Concepts (knowledge articles)
- ⚡ 6 Engrams (AI skills)
- 🔍 Full-text search
- 🎨 Venture Home brand colors
- 📱 Responsive design

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

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option 2: Self-Hosted

```bash
npm run build
npm start
# or use PM2
pm2 start npm --name "agora-studio" -- start
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
