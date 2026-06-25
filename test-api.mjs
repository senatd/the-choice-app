import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL="(.*?)"/)[1];
const supabaseAnonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="(.*?)"/)[1];

console.log('URL:', supabaseUrl ? 'Exists' : 'Missing');
console.log('ANON KEY:', supabaseAnonKey ? 'Exists' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase
    .from('deletion_requests')
    .insert([{ email: 'test@example.com', request_type: 'account' }]);

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success:', data);
  }
}

test();
