# UI Component Registry — Green Ngoria Supplies Limited

Established: 2026-09-01 (Africa/Nairobi)  
Design System: Industrial Premium / Engineering Editorial  

---

## Baseline Design Tokens

| Token Property | Light Theme Token / Class | Dark Theme Token / Class | Notes |
| :--- | :--- | :--- | :--- |
| **Page Background** | `bg-background` (`140 12% 98%`) | `bg-background` (`158 16% 7%`) | Paper-white light / Deep charcoal-slate dark |
| **Surface (Card)** | `bg-card` (`#ffffff`) | `bg-card` (`158 14% 10%`) | Surface container |
| **Sunken Surface** | `bg-surface-sunken` | `bg-surface-sunken` | Filter bars, code blocks, secondary chips |
| **Borders** | `border-border` / `border-hairline` | `border-border` / `border-hairline` | Subtle neutral hairline borders |
| **Primary Text** | `text-foreground` | `text-foreground` | Heavy contrast text |
| **Muted Text** | `text-muted-foreground` | `text-muted-foreground` | Accessible secondary metadata |
| **Brand Primary** | `text-brand-600` / `bg-brand-600` | `text-brand-400` / `bg-brand-500` | Deep emerald green |
| **Accent Gold** | `text-amber-500` / `bg-amber-500` | `text-amber-400` / `bg-amber-400` | Gold mining and metallurgical badges |

---

## Component Border Radius Baseline

| Tier | Radius Class | Target Elements |
| :--- | :--- | :--- |
| **Form Controls** | `rounded-md` | Inputs, textareas, select menus, dropdown items, compact buttons |
| **Data & Operational** | `rounded-lg` | Data tables, cards, stat panels, modal dialogs, status badges |
| **Marketing & Hero** | `rounded-xl` / `rounded-2xl` | Feature showcases, hero containers, floating process diagrams |

---

## Component Registry

### Button
File: `web/src/components/ui/button.tsx`

| Property | Default Pattern |
| :--- | :--- |
| **Primary Variant** | `bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm` |
| **Secondary Variant**| `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| **Outline Variant**  | `border border-input bg-card hover:bg-accent hover:text-accent-foreground` |
| **Ghost Variant**    | `hover:bg-accent hover:text-accent-foreground` |
| **Radius**           | `rounded-md` |
| **Focus State**      | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |

### Input & Textarea
File: `web/src/components/ui/input.tsx`

| Property | Pattern |
| :--- | :--- |
| **Background** | `bg-card` |
| **Border** | `border border-input shadow-hairline` |
| **Hover State** | `hover:border-brand-500/40` |
| **Focus State** | `focus-visible:ring-2 focus-visible:ring-ring` |
| **Radius** | `rounded-md` |
| **Height** | `h-11` (Input), `min-h-[120px]` (Textarea) |
| **Error State** | `border-destructive focus-visible:ring-destructive` |
| **Label** | `text-sm font-semibold text-foreground`, supports `required` asterisk indicator |

### Badge
File: `web/src/components/ui/badge.tsx`

| Variant | Classes |
| :--- | :--- |
| **Default** | `bg-primary text-primary-foreground` |
| **Secondary** | `bg-secondary text-secondary-foreground` |
| **Outline** | `border border-border text-foreground` |
| **Success** | `bg-success/15 text-success border border-success/30` |
| **Warning** | `bg-warning/15 text-warning border border-warning/30` |
| **Destructive**| `bg-destructive/15 text-destructive border border-destructive/30` |
| **Radius** | `rounded-md` |

### Card & Surface Panels
File: `web/src/components/ui/card.tsx`

| Property | Pattern |
| :--- | :--- |
| **Container** | `rounded-lg border border-border bg-card text-card-foreground shadow-sm` |
| **Header** | `p-6 flex flex-col space-y-1.5` |
| **Title** | `text-xl font-semibold leading-none tracking-tight font-display` |
| **Description** | `text-sm text-muted-foreground` |
| **Content** | `p-6 pt-0` |
| **Footer** | `p-6 pt-0 flex items-center` |

---

## Pattern Enforcement Rules

1. **No Raw Hex Values in Component Code**: Always use semantic tokens (`bg-card`, `text-muted-foreground`, `border-hairline`, `brand-*`).
2. **Tabular Numerals for Engineering Data**: Use `font-mono` / tabular-nums for TPH, assays, quotes, invoices, and reference numbers.
3. **WCAG Contrast Minimums**: Maintain accessible text contrast on both dark and light surfaces.
