import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjoagshtkasvxiveakdm.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqb2Fnc2h0a2FzdnhpdmVha2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTMzNDAsImV4cCI6MjA3NTQ4OTM0MH0.kJ5zHxju3FsE-1eU7BeoLSQ_Gn6tDWSryZS90P2YC64';
export const supabase = createClient(supabaseUrl, supabaseKey);
