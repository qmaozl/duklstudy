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
    
    // Check local subscription status (for one-time payments and Stripe subscriptions)
    const { data: localSub } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Check if user has a valid one-time payment
    if (localSub?.payment_type === 'one_time' && localSub.valid_until) {
      const validUntil = new Date(localSub.valid_until);
      const now = new Date();
      
      if (validUntil > now) {
        logStep("Valid one-time payment found", { 
          validUntil: localSub.valid_until,
          paymentType: 'one_time' 
        });
        
        return new Response(JSON.stringify({
          subscribed: true,
          subscription_tier: 'pro',
          payment_type: 'one_time',
          subscription_end: localSub.valid_until,
          generations_used: localSub.generations_used || 0,
          generation_limit: null // Unlimited for pro
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // One-time payment expired, update to free
        logStep("One-time payment expired", { validUntil: localSub.valid_until });
        await supabaseClient
          .from('subscribers')
          .update({
            subscribed: false,
            subscription_tier: 'free',
            payment_type: 'free',
            valid_until: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }
    }
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      if (localSub) {
        return new Response(JSON.stringify({
          subscribed: localSub.subscribed || false,
          subscription_tier: localSub.subscription_tier || 'free',
          payment_type: localSub.payment_type || 'free',
          generations_used: localSub.generations_used || 0,
          generation_limit: localSub.subscription_tier === 'pro' ? null : 5
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'free',
        payment_type: 'free',
        generations_used: 0,
        generation_limit: 5 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // List subscriptions without status filter, then check active/trialing
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 20,
    });

    const validSubscriptions = subscriptions.data.filter((sub: any) =>
      sub.status === "active" || sub.status === "trialing"
    );

    const hasActiveSub = validSubscriptions.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionTier = 'free';

    if (hasActiveSub) {
      const subscription = validSubscriptions[0];
      // For trialing subscriptions, use trial_end, for active use current_period_end
      const endTimestamp = subscription.status === "trialing" && subscription.trial_end 
        ? subscription.trial_end 
        : subscription.current_period_end;
      subscriptionEnd = new Date(endTimestamp * 1000).toISOString();
      logStep("Active/Trial subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        endDate: subscriptionEnd 
      });
      productId = subscription.items.data[0].price.product as string;
      subscriptionTier = 'pro'; // All valid subscriptions are pro
      logStep("Determined subscription tier", { productId, subscriptionTier });
      
      // Update local subscription status
      await supabaseClient
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          subscribed: true,
          subscription_tier: 'pro', // Always set to pro for valid subscriptions
          payment_type: 'recurring',
          subscription_end: subscriptionEnd,
          valid_until: null, // Clear one-time payment date
          product_id: productId,
          updated_at: new Date().toISOString()
        });
    } else {
      logStep("No active subscription found");
      
      // Update local subscription to free (only if not a valid one-time payment)
      if (localSub?.payment_type !== 'one_time' || !localSub.valid_until || new Date(localSub.valid_until) <= new Date()) {
        await supabaseClient
          .from('subscribers')
          .upsert({
            user_id: user.id,
            email: user.email,
            subscribed: false,
            subscription_tier: 'free',
            payment_type: 'free',
            subscription_end: null,
            valid_until: null,
            product_id: null,
            updated_at: new Date().toISOString()
          });
      }
    }

    // Get current generations used from database
    const { data: subData } = await supabaseClient
      .from('subscribers')
      .select('generations_used, subscription_tier')
      .eq('user_id', user.id)
      .single();

    const generationsUsed = subData?.generations_used || 0;
    const tier = hasActiveSub ? 'pro' : (subData?.subscription_tier || 'free');
    const generationLimit = tier === 'pro' ? null : 5; // null means unlimited

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: tier,
      payment_type: hasActiveSub ? 'recurring' : (subData?.payment_type || 'free'),
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