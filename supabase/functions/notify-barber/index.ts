import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()
    
    if (!record || !record.id) {
      return new Response(
        JSON.stringify({ error: 'No appointment record provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        barbers ( name, email ),
        services ( name, duration_min ),
        clients ( name, phone )
      `)
      .eq('id', record.id)
      .single()

    if (error || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointment details' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { barbers, services, clients, starts_at } = appointment
    
    if (!barbers?.email) {
      return new Response(
        JSON.stringify({ error: 'Barber has no email configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const appointmentDate = new Date(starts_at)
    const formattedDate = appointmentDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const formattedTime = appointmentDate.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
            .header { background: #1a1a1a; color: #c9a961; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { color: #1a1a1a; font-weight: bold; margin-bottom: 10px; font-size: 16px; }
            .section-content { color: #666; line-height: 1.6; }
            .highlight { background: #f9f9f9; padding: 15px; border-left: 4px solid #c9a961; margin: 15px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nueva Cita Agendada</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${barbers.name}</strong>,</p>
              <p>Has recibido una nueva cita que requiere tu atención:</p>
              
              <div class="highlight">
                <div class="section">
                  <div class="section-title">Fecha y Hora</div>
                  <div class="section-content">${formattedDate} a las ${formattedTime}</div>
                </div>
                
                <div class="section">
                  <div class="section-title">Servicio</div>
                  <div class="section-content">${services?.name} (${services?.duration_min} minutos)</div>
                </div>
                
                <div class="section">
                  <div class="section-title">Cliente</div>
                  <div class="section-content">
                    ${clients?.name}<br>
                    ${clients?.phone || 'Sin teléfono'}
                  </div>
                </div>
              </div>
              
              <p>Por favor, ingresa al panel de administración para confirmar esta cita.</p>
            </div>
            <div class="footer">
              Este es un email automático del sistema de reservas
            </div>
          </div>
        </body>
      </html>
    `

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Barbería <onboarding@resend.dev>',
        to: [barbers.email],
        subject: `Nueva cita: ${clients?.name} - ${formattedDate}`,
        html: emailHtml
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const emailResult = await emailResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.id,
        message: `Email sent to ${barbers.email}`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
