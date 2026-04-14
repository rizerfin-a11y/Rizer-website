/* ============================================================
   supabase-config.js — Supabase Client Initialization
   ============================================================ */

const SUPABASE_URL = 'https://jiseuohyvgvastizutql.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GlI3j6_1DJr1LjTx3KsZtw_NojOnPL_'; // ← Replace with your anon key from Supabase Dashboard

// Initialize the Supabase client (CDN version loaded via <script> tag)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

