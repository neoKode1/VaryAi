const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runFix() {
  console.log('🔧 Running authentication and credit system fix...');
  
  try {
    const sqlContent = fs.readFileSync('fix-auth-and-credits-system.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\n🎉 Fix completed! Now testing the system...');
    
    // Test the credit system
    const { data: testUsers } = await supabase
      .from('users')
      .select('id, email, credit_balance')
      .limit(3);
    
    console.log('\n👥 Test Users Credit Status:');
    for (const user of testUsers) {
      console.log(`📧 ${user.email}: ${user.credit_balance || 0} credits`);
    }
    
    // Test user_credits table
    const { data: creditRecords } = await supabase
      .from('user_credits')
      .select('user_id, available_credits, used_credits')
      .limit(3);
    
    console.log('\n💳 User Credits Table:');
    for (const record of creditRecords) {
      console.log(`🆔 ${record.user_id}: Available: ${record.available_credits}, Used: ${record.used_credits}`);
    }
    
  } catch (error) {
    console.error('❌ Error running fix:', error);
  }
}

runFix();
