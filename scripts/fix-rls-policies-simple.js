#!/usr/bin/env node

/**
 * Simple RLS Policy Fix using direct HTTP requests to Supabase
 */

const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, supabaseUrl);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ data: json, status: res.statusCode });
        } catch (e) {
          resolve({ data: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function executeSQL(sql) {
  console.log(`🔄 Executing: ${sql.substring(0, 80)}...`);
  
  try {
    const result = await makeRequest('POST', '/rest/v1/rpc/exec_sql', { sql });
    
    if (result.status === 200 || result.status === 201) {
      console.log(`✅ Success`);
      return true;
    } else {
      console.log(`❌ Error (${result.status}):`, result.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Exception:`, error.message);
    return false;
  }
}

async function fixRLSPolicies() {
  console.log('🔧 Fixing critical RLS policy issues...');
  
  const sqlStatements = [
    // Drop existing gallery policies
    'DROP POLICY IF EXISTS "galleries_select_policy" ON galleries',
    'DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries',
    'DROP POLICY IF EXISTS "galleries_update_policy" ON galleries',
    'DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries',
    
    // Enable RLS and create gallery policies
    'ALTER TABLE galleries ENABLE ROW LEVEL SECURITY',
    'CREATE POLICY "galleries_select_policy" ON galleries FOR SELECT USING (auth.uid() = user_id)',
    'CREATE POLICY "galleries_insert_policy" ON galleries FOR INSERT WITH CHECK (auth.uid() = user_id)',
    'CREATE POLICY "galleries_update_policy" ON galleries FOR UPDATE USING (auth.uid() = user_id)',
    'CREATE POLICY "galleries_delete_policy" ON galleries FOR DELETE USING (auth.uid() = user_id)',
    
    // Drop existing user policies
    'DROP POLICY IF EXISTS "users_select_policy" ON users',
    'DROP POLICY IF EXISTS "users_insert_policy" ON users',
    'DROP POLICY IF EXISTS "users_update_policy" ON users',
    'DROP POLICY IF EXISTS "users_delete_policy" ON users',
    
    // Enable RLS and create user policies
    'ALTER TABLE users ENABLE ROW LEVEL SECURITY',
    'CREATE POLICY "users_select_policy" ON users FOR SELECT USING (auth.uid() = id)',
    'CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (auth.uid() = id)',
    'CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (auth.uid() = id)',
    'CREATE POLICY "users_delete_policy" ON users FOR DELETE USING (auth.uid() = id)'
  ];
  
  let successCount = 0;
  let totalCount = sqlStatements.length;
  
  for (const sql of sqlStatements) {
    const success = await executeSQL(sql);
    if (success) successCount++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Summary: ${successCount}/${totalCount} statements executed successfully`);
  
  if (successCount === totalCount) {
    console.log('🎉 All RLS policies fixed successfully!');
  } else {
    console.log('⚠️ Some statements failed. You may need to run them manually in Supabase SQL Editor.');
  }
}

fixRLSPolicies().catch(console.error);
