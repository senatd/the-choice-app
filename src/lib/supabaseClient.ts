import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In development, this helps surface misconfiguration early.
  // In production, you may want to handle this differently.
  console.warn(
    "Supabase environment variables are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
  {
    auth: {
      persistSession: true,
    },
  }
);

