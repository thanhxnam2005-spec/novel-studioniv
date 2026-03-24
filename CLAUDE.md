# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev       # Start dev server
pnpm build     # Production build
pnpm lint      # ESLint
```

## Architecture

Novel Studio is a local-first creative writing workspace. All data lives in the browser via IndexedDB (Dexie). There is no backend — the only network calls are to user-configured OpenAI-compatible AI endpoints.

### Stack

- **Next.js 16.2.1** (App Router) + **React 19** + TypeScript 5 (strict)
- **Tailwind CSS 4** with OKLch color tokens, `@custom-variant dark`
- **shadcn/ui** (radix-nova style, lucide icons) — 57 components in `components/ui/`
- **Dexie 4** + `dexie-react-hooks` for IndexedDB with reactive `useLiveQuery`
- **Zustand 5** for ephemeral UI state (chat panel open/close)
- **streamdown** for streaming markdown rendering in chat
- **use-stick-to-bottom** for chat auto-scroll

### Data layer (`lib/db.ts`)

Single Dexie database `novel-studio` with schema versioning (currently v4). Ten entity tables:

**Content:** Novel → Chapter → Scene (hierarchical, `order` field for reordering), Character, Note (all scoped to `novelId`)

**AI:** AIProvider (baseUrl, apiKey), AIModel (per provider), Conversation → ConversationMessage (role, content, optional `reasoning`), ChatSettings (singleton row with `id: "default"`)

Every entity hook lives in `lib/hooks/use-*.ts` and follows the same pattern: `useLiveQuery` for reads, plain async functions for mutations. All mutations auto-set `createdAt`/`updatedAt` and use `crypto.randomUUID()`. Cascading deletes use Dexie transactions.

### AI client (`lib/ai/`)

Custom OpenAI-compatible client — no SDK dependency. `AIClient` class with:
- `chat()` — single completion
- `stream()` — async generator yielding `StreamChunk` (content + reasoning)
- `streamText()` — stream with accumulation callback
- `structured<T>()` — JSON schema response format
- `chatWithTools()` — auto-parsed tool call arguments

Factory: `createAIClient(provider)` accepts either an `AIProvider` (from Dexie) or raw `AIClientConfig`.

Streaming parses SSE manually. The `reasoning` field captures both the `reasoning_content` API field (DeepSeek native) and `<think>`/`<thinking>` XML tags in content (parsed by `parseThinkingTags` in chat-panel.tsx).

Helpers: `prompt()`, `defineTool()`, `defineSchema()` reduce boilerplate.

### Layout

```
SidebarProvider
├── AppSidebar (left, collapsible offcanvas)
├── SidebarInset
│   ├── header (sidebar trigger + breadcrumb + chat toggle)
│   └── page content (flex-1 overflow-auto)
└── ChatPanel (right, 400px, shrink-0, h-svh)
```

`navConfig` in `app-sidebar.tsx` is the single source of truth for routes — the dashboard layout derives `pageTitles` from it.

ChatPanel is ~1000 lines: conversation CRUD, streaming with abort, edit/rerun messages, history dialog, settings dialog, thinking block display. Settings (provider, model, system prompt, temperature) persist to `chatSettings` table in IndexedDB.

### Fonts

Loaded via `next/font/google` in root layout as CSS variables:
- `--font-dm-sans` (body/sans)
- `--font-playfair` (headings/serif)
- `--font-geist-mono` (code/mono)

### Path aliases

`@/*` maps to project root (tsconfig paths). shadcn components import as `@/components/ui/*`.
