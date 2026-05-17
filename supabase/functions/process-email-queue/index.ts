import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch pending emails from queue
    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) throw fetchError

    const results = []

    for (const email of emails || []) {
      try {
        let subject = ''
        let html = ''

        switch (email.type) {
          case 'connect_request_received':
            subject = `${email.from_name} wants to connect with you on Orbyt`
            html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #000;">New Connection Request</h2>
                <p>Hi ${email.to_name},</p>
                <p><strong>${email.from_name}</strong> wants to connect with you on Orbyt.</p>
                ${email.project_name ? `<p>Project: <strong>${email.project_name}</strong></p>` : ''}
                <p>
                  <a href="https://orbyt.app/connections" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    View Request
                  </a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 32px;">
                  This is an automated email from Orbyt. Please do not reply to this email.
                </p>
              </div>
            `
            break

          case 'connect_request_accepted':
            subject = `${email.from_name} accepted your connection request`
            html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #000;">Connection Request Accepted</h2>
                <p>Hi ${email.to_name},</p>
                <p><strong>${email.from_name}</strong> accepted your connection request on Orbyt!</p>
                <p>You can now collaborate together on projects.</p>
                <p>
                  <a href="https://orbyt.app/connections" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    View Connections
                  </a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 32px;">
                  This is an automated email from Orbyt. Please do not reply to this email.
                </p>
              </div>
            `
            break

          case 'friend_new_project':
            subject = `${email.from_name} created a new project: ${email.project_name}`
            html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #000;">Friend Added New Project</h2>
                <p>Hi ${email.to_name},</p>
                <p>Your friend <strong>${email.from_name}</strong> just created a new project on Orbyt:</p>
                <p style="font-size: 18px; font-weight: bold;">${email.project_name}</p>
                <p>
                  <a href="${email.project_link || 'https://orbyt.app/dashboard'}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    View Project
                  </a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 32px;">
                  This is an automated email from Orbyt. Please do not reply to this email.
                </p>
              </div>
            `
            break
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Orbyt <notifications@orbyt.app>',
            to: [email.to_email],
            subject,
            html,
          }),
        })

        const data = await res.json()

        if (res.ok) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', email.id)

          results.push({ id: email.id, status: 'sent' })
        } else {
          throw new Error(`Resend API error: ${JSON.stringify(data)}`)
        }
      } catch (error) {
        // Mark as failed and increment attempts
        await supabase
          .from('email_queue')
          .update({
            status: email.attempts >= 2 ? 'failed' : 'pending',
            attempts: email.attempts + 1,
            error_message: error.message
          })
          .eq('id', email.id)

        results.push({ id: email.id, status: 'error', error: error.message })
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
