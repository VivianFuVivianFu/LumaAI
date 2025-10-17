/**
 * Check if Phase 3 Master Agent tables exist in database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('\nChecking Phase 3 Master Agent tables...\n');

  const tables = [
    'events',
    'nudges',
    'user_feedback',
    'personalization_weights',
    'insights_cache',
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results.push(false);
      } else {
        console.log(`✅ ${table}: Exists`);
        results.push(true);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      results.push(false);
    }
  }

  const allExist = results.every(r => r);
  console.log(`\n${allExist ? '✅' : '❌'} ${results.filter(r => r).length}/${tables.length} tables exist\n`);

  if (!allExist) {
    console.log('⚠️  Some tables are missing. Please run the Phase 3 database migration:');
    console.log('   - Open Supabase SQL Editor');
    console.log('   - Run: backend/database-phase3-master-agent.sql\n');
  }

  process.exit(allExist ? 0 : 1);
}

checkTables();
