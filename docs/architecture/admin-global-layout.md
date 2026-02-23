# Admin Global Layout Structure

Full layout architecture for the BlackhawkBraids NEON COMMAND GRID admin dashboard.  
Design tokens: [`docs/design-system/neon-command-grid.md`](../design-system/neon-command-grid.md)  
Backend & WebSocket details: [`docs/architecture/ai-admin-dashboard.md`](./ai-admin-dashboard.md)

---

## Table of Contents

1. [Component Tree](#component-tree)
2. [File Structure](#file-structure)
3. [AdminRootLayout](#adminrootlayout)
4. [SidebarNavigation](#sidebarnavigation)
5. [TopCommandBar](#topcommandbar)
6. [MainDashboardGrid](#maindashboardgrid)
7. [Panel Specifications](#panel-specifications)
   - [SystemStatusPanel](#1-systemstatuspanel)
   - [RevenuePanel](#2-revenuepanel)
   - [InventoryPanel](#3-inventorypanel)
   - [ProductionPanel](#4-productionpanel)
   - [PricingPanel](#5-pricingpanel)
   - [UpsellPanel](#6-upsellpanel)
   - [SecurityPanel](#7-securitypanel)
   - [QAPanel](#8-qapanel)
   - [DevOpsPanel](#9-devopspanel)
   - [ContentEnginePanel](#10-contentenginepanel)
8. [NotificationCenter](#notificationcenter)
9. [AIControlCenter](#aicontrolcenter)
10. [PanelCard (shared component)](#panelcard-shared-component)
11. [WebSocket Integration](#websocket-integration)
12. [Role Protection](#role-protection)
13. [Mobile Admin Mode](#mobile-admin-mode)
14. [UX Behavior Rules](#ux-behavior-rules)

---

## Component Tree

```
AdminRootLayout (app/admin/layout.tsx)
│
├── Starfield          ← fixed canvas particle layer (z-index: 0)
├── GridBackground     ← animated tactical grid (CSS ::before, z-index: 0)
│
├── SidebarNavigation  ← left vertical glowing rail
│
├── div.admin-main     ← flex column, takes remaining width
│   ├── TopCommandBar  ← sticky top command bar
│   └── MainDashboardGrid
│       ├── SystemStatusPanel
│       ├── RevenuePanel
│       ├── InventoryPanel
│       ├── ProductionPanel
│       ├── PricingPanel
│       ├── UpsellPanel
│       ├── SecurityPanel
│       ├── QAPanel
│       ├── DevOpsPanel
│       └── ContentEnginePanel
│
└── NotificationCenter ← slide-in drawer from right (portal)
```

---

## File Structure

```
app/
  admin/
    layout.tsx                  # AdminRootLayout — JWT guard + shell
    page.tsx                    # Dashboard home — renders MainDashboardGrid
    ai-controls/
      page.tsx                  # AIControlCenter — full-page control panel
    revenue/
      page.tsx
    security/
      page.tsx
    qa/
      page.tsx
    devops/
      page.tsx
    production/
      page.tsx
    inventory/
      page.tsx
    pricing/
      page.tsx
    upsell/
      page.tsx
    content/
      page.tsx
    logs/
      page.tsx

components/
  admin/
    effects/
      Starfield.tsx             # Canvas starfield (see design-system doc)
    layout/
      Sidebar.tsx               # SidebarNavigation
      TopBar.tsx                # TopCommandBar
      DashboardGrid.tsx         # MainDashboardGrid responsive CSS grid
    shared/
      PanelCard.tsx             # Glassmorphism panel wrapper
      StatusIndicator.tsx       # Animated neon status dot
      MetricCard.tsx            # Single KPI card with label + value
      Sparkline.tsx             # 64×24 mini area chart
      NotificationDrawer.tsx    # NotificationCenter slide-in
      AgentToggle.tsx           # Enable/disable toggle for AI agents
    panels/
      SystemStatusPanel.tsx
      RevenuePanel.tsx
      InventoryPanel.tsx
      ProductionPanel.tsx
      PricingPanel.tsx
      UpsellPanel.tsx
      SecurityPanel.tsx
      QAPanel.tsx
      DevOpsPanel.tsx
      ContentEnginePanel.tsx
    ai-controls/
      AIControlCenter.tsx
    hooks/
      useAdminWebSocket.ts      # Shared authenticated WebSocket connection
      usePanel.ts               # Per-panel subscribe/unsubscribe helper
```

---

## AdminRootLayout

**File:** `app/admin/layout.tsx`

The root layout wraps every admin page. It:

1. Validates the JWT and `admin` role server-side before rendering.
2. Redirects unauthenticated or non-admin users to `/login?reason=unauthorized`.
3. Renders the persistent shell: `Starfield`, grid background, `SidebarNavigation`, `TopCommandBar`, and the main content area.
4. Provides the WebSocket context to all child panels via `AdminWsProvider`.

```tsx
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/auth/session';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { TopBar } from '@/components/admin/layout/TopBar';
import { NotificationDrawer } from '@/components/admin/shared/NotificationDrawer';
import { Starfield } from '@/components/admin/effects/Starfield';
import { AdminWsProvider } from '@/components/admin/providers/AdminWsProvider';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyAdminSession();
  if (!session || session.role !== 'admin') {
    redirect('/login?reason=unauthorized');
  }

  return (
    <AdminWsProvider>
      <div className="min-h-screen bg-bg text-neon-white font-body relative overflow-hidden">
        {/* Background layers */}
        <Starfield />
        <div
          className="fixed inset-0 z-0 pointer-events-none
                     bg-grid-tactical bg-[size:48px_48px]
                     animate-grid-scroll opacity-100"
          aria-hidden="true"
        />

        {/* Shell */}
        <div className="relative z-10 flex min-h-screen">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <TopBar session={session} />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>

        {/* Slide-in notification drawer (portal) */}
        <NotificationDrawer />
      </div>
    </AdminWsProvider>
  );
}
```

### Session Token Security

The `admin_token` cookie **must** be set with:

```
Set-Cookie: admin_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/admin
```

The JWT is **never** passed as a URL query parameter (it would be logged by proxies and browser history).

---

## SidebarNavigation

**File:** `components/admin/layout/Sidebar.tsx`

### Visual Spec

| Property | Value |
|----------|-------|
| Width (expanded) | `240 px` |
| Width (collapsed) | `60 px` |
| Background | `rgba(5,5,16,0.90)` + `backdrop-blur(16px)` |
| Right border | `1px solid rgba(0,195,255,0.15)` |
| Right glow | `box-shadow: 4px 0 24px rgba(0,195,255,0.08)` |
| Icon size | `20 × 20 px` |
| Icon color (default) | `rgba(232,244,255,0.45)` |
| Icon color (hover) | `#00c3ff` + `--glow-blue-sm` |
| Active item left border | `3px solid #00c3ff` + `animation: sidebar-active-pulse` |
| Active item background | `rgba(0,195,255,0.08)` |
| Transition | `width 300ms --ease-neon` |

### Navigation Sections

| Section | Icon (Lucide) | Path |
|---------|--------------|------|
| Dashboard Overview | `LayoutDashboard` | `/admin` |
| Product Automation | `Boxes` | `/admin/product-automation` |
| Custom Build Queue | `Wrench` | `/admin/build-queue` |
| Revenue Intelligence | `TrendingUp` | `/admin/revenue` |
| Inventory Forecasting | `PackageSearch` | `/admin/inventory` |
| Production Flow | `Factory` | `/admin/production` |
| Pricing Elasticity | `Tags` | `/admin/pricing` |
| Upsell Intelligence | `Zap` | `/admin/upsell` |
| Security Monitoring | `ShieldAlert` | `/admin/security` |
| QA Testing | `TestTube2` | `/admin/qa` |
| DevOps | `Server` | `/admin/devops` |
| Content Engine | `Megaphone` | `/admin/content` |
| System Logs | `ScrollText` | `/admin/logs` |
| AI Controls | `BrainCircuit` | `/admin/ai-controls` |

### Behavior

- **Hover:** icon transitions to neon blue with `--glow-blue-sm` in `150ms`.
- **Active section:** left `3px` neon blue border animates with `sidebar-active-pulse` keyframe; background tint `rgba(0,195,255,0.08)`.
- **Collapsed mode (< `md`):** labels hidden, only icons visible. Tooltip shows label on hover.
- **Mobile (< `768 px`):** sidebar replaced by bottom navigation bar with the 5 highest-priority links.

---

## TopCommandBar

**File:** `components/admin/layout/TopBar.tsx`

### Visual Spec

| Property | Value |
|----------|-------|
| Height | `56 px` |
| Background | `rgba(5,5,16,0.88)` + `backdrop-blur(16px)` |
| Bottom border | `1px solid rgba(0,195,255,0.12)` |
| Bottom glow | `box-shadow: 0 2px 20px rgba(0,195,255,0.06)` |
| Position | `sticky top-0 z-20` |

### Left Region — Live System Metrics

| Metric | Data Source | Update Frequency |
|--------|-------------|-----------------|
| **Live Revenue Today** | `revenue.snapshot` WS event | 30 s |
| **Active Builds** | `production_queue_update` WS event | Real-time |
| **Inventory Risk Level** | `inventory_risk_update` WS event | Real-time |
| **System Health %** | `agent.status.updated` WS event | 60 s |

Each metric renders as a `MetricCard` in compact form:
- Label in `Exo 2` small, `rgba(232,244,255,0.55)`.
- Value in `Orbitron` medium weight, animated counter on update.
- Color-coded: green if healthy, amber if degraded, red if critical.

### Center Region — Agent Status Dots

Renders one `StatusIndicator` dot (`sm` size) per registered AI agent.  
On hover, a tooltip shows: agent name + last heartbeat timestamp + status label.

### Right Region — Controls

| Control | Description |
|---------|-------------|
| **Emergency Override** | Red button, `Orbitron` label "OVERRIDE". Opens a `ConfirmModal` requiring two-factor confirmation before executing. Visible only to `superAdmin` role. |
| **Notification Bell** | `Bell` icon. Animates `bell-shake` when unread critical alerts exist. Badge counter shows unread count (capped at `99+`). Opens `NotificationCenter` drawer on click. |
| **Theme Toggle** | Switches between `dark` (default NEON) and `dim` (slightly brighter) modes. |
| **Admin Profile** | Avatar/initials + admin email. Opens profile dropdown. |
| **Logout** | `LogOut` icon button. Clears `admin_token` cookie and redirects to `/login`. |

---

## MainDashboardGrid

**File:** `components/admin/layout/DashboardGrid.tsx`

### CSS Grid Layout

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
  padding: 24px;
  align-items: start;
}

/* Force SystemStatusPanel to full width on large screens */
@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .panel--full-width { grid-column: 1 / -1; }
  .panel--half-width { grid-column: span 2; }
}
```

### Panel Arrangement

| Column span | Panel |
|-------------|-------|
| Full width | `SystemStatusPanel` |
| Half width | `RevenuePanel`, `ProductionPanel` |
| Quarter (1 col) | `InventoryPanel`, `PricingPanel`, `UpsellPanel`, `SecurityPanel`, `QAPanel`, `DevOpsPanel`, `ContentEnginePanel` |

---

## Panel Specifications

All panels are wrapped in `PanelCard` (see [PanelCard section](#panelcard-shared-component)).

---

### 1 — SystemStatusPanel

**File:** `components/admin/panels/SystemStatusPanel.tsx`  
**WS events:** `agent.status.updated`, `agent.error.raised`

#### Layout

Full-width row of agent health cards. Each card contains:

- Agent name (`Orbitron` H3)
- `StatusIndicator` (size `lg`)
- Last run timestamp (`Exo 2` small, dimmed)
- Short status message

#### Indicators

| Metric | Description |
|--------|-------------|
| Orchestrator Active | Global agent orchestration status |
| Security Status | PatriotShield last run + active alert count |
| QA Pass Rate | BattleTestAI latest run pass % |
| Deployment State | SkyLaunchOps last deployment status |
| AI Agent Health | Count of agents: operational / warning / critical |

#### Status Color Logic

| Condition | Indicator color |
|-----------|----------------|
| All agents operational | Green glow |
| Agent running / processing | Blue glow |
| ≥ 1 agent warning | Orange |
| ≥ 1 agent critical error | Red glow (strobe) |

---

### 2 — RevenuePanel

**File:** `components/admin/panels/RevenuePanel.tsx`  
**WS events:** `revenue.snapshot`

#### Metrics

| Metric | Description |
|--------|-------------|
| Revenue Today | Animated counter, currency-formatted |
| AOV | Average Order Value |
| Upsell Conversion % | Percentage with trend arrow |
| Top Performing Product | SKU name + revenue contribution |
| Limited Drop Performance | Countdown + units sold / total |

#### Behavior

- Counters animate on every `revenue.snapshot` WebSocket tick (every 30 s).
- Hovering the panel reveals a deeper breakdown table.
- A `Sparkline` in the header shows hourly revenue for today.

---

### 3 — InventoryPanel

**File:** `components/admin/panels/InventoryPanel.tsx`  
**WS events:** `inventory_risk_update`

#### Metrics

| Metric | Description |
|--------|-------------|
| High-Risk SKUs | Count of SKUs with < 7 days stock |
| Days to Depletion | Worst-case SKU — days remaining |
| Reorder Suggestions | Count of pending reorder recommendations |
| Material Usage Forecast | Projected usage for next 30 days |

#### Behavior

- SKUs color-coded: red (≤ 3 days), orange (4–7 days), green (> 7 days).
- Clicking any SKU row opens a **Forecast Modal** with full depletion chart.
- Risk badge in panel header reflects worst active SKU status.

---

### 4 — ProductionPanel

**File:** `components/admin/panels/ProductionPanel.tsx`  
**WS events:** `production_queue_update`

#### Metrics

| Metric | Description |
|--------|-------------|
| Builds in Queue | Active custom build count |
| Rush Orders | Orders flagged rush (highlighted red) |
| Capacity % | Current production capacity (neon progress bar) |
| Estimated Completion Time | Rolling average completion time |
| Bottleneck Warnings | Active bottleneck alerts |

#### Behavior

- Capacity progress bar: blue (< 70 %), orange (70–89 %), red (≥ 90 %).
- Bottleneck warnings pulse with `strobe-red` if critical.
- Rush orders count badge glows red while count > 0.

---

### 5 — PricingPanel

**File:** `components/admin/panels/PricingPanel.tsx`  
**WS events:** none (polling, 5-min interval)

#### Metrics

| Metric | Description |
|--------|-------------|
| Current Price Band | Active price range for hero SKUs |
| Suggested Test Adjustment | ForgeElasticPricing recommended delta |
| Elasticity Risk | Risk level of suggested change |
| Margin Health | Current margin % vs target |
| Conversion Sensitivity | Estimated conversion impact |

#### Behavior

- Small inline trend chart (7-day conversion vs price history).
- Applying a suggestion requires `ConfirmModal` and creates an `AdminAuditEvent`.

---

### 6 — UpsellPanel

**File:** `components/admin/panels/UpsellPanel.tsx`  
**WS events:** `revenue.snapshot` (upsell subset)

#### Metrics

| Metric | Description |
|--------|-------------|
| Current Upsell Attach Rate | % of orders with an upsell item |
| Active Bundles | Count of live bundle offers |
| Performance of Premium Hardware | Revenue from premium-tier add-ons |
| Recommended Rule Changes | Suggestions from ForgeUpsellIntelligence |

---

### 7 — SecurityPanel

**File:** `components/admin/panels/SecurityPanel.tsx`  
**WS events:** `security_alert`

#### Metrics

| Metric | Description |
|--------|-------------|
| Failed Login Attempts | Count in last 24 h |
| Suspicious Activity | Active flagged sessions |
| Stripe Webhook Status | Last webhook received + verification status |
| Rate Limit Alerts | Active rate-limit breach events |

#### Behavior

- Critical alerts (e.g., failed logins > threshold) pulse with `strobe-red`.
- Each alert row shows: timestamp, IP address, severity badge, quick-dismiss button.
- Panel header `StatusIndicator` goes red while any unresolved critical event exists.

---

### 8 — QAPanel

**File:** `components/admin/panels/QAPanel.tsx`  
**WS events:** `qa_failure`

#### Metrics

| Metric | Description |
|--------|-------------|
| Recent Test Failures | Count + most recent failing test name |
| Checkout Flow Status | Pass / fail for each checkout step |
| Regression Alerts | Count of open regressions by severity |
| Coverage % | Current test coverage percentage |

#### Behavior

- Test failure list grouped by severity: critical → high → medium.
- Coverage % displayed as a neon progress bar.
- Clicking a failure opens a detail drawer with stack trace.

---

### 9 — DevOpsPanel

**File:** `components/admin/panels/DevOpsPanel.tsx`  
**WS events:** `deployment_status`

#### Metrics

| Metric | Description |
|--------|-------------|
| Deployment Status | Last deployment: environment, status, time |
| API Health | Response time + error rate |
| Database Health | MongoDB Atlas connection + query latency |
| WebSocket Status | Active connections count + last event timestamp |

#### Behavior

- "Deploy to Production" button triggers pre-flight checks → `ConfirmModal` → `POST /api/admin/devops/deploy`.
- Build log streamed live in a scrollable code block when deployment is `running`.
- Panel locked to read-only during an active deployment.

---

### 10 — ContentEnginePanel

**File:** `components/admin/panels/ContentEnginePanel.tsx`  
**WS events:** none (polling, 10-min interval)

#### Metrics

| Metric | Description |
|--------|-------------|
| Active Campaigns | Count of live marketing campaigns |
| SEO Score | Aggregate SEO score (0–100) |
| Blog Traffic | Visitors today vs yesterday |
| Email Open Rate | Latest campaign open rate % |
| Drop Countdown Status | Time remaining on active limited drops |

---

## NotificationCenter

**File:** `components/admin/shared/NotificationDrawer.tsx`

### Visual Spec

| Property | Value |
|----------|-------|
| Width | `420 px` |
| Slide direction | From right edge |
| Background | `rgba(5,5,16,0.96)` + `backdrop-blur(20px)` |
| Left border | `1px solid rgba(0,195,255,0.20)` |
| Left glow | `box-shadow: -4px 0 32px rgba(0,195,255,0.10)` |
| Open animation | `translateX(100%) → translateX(0)`, `500ms --ease-neon` |
| Close animation | `translateX(0) → translateX(100%)`, `300ms ease-in` |
| z-index | `50` |

### Tabs

| Tab | Badge | WS events that populate it |
|-----|-------|--------------------------|
| Critical Alerts | Red count badge | `security_alert` (critical), `qa_failure` (critical), `agent.error.raised` |
| System Warnings | Orange count badge | `agent.status.updated` (warning), `inventory_risk_update` |
| AI Suggestions | Blue count badge | `ai_suggestion`, `autodev.suggestion.new` |
| Production Alerts | Amber count badge | `production_queue_update`, `deployment_status` |

### Notification Entry

Each entry displays:

| Field | Description |
|-------|-------------|
| Timestamp | Relative time (e.g., "2 min ago") + absolute on hover |
| Agent Source | Agent name in `Orbitron` small |
| Risk Level | Colored badge: Critical / Warning / Info |
| Message | Short description in `Exo 2` |
| Quick Action | Context-sensitive button (e.g., "View Details", "Dismiss", "Override") |

### Behavior

- Unread entries have a left `3px` glow border in the appropriate status color.
- "Mark all read" button at tab header clears unread state.
- Entries scroll within their tab pane; no full-page scroll.
- On mobile: drawer expands to full screen as a sheet; swipe down to dismiss.

---

## AIControlCenter

**File:** `components/admin/ai-controls/AIControlCenter.tsx`  
**Route:** `app/admin/ai-controls/page.tsx`

Full-page control panel. All actions are logged to `AdminAuditEvent` and require `ConfirmModal`.

### Controls

| Control | Component | Description |
|---------|-----------|-------------|
| Enable / Disable Agent | `AgentToggle` | Toggle switch per agent. Disabling requires confirmation. |
| Adjust Aggression Level | Slider (`0–100`) | Controls how aggressively an agent acts on its recommendations. |
| Override Pricing | Form + `ConfirmModal` | Manually set a price override. Expires after N hours. |
| Pause Production Automation | Toggle + `ConfirmModal` | Halts ForgeProductionFlow automation. |
| Force Inventory Recalculation | Button + `ConfirmModal` | Triggers ForgePredictiveInventory immediately. |
| Trigger Manual QA Sweep | Button + `ConfirmModal` | Runs BattleTestAI on demand. |
| Trigger Deployment | Button + `ConfirmModal` (superAdmin only) | Pre-flight → deploy via SkyLaunchOps. |

### Audit Requirement

Every action in this panel generates an immutable `AdminAuditEvent`:

```json
{
  "adminId": "<objectId>",
  "action": "agent.toggle",
  "resourceId": "blackhawkautodev",
  "before": { "enabled": true },
  "after":  { "enabled": false },
  "ipAddress": "...",
  "userAgent": "..."
}
```

---

## PanelCard (shared component)

**File:** `components/admin/shared/PanelCard.tsx`

Every panel is wrapped in `PanelCard`, which provides the consistent glassmorphism shell.

### Props

```tsx
interface PanelCardProps {
  title: string;
  status?: 'operational' | 'active' | 'warning' | 'critical' | 'offline';
  sparklineData?: number[];
  onRefresh?: () => void;
  onExpand?: () => void;
  fullWidth?: boolean;
  halfWidth?: boolean;
  children: React.ReactNode;
}
```

### Rendered Structure

```
PanelCard
├── .panel-corner--tl  (animated corner accent)
├── .panel-corner--tr
├── .panel-corner--bl
├── .panel-corner--br
├── header
│   ├── h2.panel-title          (Orbitron, uppercase)
│   ├── Sparkline               (64×24, shown if sparklineData provided)
│   ├── StatusIndicator         (top-right, md size, shown if status provided)
│   ├── RefreshButton           (icon button, calls onRefresh)
│   └── ExpandButton            (icon button, calls onExpand → fullscreen modal)
└── .panel-body
    └── {children}
```

### CSS

```css
.panel-glass {
  position: relative;
  background: rgba(10, 10, 30, 0.72);
  backdrop-filter: blur(12px) saturate(1.4);
  border: 1px solid rgba(0, 195, 255, 0.18);
  border-radius: 12px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04);
  padding: 20px 24px;
  transition: border-color 200ms ease, box-shadow 200ms ease;
  overflow: hidden;
}
.panel-glass:hover {
  border-color: rgba(0, 195, 255, 0.40);
  box-shadow:
    0 4px 32px rgba(0,0,0,0.55),
    0 0 24px rgba(0,195,255,0.12),
    inset 0 1px 0 rgba(255,255,255,0.06);
}
```

---

## WebSocket Integration

All panels receive real-time updates through a single authenticated WebSocket connection managed by `useAdminWebSocket`.

### Connection

```ts
// components/admin/hooks/useAdminWebSocket.ts
// Connects to /admin/ws — JWT read from HttpOnly cookie during HTTP upgrade.
// Never passes JWT in URL query string.
```

### Event → Panel Mapping

| WS Event | Target Panel(s) |
|----------|----------------|
| `agent.status.updated` | `SystemStatusPanel`, `TopCommandBar` (agent dots) |
| `agent.error.raised` | `SystemStatusPanel`, `NotificationCenter` → Critical Alerts |
| `revenue.snapshot` | `RevenuePanel`, `TopCommandBar` (Revenue Today) |
| `inventory_risk_update` | `InventoryPanel`, `TopCommandBar` (Inventory Risk) |
| `production_queue_update` | `ProductionPanel`, `TopCommandBar` (Active Builds) |
| `security_alert` | `SecurityPanel`, `NotificationCenter` → Critical Alerts |
| `qa_failure` | `QAPanel`, `NotificationCenter` → Critical Alerts |
| `deployment_status` | `DevOpsPanel`, `NotificationCenter` → Production Alerts |
| `ai_suggestion` | `NotificationCenter` → AI Suggestions |

### Panel Subscription

To minimize bandwidth, each panel subscribes only to its relevant events:

```json
{ "event": "admin.subscribe", "payload": { "panels": ["revenue", "security"] }, "ts": "..." }
```

Panels unsubscribe when unmounted:

```json
{ "event": "admin.unsubscribe", "payload": { "panels": ["revenue"] }, "ts": "..." }
```

---

## Role Protection

Three layers enforce admin access:

### Layer 1 — Next.js Edge Middleware

```typescript
// middleware.ts
// Runs on every /admin/* request at the Edge.
// Reads admin_token from HttpOnly cookie (never URL query param).
// Redirects unauthenticated requests to /login?reason=unauthorized.
```

### Layer 2 — Server Component Layout Guard

```typescript
// app/admin/layout.tsx
// Re-validates session + role === 'admin' on every page navigation.
// Redirects non-admin sessions to /login?reason=forbidden.
```

### Layer 3 — API Route Middleware

```typescript
// server/middleware/adminAuth.ts
// Validates JWT on every /api/admin/* request.
// Uses RS256 asymmetric verification (public key only in runtime).
// Attaches req.admin = { id, role, email } for downstream handlers.
```

### Auto-Logout on Token Expiration

The WebSocket server monitors token expiry and sends a `session.expired` event:

```json
{ "event": "session.expired", "payload": { "reason": "token_expired" }, "ts": "..." }
```

The client (`useAdminWebSocket`) handles this event by:
1. Closing the WebSocket connection.
2. Clearing the in-memory session state.
3. Redirecting to `/login?reason=session_expired`.

---

## Mobile Admin Mode

Triggered at viewport width < `768 px`.

| Element | Desktop behavior | Mobile behavior |
|---------|-----------------|-----------------|
| Sidebar | Left rail, collapsible | Hidden; replaced by bottom nav bar (5 links) |
| Top command bar | Full metric strip | Shows only: Revenue Today, System Health %, bell |
| Dashboard grid | Multi-column CSS grid | Single-column stacked panels |
| Notification center | Slide-in from right | Full-screen sheet, swipe down to dismiss |
| Metric values | Full size, side-by-side | Slightly smaller, stacked |
| Hidden panels | All visible | Non-critical panels hidden; "Show All" toggle reveals |
| Critical alerts | Top of grid | Persistent sticky banner at top of viewport |

---

## UX Behavior Rules

These rules are non-negotiable and enforced in every component.

| Rule | Implementation |
|------|---------------|
| **No clutter** | Maximum 5 visible metrics per panel in default view. Overflow hidden behind "Details" expand. |
| **No unreadable numbers** | Minimum font size `13 px`. Metric values minimum `1.125rem`. Currency formatted with `Intl.NumberFormat`. |
| **Smooth transitions** | All state changes use `280ms --ease-neon` transitions minimum. No instant jumps. |
| **Subtle glow** | Glow intensities follow the design token values. No added glow beyond spec. |
| **Clear hierarchy** | Page title > Panel title > Metric label > Supporting text. Font weight and size enforce hierarchy. |
| **Critical alerts always visible** | `SecurityPanel` and `NotificationCenter` unread badge are always in viewport (sticky top bar). Critical `NotificationBanner` renders above `TopCommandBar`. |
| **Override confirmations required** | Every destructive or override action shows `ConfirmModal` before executing. No single-click destructive actions. |
| **All overrides logged** | Every action in `AIControlCenter` and any panel override creates an `AdminAuditEvent`. |
| **Accessible** | All interactive elements have `aria-label`. Status indicators have `aria-label` with text description. Color is never the only status signal — icon + label always accompany. |
