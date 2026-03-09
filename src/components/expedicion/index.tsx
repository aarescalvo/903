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
  Loader2, Plus, Search, Truck, Package, CheckCircle, XCircle,
  FileText, User, Calendar, Send, Eye
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Expedicion {
  id: string
  numeroRemito: string
  cliente: {
    id: string
    nombre: string
  }
  fecha: string
  fechaDespacho: string | null
  patente: string | null
  chofer: string | null
  estado: string
  observaciones: string | null
  detalles: DetalleExpedicion[]
}

interface DetalleExpedicion {
  id: string
  tipoProducto: string
  descripcion: string
  cantidad: number
  pesoKg: number | null
  tropaCodigo: string | null
  precioUnitario: number | null
  subtotal: number | null
}

interface Cliente {
  id: string
  nombre: string
}

interface StockItem {
  id: string
  productoNombre: string
  tipo: string
  pesoKg: number
  cantidad: number
  tropaCodigo: string | null
}

interface Props {
  operador: Operador
}

const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  { value: 'EN_PREPARACION', label: 'En Preparación', color: 'bg-blue-100 text-blue-700' },
  { value: 'DESPACHADO', label: 'Despachado', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-purple-100 text-purple-700' },
  { value: 'ANULADO', label: 'Anulado', color: 'bg-red-100 text-red-700' }
]

const TIPOS_PRODUCTO = [
  { value: 'CUERO', label: 'Cuero' },
  { value: 'GRASA_DRESSING', label: 'Grasa Dressing' },
  { value: 'CUARTO_ASADO', label: 'Cuarto Asado' },
  { value: 'CUARTO_DELANTERO', label: 'Cuarto Delantero' },
  { value: 'CUARTO_TRASERO', label: 'Cuarto Trasero' },
  { value: 'MENUDENCIA', label: 'Menudencia' },
  { value: 'MEDIA_RES', label: 'Media Res' },
  { value: 'OTRO', label: 'Otro' }
]

export function ExpedicionModule({ operador }: Props) {
  const [expediciones, setExpediciones] = useState<Expedicion[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{estado: string, cantidad: number}[]>([])
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDetalle, setModalDetalle] = useState<Expedicion | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    clienteId: '',
    patente: '',
    chofer: '',
    observaciones: '',
    detalles: [] as {
      tipoProducto: string
      descripcion: string
      cantidad: string
      pesoKg: string
      tropaCodigo: string
      stockProductoId: string
      precioUnitario: string
    }[]
  })

  useEffect(() => {
    fetchExpediciones()
    fetchClientes()
    fetchStock()
  }, [filtroEstado])

  const fetchExpediciones = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado)
      
      const res = await fetch(`/api/expedicion?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setExpediciones(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar expediciones')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      if (data.success) {
        setClientes(data.data)
      }
    } catch (error) {
      console.error('Error fetching clientes:', error)
    }
  }

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/stock-productos?estado=DISPONIBLE')
      const data = await res.json()
      if (data.success) {
        setStock(data.data)
      }
    } catch (error) {
      console.error('Error fetching stock:', error)
    }
  }

  const handleAgregarDetalle = () => {
    setFormData({
      ...formData,
      detalles: [
        ...formData.detalles,
        {
          tipoProducto: 'OTRO',
          descripcion: '',
          cantidad: '1',
          pesoKg: '',
          tropaCodigo: '',
          stockProductoId: '',
          precioUnitario: ''
        }
      ]
    })
  }

  const handleEliminarDetalle = (index: number) => {
    const nuevos = [...formData.detalles]
    nuevos.splice(index, 1)
    setFormData({ ...formData, detalles: nuevos })
  }

  const handleUpdateDetalle = (index: number, field: string, value: string) => {
    const nuevos = [...formData.detalles]
    nuevos[index] = { ...nuevos[index], [field]: value }
    setFormData({ ...formData, detalles: nuevos })
  }

  const handleSelectStock = (index: number, stockId: string) => {
    const item = stock.find(s => s.id === stockId)
    if (item) {
      const nuevos = [...formData.detalles]
      nuevos[index] = {
        ...nuevos[index],
        stockProductoId: item.id,
        tipoProducto: item.tipo,
        descripcion: item.productoNombre,
        pesoKg: item.pesoKg.toString(),
        tropaCodigo: item.tropaCodigo || ''
      }
      setFormData({ ...formData, detalles: nuevos })
    }
  }

  const handleGuardar = async () => {
    if (!formData.clienteId) {
      toast.error('Seleccione un cliente')
      return
    }
    if (formData.detalles.length === 0) {
      toast.error('Agregue al menos un producto')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        clienteId: formData.clienteId,
        patente: formData.patente,
        chofer: formData.chofer,
        observaciones: formData.observaciones,
        operadorId: operador.id,
        detalles: formData.detalles.map(d => ({
          ...d,
          cantidad: parseInt(d.cantidad) || 1,
          pesoKg: parseFloat(d.pesoKg) || null,
          precioUnitario: parseFloat(d.precioUnitario) || null
        }))
      }

      const res = await fetch('/api/expedicion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Expedición creada')
        fetchExpediciones()
        fetchStock()
        setModalOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Error al crear expedición')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleCambiarEstado = async (expedicion: Expedicion, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/expedicion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expedicion.id,
          estado: nuevoEstado,
          fechaDespacho: nuevoEstado === 'DESPACHADO' ? new Date().toISOString() : undefined
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Estado actualizado a ${nuevoEstado.toLowerCase()}`)
        fetchExpediciones()
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const resetForm = () => {
    setFormData({
      clienteId: '',
      patente: '',
      chofer: '',
      observaciones: '',
      detalles: []
    })
  }

  const expedicionesFiltradas = expediciones.filter(e => {
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        e.numeroRemito.toLowerCase().includes(busquedaLower) ||
        e.cliente.nombre.toLowerCase().includes(busquedaLower)
      )
    }
    return true
  })

  const getEstadoBadge = (estado: string) => {
    const config = ESTADOS.find(e => e.value === estado)
    return (
      <Badge className={config?.color || 'bg-stone-100 text-stone-700'}>
        {config?.label || estado}
      </Badge>
    )
  }

  const calcularTotal = () => {
    return formData.detalles.reduce((sum, d) => {
      const subtotal = (parseFloat(d.pesoKg) || 0) * (parseFloat(d.precioUnitario) || 0)
      return sum + subtotal
    }, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Truck className="w-8 h-8 text-amber-500" />
              Expedición
            </h1>
            <p className="text-stone-500 mt-1">Despacho de mercadería y facturación</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Expedición
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {ESTADOS.map(estado => {
            const count = stats.find(s => s.estado === estado.value)?.cantidad || 0
            return (
              <Card key={estado.value} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${estado.color} p-2 rounded-lg`}>
                      {estado.value === 'PENDIENTE' && <Package className="w-4 h-4" />}
                      {estado.value === 'EN_PREPARACION' && <Loader2 className="w-4 h-4" />}
                      {estado.value === 'DESPACHADO' && <Truck className="w-4 h-4" />}
                      {estado.value === 'ENTREGADO' && <CheckCircle className="w-4 h-4" />}
                      {estado.value === 'ANULADO' && <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs text-stone-500">{estado.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Buscar por remito o cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {ESTADOS.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : expedicionesFiltradas.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-stone-400">
              <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay expediciones registradas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {expedicionesFiltradas.map((exp) => (
              <Card key={exp.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-100 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg">{exp.numeroRemito}</span>
                          {getEstadoBadge(exp.estado)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-stone-500 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {exp.cliente.nombre}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(exp.fecha).toLocaleDateString('es-AR')}
                          </span>
                          {exp.patente && (
                            <span className="font-mono">{exp.patente}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setModalDetalle(exp)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      
                      {exp.estado === 'PENDIENTE' && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleCambiarEstado(exp, 'EN_PREPARACION')}
                            className="text-blue-600"
                          >
                            Preparar
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleCambiarEstado(exp, 'ANULADO')}
                            className="text-red-500"
                          >
                            Anular
                          </Button>
                        </>
                      )}
                      
                      {exp.estado === 'EN_PREPARACION' && (
                        <Button 
                          size="sm"
                          onClick={() => handleCambiarEstado(exp, 'DESPACHADO')}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Despachar
                        </Button>
                      )}
                      
                      {exp.estado === 'DESPACHADO' && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleCambiarEstado(exp, 'ENTREGADO')}
                          className="text-purple-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Entregado
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Nueva Expedición */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Expedición</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select 
                    value={formData.clienteId} 
                    onValueChange={(v) => setFormData({...formData, clienteId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Patente</Label>
                  <Input
                    value={formData.patente}
                    onChange={(e) => setFormData({...formData, patente: e.target.value.toUpperCase()})}
                    placeholder="AB123CD"
                    className="font-mono"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Chofer</Label>
                <Input
                  value={formData.chofer}
                  onChange={(e) => setFormData({...formData, chofer: e.target.value})}
                  placeholder="Nombre del chofer"
                />
              </div>
              
              {/* Detalles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Productos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAgregarDetalle}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
                
                {formData.detalles.length === 0 ? (
                  <div className="text-center py-4 text-stone-400 border-2 border-dashed rounded-lg">
                    Agregue productos a la expedición
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.detalles.map((detalle, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-stone-50 rounded-lg">
                        <div className="col-span-3">
                          <Select 
                            value={detalle.stockProductoId} 
                            onValueChange={(v) => handleSelectStock(index, v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Stock" />
                            </SelectTrigger>
                            <SelectContent>
                              {stock.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.productoNombre} ({s.pesoKg.toFixed(1)} kg)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Descripción"
                            value={detalle.descripcion}
                            onChange={(e) => handleUpdateDetalle(index, 'descripcion', e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Kg"
                            value={detalle.pesoKg}
                            onChange={(e) => handleUpdateDetalle(index, 'pesoKg', e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="$ unit."
                            value={detalle.precioUnitario}
                            onChange={(e) => handleUpdateDetalle(index, 'precioUnitario', e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="col-span-2">
                          <p className="h-8 flex items-center justify-end text-sm font-medium">
                            {((parseFloat(detalle.pesoKg) || 0) * (parseFloat(detalle.precioUnitario) || 0)).toFixed(2)}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-red-500"
                            onClick={() => handleEliminarDetalle(index)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {formData.detalles.length > 0 && (
                <div className="flex justify-end p-4 bg-amber-50 rounded-lg">
                  <div className="text-right">
                    <p className="text-sm text-stone-500">Total</p>
                    <p className="text-2xl font-bold text-amber-700">${calcularTotal().toFixed(2)}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  placeholder="Notas adicionales"
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
                  'Crear Expedición'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Detalle */}
        <Dialog open={!!modalDetalle} onOpenChange={() => setModalDetalle(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Expedición</DialogTitle>
            </DialogHeader>
            
            {modalDetalle && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 rounded-lg">
                  <div>
                    <p className="text-xs text-stone-500">Remito</p>
                    <p className="font-mono font-bold">{modalDetalle.numeroRemito}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Estado</p>
                    {getEstadoBadge(modalDetalle.estado)}
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Cliente</p>
                    <p className="font-medium">{modalDetalle.cliente.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Fecha</p>
                    <p>{new Date(modalDetalle.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                  {modalDetalle.patente && (
                    <div>
                      <p className="text-xs text-stone-500">Patente</p>
                      <p className="font-mono">{modalDetalle.patente}</p>
                    </div>
                  )}
                  {modalDetalle.chofer && (
                    <div>
                      <p className="text-xs text-stone-500">Chofer</p>
                      <p>{modalDetalle.chofer}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Productos</Label>
                  <div className="divide-y border rounded-lg">
                    {modalDetalle.detalles.map((d, i) => (
                      <div key={i} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{d.descripcion}</p>
                          <p className="text-xs text-stone-500">{d.tipoProducto} • {d.cantidad} u</p>
                          {d.tropaCodigo && (
                            <p className="text-xs text-stone-400 font-mono">{d.tropaCodigo}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {d.pesoKg && <p className="font-medium">{d.pesoKg} kg</p>}
                          {d.subtotal && <p className="text-sm text-stone-500">${d.subtotal.toFixed(2)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {modalDetalle.observaciones && (
                  <div className="p-3 bg-stone-50 rounded-lg">
                    <p className="text-xs text-stone-500">Observaciones</p>
                    <p className="text-sm">{modalDetalle.observaciones}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
