import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking local subscription status");
      
      // Check local subscription status
      const { data: localSub } = await supabaseClient
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (localSub) {
        return new Response(JSON.stringify({
          subscribed: localSub.subscribed || false,
          subscription_tier: localSub.subscription_tier || 'free',
          generations_used: localSub.generations_used || 0,
          generation_limit: localSub.subscription_tier === 'pro' ? 1500 : 5
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'free',
        generations_used: 0,
        generation_limit: 5 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionTier = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      productId = subscription.items.data[0].price.product as string;
      subscriptionTier = 'pro'; // Assuming all active subscriptions are pro for now
      logStep("Determined subscription tier", { productId, subscriptionTier });
      
      // Update local subscription status
      await supabaseClient
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          subscribed: true,
          subscription_tier: subscriptionTier,
          subscription_end: subscriptionEnd,
          product_id: productId,
          updated_at: new Date().toISOString()
        });
    } else {
      logStep("No active subscription found");
      
      // Update local subscription to free
      await supabaseClient
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null,
          product_id: null,
          updated_at: new Date().toISOString()
        });
    }

    // Get current generations used from database
    const { data: subData } = await supabaseClient
      .from('subscribers')
      .select('generations_used, subscription_tier')
      .eq('user_id', user.id)
      .single();

    const generationsUsed = subData?.generations_used || 0;
    const tier = subData?.subscription_tier || subscriptionTier;
    const generationLimit = tier === 'pro' ? 1500 : 5;

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
      generations_used: generationsUsed,
      generation_limit: generationLimit
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});