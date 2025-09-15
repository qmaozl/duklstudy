-- Add generation tracking to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS generations_used integer DEFAULT 0;

-- Add product_id column to track Stripe product
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS product_id text;

-- Update existing free users to have generation tracking
UPDATE public.subscribers 
SET generations_used = 0, subscription_tier = 'free' 
WHERE subscription_tier IS NULL OR subscription_tier = 'free';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);