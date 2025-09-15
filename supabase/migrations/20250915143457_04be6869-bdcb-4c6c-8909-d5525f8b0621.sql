-- Remove overly broad edge function policies that allow any authenticated user to modify subscription data
DROP POLICY IF EXISTS "Edge functions can insert subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Edge functions can update subscriptions" ON public.subscribers;

-- Create more restrictive policies
-- Only allow service role (edge functions with service key) to insert subscriptions
CREATE POLICY "Service role can insert subscriptions" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Only allow service role (edge functions with service key) to update subscriptions  
CREATE POLICY "Service role can update subscriptions" 
ON public.subscribers 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Keep the existing SELECT policy for users to view their own subscription
-- Policy Name: Users can view their own subscription 
-- Using Expression: ((user_id = auth.uid()) OR (email = auth.email()))