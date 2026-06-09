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
    <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <h2>Cita agendada</h2>
      <p>Tu cita con <strong>{selectedBarber?.name}</strong> el <strong>{selectedDate}</strong> a las <strong>{selectedTime}</strong> fue registrada.</p>
      <button onClick={() => { setSuccess(false); setStep(1); setSelectedService(null); setSelectedBarber(null); setSelectedDate(''); setSelectedTime('') }}
        style={{ padding: '10px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginTop: 16 }}>
        Agendar otra cita
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 20px' }}>
      <h1>Reserva tu cita</h1>

      {/* Paso 1: Servicio */}
      {step === 1 && (
        <div>
          <h2>Elige el servicio</h2>
          {services.map(s => (
            <div key={s.id} onClick={() => { setSelectedService(s); setStep(2) }}
              style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 10, cursor: 'pointer' }}>
              <strong>{s.name}</strong>
              <p style={{ margin: '4px 0 0', color: '#666' }}>{s.duration_min} min · ${s.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Paso 2: Barbero */}
      {step === 2 && (
        <div>
          <h2>Elige el barbero</h2>
          {barbers.map(b => (
            <div key={b.id} onClick={() => { setSelectedBarber(b); setStep(3) }}
              style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 10, cursor: 'pointer' }}>
              <strong>{b.name}</strong>
              <p style={{ margin: '4px 0 0', color: '#666' }}>{b.phone}</p>
            </div>
          ))}
          <button onClick={() => setStep(1)}
            style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            Atras
          </button>
        </div>
      )}

      {/* Paso 3: Fecha y hora */}
      {step === 3 && (
        <div>
          <h2>Elige fecha y hora</h2>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 6, border: '1px solid #ddd' }} />
          {selectedDate && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {hours.map(h => {
                const isOccupied = occupiedTimes.includes(h)
                return (
                  <div key={h} onClick={() => !isOccupied && setSelectedTime(h)}
                    style={{ 
                      padding: '10px 4px', 
                      textAlign: 'center', 
                      border: `1px solid ${isOccupied ? '#ccc' : selectedTime === h ? '#111' : '#ddd'}`,
                      background: isOccupied ? '#f5f5f5' : selectedTime === h ? '#111' : '#fff', 
                      color: isOccupied ? '#999' : selectedTime === h ? '#fff' : '#111',
                      borderRadius: 6, 
                      cursor: isOccupied ? 'not-allowed' : 'pointer', 
                      fontSize: 14,
                      textDecoration: isOccupied ? 'line-through' : 'none'
                    }}>
                    {h}
                  </div>
                )
              })}
            </div>
          )}
          {selectedDate && selectedTime && (
            <div>
              <h3>Tus datos</h3>
              <input placeholder="Nombre completo" value={client.name}
                onChange={e => setClient({ ...client, name: e.target.value })}
                style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ddd' }} />
              <input placeholder="Telefono" value={client.phone}
                onChange={e => setClient({ ...client, phone: e.target.value })}
                style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ddd' }} />
              <input placeholder="Email (opcional)" value={client.email}
                onChange={e => setClient({ ...client, email: e.target.value })}
                style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 6, border: '1px solid #ddd' }} />
              <button onClick={handleConfirm} disabled={loading}
                style={{ width: '100%', padding: 12, background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16 }}>
                {loading ? 'Agendando...' : 'Confirmar cita'}
              </button>
            </div>
          )}
          <button onClick={() => setStep(2)}
            style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            Atras
          </button>
        </div>
      )}
    </div>
  )
}