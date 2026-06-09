import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Booking() {
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedBarber, setSelectedBarber] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [client, setClient] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [occupiedTimes, setOccupiedTimes] = useState([])

  useEffect(() => {
    supabase.from('services').select('*').eq('is_active', true).then(({ data }) => {
      setServices(data || [])
    })
    supabase.from('barbers').select('*').eq('is_active', true).then(({ data }) => {
      setBarbers(data || [])
    })
  }, [])

  const hours = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

  useEffect(() => {
    if (!selectedDate || !selectedBarber) return
    
    const startOfDay = `${selectedDate}T00:00:00`
    const endOfDay = `${selectedDate}T23:59:59`
    
    supabase
      .from('appointments')
      .select('starts_at')
      .eq('barber_id', selectedBarber.id)
      .gte('starts_at', startOfDay)
      .lte('starts_at', endOfDay)
      .in('status', ['pending', 'confirmed', 'completed'])
      .then(({ data }) => {
        const times = (data || []).map(appt => {
          const date = new Date(appt.starts_at)
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        })
        setOccupiedTimes(times)
      })
  }, [selectedDate, selectedBarber])

  const handleConfirm = async () => {
    if (!client.name || !client.phone) return alert('Por favor ingresa tu nombre y telefono')
    setLoading(true)

    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', client.phone)
      .maybeSingle()

    let clientId

    if (existingClient) {
      clientId = existingClient.id
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({ name: client.name, phone: client.phone, email: client.email || null })
        .select()
        .single()

      if (clientError) {
        console.error('Error cliente:', clientError)
        setLoading(false)
        return alert('Error al guardar cliente')
      }
      clientId = newClient.id
    }

    const startsAt = new Date(`${selectedDate}T${selectedTime}:00`)

    const { error: apptError } = await supabase
      .from('appointments')
      .insert({
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        client_id: clientId,
        starts_at: startsAt,
        status: 'pending'
      })

    setLoading(false)
    if (apptError) {
      console.error('Error cita:', apptError)
      return alert('Error al agendar cita')
    }
    setSuccess(true)
  }

  if (success) return (
    <div style={{
      maxWidth: 500,
      margin: '80px auto',
      padding: '0 20px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--surface)',
        padding: '48px 32px',
        borderRadius: 16,
        border: '1px solid var(--border)'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 32
        }}>
          ✓
        </div>
        <h2 style={{ marginBottom: 16 }}>Cita agendada</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          Tu cita con <strong style={{ color: 'var(--accent)' }}>{selectedBarber?.name}</strong> el{' '}
          <strong style={{ color: 'var(--text)' }}>{selectedDate}</strong> a las{' '}
          <strong style={{ color: 'var(--accent)' }}>{selectedTime}</strong> fue registrada.
        </p>
        <button onClick={() => { setSuccess(false); setStep(1); setSelectedService(null); setSelectedBarber(null); setSelectedDate(''); setSelectedTime('') }}
          style={{
            padding: '14px 32px',
            background: 'var(--accent)',
            color: 'var(--primary)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 600
          }}>
          Agendar otra cita
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ marginBottom: 8 }}>Reserva tu cita</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Paso {step} de 3</p>
      </div>

      {step === 1 && (
        <div>
          <h2 style={{ marginBottom: 24 }}>Elige el servicio</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {services.map(s => (
              <div key={s.id} onClick={() => { setSelectedService(s); setStep(2) }}
                style={{
                  padding: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{s.duration_min} min</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>
                    ${s.price.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ marginBottom: 24 }}>Elige el barbero</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {barbers.map(b => (
              <div key={b.id} onClick={() => { setSelectedBarber(b); setStep(3) }}
                style={{
                  padding: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{b.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{b.phone}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14
            }}>
            ← Atrás
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ marginBottom: 24 }}>Elige fecha y hora</h2>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: 14,
              marginBottom: 24,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 16
            }} />
          
          {selectedDate && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 10,
              marginBottom: 32
            }}>
              {hours.map(h => {
                const isOccupied = occupiedTimes.includes(h)
                return (
                  <div key={h} onClick={() => !isOccupied && setSelectedTime(h)}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      background: isOccupied ? 'var(--surface)' : selectedTime === h ? 'var(--accent)' : 'var(--surface)',
                      border: `1px solid ${isOccupied ? 'var(--border)' : selectedTime === h ? 'var(--accent)' : 'var(--border)'}`,
                      color: isOccupied ? 'var(--text-muted)' : selectedTime === h ? 'var(--primary)' : 'var(--text)',
                      borderRadius: 8,
                      cursor: isOccupied ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: isOccupied ? 'line-through' : 'none',
                      transition: 'all 0.2s'
                    }}>
                    {h}
                  </div>
                )
              })}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div>
              <h3 style={{ marginBottom: 16 }}>Tus datos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <input placeholder="Nombre completo" value={client.name}
                  onChange={e => setClient({ ...client, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                    fontSize: 16
                  }} />
                <input placeholder="Teléfono" value={client.phone}
                  onChange={e => setClient({ ...client, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                    fontSize: 16
                  }} />
                <input placeholder="Email (opcional)" value={client.email}
                  onChange={e => setClient({ ...client, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                    fontSize: 16
                  }} />
              </div>
              <button onClick={handleConfirm} disabled={loading}
                style={{
                  width: '100%',
                  padding: 16,
                  background: 'var(--accent)',
                  color: 'var(--primary)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                  opacity: loading ? 0.6 : 1
                }}>
                {loading ? 'Agendando...' : 'Confirmar cita'}
              </button>
            </div>
          )}

          <button onClick={() => setStep(2)}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14
            }}>
            ← Atrás
          </button>
        </div>
      )}
    </div>
  )
}
