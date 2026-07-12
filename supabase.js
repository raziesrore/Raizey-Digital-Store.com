import { createClient } from '@supabase/supabase-js';

// الرابط الأساسي لمشروعك على Supabase
const SUPABASE_URL = 'https://nyxteyfpdautvbmumawi.supabase.co'; 

// مفتاح الأمان العام (Anon Key) الخاص بك
const SUPABASE_ANON_KEY = 'Customer_Key_Injected_Here';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
