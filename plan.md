# MVP Development Plan - Insurance Agency CRM

## Project Context
- **Goal**: Build a Telemarketing CRM for Life Insurance.
- **Stack**: Next.js (Pages Router), Supabase (Auth + DB), Tailwind CSS.
- **Key Roles**: System Admin, Sales Manager, Sales Agent (Licensed/Unlicensed), Call Center Manager, Call Center Agent.

## Progress Tracker
- [x] Step 1: Project Initialization & Configuration
- [x] Step 2: Database Schema & Supabase Setup
- [x] Step 3: Global UI Architecture (Theme & Layouts)
- [x] Step 4: Authentication & Access Control
- [x] Step 5: System Admin Dashboard (Users & Configuration)
- [x] Step 6: Pipeline & Stage Management
- [x] Step 7: Call Center Lead Submission
- [x] Step 8: Lead Routing Engine
- [x] Step 9: Sales Dashboard & Lead Management
- [x] Step 10: Carrier Integration & Policy Management
- [x] Step 11: Additional Pages (Agents, Settings)

---

## Detailed Execution Steps

### Phase 1: Foundation (Steps 1-4)

#### Step 1: Project Initialization & Configuration
- [x] **1.1** Initialize Next.js project (Pages Router, TypeScript, Tailwind CSS).
- [x] **1.2** Install core dependencies (`@supabase/supabase-js`, `lucide-react`, `clsx`, `tailwind-merge`, `react-hook-form`, `zod`, `date-fns`).
- [x] **1.3** Configure Tailwind Global Color Palette (Light/Dark mode).
    - *Decision*: Use CSS variables for semantic coloring (primary, secondary, background, surface) to easily switch modes.
- [x] **1.4** Create reusable UI components foundation (`Button`, `Input`, `Dialog`, `Label`).
    - *Decision*: Built atomic components first to ensure UI consistency.

#### Step 2: Database Schema & Supabase Setup
- [x] **2.1** Design and Document SQL Schema.
    - Tables: `profiles`, `call_centers`, `pipelines`, `stages`, `leads`, `lead_notes`, `call_logs`, `policies`.
- [x] **2.2** Generate SQL migration script for Supabase (`supabase/schema.sql`).
- [x] **2.3** Configure Row Level Security (RLS) Policies (Included in schema & updated for Insert permissions).
    - *Constraint*: Call centers see only their data; Sales see only assigned data; Admins see all.

#### Step 3: Global UI Architecture
- [x] **3.1** Create `Layout` component with Sidebar/Navbar.
- [x] **3.2** Implement Theme Toggle (Sun/Moon icon in Settings).
- [x] **3.3** Create `DashboardLayout` specifically for authenticated views.

#### Step 4: Authentication & Access Control
- [x] **4.1** Implement Supabase Auth Context/Provider (Direct Client Usage).
- [x] **4.2** Create Login Page (`/auth/login` -> now `/` index).
- [x] **4.3** Create Higher-Order Component `withAuth` or `ProtectedRoute` wrapper to check roles (Handled in Layout + Auth Handler).
- [x] **4.4** Handle redirect logic based on User Role (e.g., Admin -> Admin Dashboard, Agent -> Sales Dashboard).

---

### Phase 2: Administration (Steps 5-6)

#### Step 5: System Admin Dashboard
- [x] **5.1** Admin Dashboard Overview (Stats) (`/dashboard`).
- [x] **5.2** User Management Interface (`/users`).
    - Create users (API Route with Service Role), assign roles, assign to Call Centers or Managers.
- [x] **5.3** Call Center Management (`/centers`).
    - CRUD operations for Call Centers.
- [x] **5.4** Agents Management (`/agents`).
    - Specialized view for managing agent profiles.

#### Step 6: Pipeline & Stage Management
- [x] **6.1** Pipeline Configuration View (`/pipeline`).
- [x] **6.2** Dynamic Stage Editor (Reorder, Color, Add/Remove) - *Partially implemented (Auto-seeding default stages).*
- [x] **6.3** Kanban Board View.
    - Move leads between stages using optimistic UI updates.

---

### Phase 3: Lead Acquisition (Step 7)

#### Step 7: Call Center Lead Submission
- [x] **7.1** Lead Capture Form (`LeadFormModal`).
    - Sections: Personal, Medical, Insurance, Banking.
- [x] **7.2** Implement Real-time Validation (Zod schema).
- [x] **7.3** Duplicate Detection Logic (DB Constraints).
- [x] **7.4** Auto-save Draft functionality - *Implemented and then Removed per user request for cleaner state management.*

---

### Phase 4: Lead Distribution & Sales (Steps 8-9)

#### Step 8: Lead Routing Engine
- [x] **8.1** Implement Routing Logic.
    - *Decision*: Implemented Manual Assignment via Lead List + Client-side Auto-creation assignment logic.
- [x] **8.2** Manual Assignment Override for Managers (In Lead List).

#### Step 9: Sales Dashboard & Lead Management
- [x] **9.1** Sales Dashboard (`/dashboard`).
    - Metrics: Dynamic based on role (Admin vs Agent).
- [x] **9.2** Kanban Board View for Pipeline Management (`/pipeline`).
- [x] **9.3** Lead Detail Page (`/leads`).
    - List View implemented with details accessible via list columns.
- [x] **9.4** Settings Page (`/settings`).
    - Profile management and Theme toggle.

---

### Phase 5: Post-Sale & Integrations (Step 10)

#### Step 10: Carrier Integration
- [x] **10.1** Policy Management Module (`/policies`).
- [x] **10.2** Policy List View with Status tracking.
- [ ] **10.3** Chargeback Pipeline Logic (Future Enhancement).
