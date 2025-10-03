# Running SQL via Supabase CLI

## Install Supabase CLI
```bash
npm install -g supabase
```

## Login to Supabase
```bash
supabase login
```

## Link to your project
```bash
supabase link --project-ref vqmzepfbgbwtzbpmrevx
```

## Run SQL script
```bash
supabase db reset --file sql-scripts/simple-diagnostic.sql
```

## OR use psql directly (if you have it installed)
```bash
psql "postgresql://postgres.vqmzepfbgbwtzbpmrevx:[YOUR_DB_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -f sql-scripts/simple-diagnostic.sql
```
