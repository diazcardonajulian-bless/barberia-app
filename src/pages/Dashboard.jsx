import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('appointments')
  const [appointments, setAppointments] = useState([])
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const startOfDay = `${selectedDate}T00:00:00`
      const endOfDay = `${selectedDate}T23:59:59`

      const { data: appts } = await supabase
        .from('appointments')
        .select('*, barbers(name), services(name, duration_min), clients(name, phone)')
        .gte('starts_at', startOfDay)
        .lte('starts_at', endOfDay)
        .order('starts_at')

      setAppointments(appts || [])

      const { data: barbersData } = await supabase
        .from('barbers')
        .select('*')
        .order('name')

      setBarbers(barbersData || [])

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('name')

      setServices(servicesData || [])
      setLoading(false)
    }
    fetch()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    const startOfDay = `${selectedDate}T00:00:00`
    const endOfDay = `${selectedDate}T23:59:59`

    const { data: appts } = await supabase
      .from('appointments')
      .select('*, barbers(name), services(name, duration_min), clients(name, phone)')
      .gte('starts_at', startOfDay)
      .lte('starts_at', endOfDay)
      .order('starts_at')

    setAppointments(appts || [])

    const { data: barbersData } = await supabase
      .from('barbers')
      .select('*')
      .order('name')

    setBarbers(barbersData || [])

    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .order('name')

    setServices(servicesData || [])
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('appointments').update({ status }).eq('id', id)
    loadData()
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'var(--warning)',
      confirmed: 'var(--info)',
      completed: 'var(--success)',
      cancelled: 'var(--error)'
    }
    return colors[status] || 'var(--text-muted)'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }
    return labels[status] || status
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatPhone = (phone) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('57') && cleaned.length === 12) return cleaned
    if (cleaned.length === 10) return '57' + cleaned
    return cleaned
  }

  const sendWhatsApp = (phone, message) => {
    const formattedPhone = formatPhone(phone)
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank')
  }

  const sendConfirmation = (appt) => {
    const message = `Hola ${appt.clients?.name}, tu cita para ${appt.services?.name} con ${appt.barbers?.name} el ${formatDate(appt.starts_at)} a las ${formatTime(appt.starts_at)} ha sido confirmada. Te esperamos!`
    sendWhatsApp(appt.clients?.phone, message)
  }

  const sendReminder = (appt) => {
    const message = `Hola ${appt.clients?.name}, te recordamos que mañana tienes cita para ${appt.services?.name} con ${appt.barbers?.name} a las ${formatTime(appt.starts_at)}. Te esperamos!`
    sendWhatsApp(appt.clients?.phone, message)
  }

  const sendCancellation = (appt) => {
    const message = `Hola ${appt.clients?.name}, lamentamos informarte que tu cita para ${appt.services?.name} del ${formatDate(appt.starts_at)} ha sido cancelada. Por favor contáctanos para reprogramar.`
    sendWhatsApp(appt.clients?.phone, message)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>Panel de Administración</h1>
        <button onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: 'var(--error)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500
          }}>
          Cerrar sesión
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 32,
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto'
      }}>
        {['appointments', 'barbers', 'services'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              fontSize: 15
            }}>
            {tab === 'appointments' ? 'Citas' : tab === 'barbers' ? 'Barberos' : 'Servicios'}
          </button>
        ))}
      </div>

      {activeTab === 'appointments' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap'
          }}>
            <label style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Fecha:</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 14
              }} />
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Cargando...</p>
          ) : appointments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No hay citas para esta fecha</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {appointments.map(appt => (
                <div key={appt.id} style={{
                  padding: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
                        {formatTime(appt.starts_at)}
                      </div>
                      <div style={{ fontWeight: 500, fontSize: 16 }}>{appt.services?.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{appt.services?.duration_min} min</div>
                    </div>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      background: getStatusColor(appt.status),
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600
                    }}>
                      {getStatusLabel(appt.status)}
                    </span>
                  </div>

                  <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{appt.clients?.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{appt.clients?.phone}</div>
                    {appt.status === 'confirmed' && (
                      <button onClick={() => sendReminder(appt)}
                        style={{
                          marginTop: 10,
                          padding: '6px 12px',
                          background: 'var(--whatsapp)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 500
                        }}>
                        Enviar recordatorio
                      </button>
                    )}
                  </div>

                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                    Barbero: <strong style={{ color: 'var(--text)' }}>{appt.barbers?.name}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {appt.status === 'pending' && (
                      <button onClick={() => updateStatus(appt.id, 'confirmed')}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--info)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500
                        }}>
                        Confirmar
                      </button>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        <button onClick={() => sendConfirmation(appt)}
                          style={{
                            padding: '8px 16px',
                            background: 'var(--whatsapp)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500
                          }}>
                          WhatsApp
                        </button>
                        <button onClick={() => updateStatus(appt.id, 'completed')}
                          style={{
                            padding: '8px 16px',
                            background: 'var(--success)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500
                          }}>
                          Completar
                        </button>
                      </>
                    )}
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <button onClick={() => { sendCancellation(appt); updateStatus(appt.id, 'cancelled') }}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--error)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500
                        }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'barbers' && (
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 24 }}>Barberos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {barbers.map(barber => (
              <div key={barber.id} style={{
                padding: 20,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{barber.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{barber.phone}</div>
                </div>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: barber.is_active ? 'var(--success)' : 'var(--error)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  {barber.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 24 }}>Servicios</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {services.map(service => (
              <div key={service.id} style={{
                padding: 20,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{service.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    {service.duration_min} min · <span style={{ color: 'var(--accent)' }}>${service.price.toLocaleString()}</span>
                  </div>
                </div>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: service.is_active ? 'var(--success)' : 'var(--error)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  {service.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
