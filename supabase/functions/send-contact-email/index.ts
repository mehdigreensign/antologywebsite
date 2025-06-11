const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ContactRequest {
  email: string;
  source: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, source }: ContactRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Email content
    const subject = "Route Optimization Demo Request";
    const emailBody = `
New contact request from Antology.ai website:

Email: ${email}
Source: ${source}
Timestamp: ${new Date().toISOString()}

The prospect is interested in learning more about AI-powered route optimization solution for delivery businesses.

Please follow up to schedule a demo.
    `.trim();

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    
    // For now, we'll simulate the email sending and log the details
    console.log("Email would be sent to: sales@antology.ai");
    console.log("Subject:", subject);
    console.log("Body:", emailBody);
    console.log("From email:", email);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Thank you for your interest! Our sales team will contact you within 24 hours." 
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error processing contact request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process your request. Please try again later." 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});