import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Get current subscription info
    const { data: subData, error: subError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      throw new Error("Could not fetch subscription data");
    }

    const currentUsed = subData?.generations_used || 0;
    const isPro = (subData?.subscription_tier || 'free') === 'pro';
    const limit: number | null = isPro ? null : 5;

    // Check if user has exceeded limit (only for free tier)
    if (limit !== null && currentUsed >= limit) {
      return new Response(JSON.stringify({ 
        error: "Generation limit exceeded",
        generations_used: currentUsed,
        generation_limit: limit 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Increment generation count (upsert to ensure row exists)
    const { error: updateError } = await supabaseClient
      .from('subscribers')
      .upsert({ 
        user_id: user.id,
        generations_used: currentUsed + 1,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error("Error updating generations:", updateError);
      throw new Error("Could not update generation count");
    }

    const remaining = limit === null ? null : (limit - (currentUsed + 1));
    return new Response(JSON.stringify({
      success: true,
      generations_used: currentUsed + 1,
      generation_limit: limit,
      remaining
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR in increment-generation:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});