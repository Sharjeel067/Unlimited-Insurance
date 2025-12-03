-- Enable DELETE for system_admin on all major tables

-- 1. Call Centers
CREATE POLICY "Enable delete for system_admin" ON "public"."call_centers"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Enable update for system_admin" ON "public"."call_centers"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Enable insert for system_admin" ON "public"."call_centers"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

-- 2. Profiles (Users/Agents)
-- Note: Deleting a user from public.profiles does NOT delete them from auth.users automatically unless you have a trigger/foreign key setup that cascades backwards (usually it's auth.users -> public.profiles). 
-- But we can allow deletion from profiles.
CREATE POLICY "Enable delete for system_admin" ON "public"."profiles"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Enable update for system_admin" ON "public"."profiles"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

-- 3. Leads
CREATE POLICY "Enable delete for system_admin" ON "public"."leads"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

-- 4. Policies
CREATE POLICY "Enable delete for system_admin" ON "public"."policies"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Enable insert for system_admin" ON "public"."policies"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Enable update for system_admin" ON "public"."policies"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

-- 5. Pipelines & Stages (If needed)
CREATE POLICY "Enable delete for system_admin" ON "public"."pipelines"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Enable delete for system_admin" ON "public"."stages"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

-- 6. Notes & Logs
CREATE POLICY "Enable delete for system_admin" ON "public"."lead_notes"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Enable delete for system_admin" ON "public"."call_logs"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

