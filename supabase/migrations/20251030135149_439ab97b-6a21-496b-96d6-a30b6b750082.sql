-- Add fields to track one-time payments
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'free' CHECK (payment_type IN ('free', 'recurring', 'one_time')),
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_subscribers_valid_until ON public.subscribers(valid_until) WHERE valid_until IS NOT NULL;

COMMENT ON COLUMN public.subscribers.payment_type IS 'Type of payment: free, recurring (Stripe subscription), or one_time (Alipay/manual renewal)';
COMMENT ON COLUMN public.subscribers.valid_until IS 'For one-time payments, the date until which the subscription is valid';