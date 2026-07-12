require('dotenv').config({ path: 'payment-server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('devotees').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} devotees in Supabase.`);
  }
}

check();
