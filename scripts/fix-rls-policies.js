#!/usr/bin/env node

/**
 * Fix Critical RLS Policy Issues
 * This script fixes the exact RLS issues shown in the logs:
 * 1. Gallery RLS: Admin finds 1000 items, user finds 0
 * 2. Users RLS: "new row violates row-level security policy for table 'users'"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('🔧 Fixing critical RLS policy issues...');
    
    // Fix Galleries Table RLS Policies
    console.log('\n📊 Fixing galleries table RLS policies...');
    
    // Drop existing policies
    const dropGalleryPolicies = [
      'DROP POLICY IF EXISTS "galleries_select_policy" ON galleries',
      'DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries', 
      'DROP POLICY IF EXISTS "galleries_update_policy" ON galleries',
      'DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries',
      'DROP POLICY IF EXISTS "Users can view their own gallery items" ON galleries',
      'DROP POLICY IF EXISTS "Users can insert their own gallery items" ON galleries',
      'DROP POLICY IF EXISTS "Users can update their own gallery items" ON galleries',
      'DROP POLICY IF EXISTS "Users can delete their own gallery items" ON galleries',
      'DROP POLICY IF EXISTS "gallery_select_policy" ON galleries',
      'DROP POLICY IF EXISTS "gallery_insert_policy" ON galleries',
      'DROP POLICY IF EXISTS "gallery_update_policy" ON galleries',
      'DROP POLICY IF EXISTS "gallery_delete_policy" ON galleries'
    ];
    
    for (const sql of dropGalleryPolicies) {
      try {
        console.log(`🔄 Dropping policy: ${sql.split(' ')[4]}`);
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error && !error.message.includes('does not exist')) {
          console.log(`⚠️ Warning: ${error.message}`);
        } else {
          console.log(`✅ Policy dropped successfully`);
        }
      } catch (err) {
        console.log(`⚠️ Warning: ${err.message}`);
      }
    }
    
    // Enable RLS and create new policies
    console.log('\n🔒 Enabling RLS and creating new gallery policies...');
    
    const galleryPolicies = [
      'ALTER TABLE galleries ENABLE ROW LEVEL SECURITY',
      `CREATE POLICY "galleries_select_policy" ON galleries FOR SELECT USING (auth.uid() = user_id)`,
      `CREATE POLICY "galleries_insert_policy" ON galleries FOR INSERT WITH CHECK (auth.uid() = user_id)`,
      `CREATE POLICY "galleries_update_policy" ON galleries FOR UPDATE USING (auth.uid() = user_id)`,
      `CREATE POLICY "galleries_delete_policy" ON galleries FOR DELETE USING (auth.uid() = user_id)`
    ];
    
    for (const sql of galleryPolicies) {
      try {
        console.log(`🔄 Creating gallery policy...`);
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          console.error(`❌ Error: ${error.message}`);
        } else {
          console.log(`✅ Gallery policy created successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
      }
    }
    
    // Fix Users Table RLS Policies
    console.log('\n👤 Fixing users table RLS policies...');
    
    // Drop existing policies
    const dropUserPolicies = [
      'DROP POLICY IF EXISTS "users_select_policy" ON users',
      'DROP POLICY IF EXISTS "users_insert_policy" ON users',
      'DROP POLICY IF EXISTS "users_update_policy" ON users', 
      'DROP POLICY IF EXISTS "users_delete_policy" ON users',
      'DROP POLICY IF EXISTS "Users can view their own profile" ON users',
      'DROP POLICY IF EXISTS "Users can insert their own profile" ON users',
      'DROP POLICY IF EXISTS "Users can update their own profile" ON users',
      'DROP POLICY IF EXISTS "Users can delete their own profile" ON users',
      'DROP POLICY IF EXISTS "Users can view own profile" ON users',
      'DROP POLICY IF EXISTS "Users can insert own profile" ON users',
      'DROP POLICY IF EXISTS "Users can update own profile" ON users',
      'DROP POLICY IF EXISTS "Users can delete own profile" ON users',
      'DROP POLICY IF EXISTS "user_select_policy" ON users',
      'DROP POLICY IF EXISTS "user_insert_policy" ON users',
      'DROP POLICY IF EXISTS "user_update_policy" ON users',
      'DROP POLICY IF EXISTS "user_delete_policy" ON users'
    ];
    
    for (const sql of dropUserPolicies) {
      try {
        console.log(`🔄 Dropping user policy: ${sql.split(' ')[4]}`);
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error && !error.message.includes('does not exist')) {
          console.log(`⚠️ Warning: ${error.message}`);
        } else {
          console.log(`✅ Policy dropped successfully`);
        }
      } catch (err) {
        console.log(`⚠️ Warning: ${err.message}`);
      }
    }
    
    // Enable RLS and create new policies
    console.log('\n🔒 Enabling RLS and creating new user policies...');
    
    const userPolicies = [
      'ALTER TABLE users ENABLE ROW LEVEL SECURITY',
      `CREATE POLICY "users_select_policy" ON users FOR SELECT USING (auth.uid() = id)`,
      `CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (auth.uid() = id)`,
      `CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (auth.uid() = id)`,
      `CREATE POLICY "users_delete_policy" ON users FOR DELETE USING (auth.uid() = id)`
    ];
    
    for (const sql of userPolicies) {
      try {
        console.log(`🔄 Creating user policy...`);
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          console.error(`❌ Error: ${error.message}`);
        } else {
          console.log(`✅ User policy created successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
      }
    }
    
    console.log('\n🎉 RLS policy fixes completed!');
    console.log('🔍 Users should now be able to:');
    console.log('   - View their own gallery items');
    console.log('   - Create their own user profiles');
    console.log('   - Access all their data without RLS blocking');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    console.log('\n💡 Manual Fix Instructions:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of sql-scripts/fix-critical-rls-issues.sql');
    console.log('4. Execute the script');
    console.log('5. Verify the policies were created successfully');
  }
}

// Run the fix
fixRLSPolicies().catch(console.error);