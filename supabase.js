import { createClient } from '@supabase/supabase-js';

// الرابط الأساسي لمشروعك (جاهز ومنظف للربط الصحيح)
const SUPABASE_URL = 'https://nyxteyfpdautvbmumawi.supabase.co'; 

// مفتاح الأمان (Anon Key) الخاص بك كاملاً بدون أي نقص
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eHRleWZwZGF1dHZibXVtYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODUzMzQsImV4cCI6MjA5OTQ2MTMzNH0.QRCo9yV5PnjqjWPrVopIzHpmMokXLixrX-fyth5A8hE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
