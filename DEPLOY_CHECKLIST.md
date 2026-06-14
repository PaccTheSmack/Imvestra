# Imvestra Deploy Checklist

## Vercel Environment Variables (Production)
Copy these from .env.local and add to Vercel dashboard:

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Stripe (LIVE keys – not test!)
- `STRIPE_SECRET_KEY` (sk_live_...)
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...)
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_TEAM_MONTHLY`

### App
- `NEXT_PUBLIC_APP_URL=https://imvestra.de`

### Resend
- `RESEND_API_KEY`

### PostHog
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

## Post-Deploy Steps
- [ ] Supabase Auth → Site URL auf `https://imvestra.de` setzen
- [ ] Supabase Auth → Redirect URLs: `https://imvestra.de/**`
- [ ] Stripe Webhook → Endpoint: `https://imvestra.de/api/stripe/webhook`
- [ ] Stripe Webhook Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Domain DNS auf Vercel zeigen
- [ ] SSL Zertifikat automatisch via Vercel
