import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  try {
    console.log('Running database migrations...')

    // Add password_hash column
    const { error: passwordError } = await supabase
      .from('profiles')
      .select('password_hash')
      .limit(1)

    if (passwordError && passwordError.message.includes('column')) {
      console.log('Adding password_hash column...')
      // Note: This would need to be run manually in Supabase SQL editor
      console.log('Please run this SQL in your Supabase SQL editor:')
      console.log('ALTER TABLE profiles ADD COLUMN password_hash TEXT;')
    } else {
      console.log('✓ password_hash column exists')
    }

    console.log('Migration check completed!')
    console.log('If you see SQL commands above, please run them manually in Supabase.')
  } catch (error) {
    console.error('Migration check failed:', error)
  }
}

runMigrations()