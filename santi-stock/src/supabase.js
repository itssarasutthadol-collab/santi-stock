import { createClient } from '@supabase/supabase-js';

// ⚠️ ใส่ค่าจาก Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://rrhsuuwcuvuvobeqzxal.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xWIHC25j2F0BmJ491uotNw_Kw_cMYMd';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
