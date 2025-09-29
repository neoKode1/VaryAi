#!/usr/bin/env node

/**
 * Export All Supabase SQL Files and Policies
 * This script will help us get a comprehensive view of your 175 SQL files
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exportAllSQLInfo() {
  try {
    console.log('🔍 Exporting comprehensive Supabase SQL information...');
    
    // Create export directory
    const exportDir = path.join(__dirname, '../supabase-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // 1. Get all tables and their RLS status
    console.log('📊 Exporting table information...');
    const tablesQuery = `
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled,
        hasrls,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', { sql: tablesQuery });
    if (tablesError) {
      console.log('⚠️ Could not fetch tables via RPC, trying alternative method...');
      // Alternative: just log what we know
      console.log('📝 Known tables: galleries, users');
    } else {
      fs.writeFileSync(path.join(exportDir, 'tables-info.json'), JSON.stringify(tables, null, 2));
      console.log(`✅ Exported ${tables?.length || 0} tables info`);
    }
    
    // 2. Get all RLS policies
    console.log('🔒 Exporting all RLS policies...');
    const policiesQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual as using_expression,
        with_check as with_check_expression
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesQuery });
    if (policiesError) {
      console.log('⚠️ Could not fetch policies via RPC');
    } else {
      fs.writeFileSync(path.join(exportDir, 'all-policies.json'), JSON.stringify(policies, null, 2));
      console.log(`✅ Exported ${policies?.length || 0} policies`);
    }
    
    // 3. Get all functions and procedures
    console.log('⚙️ Exporting functions and procedures...');
    const functionsQuery = `
      SELECT 
        routine_name,
        routine_type,
        data_type,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name;
    `;
    
    const { data: functions, error: functionsError } = await supabase.rpc('exec_sql', { sql: functionsQuery });
    if (functionsError) {
      console.log('⚠️ Could not fetch functions via RPC');
    } else {
      fs.writeFileSync(path.join(exportDir, 'functions.json'), JSON.stringify(functions, null, 2));
      console.log(`✅ Exported ${functions?.length || 0} functions`);
    }
    
    // 4. Get all triggers
    console.log('🎯 Exporting triggers...');
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `;
    
    const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', { sql: triggersQuery });
    if (triggersError) {
      console.log('⚠️ Could not fetch triggers via RPC');
    } else {
      fs.writeFileSync(path.join(exportDir, 'triggers.json'), JSON.stringify(triggers, null, 2));
      console.log(`✅ Exported ${triggers?.length || 0} triggers`);
    }
    
    // 5. Get table schemas
    console.log('📋 Exporting table schemas...');
    const schemaQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const { data: schema, error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaQuery });
    if (schemaError) {
      console.log('⚠️ Could not fetch schema via RPC');
    } else {
      fs.writeFileSync(path.join(exportDir, 'table-schema.json'), JSON.stringify(schema, null, 2));
      console.log(`✅ Exported table schema`);
    }
    
    // 6. Create a summary report
    console.log('📝 Creating summary report...');
    const summary = {
      export_timestamp: new Date().toISOString(),
      tables_count: tables?.length || 'unknown',
      policies_count: policies?.length || 'unknown',
      functions_count: functions?.length || 'unknown',
      triggers_count: triggers?.length || 'unknown',
      known_issues: [
        'RLS policy violations on users table',
        'Gallery access blocked by RLS policies',
        'Admin finds 1000 gallery items, user finds 0'
      ],
      next_steps: [
        'Review all-policies.json for conflicting policies',
        'Check table-schema.json for structural issues',
        'Analyze functions.json for custom RLS functions',
        'Look for triggers that might interfere with RLS'
      ]
    };
    
    fs.writeFileSync(path.join(exportDir, 'export-summary.json'), JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Export Summary:');
    console.log(`📁 Export directory: ${exportDir}`);
    console.log(`📋 Files created:`);
    console.log(`   - tables-info.json (${tables?.length || 0} tables)`);
    console.log(`   - all-policies.json (${policies?.length || 0} policies)`);
    console.log(`   - functions.json (${functions?.length || 0} functions)`);
    console.log(`   - triggers.json (${triggers?.length || 0} triggers)`);
    console.log(`   - table-schema.json (schema info)`);
    console.log(`   - export-summary.json (summary)`);
    
    console.log('\n🔍 Next Steps:');
    console.log('1. Review the exported JSON files');
    console.log('2. Look for conflicting RLS policies');
    console.log('3. Check for custom functions that might interfere');
    console.log('4. Identify the root cause of the RLS issues');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.log('\n💡 Alternative approach:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run: SELECT * FROM pg_policies WHERE schemaname = \'public\';');
    console.log('3. Copy the results and share them');
  }
}

exportAllSQLInfo().catch(console.error);
