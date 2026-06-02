import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { WebApp } from '@twa-dev/sdk'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [courierLocation, setCourierLocation] = useState(null)
  const [debugInfo, setDebugInfo] = useState("")
  const channelRef = useRef(null)

  useEffect(() => {
    try {
      const tg = WebApp
      tg.ready()
      tg.expand()

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user)
        setDebugInfo(`user.id = ${tg.initDataUnsafe.user.id} (з Telegram)`)
      } else {
        setDebugInfo("Запуск в браузері (не Telegram)")
      }
    } catch (e) {
      setDebugInfo("Запуск в браузері")
    }

    fetchOrders()
    fetchCourierLocation()
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    setOrders(data || [])
    setDebugInfo(prev => prev + ` | Замовлень: ${data?.length || 0}`)
  }

  const fetchCourierLocation = async () => {
    const { data } = await supabase
      .from('courier_coordinates')
      .select('latitude, longitude')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setCourierLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) })
    }
  }

  const getStatus = (status) => {
    switch (status) {
      case 'created':     return { text: '🆕 Прийнято', color: '#1565C0', bg: '#E3F2FD' }
      case 'in_delivery': return { text: '🚚 В доставці', color: '#EF6C00', bg: '#FFF3E0' }
      case 'delivered':   return { text: '✅ Доставлено', color: '#2E7D32', bg: '#E8F5E9' }
      case 'cancelled':   return { text: '❌ Скасовано', color: '#C62828', bg: '#FFEBEE' }
      default:            return { text: status, color: '#616161', bg: '#F5F5F5' }
    }
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#229ED9', fontSize: '26px', fontWeight: '700' }}>
          Відстеження доставки
        </h1>
        {user && <p style={{ marginTop: '8px' }}>Привіт, {user.first_name}!</p>}
      </div>

      {/* БЛОК ДІАГНОСТИКИ */}
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px',
        fontSize: '13px',
        color: '#856404'
      }}>
        <strong>🔍 Діагностика:</strong><br />
        {debugInfo || "Завантаження..."}
      </div>

      <h2 style={{ marginBottom: '16px' }}>Мої замовлення</h2>

      {orders.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
          Замовлень немає
        </p>
      )}

      {orders.map(order => {
        const status = getStatus(order.status)
        const isActive = order.status === 'in_delivery'

        return (
          <div key={order.id} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '18px',
            marginBottom: '18px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <strong>#{order.order_number}</strong>
              <span style={{ background: status.bg, color: status.color, padding: '4px 12px', borderRadius: '20px', fontSize: '14px' }}>
                {status.text}
              </span>
            </div>

            <p style={{ margin: '8px 0' }}>{order.delivery_address}</p>
            {order.order_description && <p style={{ fontSize: '15px', color: '#666' }}>{order.order_description}</p>}

            {isActive && courierLocation && (
              <div style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden' }}>
                <MapContainer center={[courierLocation.lat, courierLocation.lng]} zoom={16} style={{ height: '320px', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[courierLocation.lat, courierLocation.lng]}>
                    <Popup>Кур'єр тут</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
        )
      })}

      <button 
        onClick={() => { fetchOrders(); fetchCourierLocation() }}
        style={{
          width: '100%',
          padding: '16px',
          background: '#229ED9',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '17px',
          fontWeight: '600',
          marginTop: '10px'
        }}
      >
        🔄 Оновити
      </button>
    </div>
  )
}

export default App