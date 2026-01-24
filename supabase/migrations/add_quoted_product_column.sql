-- Add quoted_product column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS quoted_product TEXT;
