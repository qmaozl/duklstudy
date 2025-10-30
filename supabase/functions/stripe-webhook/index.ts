import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not set");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Processing event: ${event.type}`);

    // Handle successful one-time payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Check if this is a one-time payment
      if (session.mode === "payment" && session.metadata?.payment_type === "one_time") {
        const userId = session.metadata.user_id;
        const durationDays = parseInt(session.metadata.duration_days || "30");
        
        if (!userId) {
          console.error("No user_id in session metadata");
          return new Response(JSON.stringify({ error: "No user_id" }), { status: 400 });
        }

        // Calculate valid_until date (30 days from now)
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + durationDays);

        console.log(`Activating one-time payment for user ${userId} until ${validUntil.toISOString()}`);

        // Update subscriber record
        const { error } = await supabaseClient
          .from('subscribers')
          .upsert({
            user_id: userId,
            email: session.customer_email || session.customer_details?.email,
            subscribed: true,
            subscription_tier: 'pro',
            payment_type: 'one_time',
            valid_until: validUntil.toISOString(),
            subscription_end: validUntil.toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error("Error updating subscriber:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        console.log(`Successfully activated one-time payment for user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Webhook error" }),
      { status: 400 }
    );
  }
});