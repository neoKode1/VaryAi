# Credit System Migration Plan

## 🎯 Goal
Migrate from dual credit systems to a unified subscription-based system without disrupting existing users.

## 📋 Current State
- **Legacy System**: `users.credit_balance` (pay-as-you-go)
- **New System**: `user_credits` table (subscription-based)
- **Issue**: Both systems running in parallel, causing confusion

## 🚀 Migration Strategy

### Phase 1: Fix Critical Issues (IMMEDIATE)
1. **Fix RLS Policies** - Users can't see their gallery items
2. **Unify Credit System** - Choose one system and migrate data
3. **Test Credit Flow** - Ensure credits work properly

### Phase 2: Credit Migration (GRADUAL)
1. **Preserve Existing Credits** - Don't reset to zero
2. **Migrate Legacy Credits** - Move `users.credit_balance` to `user_credits`
3. **Grandfather Users** - Give existing users credit_type: 'grandfathered'
4. **Set Expiration** - Give grandfathered credits 6-month expiration

### Phase 3: Subscription Transition (GRADUAL)
1. **Keep Grandfathered Credits** - Let users use existing credits
2. **Encourage Subscriptions** - Show subscription benefits
3. **Natural Transition** - Users will subscribe when credits run out

## 💰 Credit Migration Logic

```sql
-- For each user with legacy credits:
-- 1. Create user_credits record with credit_type: 'grandfathered'
-- 2. Set total_credits = users.credit_balance
-- 3. Set expires_at = NOW() + 6 months
-- 4. Keep users.credit_balance for backward compatibility
```

## 🎁 Benefits of This Approach
- ✅ No user disruption
- ✅ Preserves existing credits
- ✅ Encourages subscription adoption
- ✅ Maintains user trust
- ✅ Gradual transition

## ⚠️ What NOT to Do
- ❌ Reset credits to zero (breaks user trust)
- ❌ Force immediate subscription (user churn)
- ❌ Remove legacy system immediately (breaks existing flow)
