import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface NotificationPayload {
  to_email: string
  to_name: string
  type: 'connect_request_received' | 'connect_request_accepted' | 'friend_new_project'
  from_name: string
  project_name?: string
  project_link?: string
}

serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json()

    let subject = ''
    let html = ''

    switch (payload.type) {
      case 'connect_request_received':
        subject = `${payload.from_name} wants to connect with you on Orbyt`
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000;">New Connection Request</h2>
            <p>Hi ${payload.to_name},</p>
            <p><strong>${payload.from_name}</strong> wants to connect with you on Orbyt.</p>
            ${payload.project_name ? `<p>Project: <strong>${payload.project_name}</strong></p>` : ''}
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
        subject = `${payload.from_name} accepted your connection request`
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000;">Connection Request Accepted</h2>
            <p>Hi ${payload.to_name},</p>
            <p><strong>${payload.from_name}</strong> accepted your connection request on Orbyt!</p>
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
        subject = `${payload.from_name} created a new project: ${payload.project_name}`
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000;">Friend Added New Project</h2>
            <p>Hi ${payload.to_name},</p>
            <p>Your friend <strong>${payload.from_name}</strong> just created a new project on Orbyt:</p>
            <p style="font-size: 18px; font-weight: bold;">${payload.project_name}</p>
            <p>
              <a href="${payload.project_link || 'https://orbyt.app/dashboard'}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
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
        to: [payload.to_email],
        subject,
        html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`)
    }

    return new Response(JSON.stringify({ success: true, data }), {
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
