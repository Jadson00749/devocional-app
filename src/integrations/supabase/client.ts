import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://buwsdtkrlgbfxwexnocw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1d3NkdGtybGdiZnh3ZXhub2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTI2MzAsImV4cCI6MjA4NDQyODYzMH0.Ghg60nntbPaX3gH999cPT3RLvByF4zrqi-UPnxDIP-o';

// Cliente Supabase configurado
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});


