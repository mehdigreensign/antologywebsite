import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactRequest {
  email: string;
  formType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, formType }: ContactRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        email: email,
        form_type: formType,
        processed: false,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save submission' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const emailBody = `
New Contact Request from Antology.ai Website

Email: ${email}
Form Type: ${formType}
Timestamp: ${new Date().toISOString()}

The prospect is interested in learning more about AI-powered route optimization solution for delivery businesses.

Please follow up to schedule a demo.
    `.trim();

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Antology.ai <onboarding@resend.dev>',
            to: ['sales@antology.ai'],
            subject: 'Route Optimization Demo Request from Antology.ai',
            text: emailBody,
          }),
        });

        if (!resendResponse.ok) {
          console.error('Resend API error:', await resendResponse.text());
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    try {
      const timestamp = new Date().toISOString();
      const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxA4Y_TlW8aLpONsFsf5qk4Xg7VBTCYoD8xGwZ5N3gOyPdNDVXjYQyK1dFXxqQ7jMiN/exec';
      
      const googleSheetResponse = await fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          formType: formType,
          timestamp: timestamp,
        }),
      });

      console.log('Google Sheet submission sent');
    } catch (sheetError) {
      console.error('Google Sheet error:', sheetError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing contact request:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});