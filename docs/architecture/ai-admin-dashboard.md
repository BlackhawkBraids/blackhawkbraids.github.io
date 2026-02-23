# BlackhawkAICentralCommand — Unified AI Admin Dashboard Architecture

Real-time monitoring and control panel connecting all autonomous agents for BlackhawkBraids.com.

---

## Table of Contents

1. [Admin Route Architecture](#admin-route-architecture)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [Database Schema Additions](#database-schema-additions)
4. [WebSocket Event Design](#websocket-event-design)
5. [Component Structure](#component-structure)
6. [Role Protection Strategy](#role-protection-strategy)
7. [Monitoring Workflow](#monitoring-workflow)
8. [Override Safeguards](#override-safeguards)
9. [Deployment Gate Logic](#deployment-gate-logic)

---

## Admin Route Architecture

### Next.js App Router Structure

```
app/
  admin/
    layout.tsx                      # JWT guard + admin role check wrapper
    page.tsx                        # Dashboard home — AI System Status overview
    ai-status/
      page.tsx                      # AI System Status Panel
    product-automation/
      page.tsx                      # Product Automation Console
      [productId]/
        page.tsx                    # Individual product review/edit
    build-queue/
      page.tsx                      # Custom Build Queue
      [buildId]/
        page.tsx                    # Individual build configuration review
    revenue/
      page.tsx                      # Revenue Intelligence Panel
    security/
      page.tsx                      # Security Monitoring Panel
    qa/
      page.tsx                      # QA Monitoring Panel
    devops/
      page.tsx                      # DevOps Panel
    growth/
      page.tsx                      # Growth Optimization Panel
    autodev/
      page.tsx                      # AutoDev Optimization Suggestions
    audit-log/
      page.tsx                      # Full audit trail
    api/
      admin/
        [...all admin API routes]   # Next.js Route Handlers (see Backend section)
```

### Route Guard — `app/admin/layout.tsx`

The layout wraps every admin page and enforces access before rendering children:

```typescript
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/auth/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyAdminSession();
  if (!session || session.role !== 'admin') {
    redirect('/login?reason=unauthorized');
  }
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  );
}
```

---

## Backend API Endpoints

All endpoints are prefixed `/api/admin` and require `Authorization: Bearer <jwt>` with `role: admin`.

### AI System Status

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/ai/status` | All agent health indicators + last run timestamps |
| `GET` | `/api/admin/ai/logs` | Paginated execution logs across all agents |
| `GET` | `/api/admin/ai/errors` | Active error alerts with severity |
| `POST` | `/api/admin/ai/restart/:agentId` | Manually restart a specific agent |

### Product Automation Console

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/products/pending` | AI-generated products awaiting approval |
| `PUT` | `/api/admin/products/:id/approve` | Approve + push to live |
| `PUT` | `/api/admin/products/:id/edit` | Edit description, SEO fields |
| `DELETE` | `/api/admin/products/:id/reject` | Reject AI-generated product (with confirmation) |
| `GET` | `/api/admin/products/:id/seo-score` | Fetch computed SEO score |

### Custom Build Queue

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/builds/queue` | Pending custom builds |
| `GET` | `/api/admin/builds/:id` | Full configuration JSON for a build |
| `PUT` | `/api/admin/builds/:id/approve` | Approve build → production queue |
| `PUT` | `/api/admin/builds/:id/reject` | Reject flagged build |

### Revenue Intelligence

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/revenue/live` | Current session revenue snapshot |
| `GET` | `/api/admin/revenue/aov` | Average Order Value over time range |
| `GET` | `/api/admin/revenue/upsell` | Upsell conversion rate + top SKUs |
| `GET` | `/api/admin/revenue/drops` | Limited drop performance metrics |

### Security Monitoring

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/security/login-failures` | Failed login attempts log |
| `GET` | `/api/admin/security/checkout-alerts` | Suspicious checkout attempts |
| `GET` | `/api/admin/security/rate-limits` | Rate limit breach events |
| `GET` | `/api/admin/security/stripe-webhooks` | Stripe webhook verification logs |

### QA Monitoring

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/qa/failures` | Current failing test cases |
| `GET` | `/api/admin/qa/regressions` | Regression alerts by severity |
| `GET` | `/api/admin/qa/checkout-tests` | Checkout flow test results |

### DevOps

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/devops/deployments` | Deployment status + build logs |
| `GET` | `/api/admin/devops/env-check` | Environment variable presence check |
| `GET` | `/api/admin/devops/health` | Service health check status |
| `POST` | `/api/admin/devops/deploy` | Trigger deployment (requires confirmation token) |

### Growth Optimization

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/growth/experiments` | Active A/B experiments |
| `GET` | `/api/admin/growth/conversion` | Conversion rate by page |
| `GET` | `/api/admin/growth/email-capture` | Email capture rate |
| `GET` | `/api/admin/growth/drops` | Countdown drop performance |

### AutoDev Suggestions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/autodev/suggestions` | Pending optimization suggestions |
| `PUT` | `/api/admin/autodev/suggestions/:id/dismiss` | Dismiss a suggestion |
| `PUT` | `/api/admin/autodev/suggestions/:id/apply` | Mark suggestion as applied |

### Audit Log

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/audit` | Paginated full audit log |
| `GET` | `/api/admin/audit/:id` | Single audit event detail |

---

## Database Schema Additions

All schemas use Mongoose and extend the existing MongoDB database.

### `AgentLog`

Records every agent execution and its outcome.

```typescript
const AgentLogSchema = new Schema({
  agentId:     { type: String, required: true, index: true },
  agentName:   { type: String, required: true },
  status:      { type: String, enum: ['running', 'success', 'error', 'warn'], required: true },
  message:     { type: String },
  payload:     { type: Schema.Types.Mixed },
  durationMs:  { type: Number },
  triggeredBy: { type: String, enum: ['schedule', 'admin', 'webhook'], default: 'schedule' },
  createdAt:   { type: Date, default: Date.now, index: true },
});
```

### `AdminAuditEvent`

Immutable record of every admin override action.

```typescript
const AdminAuditEventSchema = new Schema({
  adminId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action:     { type: String, required: true },   // e.g. 'product.approve', 'build.reject'
  resourceId: { type: String },
  before:     { type: Schema.Types.Mixed },        // snapshot before change
  after:      { type: Schema.Types.Mixed },        // snapshot after change
  ipAddress:  { type: String },
  userAgent:  { type: String },
  createdAt:  { type: Date, default: Date.now, index: true },
});
// Enforce append-only: reject any attempt to save an existing document
AdminAuditEventSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('AdminAuditEvent records are immutable'));
  }
  next();
});
```

### `AutoDevSuggestion`

Stores optimization suggestions generated by the BlackhawkAutoDev agent.

```typescript
const AutoDevSuggestionSchema = new Schema({
  area:            { type: String, required: true },
  currentLimit:    { type: String, required: true },
  riskLevel:       { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  performanceImpact: { type: String },
  scalabilityImpact: { type: String },
  refactorPlan:    { type: String },
  migrationSteps:  { type: [String] },
  rollbackPlan:    { type: String },
  priority:        { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  status:          { type: String, enum: ['pending', 'applied', 'dismissed'], default: 'pending', index: true },
  createdAt:       { type: Date, default: Date.now },
});
```

### `SecurityEvent`

Captures security-relevant events from PatriotShield.

```typescript
const SecurityEventSchema = new Schema({
  type:       { type: String, enum: ['login_failure', 'checkout_suspicious', 'rate_limit', 'webhook_verify'], required: true, index: true },
  severity:   { type: String, enum: ['info', 'warn', 'critical'], default: 'info' },
  ipAddress:  { type: String, index: true },
  userId:     { type: Schema.Types.ObjectId, ref: 'User' },
  detail:     { type: Schema.Types.Mixed },
  resolved:   { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now, index: true },
});
```

### `DeploymentRecord`

Tracks every deployment action initiated from the dashboard.

```typescript
const DeploymentRecordSchema = new Schema({
  initiatedBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  environment:      { type: String, enum: ['staging', 'production'], required: true },
  confirmationToken:{ type: String, required: true },
  status:           { type: String, enum: ['pending', 'running', 'success', 'failed'], default: 'pending', index: true },
  buildLog:         { type: String },
  startedAt:        { type: Date },
  completedAt:      { type: Date },
  createdAt:        { type: Date, default: Date.now },
});
```

### Extended `Product` Fields

Add the following fields to the existing `Product` schema to support the automation console:

```typescript
// Additional fields on existing Product schema
automationStatus: { type: String, enum: ['draft', 'pending_review', 'approved', 'rejected', 'live'], default: 'live' },
seoScore:         { type: Number, min: 0, max: 100 },
generatedBy:      { type: String },   // agent name that generated this product
approvedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
approvedAt:       { type: Date },
```

---

## WebSocket Event Design

Real-time updates are delivered over a single authenticated WebSocket connection per admin session.

### Connection Handshake

The JWT must **never** be passed in the URL query string (it would be logged by proxies and browser history). Use the `Sec-WebSocket-Protocol` header trick or read it from the `HttpOnly` cookie during the HTTP upgrade:

```
GET /admin/ws HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Cookie: admin_token=<jwt>          ← read by the server during the HTTP upgrade
```

The server validates the JWT and the `admin` role on connection. Unauthenticated connections are immediately closed with code `4401`.

### Event Envelope

Every message follows this envelope format:

```typescript
interface WsEvent {
  event:   string;          // namespaced event name
  payload: unknown;         // event-specific data
  ts:      string;          // ISO 8601 timestamp
}
```

### Event Catalog

| Event | Direction | Description |
|-------|-----------|-------------|
| `agent.status.updated` | Server → Client | An agent changed health state |
| `agent.log.new` | Server → Client | New agent execution log line |
| `agent.error.raised` | Server → Client | Agent produced an error |
| `product.pending.new` | Server → Client | New AI product awaiting approval |
| `build.queued` | Server → Client | New custom build in queue |
| `revenue.snapshot` | Server → Client | Live revenue tick (every 30 s) |
| `security.event` | Server → Client | New security event from PatriotShield |
| `qa.failure` | Server → Client | Test failure detected |
| `devops.deploy.status` | Server → Client | Deployment status change |
| `growth.experiment.update` | Server → Client | A/B experiment metric update |
| `autodev.suggestion.new` | Server → Client | New optimization suggestion |
| `admin.override` | Client → Server | Admin performs an override action |
| `admin.subscribe` | Client → Server | Subscribe to a specific panel's events |
| `admin.unsubscribe` | Client → Server | Unsubscribe from a panel's events |

### Example Payloads

**`agent.status.updated`**
```json
{
  "event": "agent.status.updated",
  "payload": {
    "agentId": "blackhawkautodev",
    "agentName": "BlackhawkAutoDev",
    "status": "error",
    "message": "Failed to connect to MongoDB Atlas",
    "lastSuccess": "2026-02-23T03:45:00.000Z"
  },
  "ts": "2026-02-23T04:00:00.000Z"
}
```

**`revenue.snapshot`**
```json
{
  "event": "revenue.snapshot",
  "payload": {
    "liveRevenue": 4827.50,
    "aov": 68.20,
    "upsellConversionRate": 0.34,
    "topSku": "550-paracord-bracelet-od-green"
  },
  "ts": "2026-02-23T04:00:30.000Z"
}
```

### Panel Subscription

Admins subscribe to individual panel event namespaces to avoid unnecessary traffic:

```json
{ "event": "admin.subscribe", "payload": { "panels": ["revenue", "security"] }, "ts": "..." }
```

---

## Component Structure

```
components/
  admin/
    layout/
      AdminShell.tsx             # Top-level layout: sidebar + header + main
      AdminSidebar.tsx           # Navigation links to all panels
      AdminHeader.tsx            # Admin user info, notifications bell
      NotificationBanner.tsx     # Priority alert banner (critical events)
    shared/
      StatusBadge.tsx            # Animated neon health indicator (green/yellow/red)
      PanelCard.tsx              # Consistent card wrapper with title + actions
      DataTable.tsx              # Sortable/paginated data table
      ConfirmModal.tsx           # Two-step confirmation dialog for destructive actions
      AuditLogViewer.tsx         # Filterable audit log display
      ExportButton.tsx           # CSV/JSON export trigger
    panels/
      AIStatusPanel/
        AIStatusPanel.tsx        # Orchestrates all agent status cards
        AgentCard.tsx            # Individual agent: status badge + last log + restart
        ErrorAlertList.tsx       # Active error alerts with severity colours
      ProductAutomation/
        ProductAutomationPanel.tsx
        PendingProductList.tsx   # List of AI-generated products for review
        ProductEditForm.tsx      # Inline edit: description, SEO fields
        SEOScoreMeter.tsx        # Visual SEO score 0–100
      BuildQueue/
        BuildQueuePanel.tsx
        BuildQueueList.tsx       # Pending builds table
        BuildConfigViewer.tsx    # Full JSON configuration display
      Revenue/
        RevenuePanel.tsx
        RevenueKPIRow.tsx        # Live revenue, AOV, upsell rate
        TopPerformersChart.tsx   # Colors/weaves bar chart
        DropPerformanceCard.tsx  # Limited drop countdown + sales metrics
      Security/
        SecurityPanel.tsx
        SecurityEventFeed.tsx    # Live feed of security events
        LoginFailureTable.tsx
        StripeWebhookLog.tsx
      QA/
        QAPanel.tsx
        TestFailureList.tsx
        RegressionAlertTable.tsx
        CheckoutTestResults.tsx
      DevOps/
        DevOpsPanel.tsx
        DeploymentStatusCard.tsx # Current deploy status + build log stream
        HealthCheckGrid.tsx      # Service health grid
        EnvVarChecklist.tsx      # Required env var presence check
      Growth/
        GrowthPanel.tsx
        ExperimentTable.tsx      # A/B experiment results
        ConversionRateGrid.tsx   # Per-page conversion rates
        EmailCaptureMetric.tsx
      AutoDev/
        AutoDevPanel.tsx
        SuggestionCard.tsx       # Priority badge + refactor plan + apply/dismiss
    hooks/
      useAdminWebSocket.ts       # Shared WebSocket connection + event dispatch
      usePanel.ts                # Subscribe/unsubscribe helper per panel
      useAuditLogger.ts          # Client-side audit event dispatcher
```

---

## Role Protection Strategy

### Layers of Defence

```
Request
  │
  ▼
1. Next.js Middleware (middleware.ts)
   └─ Verify JWT signature on every /admin/* request
   └─ Block unauthenticated requests → redirect /login
  │
  ▼
2. Admin Layout Server Component (app/admin/layout.tsx)
   └─ Re-verify session + role === 'admin'
   └─ Non-admin role → redirect /login?reason=forbidden
  │
  ▼
3. API Route Handler Middleware (server/middleware/adminAuth.ts)
   └─ Re-verify JWT on every /api/admin/* call
   └─ Attach req.admin = { id, role, email } for downstream use
  │
  ▼
4. Controller-level checks
   └─ Confirm specific permission where needed (e.g. only superAdmin can trigger deploy)
```

### `middleware.ts` (Next.js Edge)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtEdge } from '@/lib/auth/edge';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Token is read from an HttpOnly, Secure, SameSite=Strict cookie — never from a query param.
    const token = req.cookies.get('admin_token')?.value;
    const payload = token ? await verifyJwtEdge(token) : null;
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?reason=unauthorized', req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
```

The `admin_token` cookie **must** be set with all three security flags:

```
Set-Cookie: admin_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/
```

- `HttpOnly` — prevents JavaScript access (mitigates XSS token theft)
- `Secure` — transmitted over HTTPS only
- `SameSite=Strict` — prevents CSRF attacks

### `server/middleware/adminAuth.ts`

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
if (!JWT_PUBLIC_KEY) {
  throw new Error('JWT_PUBLIC_KEY environment variable is required');
}

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] }) as {
      id: string;
      role: string;
      email: string;
    };
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    (req as any).admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

---

## Monitoring Workflow

```
Autonomous Agents
  (BlackhawkAutoDev, PatriotShield, BattleTestAI, SkyLaunchOps, …)
       │
       │ emit structured log events
       ▼
AgentLog collection (MongoDB)
       │
       ├──► WebSocket broadcast (agent.log.new / agent.status.updated / agent.error.raised)
       │         │
       │         ▼
       │    AdminDashboard WebSocket client
       │         │
       │         ▼
       │    AIStatusPanel — live health badges + error alerts
       │
       └──► REST polling fallback (GET /api/admin/ai/logs)
                 │
                 ▼
            DataTable with pagination + export
```

### Error Escalation

| Severity | Indicator | Admin Action |
|----------|-----------|-------------|
| `info` | Dim neon blue | No action required |
| `warn` | Amber pulse | Review recommended |
| `error` | Red solid | Immediate attention |
| `critical` | Red strobe + NotificationBanner | Requires acknowledgement before proceeding |

### Health Check Cadence

- Agent heartbeat: every **60 seconds**
- Revenue snapshot broadcast: every **30 seconds**
- Security event stream: **real-time** (event-driven)
- QA test results: pushed on **test run completion**
- DevOps health: polled every **120 seconds**

---

## Override Safeguards

All override actions follow the same three-step pattern:

```
Admin clicks action
       │
       ▼
1. ConfirmModal shown
   "Are you sure you want to [action]? This cannot be undone."
       │  Admin confirms
       ▼
2. Confirmation token generated client-side
   Sent with request body: { confirmationToken: uuid }
       │
       ▼
3. Server validates token presence, records AdminAuditEvent
   { adminId, action, resourceId, before, after, ipAddress, userAgent }
       │
       ▼
4. Action executed
       │
       ▼
5. WebSocket broadcast: admin.override → all other admin sessions
```

### Actions Requiring Confirmation

| Action | Extra Gate |
|--------|-----------|
| `product.approve` → push to live | ConfirmModal |
| `product.reject` | ConfirmModal |
| `build.approve` → production queue | ConfirmModal |
| `build.reject` | ConfirmModal |
| `devops.deploy` → production | ConfirmModal + superAdmin role |
| `agent.restart` | ConfirmModal |

### Audit Log Requirements

- Every row in `AdminAuditEvent` is **append-only** — no updates, no deletes.
- Retained for minimum **90 days**.
- Exportable as CSV from the `/admin/audit-log` panel.
- Searchable by admin, action type, resource ID, and date range.

---

## Deployment Gate Logic

```
Admin clicks "Deploy to Production"
       │
       ▼
1. Pre-flight checks (server-side, blocking)
   ├─ All QA tests passing?               → block if any critical failure
   ├─ No unresolved critical security events? → block if active critical event
   ├─ Environment variables all present?  → block if any required var missing
   └─ No running deployment in progress?  → block if status === 'running'
       │  All checks pass
       ▼
2. ConfirmModal with pre-flight summary shown to admin
       │  Admin confirms
       ▼
3. Confirmation token + admin ID sent to POST /api/admin/devops/deploy
       │
       ▼
4. DeploymentRecord created { status: 'pending', environment: 'production', initiatedBy, confirmationToken }
       │
       ▼
5. AdminAuditEvent recorded { action: 'devops.deploy', ... }
       │
       ▼
6. SkyLaunchOps agent triggered
       │
       ├──► Build log streamed via WebSocket: devops.deploy.status
       │
       └──► On completion: DeploymentRecord updated { status: 'success' | 'failed', completedAt }
                 │
                 ▼
            NotificationBanner shown to admin
```

### Pre-flight Check Implementation

```typescript
// server/controllers/admin/devops.ts

/** All environment variables that must be present before a production deployment. */
const REQUIRED_ENV_VARS = [
  'JWT_PUBLIC_KEY',
  'JWT_PRIVATE_KEY',
  'MONGODB_URI',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_API_URL',
  'ADMIN_COOKIE_SECRET',
] as const;

async function preflightChecks(): Promise<{ pass: boolean; failures: string[] }> {
  const failures: string[] = [];

  const criticalQaFailure = await QaResult.exists({ severity: 'critical', resolved: false });
  if (criticalQaFailure) failures.push('Unresolved critical QA failure');

  const criticalSecEvent = await SecurityEvent.exists({ severity: 'critical', resolved: false });
  if (criticalSecEvent) failures.push('Unresolved critical security event');

  const missingEnvVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missingEnvVars.length) failures.push(`Missing env vars: ${missingEnvVars.join(', ')}`);

  const activeDeployment = await DeploymentRecord.exists({ status: 'running' });
  if (activeDeployment) failures.push('A deployment is already running');

  return { pass: failures.length === 0, failures };
}
```

---

## Technology Summary

| Concern | Technology |
|---------|-----------|
| Frontend framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom neon design tokens |
| Animation | Framer Motion (status indicators, panel transitions) |
| State management | Zustand (WebSocket event store) |
| Real-time transport | WebSocket (`ws` library on server) |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Authentication | JWT (RS256 asymmetric) — private key signs tokens on the server, public key verifies in middleware and Edge runtime |
| Deployment | Vercel (frontend) + Render/Railway (backend) |
| Secrets | Environment variables only — never in source |
