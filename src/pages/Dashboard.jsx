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
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444'
    }
    return colors[status] || '#666'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Panel de Administración</h1>
        <button onClick={handleLogout}
          style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e5e5' }}>
        {['appointments', 'barbers', 'services'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1a1a1a' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#1a1a1a' : '#666'
            }}>
            {tab === 'appointments' ? 'Citas' : tab === 'barbers' ? 'Barberos' : 'Servicios'}
          </button>
        ))}
      </div>

      {activeTab === 'appointments' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <label style={{ fontWeight: 500 }}>Fecha:</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e5e5' }} />
          </div>

          {loading ? (
            <p>Cargando...</p>
          ) : appointments.length === 0 ? (
            <p style={{ color: '#666' }}>No hay citas para esta fecha</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {appointments.map(appt => (
                <div key={appt.id} style={{
                  padding: 16,
                  border: '1px solid #e5e5e5',
                  borderRadius: 8,
                  background: '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{formatTime(appt.starts_at)}</div>
                      <div style={{ fontWeight: 500 }}>{appt.services?.name}</div>
                      <div style={{ color: '#666', fontSize: 14 }}>{appt.services?.duration_min} min</div>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      background: getStatusColor(appt.status),
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {getStatusLabel(appt.status)}
                    </span>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 500 }}>{appt.clients?.name}</div>
                    <div style={{ color: '#666', fontSize: 14 }}>{appt.clients?.phone}</div>
                    {appt.status === 'confirmed' && (
                      <button onClick={() => sendReminder(appt)}
                        style={{ marginTop: 8, padding: '4px 10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        Enviar recordatorio
                      </button>
                    )}
                  </div>

                  <div style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
                    Barbero: <strong>{appt.barbers?.name}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {appt.status === 'pending' && (
                      <button onClick={() => updateStatus(appt.id, 'confirmed')}
                        style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                        Confirmar
                      </button>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        <button onClick={() => sendConfirmation(appt)}
                          style={{ padding: '6px 12px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                          WhatsApp
                        </button>
                        <button onClick={() => updateStatus(appt.id, 'completed')}
                          style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                          Completar
                        </button>
                      </>
                    )}
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <button onClick={() => { sendCancellation(appt); updateStatus(appt.id, 'cancelled') }}
                        style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
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
          <h2 style={{ marginTop: 0 }}>Barberos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {barbers.map(barber => (
              <div key={barber.id} style={{
                padding: 16,
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{barber.name}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>{barber.phone}</div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  background: barber.is_active ? '#10b981' : '#ef4444',
                  color: '#fff',
                  fontSize: 12
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
          <h2 style={{ marginTop: 0 }}>Servicios</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {services.map(service => (
              <div key={service.id} style={{
                padding: 16,
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{service.name}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>{service.duration_min} min · ${service.price.toLocaleString()}</div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  background: service.is_active ? '#10b981' : '#ef4444',
                  color: '#fff',
                  fontSize: 12
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
