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
  Loader2, Plus, Search, Trash, Recycle, TrendingDown, Package,
  Calendar, DollarSign, User, Edit
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Rendering {
  id: string
  fechaFaena: string
  tropaCodigo: string | null
  tipoProducto: string
  pesoKg: number
  cliente?: { id: string; nombre: string } | null
  precioKg: number | null
  enStock: boolean
  vendido: boolean
  observaciones: string | null
}

interface Cliente {
  id: string
  nombre: string
}

interface Props {
  operador: Operador
}

const TIPOS_RENDERING = [
  { value: 'HUESO', label: 'Hueso' },
  { value: 'GRASA', label: 'Grasa' },
  { value: 'DESPERDICIO', label: 'Desperdicio' },
  { value: 'FONDO_DIGESTOR', label: 'Fondo de Digestor' },
  { value: 'SANGRE_SANCOCHADA', label: 'Sangre Sancochada' }
]

export function RenderingModule({ operador }: Props) {
  const [renderings, setRenderings] = useState<Rendering[]>([])
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [stats, setStats] = useState<{porTipo: {tipo: string; cantidad: number; pesoKg: number}[]}>({ porTipo: [] })
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    fechaFaena: new Date().toISOString().split('T')[0],
    tropaCodigo: '',
    tipoProducto: 'HUESO',
    pesoKg: '',
    clienteId: '',
    precioKg: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchRenderings()
    fetchClientes()
  }, [filtroTipo])

  const fetchRenderings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroTipo !== 'todos') params.append('tipoProducto', filtroTipo)
      
      const res = await fetch(`/api/rendering?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setRenderings(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar rendering')
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

  const handleGuardar = async () => {
    if (!formData.pesoKg || parseFloat(formData.pesoKg) <= 0) {
      toast.error('Ingrese el peso')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        ...formData,
        operadorId: operador.id
      }

      const res = await fetch('/api/rendering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Registro creado')
        fetchRenderings()
        setModalOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Error al crear')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleMarcarVendido = async (id: string) => {
    try {
      const res = await fetch('/api/rendering', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          vendido: true,
          enStock: false,
          fechaSalida: new Date().toISOString()
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Marcado como vendido')
        fetchRenderings()
      }
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    
    try {
      const res = await fetch(`/api/rendering?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Registro eliminado')
        fetchRenderings()
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const resetForm = () => {
    setFormData({
      fechaFaena: new Date().toISOString().split('T')[0],
      tropaCodigo: '',
      tipoProducto: 'HUESO',
      pesoKg: '',
      clienteId: '',
      precioKg: '',
      observaciones: ''
    })
  }

  const renderingsFiltrados = renderings.filter(r => {
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        r.tropaCodigo?.toLowerCase().includes(busquedaLower) ||
        r.cliente?.nombre?.toLowerCase().includes(busquedaLower)
      )
    }
    return true
  })

  // Agrupar por fecha
  const renderingsPorFecha = renderingsFiltrados.reduce((acc, r) => {
    const fecha = r.fechaFaena.split('T')[0]
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(r)
    return acc
  }, {} as Record<string, Rendering[]>)

  const getTipoBadge = (tipo: string) => {
    const colores: Record<string, string> = {
      HUESO: 'bg-gray-100 text-gray-700',
      GRASA: 'bg-yellow-100 text-yellow-700',
      DESPERDICIO: 'bg-red-100 text-red-700',
      FONDO_DIGESTOR: 'bg-orange-100 text-orange-700',
      SANGRE_SANCOCHADA: 'bg-red-200 text-red-800'
    }
    return colores[tipo] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Recycle className="w-8 h-8 text-amber-500" />
              Rendering
            </h1>
            <p className="text-stone-500 mt-1">Pesaje de productos de rendering por fecha de faena</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pesaje
          </Button>
        </div>

        {/* Stats por tipo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {TIPOS_RENDERING.map(tipo => {
            const stat = stats.porTipo.find(s => s.tipo === tipo.value)
            return (
              <Card key={tipo.value} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Badge className={getTipoBadge(tipo.value)}>{tipo.label}</Badge>
                    <p className="text-2xl font-bold mt-2">{stat?.pesoKg.toFixed(1) || 0} kg</p>
                    <p className="text-xs text-stone-500">{stat?.cantidad || 0} registros</p>
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
                    placeholder="Buscar por tropa o cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {TIPOS_RENDERING.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista por fecha */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : Object.keys(renderingsPorFecha).length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center text-stone-400">
              <Recycle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay registros de rendering</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(renderingsPorFecha)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([fecha, items]) => {
                const pesoDia = items.reduce((sum, r) => sum + r.pesoKg, 0)
                return (
                  <Card key={fecha} className="border-0 shadow-md">
                    <CardHeader className="bg-stone-50 py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </CardTitle>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          {items.length} registros • {pesoDia.toFixed(1)} kg
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {items.map((r) => (
                          <div key={r.id} className="p-4 hover:bg-stone-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Badge className={getTipoBadge(r.tipoProducto)}>
                                  {TIPOS_RENDERING.find(t => t.value === r.tipoProducto)?.label}
                                </Badge>
                                <div>
                                  <p className="text-2xl font-bold text-stone-800">{r.pesoKg.toFixed(1)} kg</p>
                                  {r.tropaCodigo && (
                                    <p className="text-xs text-stone-500 font-mono">Tropa: {r.tropaCodigo}</p>
                                  )}
                                  {r.cliente && (
                                    <p className="text-xs text-stone-500 flex items-center gap-1">
                                      <User className="w-3 h-3" />{r.cliente.nombre}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {r.precioKg && (
                                  <span className="text-sm text-stone-500">${r.precioKg}/kg</span>
                                )}
                                {r.enStock ? (
                                  <Badge className="bg-emerald-100 text-emerald-700">En Stock</Badge>
                                ) : r.vendido ? (
                                  <Badge className="bg-blue-100 text-blue-700">Vendido</Badge>
                                ) : (
                                  <Badge className="bg-stone-100 text-stone-700">Salida</Badge>
                                )}
                                {r.enStock && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleMarcarVendido(r.id)}
                                    className="text-emerald-600"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEliminar(r.id)}
                                  className="text-red-500"
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}

        {/* Modal Nuevo */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pesaje de Rendering</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Faena</Label>
                  <Input
                    type="date"
                    value={formData.fechaFaena}
                    onChange={(e) => setFormData({...formData, fechaFaena: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código Tropa (opcional)</Label>
                  <Input
                    value={formData.tropaCodigo}
                    onChange={(e) => setFormData({...formData, tropaCodigo: e.target.value})}
                    placeholder="B20260001"
                  />
                </div>
              </div>
              
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
                    {TIPOS_RENDERING.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Peso (kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.pesoKg}
                  onChange={(e) => setFormData({...formData, pesoKg: e.target.value})}
                  placeholder="0.0"
                  className="text-2xl font-bold text-center h-14"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select 
                  value={formData.clienteId} 
                  onValueChange={(v) => setFormData({...formData, clienteId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Precio por kg ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioKg}
                  onChange={(e) => setFormData({...formData, precioKg: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
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
                  'Guardar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
