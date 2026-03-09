'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Loader2, Plus, Search, ArrowRightLeft, Warehouse,
  Calendar, Package
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Camara {
  id: string
  nombre: string
  tipo: string
  capacidad: number
}

interface MovimientoDespostada {
  id: string
  fecha: Date
  tipoProducto: string
  productoNombre: string
  cantidad: number
  pesoKg: number
  camaraOrigenId?: string
  camaraOrigen?: { nombre: string }
  camaraDestinoId: string
  camaraDestino: { nombre: string }
  tropaCodigo?: string
  lote?: string
  observaciones?: string
  operadorId?: string
}

interface StockProducto {
  id: string
  productoNombre: string
  tipo: string
  cantidad: number
  pesoKg: number
  tropaCodigo?: string
  lote?: string
  camaraId?: string
  camara?: { nombre: string }
}

interface Props {
  operador: Operador
}

const TIPOS_PRODUCTO = [
  { value: 'CUARTO_ASADO', label: 'Cuarto Asado' },
  { value: 'CUARTO_DELANTERO', label: 'Cuarto Delantero' },
  { value: 'CUARTO_TRASERO', label: 'Cuarto Trasero' },
  { value: 'PRODUCTO_DESPOSTADO', label: 'Producto Despostado' },
]

export function MovimientoDespostadaModule({ operador }: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoDespostada[]>([])
  const [stock, setStock] = useState<StockProducto[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filtroCamara, setFiltroCamara] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    tipoProducto: 'CUARTO_ASADO',
    productoNombre: '',
    cantidad: '1',
    pesoKg: '',
    camaraOrigenId: '',
    camaraDestinoId: '',
    tropaCodigo: '',
    lote: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchData()
  }, [filtroCamara])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [movRes, stockRes, camarasRes] = await Promise.all([
        fetch(`/api/movimiento-despostada${filtroCamara !== 'todos' ? `?camaraId=${filtroCamara}` : ''}`),
        fetch('/api/stock-productos?estado=DISPONIBLE'),
        fetch('/api/camaras')
      ])
      
      const [movData, stockData, camarasData] = await Promise.all([
        movRes.json(),
        stockRes.json(),
        camarasRes.json()
      ])
      
      if (movData.success) setMovimientos(movData.data)
      if (stockData.success) setStock(stockData.data)
      if (camarasData.success) setCamaras(camarasData.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!formData.productoNombre || !formData.camaraDestinoId) {
      toast.error('Complete producto y cámara destino')
      return
    }

    setGuardando(true)
    try {
      const res = await fetch('/api/movimiento-despostada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cantidad: parseInt(formData.cantidad),
          pesoKg: parseFloat(formData.pesoKg) || 0,
          operadorId: operador.id
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Movimiento registrado')
        setModalOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const resetForm = () => {
    setFormData({
      tipoProducto: 'CUARTO_ASADO',
      productoNombre: '',
      cantidad: '1',
      pesoKg: '',
      camaraOrigenId: '',
      camaraDestinoId: '',
      tropaCodigo: '',
      lote: '',
      observaciones: ''
    })
  }

  const movimientosFiltrados = movimientos.filter(m => {
    if (busqueda) {
      const b = busqueda.toLowerCase()
      return m.productoNombre.toLowerCase().includes(b) || 
             (m.tropaCodigo?.toLowerCase().includes(b))
    }
    return true
  })

  // Agrupar por fecha
  const porFecha = movimientosFiltrados.reduce((acc, m) => {
    const fecha = new Date(m.fecha).toLocaleDateString('es-AR')
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(m)
    return acc
  }, {} as Record<string, MovimientoDespostada[]>)

  const getTipoBadge = (tipo: string) => {
    const colores: Record<string, string> = {
      'CUARTO_ASADO': 'bg-amber-100 text-amber-700',
      'CUARTO_DELANTERO': 'bg-blue-100 text-blue-700',
      'CUARTO_TRASERO': 'bg-purple-100 text-purple-700',
      'PRODUCTO_DESPOSTADO': 'bg-emerald-100 text-emerald-700'
    }
    return colores[tipo] || 'bg-gray-100 text-gray-700'
  }

  // Stock por cámara
  const stockPorCamara = stock.reduce((acc, s) => {
    const camaraId = s.camaraId || 'sin-camara'
    if (!acc[camaraId]) {
      acc[camaraId] = {
        camara: s.camara?.nombre || 'Sin cámara',
        productos: [],
        pesoTotal: 0
      }
    }
    acc[camaraId].productos.push(s)
    acc[camaraId].pesoTotal += s.pesoKg
    return acc
  }, {} as Record<string, { camara: string; productos: StockProducto[]; pesoTotal: number }>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <ArrowRightLeft className="w-8 h-8 text-amber-500" />
              Movimientos de Despostada
            </h1>
            <p className="text-stone-500 mt-1">Movimientos FIFO entre cámaras</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>

        {/* Stock por cámara */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(stockPorCamara).slice(0, 6).map(([camaraId, data]) => (
            <Card key={camaraId} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse className="w-4 h-4 text-stone-400" />
                  <span className="font-medium text-sm">{data.camara}</span>
                </div>
                <p className="text-2xl font-bold">{data.pesoTotal.toFixed(1)} kg</p>
                <p className="text-xs text-stone-500">{data.productos.length} productos</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Buscar por producto o tropa..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filtroCamara} onValueChange={setFiltroCamara}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las cámaras</SelectItem>
                  {camaras.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Listado por fecha */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : Object.keys(porFecha).length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center text-stone-400">
              <ArrowRightLeft className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay movimientos registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(porFecha).map(([fecha, items]) => (
              <Card key={fecha} className="border-0 shadow-md">
                <CardHeader className="bg-stone-50 rounded-t-lg py-3">
                  <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {fecha}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {items.map((mov) => (
                      <div key={mov.id} className="p-4 hover:bg-stone-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getTipoBadge(mov.tipoProducto)}>
                              {TIPOS_PRODUCTO.find(t => t.value === mov.tipoProducto)?.label}
                            </Badge>
                            <div>
                              <p className="font-medium">{mov.productoNombre}</p>
                              <p className="text-xs text-stone-500">
                                {mov.camaraOrigen?.nombre || 'Sin origen'} → {mov.camaraDestino?.nombre}
                                {mov.tropaCodigo && ` • Tropa: ${mov.tropaCodigo}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{mov.pesoKg.toFixed(1)} kg</p>
                            <p className="text-xs text-stone-500">{mov.cantidad} piezas</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Nuevo Movimiento */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-500" />
                Nuevo Movimiento
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Producto</Label>
                  <Select 
                    value={formData.tipoProducto} 
                    onValueChange={(v) => setFormData({...formData, tipoProducto: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_PRODUCTO.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Producto</Label>
                <Select 
                  value={formData.productoNombre} 
                  onValueChange={(v) => {
                    const s = stock.find(s => s.productoNombre === v)
                    setFormData({
                      ...formData, 
                      productoNombre: v,
                      tropaCodigo: s?.tropaCodigo || '',
                      pesoKg: s?.pesoKg?.toString() || '',
                      camaraOrigenId: s?.camaraId || ''
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stock.map(s => (
                      <SelectItem key={s.id} value={s.productoNombre}>
                        {s.productoNombre} ({s.pesoKg.toFixed(1)} kg) - {s.camara?.nombre || 'Sin cámara'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4" />
                    Cámara Origen
                  </Label>
                  <Select 
                    value={formData.camaraOrigenId} 
                    onValueChange={(v) => setFormData({...formData, camaraOrigenId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cámara Destino *</Label>
                  <Select 
                    value={formData.camaraDestinoId} 
                    onValueChange={(v) => setFormData({...formData, camaraDestinoId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.pesoKg}
                    onChange={(e) => setFormData({...formData, pesoKg: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lote</Label>
                  <Input
                    value={formData.lote}
                    onChange={(e) => setFormData({...formData, lote: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardar}
                disabled={guardando}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {guardando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Registrar Movimiento'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
