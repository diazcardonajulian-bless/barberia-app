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
  
  const [editingBarber, setEditingBarber] = useState(null)
  const [editingService, setEditingService] = useState(null)
  const [showAddBarber, setShowAddBarber] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  
  const [barberForm, setBarberForm] = useState({ name: '', phone: '', is_active: true })
  const [serviceForm, setServiceForm] = useState({ name: '', duration_min: 30, price: 0, is_active: true })

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

  const handleAddBarber = async (e) => {
    e.preventDefault()
    await supabase.from('barbers').insert(barberForm)
    setBarberForm({ name: '', phone: '', is_active: true })
    setShowAddBarber(false)
    loadData()
  }

  const handleUpdateBarber = async (e) => {
    e.preventDefault()
    await supabase.from('barbers').update(barberForm).eq('id', editingBarber.id)
    setEditingBarber(null)
    setBarberForm({ name: '', phone: '', is_active: true })
    loadData()
  }

  const handleDeleteBarber = async (id, name) => {
    if (!confirm(`¿Estás seguro de eliminar al barbero "${name}"? Esta acción no se puede deshacer.`)) return
    await supabase.from('barbers').delete().eq('id', id)
    loadData()
  }

  const handleAddService = async (e) => {
    e.preventDefault()
    await supabase.from('services').insert(serviceForm)
    setServiceForm({ name: '', duration_min: 30, price: 0, is_active: true })
    setShowAddService(false)
    loadData()
  }

  const handleUpdateService = async (e) => {
    e.preventDefault()
    await supabase.from('services').update(serviceForm).eq('id', editingService.id)
    setEditingService(null)
    setServiceForm({ name: '', duration_min: 30, price: 0, is_active: true })
    loadData()
  }

  const handleDeleteService = async (id, name) => {
    if (!confirm(`¿Estás seguro de eliminar el servicio "${name}"? Esta acción no se puede deshacer.`)) return
    await supabase.from('services').delete().eq('id', id)
    loadData()
  }

  const startEditBarber = (barber) => {
    setEditingBarber(barber)
    setBarberForm({ name: barber.name, phone: barber.phone, is_active: barber.is_active })
  }

  const startEditService = (service) => {
    setEditingService(service)
    setServiceForm({ name: service.name, duration_min: service.duration_min, price: service.price, is_active: service.is_active })
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

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 14
  }

  const buttonStyle = (bg) => ({
    padding: '8px 16px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500
  })

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
                        style={buttonStyle('var(--info)')}>
                        Confirmar
                      </button>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        <button onClick={() => sendConfirmation(appt)}
                          style={buttonStyle('var(--whatsapp)')}>
                          WhatsApp
                        </button>
                        <button onClick={() => updateStatus(appt.id, 'completed')}
                          style={buttonStyle('var(--success)')}>
                          Completar
                        </button>
                      </>
                    )}
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <button onClick={() => { sendCancellation(appt); updateStatus(appt.id, 'cancelled') }}
                        style={buttonStyle('var(--error)')}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>Barberos</h2>
            <button onClick={() => setShowAddBarber(true)}
              style={buttonStyle('var(--accent)')}>
              + Agregar
            </button>
          </div>

          {showAddBarber && (
            <form onSubmit={handleAddBarber} style={{
              padding: 20,
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              marginBottom: 16
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Nuevo Barbero</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <input
                  placeholder="Nombre"
                  value={barberForm.name}
                  onChange={e => setBarberForm({ ...barberForm, name: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  placeholder="Teléfono"
                  value={barberForm.phone}
                  onChange={e => setBarberForm({ ...barberForm, phone: e.target.value })}
                  required
                  style={inputStyle}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={barberForm.is_active}
                    onChange={e => setBarberForm({ ...barberForm, is_active: e.target.checked })}
                  />
                  Activo
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={buttonStyle('var(--success)')}>Guardar</button>
                <button type="button" onClick={() => setShowAddBarber(false)} style={buttonStyle('var(--text-muted)')}>Cancelar</button>
              </div>
            </form>
          )}

          {editingBarber && (
            <form onSubmit={handleUpdateBarber} style={{
              padding: 20,
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              marginBottom: 16
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Editar Barbero</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <input
                  placeholder="Nombre"
                  value={barberForm.name}
                  onChange={e => setBarberForm({ ...barberForm, name: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  placeholder="Teléfono"
                  value={barberForm.phone}
                  onChange={e => setBarberForm({ ...barberForm, phone: e.target.value })}
                  required
                  style={inputStyle}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={barberForm.is_active}
                    onChange={e => setBarberForm({ ...barberForm, is_active: e.target.checked })}
                  />
                  Activo
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={buttonStyle('var(--success)')}>Actualizar</button>
                <button type="button" onClick={() => { setEditingBarber(null); setBarberForm({ name: '', phone: '', is_active: true }) }} style={buttonStyle('var(--text-muted)')}>Cancelar</button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {barbers.map(barber => (
              <div key={barber.id} style={{
                padding: 20,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
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
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => startEditBarber(barber)} style={buttonStyle('var(--info)')}>Editar</button>
                  <button onClick={() => handleDeleteBarber(barber.id, barber.name)} style={buttonStyle('var(--error)')}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>Servicios</h2>
            <button onClick={() => setShowAddService(true)}
              style={buttonStyle('var(--accent)')}>
              + Agregar
            </button>
          </div>

          {showAddService && (
            <form onSubmit={handleAddService} style={{
              padding: 20,
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              marginBottom: 16
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Nuevo Servicio</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <input
                  placeholder="Nombre"
                  value={serviceForm.name}
                  onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Duración (min)"
                  value={serviceForm.duration_min}
                  onChange={e => setServiceForm({ ...serviceForm, duration_min: parseInt(e.target.value) })}
                  required
                  min="1"
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={serviceForm.price}
                  onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={serviceForm.is_active}
                    onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  />
                  Activo
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={buttonStyle('var(--success)')}>Guardar</button>
                <button type="button" onClick={() => setShowAddService(false)} style={buttonStyle('var(--text-muted)')}>Cancelar</button>
              </div>
            </form>
          )}

          {editingService && (
            <form onSubmit={handleUpdateService} style={{
              padding: 20,
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              marginBottom: 16
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Editar Servicio</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <input
                  placeholder="Nombre"
                  value={serviceForm.name}
                  onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Duración (min)"
                  value={serviceForm.duration_min}
                  onChange={e => setServiceForm({ ...serviceForm, duration_min: parseInt(e.target.value) })}
                  required
                  min="1"
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={serviceForm.price}
                  onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={serviceForm.is_active}
                    onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  />
                  Activo
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={buttonStyle('var(--success)')}>Actualizar</button>
                <button type="button" onClick={() => { setEditingService(null); setServiceForm({ name: '', duration_min: 30, price: 0, is_active: true }) }} style={buttonStyle('var(--text-muted)')}>Cancelar</button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {services.map(service => (
              <div key={service.id} style={{
                padding: 20,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
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
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => startEditService(service)} style={buttonStyle('var(--info)')}>Editar</button>
                  <button onClick={() => handleDeleteService(service.id, service.name)} style={buttonStyle('var(--error)')}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
