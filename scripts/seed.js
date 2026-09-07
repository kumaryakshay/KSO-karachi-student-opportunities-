/**
 * KSO Database Seeding Script
 * ============================
 * Run locally with:  npm run seed
 *
 * Uses the Supabase SERVICE ROLE KEY (bypasses RLS) to bulk-insert
 * opportunities from a JSON file into the Supabase database.
 *
 * ⚠️  This script is NOT shipped in the app — it's a dev-only tool.
 *
 * Required env vars in .env:
 *   EXPO_PUBLIC_SUPABASE_URL        — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY       — from Dashboard → Settings → API
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Configuration ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_FILE = path.join(__dirname, 'real_opportunities.json');
const BATCH_SIZE = 10;

// ── Validation ──────────────────────────────────────────────────────────────────

if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
  console.error('\n❌ Error: EXPO_PUBLIC_SUPABASE_URL not set in .env\n');
  console.error('   1. Go to Supabase Dashboard → Settings → API');
  console.error('   2. Copy the Project URL');
  console.error('   3. Paste it as EXPO_PUBLIC_SUPABASE_URL in your .env file\n');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('\n❌ Error: SUPABASE_SERVICE_ROLE_KEY not set in .env\n');
  console.error('   1. Go to Supabase Dashboard → Settings → API');
  console.error('   2. Copy the service_role key (marked as SECRET)');
  console.error('   3. Paste it as SUPABASE_SERVICE_ROLE_KEY in your .env file\n');
  console.error('   ⚠️  Never commit the service role key to git!\n');
  process.exit(1);
}

// ── Supabase Admin Client (service role bypasses RLS) ──────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ── Helpers ─────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main Seed Function ──────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 KSO Database Seeder');
  console.log('═'.repeat(50));
  console.log(`📡 Supabase:  ${SUPABASE_URL}`);
  console.log(`📄 Data file: ${DATA_FILE}`);
  console.log('═'.repeat(50));

  // 1. Read JSON data
  let opportunities;
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    opportunities = JSON.parse(raw);
  } catch (err) {
    console.error(`\n❌ Could not read ${DATA_FILE}:`, err.message);
    process.exit(1);
  }

  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    console.error('\n❌ Data file is empty or not a valid JSON array.\n');
    process.exit(1);
  }

  console.log(`\n📦 Found ${opportunities.length} opportunities to seed.\n`);

  // 2. Ask about clearing existing data
  const shouldClear = process.argv.includes('--clear');
  if (shouldClear) {
    console.log('🗑️  --clear flag detected. Removing existing opportunities...');
    const { error: clearError } = await supabase
      .from('opportunities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

    if (clearError) {
      console.error('   ❌ Failed to clear table:', clearError.message);
      process.exit(1);
    }
    console.log('   ✅ Table cleared.\n');
  }

  // 3. Batch insert
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
    const batch = opportunities.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(opportunities.length / BATCH_SIZE);

    console.log(`   Batch ${batchNum}/${totalBatches}: inserting ${batch.length} records...`);

    const { data, error } = await supabase
      .from('opportunities')
      .insert(batch)
      .select('id, title');

    if (error) {
      console.error(`   ❌ Batch ${batchNum} failed:`, error.message);
      // If duplicate key, try upsert
      if (error.code === '23505') {
        console.log('   🔄 Trying upsert (some records may already exist)...');
        const { error: upsertError } = await supabase
          .from('opportunities')
          .upsert(batch, { onConflict: 'title,organization' })
          .select('id');

        if (upsertError) {
          console.error(`   ❌ Upsert also failed:`, upsertError.message);
          failed += batch.length;
        } else {
          inserted += batch.length;
          console.log(`   ✅ Batch ${batchNum} upserted successfully.`);
        }
      } else {
        failed += batch.length;
      }
    } else {
      inserted += batch.length;
      console.log(`   ✅ Batch ${batchNum} inserted (${data?.length || 0} records)`);
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < opportunities.length) {
      await sleep(500);
    }
  }

  // 4. Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 SEED SUMMARY');
  console.log('═'.repeat(50));
  console.log(`   ✅ Inserted: ${inserted}`);
  if (failed > 0) {
    console.log(`   ❌ Failed:   ${failed}`);
  }
  console.log(`   📦 Total:    ${opportunities.length}`);
  console.log('═'.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All opportunities seeded successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Update your .env with real Supabase URL + anon key');
    console.log('   2. Run "npx expo start" and check the app');
    console.log('   3. Home and Explore screens should now show real data\n');
  } else {
    console.log('\n⚠️  Some records failed. Check the errors above.\n');
  }
}

seed().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
