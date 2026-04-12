# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (includes type checking)
npm run start    # Serve production build (requires build first)
npm run lint     # Run Next.js ESLint
```

No test framework is configured.

## Architecture

**DocAssist** is a mobile-first Next.js 14 (App Router) PWA for Indian clinic WhatsApp automation. It lets doctors manage patient WhatsApp conversations through protocol-based auto-replies and a chat inbox.

### Stack
- **Next.js 14.2** with App Router — all pages use `"use client"` (no server actions yet)
- **Tailwind CSS** + custom component classes in `src/app/globals.css` (`.btn-primary`, `.card`, `.input-field`, `.badge-*`)
- **Framer Motion** for entrance animations (stagger delays 0.05–0.3s)
- **Lucide React** icons throughout
- **All data is mocked** in `src/lib/mockData.ts` — no backend or API exists yet

### Route Structure

```
src/app/
  page.tsx                        # Login/signup landing page
  layout.tsx                      # Root layout + PWA ServiceWorkerRegistrar
  (app)/                          # Route group with shared app shell
    dashboard/page.tsx            # Main inbox: patient list with Recent/Urgent/Unread tabs
    patients/[id]/page.tsx        # Patient detail: Chat + Private Notes tabs
    protocols/page.tsx            # Protocol list with search and toggles
    protocols/new/page.tsx        # Create new protocol form
    settings/page.tsx             # Doctor profile and WhatsApp connection settings
```

### Key Data Model (from `src/lib/mockData.ts`)

```typescript
Doctor        { id, name, specialty, clinicName, phone, email, plan, whatsappConnected }
Patient       { id, name, phone, lastMessage, lastMessageTime, unreadCount, isUrgent, protocolUsed? }
Message       { id, patientId, content, timestamp, sender, type, protocolName? }
Protocol      { id, title, keywords[], replyText, isActive, addToMenu, usageCount, disclaimer }
PrivateNote   { id, patientId, content, timestamp }
```

### Styling Conventions

- Max-width 32rem (`max-w-sm`) — this is a mobile-first app
- Brand color: teal (`#0d9488`); urgent: red (`#ef4444`) — defined in `tailwind.config.ts`
- Safe area insets used for mobile notch/bottom bar via `env(safe-area-inset-bottom)`
- Path alias `@/*` maps to `src/*`

### PWA

- Service worker at `public/sw.js`, registered via `src/components/ServiceWorkerRegistrar.tsx`
- PWA manifest at `public/manifest.json`
- App supports offline use with cached assets
