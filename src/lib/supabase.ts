import { createClient } from '@supabase/supabase-js'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcjynyfusqkqtdohnyzq.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gNJhc4WCS9MnnmDAL2T6Vg_AQ71_Vid'
export const supabase = createClient(url, key)