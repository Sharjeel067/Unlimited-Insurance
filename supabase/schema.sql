-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM (
  'system_admin',
  'sales_manager',
  'sales_agent_licensed',
  'sales_agent_unlicensed',
  'call_center_manager',
  'call_center_agent'
);

-- Pipeline type is now TEXT to allow dynamic values matching pipeline names
-- CREATE TYPE pipeline_type AS ENUM (
--   'transfer',
--   'customer',
--   'chargeback'
-- );

-- 1. Call Centers
CREATE TABLE public.call_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role user_role DEFAULT 'call_center_agent',
  call_center_id UUID REFERENCES public.call_centers(id),
  manager_id UUID REFERENCES public.profiles(id),
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pipelines
CREATE TABLE public.pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Stages
CREATE TABLE public.stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_code TEXT DEFAULT '#cbd5e1',
  order_index INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- System Metadata
  submission_id TEXT UNIQUE, -- For legacy/external reference
  call_center_id UUID REFERENCES public.call_centers(id),
  user_id UUID REFERENCES auth.users(id), -- Submitter
  
  -- Assignment
  assigned_agent_id UUID REFERENCES public.profiles(id),
  buffer_agent_id UUID REFERENCES public.profiles(id),
  
  -- Pipeline Status
  pipeline_id UUID REFERENCES public.pipelines(id),
  stage_id UUID REFERENCES public.stages(id),
  
  -- Personal Info
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  age INTEGER,
  ssn TEXT, -- Should be encrypted in application layer or RLS restricted
  phone_number TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  birth_state TEXT,
  driver_license TEXT,
  
  -- Medical
  height TEXT,
  weight TEXT,
  tobacco_use BOOLEAN,
  health_conditions TEXT,
  medications TEXT,
  doctor_name TEXT,
  
  -- Insurance
  desired_coverage NUMERIC,
  monthly_budget NUMERIC,
  existing_coverage TEXT,
  beneficiary_info JSONB, -- Store name, relation, etc.
  draft_date TEXT,
  
  -- Banking
  bank_name TEXT,
  routing_number TEXT,
  account_number TEXT,
  
  -- Metrics
  lead_value NUMERIC DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ
);

-- 6. Lead Notes
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Call Logs
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.profiles(id),
  duration INTEGER, -- Seconds
  recording_url TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Policies (Carrier Integration)
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id),
  carrier_name TEXT,
  policy_number TEXT,
  status TEXT,
  premium_amount NUMERIC,
  commission_amount NUMERIC,
  application_date DATE,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Basic Setup)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Profiles: Everyone can read basic profile info (needed for assigning agents)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow authenticated users to view leads (we can refine this later to 'own' leads)
CREATE POLICY "Enable read access for authenticated users" ON "public"."leads"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert leads
CREATE POLICY "Enable insert access for authenticated users" ON "public"."leads"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update leads
CREATE POLICY "Enable update access for authenticated users" ON "public"."leads"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true);

-- Create a trigger to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'sales_agent_unlicensed'); -- Default role, change as needed
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
