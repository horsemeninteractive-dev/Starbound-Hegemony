import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xxpkbjowdofjyyucnqwf.supabase.co', 'sb_publishable_8u6VGVUEZw67pXSFhhww3g_-y6RBeem');
supabase.from('parties').select('*').limit(1).then(console.log).catch(console.error);
