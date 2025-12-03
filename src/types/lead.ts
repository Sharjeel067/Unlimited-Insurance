import { z } from "zod";

export const leadSchema = z.object({
  // Personal Info
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  date_of_birth: z.string().min(1, "DOB is required"),
  age: z.number().min(0).optional(), // Calculated
  ssn: z.string().min(9, "SSN must be 9 digits").max(11, "Invalid SSN format"),
  phone_number: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().length(2, "Use 2-letter state code"),
  zip_code: z.string().min(5, "Zip code is required"),
  birth_state: z.string().optional(),
  driver_license: z.string().optional(),

  // Medical
  height: z.string().optional(),
  weight: z.string().optional(),
  tobacco_use: z.boolean().default(false),
  health_conditions: z.string().optional(),
  medications: z.string().optional(),
  doctor_name: z.string().optional(),

  // Insurance
  desired_coverage: z.number().min(0).optional(),
  monthly_budget: z.number().min(0).optional(),
  existing_coverage: z.string().optional(),
  beneficiary_name: z.string().optional(),
  beneficiary_relation: z.string().optional(),
  draft_date: z.string().optional(),

  // Banking
  bank_name: z.string().optional(),
  routing_number: z.string().optional(),
  account_number: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

