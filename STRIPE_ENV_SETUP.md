# Stripe Environment Variables Setup

## The Problem
Your pricing page buttons aren't working because the `STRIPE_HEAVY_PRICE_ID` environment variable is missing.

## Quick Fix

1. **Create a `.env.local` file** in your project root (if it doesn't exist)

2. **Add these environment variables** with your actual Stripe values:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Product and Price IDs
STRIPE_WEEKLY_PRO_PRODUCT_ID=prod_your_weekly_pro_product_id_here
STRIPE_WEEKLY_PRO_PRICE_ID=price_your_weekly_pro_price_id_here

STRIPE_HEAVY_PRODUCT_ID=prod_your_heavy_product_id_here
STRIPE_HEAVY_PRICE_ID=price_your_heavy_price_id_here

STRIPE_CREDIT_PACK_5_PRODUCT_ID=prod_your_credit_pack_5_product_id_here
STRIPE_CREDIT_PACK_5_PRICE_ID=price_your_credit_pack_5_price_id_here

STRIPE_CREDIT_PACK_10_PRODUCT_ID=prod_your_credit_pack_10_product_id_here
STRIPE_CREDIT_PACK_10_PRICE_ID=price_your_credit_pack_10_price_id_here

STRIPE_CREDIT_PACK_25_PRODUCT_ID=prod_your_credit_pack_25_product_id_here
STRIPE_CREDIT_PACK_25_PRICE_ID=price_your_credit_pack_25_price_id_here
```

## How to Get Your Price IDs

### Option 1: Use the Script
1. Install stripe: `npm install stripe`
2. Set your `STRIPE_SECRET_KEY` in `.env.local`
3. Run: `node get-stripe-price-ids.js`
4. Copy the suggested environment variables

### Option 2: Manual from Stripe Dashboard
1. Go to your Stripe Dashboard → Products
2. Click on each product (vARY_Weekly, vARY_Heavy, etc.)
3. Copy the Price ID from each product
4. Add them to your `.env.local` file

## Your Products (from Stripe Dashboard)
- **vARY_Weekly** - $7.50 USD Per week
- **vARY_Heavy** - $14.99 USD Per month  
- **vARY Credits 5** - $6.25 USD
- **vARY Credits 10** - $12.50 USD
- **vARY Credits 25** - $31.25 USD

## After Setup
1. Restart your development server: `npm run dev`
2. Test the pricing page buttons
3. They should now redirect to Stripe checkout

## Vercel Deployment
Don't forget to add these same environment variables to your Vercel project settings!
