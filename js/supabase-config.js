/* ============================================================
   supabase-config.js — Supabase Client Initialization
   ============================================================ */

const SUPABASE_URL = 'https://jiseuohyvgvastizutql.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ← Replace with your anon key from Supabase Dashboard

// Initialize the Supabase client (CDN version loaded via <script> tag)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
