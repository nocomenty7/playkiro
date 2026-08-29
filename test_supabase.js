require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('vote_stats')
    .select('question_id, stats');
  
  if (error) return console.error(error);
  
  const filtered = data.filter(r => (r.stats.multi_a > 0 || r.stats.multi_b > 0));
  console.log(JSON.stringify(filtered, null, 2));
}

test();
