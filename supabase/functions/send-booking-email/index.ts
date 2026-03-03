import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  // ✅ CORS preflight
  if (req?.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  try {
    const { type, booking, contact } = await req?.json();
    const RESEND_API_KEY = Deno?.env?.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const brandColor = "#0ea5e9";
    const ADMIN_EMAIL = Deno?.env?.get("ADMIN_EMAIL") || "roywaitseveryday2@gmail.com";

    const emailHeader = `
      <div style="background-color: ${brandColor}; padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-family: serif;">Paragon</h1>
      </div>
    `;

    const emailFooter = `
      <div style="background-color: #f3f4f6; padding: 30px 20px; text-align: center; margin-top: 40px;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">© 2026 Paragon. All rights reserved.</p>
        <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">
          <a href="https://paragondel6143.builtwithrocket.new" style="color: ${brandColor}; text-decoration: none;">Visit Website</a> | 
          <a href="https://paragondel6143.builtwithrocket.new/contact" style="color: ${brandColor}; text-decoration: none;">Contact Us</a>
        </p>
      </div>
    `;

    let subject = "";
    let html = "";
    let toEmail = "";

    switch (type) {
      case "contact":
        toEmail = contact?.email;
        subject = `Thank you for contacting us - ${contact?.subject}`;
        html = `
          <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto;">
              ${emailHeader}
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">Thank You for Reaching Out!</h2>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${contact?.name},</p>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">Thank you for contacting us. We have received your message and will get back to you within 24 hours.</p>
                <div style="background-color: #f9fafb; border-left: 4px solid ${brandColor}; padding: 20px; margin: 0 0 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Subject:</strong> ${contact?.subject}</p>
                  <p style="margin: 0; color: #1f2937;"><strong>Your Message:</strong></p>
                  <p style="margin: 10px 0 0 0; color: #4b5563;">${contact?.message}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="mailto:${ADMIN_EMAIL}" style="display: inline-block; background-color: ${brandColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">Contact Me</a>
                </div>
              </div>
              ${emailFooter}
            </div>
          </body></html>
        `;
        break;

      case "admin_new_contact":
        toEmail = ADMIN_EMAIL;
        subject = `New Contact Message: ${contact?.subject}`;
        html = `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto;">
              ${emailHeader}
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">📬 New Contact Message Received</h2>
                <div style="background-color: #f9fafb; border-left: 4px solid ${brandColor}; padding: 20px; margin: 0 0 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>From:</strong> ${contact?.name}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Email:</strong> ${contact?.email}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Subject:</strong> ${contact?.subject}</p>
                  <p style="margin: 0; color: #1f2937;"><strong>Message:</strong></p>
                  <p style="margin: 10px 0 0 0; color: #4b5563;">${contact?.message}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://paragondel6143.builtwithrocket.new/admin/contacts" style="display: inline-block; background-color: ${brandColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">View in Dashboard</a>
                </div>
              </div>
              ${emailFooter}
            </div>
          </body></html>
        `;
        break;

      case "admin_new_booking":
        toEmail = ADMIN_EMAIL;
        subject = `New Booking Request: ${booking?.service_type} - ${booking?.name}`;
        html = `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto;">
              ${emailHeader}
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">📅 New Booking Request</h2>
                <div style="background-color: #f9fafb; border-left: 4px solid ${brandColor}; padding: 20px; margin: 0 0 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Client:</strong> ${booking?.name}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Email:</strong> ${booking?.email}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Phone:</strong> ${booking?.phone}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Service:</strong> ${booking?.service_type}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Event Date:</strong> ${new Date(booking?.event_date)?.toLocaleDateString()}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Location:</strong> ${booking?.event_location}</p>
                  ${booking?.message ? `<p style="margin: 0; color: #1f2937;"><strong>Message:</strong> ${booking?.message}</p>` : ''}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://paragondel6143.builtwithrocket.new/admin/bookings" style="display: inline-block; background-color: ${brandColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">Manage Bookings</a>
                </div>
              </div>
              ${emailFooter}
            </div>
          </body></html>
        `;
        break;

      case "confirmation":
        toEmail = booking?.email;
        subject = `Booking Confirmed - ${booking?.service_type}`;
        html = `
          <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto;">
              ${emailHeader}
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">✅ Booking Confirmed!</h2>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${booking?.name},</p>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">Great news! Your booking has been confirmed. Here are the details:</p>
                <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Service:</strong> ${booking?.service_type}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Date:</strong> ${new Date(booking?.event_date)?.toLocaleDateString()}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Location:</strong> ${booking?.event_location}</p>
                  <p style="margin: 0; color: #1f2937;"><strong>Status:</strong> <span style="color: #10b981;">Confirmed</span></p>
                </div>
                <p style="color: #4b5563; line-height: 1.6;">I'm looking forward to working with you! If you have any questions, feel free to reach out.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://paragondel6143.builtwithrocket.new/my-bookings" style="display: inline-block; background-color: ${brandColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">View My Booking</a>
                </div>
              </div>
              ${emailFooter}
            </div>
          </body></html>
        `;
        break;

      case "cancellation":
        toEmail = booking?.email;
        subject = `Booking Cancelled - ${booking?.service_type}`;
        html = `
          <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto;">
              ${emailHeader}
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">Booking Cancelled</h2>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${booking?.name},</p>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">Your booking has been cancelled:</p>
                <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 0 0 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Service:</strong> ${booking?.service_type}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Original Date:</strong> ${new Date(booking?.event_date)?.toLocaleDateString()}</p>
                  <p style="margin: 0; color: #1f2937;"><strong>Status:</strong> <span style="color: #ef4444;">Cancelled</span></p>
                  ${booking?.cancellation_reason ? `<p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px solid #fecaca; color: #1f2937;"><strong>Reason:</strong> ${booking?.cancellation_reason}</p>` : ''}
                </div>
                <p style="color: #4b5563; line-height: 1.6;">I'm sorry we couldn't work together this time. Feel free to book again in the future!</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://paragondel6143.builtwithrocket.new/booking" style="display: inline-block; background-color: ${brandColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">Book Again</a>
                </div>
              </div>
              ${emailFooter}
            </div>
          </body></html>
        `;
        break;

      case "status_update":
        toEmail = booking?.email;
        subject = `Booking Status Update - ${booking?.service_type}`;
        html = `
          <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto;">
              ${emailHeader}
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">Booking Status Update</h2>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${booking?.name},</p>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">Your booking status has been updated:</p>
                <div style="background-color: #f9fafb; border-left: 4px solid ${brandColor}; padding: 20px; margin: 0 0 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Service:</strong> ${booking?.service_type}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Date:</strong> ${new Date(booking?.event_date)?.toLocaleDateString()}</p>
                  <p style="margin: 0; color: #1f2937;"><strong>New Status:</strong> <span style="text-transform: capitalize;">${booking?.status}</span></p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://paragondel6143.builtwithrocket.new/my-bookings" style="display: inline-block; background-color: ${brandColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">View My Booking</a>
                </div>
              </div>
              ${emailFooter}
            </div>
          </body></html>
        `;
        break;

      case "reminder":
        toEmail = booking?.email;
        subject = `Upcoming Event Reminder - ${booking?.service_type}`;
        html = `
          <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto;">
              ${emailHeader}
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">📅 Event Reminder</h2>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">Hi ${booking?.name},</p>
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">This is a friendly reminder about your upcoming event:</p>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0;">
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Service:</strong> ${booking?.service_type}</p>
                  <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Date:</strong> ${new Date(booking?.event_date)?.toLocaleDateString()}</p>
                  <p style="margin: 0; color: #1f2937;"><strong>Location:</strong> ${booking?.event_location}</p>
                </div>
                <p style="color: #4b5563; line-height: 1.6;">I'm excited to work with you! Please let me know if you need any last-minute adjustments.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://paragondel6143.builtwithrocket.new/my-bookings" style="display: inline-block; background-color: ${brandColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">View My Booking</a>
                </div>
              </div>
              ${emailFooter}
            </div>
          </body></html>
        `;
        break;

      default:
        throw new Error("Invalid email type");
    }

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: toEmail,
        subject: subject,
        html: html
      })
    });

    const data = await response?.json();

    if (!response?.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully",
      emailId: data.id
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});