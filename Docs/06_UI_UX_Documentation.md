# UI/UX Documentation
# PromptNest

**Version:** 2.0  
**Date:** 2026-07-11  
**Frontend:** React 18 + Vite + **Tailwind CSS v4**, Motion (Framer), Phosphor icons

> The authoritative, detailed design extraction lives in `design.md` at the repo
> root. This section summarizes the current **plum, light-first** design system,
> which replaced the earlier dark-only purple theme.

---

## 1. Design System

### 1.1 Color Palette
Design tokens are defined in `src/styles/index.css` (light-first, with dark-mode variants):

| Token | Hex | Usage |
|---|---|---|
| `--color-accent` (plum) | `#714B67` | Primary buttons, links, active states, accent |
| `--color-accent-d` | `#5A3A52` | Accent hover |
| `--color-bg` | `#FFFFFF` | Page background (light) |
| `--color-surface2` | `#F3F4F6` | Subtle surfaces, cards background |
| `--color-border` | `#E5E7EB` | Borders |
| `--color-text` | `#111827` | Primary text |
| `--color-muted` | `#6B7280` | Labels, placeholders, secondary text |
| Dark panels | `#1A1B22` / `#252733` | Dark-mode backgrounds, auth/landing panels |

**Fonts:** Inter Variable (UI/body) + Source Serif 4 Variable (brand & headings).

**Theme:** Light-first with a full **dark mode** (toggle in-app and in docs), via Tailwind's `dark:` variant.

### 1.2 Typography
- **Font family:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Base size:** 14px
- **Line height:** 1.5
- **Heading sizes:** 22px (page), 20px (section), 16px (modal title), 15px (card title)
- **Label size:** 13px
- **Tag/meta size:** 11px-12px

### 1.3 Spacing & Layout
- **Border radius:** `8px` (CSS var `--radius`)
- **Sidebar width:** `240px` (CSS var `--sidebar-width`)
- **Card grid:** `repeat(auto-fill, minmax(320px, 1fr))`
- **Modal max width:** `520px`
- **Padding:** Cards 16px, Main content 24px, Modal 24px

### 1.4 Interactive States
- Buttons: `opacity: 0.5` + `cursor: not-allowed` when disabled
- Buttons: `transition: background 0.15s, opacity 0.15s`
- Active NavLink: `--color-primary` text + `--color-surface-hover` background
- Favorite star: `#f5c518` (yellow) when active, `--color-text-muted` when not

### 1.5 Scrollbar Styling
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
```

---

## 2. Component Library

### 2.1 Button (`components/common/Button.jsx`)

**Props:**
| Prop | Type | Default | Options |
|---|---|---|---|
| variant | string | "primary" | "primary", "danger", "ghost" |
| size | string | "md" | "sm", "md", "lg" |
| disabled | boolean | false | — |
| type | string | "button" | "button", "submit" |
| onClick | function | — | — |
| style | object | {} | Merged last (override) |

**Visual variants:**
- `primary`: Purple background (`#6c63ff`), white text
- `danger`: Red background (`#e05260`), white text
- `ghost`: Transparent, bordered, default text color

**Sizes:**
- `sm`: `6px 12px` padding
- `md`: `8px 16px` padding
- `lg`: `12px 24px` padding

---

### 2.2 Input (`components/common/Input.jsx`)

**Props:** `label`, `type`, `value`, `onChange`, `placeholder`, `required`, `style`

**Renders:** Label above input (if label provided). Full-width input with dark surface background, border, rounded corners.

**Note:** No built-in error state styling — errors are displayed as sibling elements in the parent form.

---

### 2.3 Modal (`components/common/Modal.jsx`)

**Props:** `title` (string), `onClose` (function), `children`

**Behavior:**
- Fixed overlay covers entire viewport
- Content box centered, max-width 520px, scrollable if tall
- Click outside overlay → `onClose()`
- `Escape` key → `onClose()`
- Title bar with × button

---

### 2.4 TagPill (`components/tags/TagPill.jsx`)

**Props:** `name` (string), `onClick` (optional function)

**Renders:** Pill-shaped span with muted text. Cursor changes to pointer if `onClick` provided. Used inside PromptCard to display prompt tags.

---

### 2.5 ProtectedRoute (`components/common/ProtectedRoute.jsx`)

**Wraps:** All authenticated pages  
**Behavior:**
- While `loading === true`: full-screen "Loading..." text
- While `user === null` (after load): `<Navigate to="/login" replace />`
- Otherwise: renders children

---

## 3. Page Layouts

### 3.1 Auth Pages (Login / Register)

```
┌────────────────────────────────────┐
│      (full-screen dark bg)         │
│                                    │
│    ┌──────────────────────────┐    │
│    │    PromptNest           │    │
│    │    ─────────────────     │    │
│    │    [Email input]         │    │
│    │    [Password input]      │    │
│    │    [error if any]        │    │
│    │    [Login button]        │    │
│    │                          │    │
│    │    No account? Register  │    │
│    └──────────────────────────┘    │
│                                    │
└────────────────────────────────────┘
Card: max-width 380px, centered, surface background
```

---

### 3.2 Authenticated Layout

```
┌──────────────────┬─────────────────────────────────────────┐
│   SIDEBAR        │                                         │
│   240px fixed    │   MAIN CONTENT (flex: 1, pad 24px)      │
│                  │                                         │
│  PromptNest     │   [Page content here]                   │
│                  │                                         │
│  > Dashboard     │                                         │
│  > All Prompts   │                                         │
│                  │                                         │
│  GROUPS ────  +  │                                         │
│  [group name]    │                                         │
│  [group name]    │                                         │
│                  │                                         │
│  ─────────────   │                                         │
│  alice           │                                         │
│  [Logout]        │                                         │
└──────────────────┴─────────────────────────────────────────┘
```

---

### 3.3 Dashboard Page

```
Welcome back, alice
Here's an overview of your prompt library.

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│      42      │  │       8      │  │       5      │
│ Total Prompts│  │   Favorites  │  │    Groups    │
└──────────────┘  └──────────────┘  └──────────────┘
  (link → /prompts)  (→ /prompts?is_favorite=true)  (→ /prompts)

[Browse Prompts →]
```

Stat cards are clickable links. Numbers in primary purple.

---

### 3.4 Prompts Page

```
Prompts                                    [+ New Prompt]

┌──────────────────────────────────────────────────────────┐
│ [Search...]  [Group ▼]  [Tag...]  [All ▼]  [Clear]       │
└──────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Title            ★ │  │ Title            ☆ │  │ Title            ☆ │
│ Description        │  │                    │  │                    │
│ ┌──────────────┐  │  │ ┌──────────────┐  │  │ ┌──────────────┐  │
│ │ prompt...    │  │  │ │ prompt...    │  │  │ │ prompt...    │  │
│ └──────────────┘  │  │ └──────────────┘  │  │ └──────────────┘  │
│ [tag] [tag]       │  │ [tag]             │  │                    │
│ Copy Edit Dup Del │  │ Copy Edit Dup Del │  │ Copy Edit Dup Del │
│ Used 3 times      │  │ Used 0 times      │  │ Used 1 time       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

Grid: `repeat(auto-fill, minmax(320px, 1fr))`

---

### 3.5 Prompt Editor Modal (Create / Edit)

```
┌─────────────────────────────────────────────┐
│ New Prompt                              [×]  │
│─────────────────────────────────────────────│
│ Title *                                      │
│ [________________________________]           │
│                                              │
│ Description                                  │
│ [________________________________]           │
│                                              │
│ Prompt Content *                             │
│ [                                ]           │
│ [    textarea 6 rows             ]           │
│ [                                ]           │
│                                              │
│ Group                                        │
│ [No group           ▼]                       │
│                                              │
│ Tags (comma-separated)                       │
│ [python, gpt, coding]                        │
│                                              │
│ [error message if any]                       │
│                                              │
│                       [Cancel]  [Create]     │
└─────────────────────────────────────────────┘
```

---

## 4. Navigation & Routing

| URL | Page | Auth required |
|---|---|---|
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/` | → redirect to `/dashboard` | Yes |
| `/dashboard` | DashboardPage | Yes |
| `/prompts` | PromptsPage | Yes |
| `/prompts?q=...` | PromptsPage with search | Yes |
| `/prompts?group_id=<uuid>` | PromptsPage filtered by group | Yes |
| `/prompts?is_favorite=true` | PromptsPage favorites | Yes |
| `/*` | NotFoundPage (404) | No |

**Route protection:** `ProtectedRoute` wraps the `/` layout route. All child routes are automatically protected.

---

## 5. UX Patterns

### 5.1 Loading States
- Auth context initialization: full-screen "Loading..." while checking token validity
- Prompts list: "Loading..." centered text while fetching
- Form submission buttons: text changes to "Logging in...", "Saving...", "Registering..." and become disabled

### 5.2 Empty States
- No prompts found: "No prompts found." centered with padding
- No groups in sidebar: sidebar groups section is empty (no placeholder)

### 5.3 Error States
- Form errors: red text below form, using `--color-danger`
- Deleted/not-found resources: 404 returned, card disappears on next fetch

### 5.4 Confirmation Dialogs
- Delete prompt: `window.confirm("Delete "<title>"?")`
- No custom modal used — native browser confirm

### 5.5 Sidebar Group Creation (Inline)
1. Click "+" → inline form appears (autoFocus on input)
2. Type name → press Enter or click "Add"
3. New group appended to list without full page reload

### 5.6 Filter Interaction
- All filter controls are controlled components in `PromptsPage` state
- Every change triggers `useEffect` → `fetchPrompts()`
- "Clear" button resets all filters to empty strings
- URL params read on mount to support direct links (e.g., from sidebar group click)

---

## 6. Accessibility Notes (Current State)

| Issue | Status |
|---|---|
| All inputs have `label` elements via `Input` component | Done |
| Buttons have semantic `type` attribute | Done |
| Escape key closes modal | Done |
| Color contrast: text on surface background | Adequate (dark theme) |
| `aria-label` on icon-only buttons (star, ×) | Not implemented |
| Focus management when modal opens | Not implemented |
| Keyboard navigation through cards | Not implemented |
| Screen reader announcements for dynamic content | Not implemented |

---

## 7. Responsive Design

| Breakpoint | Behavior |
|---|---|
| ≥ 1024px | Full two-column layout (sidebar + content) |
| < 768px | Sidebar overlaps content (no collapse implemented in v1) |

**v1 limitation:** The sidebar does not collapse on small screens. Mobile experience is limited. A collapsible sidebar is planned for v2.
