import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PROMO_CODES = {
  "TESTERSIGMAGRIND": {
    name: "Tester Sigma Grind Access",
    product_id: "prod_RfL0VMGc0e5Z9n", // Dukl Pro product ID
    duration_days: 30
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log('Starting promo code activation process...');
    
    const { promo_code } = await req.json();
    
    if (!promo_code) {
      throw new Error("Promo code is required");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    console.log('User authenticated:', user.email);
    console.log('Attempting to activate promo code:', promo_code);

    // Check if promo code is valid
    const promoDetails = VALID_PROMO_CODES[promo_code.toUpperCase() as keyof typeof VALID_PROMO_CODES];
    if (!promoDetails) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid promo code" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing customer:', customerId);
      
      // Check if they already have an active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        console.log('User already has active subscription');
        return new Response(JSON.stringify({ 
          success: false, 
          error: "You already have an active subscription" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      // Create new customer
      console.log('Creating new customer');
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
      console.log('Created new customer:', customerId);
    }

    // Create a subscription with trial period to simulate instant activation
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: "price_1S9nWWRrrSboS67qSLe52yh0", // Dukl Pro price ID
        },
      ],
      trial_end: Math.floor((Date.now() + (promoDetails.duration_days * 24 * 60 * 60 * 1000)) / 1000),
      metadata: {
        promo_code: promo_code,
        activated_by: user.email
      }
    });

    console.log('Promo subscription created:', subscription.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${promoDetails.name} activated! You now have Dukl Pro access for ${promoDetails.duration_days} days.`,
      subscription_id: subscription.id,
      trial_end: new Date(subscription.trial_end * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in activate-promo-code:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate promo code'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});