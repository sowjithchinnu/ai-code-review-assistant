# AI Code Review Assistant - Frontend Structure Map

**Project Type:** Next.js 16 with React 19, TypeScript, Tailwind CSS v4  
**UI Framework:** shadcn/ui + Base UI  
**Animation:** Framer Motion  
**Icons:** Lucide React  
**Build Date:** Generated 2026-07-17

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Pages & Routes](#pages--routes)
4. [Layout Components](#layout-components)
5. [UI Components](#ui-components)
6. [Services & Utilities](#services--utilities)
7. [Data Flow & Dependencies](#data-flow--dependencies)
8. [Component Composition Patterns](#component-composition-patterns)

---

## Architecture Overview

### Technology Stack
- **Next.js:** v16.2.10 (App Router with dynamic route groups)
- **React:** v19.2.4 (React Compiler enabled)
- **TypeScript:** v5.x
- **Styling:** Tailwind CSS v4 + Framer Motion animations
- **State Management:** React hooks + localStorage (token, user, theme)
- **UI Library:** @base-ui/react, class-variance-authority for variants
- **Icons:** Lucide React (1.24.0) - 40+ icons used across app

### Key Architectural Patterns
- **Client Components:** Heavy use of `"use client"` directive for interactivity
- **Server Components:** Layout hierarchy, metadata management
- **Route Groups:** `(dashboard)` group for authenticated pages layout
- **Error Handling:** Custom error boundaries, API error responses, toast notifications
- **State Management:** Local React state with side effects via useEffect
- **Responsive Design:** Mobile-first with lg: breakpoints (1024px)
- **Animations:** Page transitions with framer-motion fade-in effects

---

## File Structure

```
frontend/
├── app/                                 # Next.js App Router
│   ├── layout.tsx                      # Root layout (fonts, metadata, ToastProvider)
│   ├── globals.css                     # Global styles
│   ├── favicon.ico
│   ├── page.tsx                        # Root page (likely redirects to /login or /dashboard)
│   ├── login/
│   │   └── page.tsx                    # Login page
│   ├── signup/
│   │   └── page.tsx                    # Sign up page
│   ├── forgot-password/
│   │   └── page.tsx                    # Forgot password page
│   ├── reset-password/
│   │   └── page.tsx                    # Reset password page
│   └── (dashboard)/                    # Route group for authenticated pages
│       ├── layout.tsx                  # Dashboard layout wrapper (Sidebar + TopNavbar)
│       ├── dashboard/
│       │   └── page.tsx                # Dashboard home (metrics, stats, charts)
│       ├── new-review/ (removed)
│       ├── reviews/
│       │   └── page.tsx                # Reviews history with table, filters, details panel
│       ├── analysis/
│       │   ├── layout.tsx              # Analysis layout (passthrough)
│       │   └── page.tsx                # Static analysis results & issues
│       ├── projects/
│       │   └── page.tsx                # Projects management (placeholder)
│       └── settings/
│           └── page.tsx                # Settings & preferences (placeholder)
│
├── components/                         # Reusable UI components
│   ├── layout/
│   │   ├── dashboard-layout.tsx        # Main layout container (Sidebar + TopNavbar wrapper)
│   │   ├── sidebar.tsx                 # Navigation sidebar (collapsible, responsive, mobile drawer)
│   │   ├── top-navbar.tsx              # Top navigation bar (search, notifications, user menu, theme toggle)
│   │   └── logo.tsx                    # Logo component (simple "AI" badge)
│   │
│   └── ui/                             # Shadcn-based UI primitives
│       ├── button.tsx                  # Button (variants: default, outline, secondary, ghost, destructive, link)
│       ├── card.tsx                    # Card container (CardHeader, CardTitle, CardDescription, CardContent)
│       ├── input.tsx                   # Text input (Base UI)
│       ├── select.tsx                  # Select dropdown
│       ├── textarea.tsx                # Textarea (min-height: 180px)
│       ├── badge.tsx                   # Badge/pill (variants: default, secondary, destructive, outline, ghost)
│       ├── table.tsx                   # Table primitives (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
│       ├── avatar.tsx                  # Avatar component (with fallback)
│       ├── dropdown-menu.tsx           # Dropdown menu (Base UI Menu)
│       ├── tooltip.tsx                 # Tooltip (Base UI)
│       ├── separator.tsx               # Horizontal separator line
│       ├── dashboard-visuals.tsx       # Specialized dashboard components
│       │   ├── CodeBlock               # Syntax-highlighted code display (theme: slate-950)
│       │   ├── PageTransition          # Framer Motion page entrance animation
│       │   ├── EmptyState              # Centered empty state with icon & action
│       │   ├── TableSkeleton           # Loading skeleton for tables
│       │   └── MetricsSkeleton         # Loading skeleton for metric cards
│       └── toast-provider.tsx          # Toast context + notification system (3.2s auto-dismiss)
│
├── lib/                                # Utilities & configuration
│   ├── api.ts                          # Centralized API client
│   └── utils.ts                        # Helper functions (cn() - tailwind merge)
│
├── services/
│   └── analysis.service.ts             # Analysis API wrapper
│
├── public/                             # Static assets
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── next.config.ts                      # Next.js config
├── postcss.config.mjs                  # PostCSS + Tailwind config
├── components.json                     # Shadcn config
└── eslint.config.mjs                   # ESLint configuration
```

---

## Pages & Routes

### Authentication Pages (Outside Dashboard)
| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `/login` | `app/login/page.tsx` | User login | Implemented |
| `/signup` | `app/signup/page.tsx` | User registration | Implemented |
| `/forgot-password` | `app/forgot-password/page.tsx` | Password reset flow | Implemented |
| `/reset-password` | `app/reset-password/page.tsx` | Confirm password reset | Implemented |

### Authenticated Pages (In Dashboard Route Group)
| Route | File | Component | Purpose |
|-------|------|-----------|---------|
| `/dashboard` | `(dashboard)/dashboard/page.tsx` | DashboardPage | Main analytics hub with metrics, stats, complexity breakdown, submission history |
| `/new-review` | REMOVED | NewReviewPage | Moved submission UI into `/dashboard` |
| `/reviews` | `(dashboard)/reviews/page.tsx` | ReviewsPage | Submission history table with search, filters, details panel |
| `/analysis` | `(dashboard)/analysis/page.tsx` | AnalysisPage | Static analysis results, issues table, documentation |
| `/projects` | `(dashboard)/projects/page.tsx` | ProjectsPage | Project/repo management (placeholder) |
| `/settings` | `(dashboard)/settings/page.tsx` | SettingsPage | Account & preferences (placeholder) |

### Layout Hierarchy
```
Root Layout (layout.tsx)
  ├─ ToastProvider
  │
  ├─ Auth Pages
  │  ├─ /login
  │  ├─ /signup
  │  └─ /forgot-password
  │
  └─ (dashboard) Layout (layout.tsx)
     ├─ Sidebar (navigation)
     ├─ TopNavbar (header)
     └─ Main Content
        ├─ /dashboard
        ├─ /new-review
        ├─ /reviews
        ├─ /analysis
        ├─ /projects
        └─ /settings
```

---

## Layout Components

### 1. DashboardLayout (`components/layout/dashboard-layout.tsx`)
**Client Component** • Core layout wrapper for all authenticated pages

**Props:**
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

**Features:**
- Manages sidebar open/collapsed state
- Responsive: sidebar hidden on mobile, visible on desktop (lg+)
- Updates page title from route-based mapping
- Handles viewport resize events
- Margin adjustment for collapsed sidebar (ml-20 vs ml-64)

**State:**
- `sidebarOpen`: Boolean (desktop: true, mobile: false on route change)
- `sidebarCollapsed`: Boolean (persisted to sidebar component)
- `pathname`: Current route

**Child Components:**
- `Sidebar` (pass sidebarOpen, onClose, onCollapsedChange)
- `TopNavbar` (pass title, onMenuClick, sidebarOpen)
- Main content area with responsive padding

**Tailwind Classes:** min-h-screen, flex, lg:ml-20/64 transitions

---

### 2. Sidebar (`components/layout/sidebar.tsx`)
**Client Component** • Collapsible navigation drawer with mobile support

**Props:**
```typescript
interface SidebarProps {
  isOpen: boolean;                    // Mobile drawer visibility
  onClose: () => void;                // Called when user closes drawer
  onCollapsedChange?: (collapsed: boolean) => void; // Desktop collapse toggle
}
```

**Key Features:**
- **Desktop Behavior:**
  - Always visible, can collapse to icon-only (60px width)
  - Collapse state persisted to localStorage (`sidebar-collapsed`)
  - Toggle button in header
  - Smooth transitions (duration-300)
  
- **Mobile Behavior:**
  - Drawer slides in from left when `isOpen=true`
  - Full-screen overlay with backdrop blur
  - Auto-closes on navigation
  - Prevents body scroll when open
  
**Navigation Items:** Array of 4 primary items (simplified)
  ```typescript
  [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview and analytics" },
    { title: "Reviews", href: "/reviews", icon: FileText, description: "Code review history" },
    { title: "Analysis", href: "/analysis", icon: ScanSearch, description: "Static analysis results" },
    { title: "Settings", href: "/settings", icon: Settings, description: "Application settings" },
  ]
  ```

**Active Item Detection:**
- `isNavItemActive(pathname, href)`: Checks exact match or starts with `{href}/`
- Active styling: primary background + dot indicator + font-medium

**Sections:**
1. **Header** (desktop only): Logo + "Code Review" text + collapse toggle
2. **Navigation** (scrollable): 6 nav items with tooltips
3. **Footer**: Logout button

**Styling:** Collapsible container, gap-3 items, transitions, hover effects

---

### 3. TopNavbar (`components/layout/top-navbar.tsx`)
**Client Component** • Top navigation bar with search, notifications, user menu

**Props:**
```typescript
interface TopNavbarProps {
  title: string;                    // Page title
  onMenuClick: () => void;          // Mobile menu toggle callback
  sidebarOpen: boolean;             // For responsive rendering
}
```

**Layout:**
- Left: Mobile menu button + page title
- Center: Search input (with Search icon)
- Right: Notifications badge + Theme toggle + User dropdown

**Components:**
1. **Mobile Menu Button:** Hidden on lg+, triggers sidebar open
2. **Page Title:** Display route name (e.g., "Dashboard", "New Review")
3. **Search Input:** Placeholder "Search submissions, reviews..."
4. **Notification Bell:** Badge showing count (hardcoded 3)
5. **Theme Toggle:** 
   - Reads from localStorage (`theme`)
   - Applies to `<html>` element classList
   - Shows SunMedium or MoonStar icon
   - Toast notification on toggle
6. **User Dropdown Menu:**
   - Trigger: Avatar with user initials
   - Items: Profile, Settings, Logout
   - Logout clears token + user from localStorage, redirects to /login

**User Object:**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}
// Loaded from localStorage as JSON string
```

**State Management:**
- `theme`: "light" | "dark" (defaults to system preference)
- `user`: User object from localStorage
- `notificationCount`: Hardcoded 3 (placeholder)

---

### 4. Logo (`components/layout/logo.tsx`)
**Presentational Component** • Simple branded logo

**Props:**
```typescript
interface LogoProps {
  className?: string;
  size?: "sm" | "md";     // Default: "md"
}
```

**Render:** Rounded square border container with text "AI"  
**Sizes:** sm (7x7 text-[10px]) | md (8x8 text-[11px])

---

## UI Components

### Form & Input Components

#### Button (`components/ui/button.tsx`)
**Variant System:** CVA-based (Class Variance Authority)

**Variants:**
- `default`: bg-primary, text-primary-foreground
- `outline`: border-border, hover:bg-muted
- `secondary`: bg-secondary
- `ghost`: transparent, hover:bg-muted
- `destructive`: bg-destructive/10, text-destructive
- `link`: text-primary, underline on hover

**Sizes:**
- `default` (h-8, px-2.5)
- `xs` (h-6, smaller text)
- `sm` (h-7, text-[0.8rem])
- `lg` (h-9)
- `icon` (8x8 square)
- `icon-xs`, `icon-sm`, `icon-lg` (icon-specific sizing)

**Base:** @base-ui/react Button primitive

---

#### Input (`components/ui/input.tsx`)
**Base:** @base-ui/react/input  
**Styling:** h-8, rounded-lg, border-input, focus ring-3

**Features:**
- File input support (file:inline-flex styling)
- Placeholder text color
- Disabled state opacity-50
- Dark mode: bg-input/30

---

#### Select (`components/ui/select.tsx`)
**Simple:** HTML `<select>` element styled

**Classes:** h-10, w-full, rounded-lg, border-input, px-3 py-2  
**Dark Mode:** bg-input/30

---

#### Textarea (`components/ui/textarea.tsx`)
**Sizing:** min-h-[180px], w-full  
**Styling:** rounded-xl, border-input, px-3 py-2.5

---

### Data Display Components

#### Card (`components/ui/card.tsx`)
**Exports:** Card, CardHeader, CardTitle, CardDescription, CardContent

**Card:** rounded-[28px], border-border/70, bg-card/80 (semi-transparent)

**Sub-components:**
- `CardHeader`: flex flex-col gap-2, p-6
- `CardTitle`: text-xl font-semibold
- `CardDescription`: text-sm text-muted-foreground
- `CardContent`: p-6 pt-0

---

#### Table (`components/ui/table.tsx`)
**Exports:** Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, TableFooter

**Features:**
- Wrapper div for overflow scrolling
- Standard HTML table semantics
- Hover:bg-muted/50 on rows
- Grid-based column sizing support

---

#### Badge (`components/ui/badge.tsx`)
**Variants:** default, secondary, destructive, outline, ghost, link

**Sizing:** h-5, rounded-4xl (pill shape), px-2 py-0.5

**Default Variant:** bg-primary, text-primary-foreground

---

#### Avatar (`components/ui/avatar.tsx`)
**Placeholder:** AvatarFallback for initials when no image

---

### Navigation & Menus

#### Dropdown Menu (`components/ui/dropdown-menu.tsx`)
**Base:** @base-ui/react/menu

**Exports:**
- DropdownMenu (root)
- DropdownMenuTrigger (with asChild prop)
- DropdownMenuContent
- DropdownMenuGroup
- DropdownMenuLabel
- DropdownMenuItem (with variant: "default" | "destructive")
- DropdownMenuSub
- DropdownMenuSubTrigger
- DropdownMenuSubContent
- DropdownMenuCheckboxItem
- DropdownMenuRadioGroup
- DropdownMenuRadioItem
- DropdownMenuSeparator

**Styling:** Popover z-50, max-h via CSS variable, ring-1 ring-foreground/10

**Menu Item Variants:**
- `default`: hover:bg-accent
- `destructive`: text-destructive, hover:bg-destructive/10

---

#### Tooltip (`components/ui/tooltip.tsx`)
**Base:** @base-ui/react/tooltip

**Exports:** Tooltip, TooltipTrigger, TooltipContent, TooltipProvider

**Usage:** Wrap with TooltipProvider, use disabled={!isCollapsed} for conditional tooltips

---

#### Separator (`components/ui/separator.tsx`)
**Simple:** border-t border-border line divider

---

### Specialized Dashboard Components

#### dashboard-visuals.tsx (`components/ui/dashboard-visuals.tsx`)

##### CodeBlock
**Props:**
```typescript
interface CodeBlockProps {
  code: string;
  language?: string;        // Default: "ts"
  title?: string;          // Default: "{language} snippet"
  className?: string;
}
```

**Features:**
- Custom syntax highlighting (no external lib)
- Highlights: keywords (blue), strings (amber), numbers (violet), comments (emerald)
- Container: rounded-2xl, border-border/60, bg-slate-950 (dark)
- Header bar: uppercase tracking, border-b border-white/10
- Pre/code block: monospace, text-slate-100, leading-6

---

##### PageTransition
**Animation:** Framer Motion fade-in + slide-up  
**Motion Props:**
- `initial`: { opacity: 0, y: 12 }
- `animate`: { opacity: 1, y: 0 }
- `transition`: { duration: 0.25, ease: "easeOut" }

**Usage:** Wraps page main content for entrance animation

---

##### EmptyState
**Props:**
```typescript
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}
```

**Render:** Centered icon (12x12 in primary/10 bg), title, description, optional action button  
**Container:** rounded-[24px], border-dashed, bg-card/60

---

##### TableSkeleton
**Props:** `rows?: number` (default 5)  
**Render:** Animated skeleton rows with gradient shimmer effect (bg-muted, animate-pulse)

---

##### MetricsSkeleton
**Props:** None  
**Render:** 3-column grid of skeleton metric cards

---

### Notification System

#### Toast Provider (`components/ui/toast-provider.tsx`)
**Context:** ToastContext with { toast, dismiss } functions

**Toast API:**
```typescript
toast({
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
})
```

**Features:**
- Auto-dismiss after 3.2s
- Manual dismiss via X button
- Fixed position bottom-right, z-[80]
- Framer Motion entrance/exit animations
- Variant-specific colors:
  - `success`: emerald-500/30 bg, emerald icon
  - `destructive`: destructive/30 bg, alert icon
  - `default`: primary/20 bg, check icon

**Hook:** `useToast()` returns `{ toast }`

---

## Services & Utilities

### API Client (`lib/api.ts`)

**Base Configuration:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
```

**Type Definitions:**
```typescript
export interface AnalysisIssue {
  rule?: string | null;
  severity: string;
  line?: number | null;
  message: string;
}

export interface SubmissionHistoryItem {
  id: number;
  title: string;
  language: string;
  created_at: string;
  aiReviewSummary: string;
  complexity: string;
}

export interface AiReviewItem {
  id: number;
  title: string;
  language: string;
  created_at: string;
  summary: string;
}

export interface LanguageDistributionItem {
  language: string;
  count: number;
}

export interface DashboardMetrics {
  submissions: number;
  aiReviews: number;
  issuesFound: number;
  averageCyclomaticComplexity: number;
  reviewCoverage: number;
  reviewQuality: number;
  releaseReadiness: number;
  complexitySummary: { low: number; medium: number; high: number };
  latestSubmissions: SubmissionHistoryItem[];
  latestAiReviews: AiReviewItem[];
  languageDistribution: LanguageDistributionItem[];
  recentSubmissions: SubmissionHistoryItem[];
}
```

**API Functions:**

1. **fetchAnalysisResults()**
   - Endpoint: `GET /api/submissions/analysis`
   - Returns: `AnalysisIssue[]`
   - Uses token from localStorage for auth

2. **fetchSubmissionHistory(params)**
   - Endpoint: `GET /api/submissions?search=...&language=...&date=...&page=...&limit=...`
   - Params: `{ search?, language?, date?, page?, limit? }`
   - Returns: `{ submissions: SubmissionHistoryItem[], pagination? }`
   - Uses token from localStorage

3. **fetchDashboardMetrics()**
   - Endpoint: `GET /api/dashboard/metrics`
   - Returns: `DashboardMetrics` (with defaults if missing)
   - Uses token from localStorage

4. **createSubmission(payload)**
   - Endpoint: `POST /api/submissions`
   - Method: FormData for files, JSON for paste
   - Payload:
     ```typescript
     {
       title: string;
       language: string;
       code?: string;        // For paste mode
       file?: File | null;   // For upload mode
     }
     ```
   - Returns: `{ success: boolean, message?: string }`

5. **deleteSubmission(submissionId)**
   - Endpoint: `DELETE /api/submissions/{id}`
   - Returns: `{ success: boolean, message?: string }`

**Error Handling:**
- Checks `response.ok` and `data.success`
- Throws Error with `data.message` or default message
- All functions include token auth header if available

---

### Utilities (`lib/utils.ts`)

```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Purpose:** Merge Tailwind classes (handles conflicts via tailwind-merge)  
**Usage:** Apply conditional classes, override defaults

---

### Analysis Service (`services/analysis.service.ts`)

```typescript
export async function getAnalysis() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${API_URL}/api/submissions/analysis`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return response.json();
}
```

**Note:** Duplicates `fetchAnalysisResults()` from api.ts - consider consolidating

---

## Data Flow & Dependencies

### Page Data Loading Patterns

#### Dashboard Page (`/dashboard`)
```
DashboardPage (use client)
  ├─ useEffect: Fetch DashboardMetrics
  │   ├─ fetchDashboardMetrics()
  │   └─ Updates state: metrics
  └─ Render: Stat cards, Overview cards, Complexity breakdown, Latest submissions table
     └─ Components: Badge, Button, PageTransition, CodeBlock, MetricsSkeleton
```

**Metrics Displayed:**
- Submissions count
- AI reviews count
- Issues found
- Average cyclomatic complexity
- Review coverage %
- Review quality %
- Release readiness %
- Complexity distribution (low/medium/high)

---

#### New Review Page (`/new-review`)
```
NewReviewPage (use client)
  ├─ State:
  │   ├─ title: string
  │   ├─ language: string (default: "JavaScript")
  │   ├─ inputMode: "paste" | "file"
  │   ├─ code: string (default code snippet)
  │   ├─ selectedFile: File | null
  │   ├─ isSubmitting: boolean
  │   └─ error: string | null
  │
  ├─ On Submit:
  │   └─ createSubmission(payload)
  │       ├─ If success: Toast + navigate to /analysis
  │       └─ If error: Show error toast + set error message
  │
  └─ Render:
      ├─ Header section (gradient bg, title, badge)
      ├─ Form Card with:
      │   ├─ Title input
      │   ├─ Language select
      │   ├─ Paste vs Upload toggle buttons
      │   ├─ Code textarea or file input
      │   └─ Submit button
      └─ Helper text (contextual based on inputMode)
```

**Language Options:** JavaScript, TypeScript, Python, Java, Go, Rust, C++, C, Other

---

#### Reviews Page (`/reviews`)
```
ReviewsPage (use client)
  ├─ State:
  │   ├─ submissions: SubmissionHistoryItem[]
  │   ├─ search: string
  │   ├─ language: "all" | string
  │   ├─ dateOrder: "newest" | "oldest"
  │   ├─ page: number
  │   ├─ pagination: PaginationData | null
  │   ├─ selectedSubmission: SubmissionHistoryItem | null
  │   ├─ isLoading: boolean
  │   ├─ error: string | null
  │   └─ activeTab: "summary" | "findings" | "docs"
  │
  ├─ useEffect (debounced, 250ms):
  │   └─ fetchSubmissionHistory({ search, language, date, page, limit: 10 })
  │       └─ Updates: submissions, pagination, selectedSubmission
  │
  ├─ Events:
  │   ├─ Click row: setSelectedSubmission
  │   ├─ Delete: handleDeleteSubmission → confirm → deleteSubmission()
  │   └─ Filter changes: reset page to 1
  │
  └─ Render:
      ├─ Header (title, badges)
      ├─ Filters row (search, language dropdown, date order)
      ├─ Submissions table
      │   └─ Columns: Title, Language, Date, Complexity, Delete button
      └─ Details panel (right side, xl:)
          ├─ Complexity score card
          ├─ AI summary section
          ├─ Tabs: Summary | Findings | Docs
          └─ Code sample display
```

---

#### Analysis Page (`/analysis`)
```
AnalysisPage (use client)
  ├─ State:
  │   ├─ issues: AnalysisIssue[]
  │   ├─ isLoading: boolean
  │   ├─ error: string | null
  │   └─ activeTab: "issues" | "docs" | "sample"
  │
  ├─ useEffect:
  │   └─ fetchAnalysisResults()
  │       └─ Updates: issues, error
  │
  └─ Render:
      ├─ Header (title, badge)
      ├─ Summary cards (3):
      │   ├─ Critical issues count
      │   ├─ Warnings count
      │   └─ Coverage %
      ├─ Tabs: Issues | Documentation | Sample Code
      ├─ Issues table (if issues.length > 0)
      │   └─ Columns: Severity badge, Rule, Line, Message
      ├─ Documentation links (3 hardcoded items)
      └─ CodeBlock display (sample code)
```

---

### Authentication State

**Storage:** localStorage
- `token`: JWT/auth token (string)
- `user`: User object (JSON)
- `theme`: "light" | "dark" (string)
- `sidebar-collapsed`: "true" | "false" (string)

**Flow:**
1. Login page stores token + user
2. TopNavbar reads user for display
3. All API calls include `Authorization: Bearer ${token}` header
4. Logout clears token + user, redirects to /login

---

### Navigation Flow

```
┌─────────────────────────────────────────┐
│ Sidebar Navigation (6 items)            │
├─────────────────────────────────────────┤
│ /dashboard      → DashboardPage         │
│ /projects       → ProjectsPage          │
│ /reviews        → ReviewsPage           │
│ /new-review     → NewReviewPage         │
│ /analysis       → AnalysisPage          │
│ /settings       → SettingsPage          │
│ Logout          → /login                │
└─────────────────────────────────────────┘

NewReviewPage → (on submit success) → AnalysisPage
```

---

## Component Composition Patterns

### Pattern 1: Page with Metrics & Table
**Used by:** DashboardPage, ReviewsPage, AnalysisPage

```typescript
export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await apiFunction();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <PageTransition className="space-y-6">
      {/* Header section with gradient */}
      <div className="rounded-[28px] border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6">
        {/* Title + Badge */}
      </div>

      {/* Content */}
      {loading ? <MetricsSkeleton /> : error ? <ErrorBox /> : <Content />}
    </PageTransition>
  );
}
```

---

### Pattern 2: Form Page
**Used by:** NewReviewPage

```typescript
export default function FormPage() {
  const [formData, setFormData] = useState({/* ... */});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Validate
    if (!formData.title.trim()) {
      setError("Title required");
      return;
    }
    // Submit
    setIsSubmitting(true);
    try {
      await apiFunction(formData);
      toast({ title: "Success", variant: "success" });
      router.push("/next-page");
    } catch (err) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageTransition className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Title</CardTitle>
          <CardDescription>Helper text</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form fields */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Loading..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
```

---

### Pattern 3: Mobile Responsive Layout
**Used by:** DashboardLayout, Sidebar, TopNavbar

```typescript
// Desktop/Mobile Classes
<div className="hidden lg:block">Desktop only</div>
<div className="lg:hidden">Mobile only</div>

// Responsive Margin
<div className="lg:ml-20"> {/* collapsed */}
  <div className="lg:ml-64"> {/* expanded */}
</div>

// Responsive Columns
<div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
  {/* Mobile: 1 column, Desktop: 2 columns with ratio 1.3:0.9 */}
</div>
```

---

## Key Refactoring Considerations

### 1. State Management
- **Current:** React hooks + localStorage
- **Opportunities:**
  - Extract user/auth state to context (avoid prop drilling)
  - Create custom hooks for data fetching (reduce boilerplate in pages)
  - Consider React Query / SWR for API caching

### 2. Component Organization
- **Current:** Layout components separate, UI components grouped
- **Opportunities:**
  - Extract filter logic into reusable FilterBar component
  - Create shared "DataTable" wrapper for table pages
  - Consolidate page header (gradient + title + badge) into reusable PageHeader

### 3. Duplications
- `getAnalysis()` in services/analysis.service.ts duplicates `fetchAnalysisResults()` in lib/api.ts
- Multiple pages use similar data loading + loading/error/empty states
- Recommend: Create `useApiData(fetchFn)` hook to standardize

### 4. Responsive Design
- Heavy use of ad-hoc responsive classes
- Recommend: Create responsive variants for common patterns (e.g., TwoColumnLayout)

### 5. Type Safety
- API response types are defined but pages don't use strict typing on state
- Recommend: Add type annotations to all useState generics

### 6. Testing Gaps
- No test files for components
- Recommend: Set up Vitest + React Testing Library

### 7. Accessibility
- Limited ARIA labels in interactive elements
- Recommend: Add aria-label, aria-expanded, role attributes

---

## Icon Usage Summary

**Lucide Icons** (40+ across app):
- Navigation: LayoutDashboard, FolderKanban, FileText, Settings, ScanSearch, Sparkles
- Actions: LogOut, Menu, Search, Bell, Plus, Trash2, Download
- Status: CheckCircle2, AlertTriangle, AlertCircle, Bug, Shield
- UI: ChevronLeft, ChevronRight, ChevronDown, X, ArrowUpRight
- Content: Code2, BookOpen, CalendarDays, Gauge, Activity, Clock3
- Theme: SunMedium, MoonStar
- File: FileCode2, FileUp, UploadCloud, ArrowRight
- Analysis: Bot, ScanSearch

---

## Dependencies Deep Dive

### UI & Components
- `@base-ui/react` (v1.6.0) - Unstyled accessible components (Button, Input, Menu, Tooltip)
- `shadcn/ui` (v4.13.0) - Styled component presets via copy-paste

### Styling
- `tailwindcss` (v4) - Utility-first CSS framework
- `@tailwindcss/postcss` (v4) - PostCSS support
- `class-variance-authority` (v0.7.1) - Component variant management (CVA)
- `tailwind-merge` (v3.6.0) - Merge conflicting Tailwind classes
- `clsx` (v2.1.1) - Conditional className builder

### Animation
- `framer-motion` (v12.42.2) - React animation library (PageTransition, toast animations)

### Icons
- `lucide-react` (v1.24.0) - Icon library

### Utilities
- `next` (v16.2.10) - Framework
- `react` (v19.2.4) - UI library with compiler support
- `react-dom` (v19.2.4) - DOM rendering

---

## Development Workflow

### Build & Dev
```bash
npm run dev       # Development server (localhost:3000)
npm run build     # Production build
npm start         # Production server
npm run lint      # ESLint check
```

### Key Config Files
- `tsconfig.json` - TypeScript strict mode enabled
- `next.config.ts` - Next.js settings
- `tailwind.config.js` - Tailwind v4 settings
- `components.json` - shadcn/ui component registry
- `eslint.config.mjs` - ESLint rules

---

## Summary

This frontend is a **modern Next.js dashboard** with:
- ✅ Clean component hierarchy (layout + UI primitives)
- ✅ Strong TypeScript support
- ✅ Responsive design (mobile-first)
- ✅ Rich animations (Framer Motion)
- ✅ Comprehensive UI library (Base UI + shadcn)
- ⚠️ Opportunity: Consolidate duplicate API calls
- ⚠️ Opportunity: Extract common patterns into hooks/components
- ⚠️ Opportunity: Add comprehensive testing

