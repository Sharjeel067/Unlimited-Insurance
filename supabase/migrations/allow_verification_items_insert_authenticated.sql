-- Fix RLS policies for verification_items and verification_sessions
-- to allow authenticated users full access.
-- The person starting verification (e.g. call center) may not be the
-- licensed_agent_id on the session; restrictive RLS was blocking operations.

-- =====================
-- verification_items
-- =====================

-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "verification_items_insert_session_agents" ON public.verification_items;
DROP POLICY IF EXISTS "verification_items_insert" ON public.verification_items;
DROP POLICY IF EXISTS "verification_items_select" ON public.verification_items;
DROP POLICY IF EXISTS "verification_items_update" ON public.verification_items;
DROP POLICY IF EXISTS "verification_items_select_all" ON public.verification_items;
DROP POLICY IF EXISTS "verification_items_update_session_agents" ON public.verification_items;
DROP POLICY IF EXISTS "Users can view verification items for their sessions" ON public.verification_items;
DROP POLICY IF EXISTS "Buffer agents can modify verification items" ON public.verification_items;
DROP POLICY IF EXISTS "verification_items_select_authenticated" ON public.verification_items;
DROP POLICY IF EXISTS "verification_items_insert_authenticated" ON public.verification_items;
DROP POLICY IF EXISTS "verification_items_update_authenticated" ON public.verification_items;

-- Allow any authenticated user to SELECT verification_items
CREATE POLICY "verification_items_select_authenticated"
  ON public.verification_items
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow any authenticated user to INSERT verification_items
CREATE POLICY "verification_items_insert_authenticated"
  ON public.verification_items
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow any authenticated user to UPDATE verification_items
CREATE POLICY "verification_items_update_authenticated"
  ON public.verification_items
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================
-- verification_sessions
-- =====================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "verification_sessions_select" ON public.verification_sessions;
DROP POLICY IF EXISTS "verification_sessions_insert" ON public.verification_sessions;
DROP POLICY IF EXISTS "verification_sessions_update" ON public.verification_sessions;
DROP POLICY IF EXISTS "Users can view their verification sessions" ON public.verification_sessions;
DROP POLICY IF EXISTS "Users can create verification sessions" ON public.verification_sessions;
DROP POLICY IF EXISTS "Users can update verification sessions" ON public.verification_sessions;
DROP POLICY IF EXISTS "verification_sessions_select_authenticated" ON public.verification_sessions;
DROP POLICY IF EXISTS "verification_sessions_insert_authenticated" ON public.verification_sessions;
DROP POLICY IF EXISTS "verification_sessions_update_authenticated" ON public.verification_sessions;

-- Allow any authenticated user to SELECT verification_sessions
CREATE POLICY "verification_sessions_select_authenticated"
  ON public.verification_sessions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow any authenticated user to INSERT verification_sessions
CREATE POLICY "verification_sessions_insert_authenticated"
  ON public.verification_sessions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow any authenticated user to UPDATE verification_sessions
CREATE POLICY "verification_sessions_update_authenticated"
  ON public.verification_sessions
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
