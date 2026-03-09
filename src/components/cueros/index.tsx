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
  Loader2, Plus, Search, Package, Scale, TrendingDown, CheckCircle,
  XCircle, Edit, Trash2, Filter
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Cuero {
  id: string
  tropaCodigo: string | null
  garron: number | null
  peso: number | null
  clasificacion: string
  observaciones: string | null
  enStock: boolean
  fechaIngreso: string
  destino: string | null
  precioUnitario: number | null
  vendido: boolean
}

interface Props {
  operador: Operador
}

const CLASIFICACIONES = [
  { value: 'SELECCION', label: 'Selección (1° calidad)' },
  { value: 'PRIMERA', label: 'Primera (2° calidad)' },
  { value: 'SEGUNDA', label: 'Segunda (3° calidad)' },
  { value: 'DESCARTE', label: 'Descarte (Renderizado)' }
]

export function CuerosModule({ operador }: Props) {
  const [cueros, setCueros] = useState<Cuero[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pesoTotal: 0,
    enStock: 0,
    pesoEnStock: 0
  })
  
  // Filtros
  const [filtroStock, setFiltroStock] = useState<string>('todos')
  const [filtroClasificacion, setFiltroClasificacion] = useState<string>('todas')
  const [busqueda, setBusqueda] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cuero | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    tropaCodigo: '',
    garron: '',
    peso: '',
    clasificacion: 'SELECCION',
    observaciones: '',
    destino: '',
    precioUnitario: ''
  })

  useEffect(() => {
    fetchCueros()
  }, [filtroStock])

  const fetchCueros = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStock === 'enStock') params.append('enStock', 'true')
      
      const res = await fetch(`/api/cueros?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setCueros(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cueros')
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!formData.tropaCodigo && !formData.garron) {
      toast.error('Ingrese al menos tropa o garrón')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        ...formData,
        operadorId: operador.id
      }

      if (editando) {
        const res = await fetch('/api/cueros', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editando.id, ...payload })
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Cuero actualizado')
          fetchCueros()
        } else {
          toast.error(data.error || 'Error al actualizar')
        }
      } else {
        const res = await fetch('/api/cueros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Cuero registrado')
          fetchCueros()
        } else {
          toast.error(data.error || 'Error al crear')
        }
      }
      
      setModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const handleEditar = (cuero: Cuero) => {
    setEditando(cuero)
    setFormData({
      tropaCodigo: cuero.tropaCodigo || '',
      garron: cuero.garron?.toString() || '',
      peso: cuero.peso?.toString() || '',
      clasificacion: cuero.clasificacion,
      observaciones: cuero.observaciones || '',
      destino: cuero.destino || '',
      precioUnitario: cuero.precioUnitario?.toString() || ''
    })
    setModalOpen(true)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este cuero?')) return
    
    try {
      const res = await fetch(`/api/cueros?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Cuero eliminado')
        fetchCueros()
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleMarcarVendido = async (cuero: Cuero) => {
    try {
      const res = await fetch('/api/cueros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cuero.id,
          vendido: true,
          enStock: false,
          fechaSalida: new Date().toISOString()
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Cuero marcado como vendido')
        fetchCueros()
      }
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const resetForm = () => {
    setEditando(null)
    setFormData({
      tropaCodigo: '',
      garron: '',
      peso: '',
      clasificacion: 'SELECCION',
      observaciones: '',
      destino: '',
      precioUnitario: ''
    })
  }

  const cuerosFiltrados = cueros.filter(c => {
    if (filtroClasificacion !== 'todas' && c.clasificacion !== filtroClasificacion) return false
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        c.tropaCodigo?.toLowerCase().includes(busquedaLower) ||
        c.garron?.toString().includes(busquedaLower) ||
        c.destino?.toLowerCase().includes(busquedaLower)
      )
    }
    return true
  })

  const getClasificacionBadge = (clasificacion: string) => {
    const colores: Record<string, string> = {
      SELECCION: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      PRIMERA: 'bg-blue-100 text-blue-700 border-blue-300',
      SEGUNDA: 'bg-amber-100 text-amber-700 border-amber-300',
      DESCARTE: 'bg-stone-100 text-stone-700 border-stone-300'
    }
    return colores[clasificacion] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-amber-500" />
              Gestión de Cueros
            </h1>
            <p className="text-stone-500 mt-1">Registro y control de cueros por tropa</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Cuero
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Peso Total</p>
                  <p className="text-xl font-bold">{stats.pesoTotal.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">En Stock</p>
                  <p className="text-xl font-bold">{stats.enStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Vendidos</p>
                  <p className="text-xl font-bold">{stats.total - stats.enStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Buscar por tropa, garrón o destino..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filtroStock} onValueChange={setFiltroStock}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="enStock">En Stock</SelectItem>
                    <SelectItem value="vendidos">Vendidos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroClasificacion} onValueChange={setFiltroClasificacion}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas clases</SelectItem>
                    {CLASIFICACIONES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : cuerosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay cueros registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Tropa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Garrón</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Peso</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Clasificación</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Destino</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cuerosFiltrados.map((cuero) => (
                      <tr key={cuero.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium">{cuero.tropaCodigo || '-'}</span>
                        </td>
                        <td className="px-4 py-3">{cuero.garron || '-'}</td>
                        <td className="px-4 py-3">{cuero.peso ? `${cuero.peso} kg` : '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={getClasificacionBadge(cuero.clasificacion)}>
                            {cuero.clasificacion}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {cuero.enStock ? (
                            <Badge className="bg-emerald-100 text-emerald-700">En Stock</Badge>
                          ) : cuero.vendido ? (
                            <Badge className="bg-blue-100 text-blue-700">Vendido</Badge>
                          ) : (
                            <Badge className="bg-stone-100 text-stone-700">Salida</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-500">{cuero.destino || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {cuero.enStock && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMarcarVendido(cuero)}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditar(cuero)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEliminar(cuero.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Nuevo/Editar */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editando ? 'Editar Cuero' : 'Registrar Cuero'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código Tropa</Label>
                  <Input
                    value={formData.tropaCodigo}
                    onChange={(e) => setFormData({...formData, tropaCodigo: e.target.value})}
                    placeholder="B20260001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Garrón</Label>
                  <Input
                    type="number"
                    value={formData.garron}
                    onChange={(e) => setFormData({...formData, garron: e.target.value})}
                    placeholder="1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => setFormData({...formData, peso: e.target.value})}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Clasificación</Label>
                  <Select 
                    value={formData.clasificacion} 
                    onValueChange={(v) => setFormData({...formData, clasificacion: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASIFICACIONES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input
                  value={formData.destino}
                  onChange={(e) => setFormData({...formData, destino: e.target.value})}
                  placeholder="Cliente o destino"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Precio Unitario ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precioUnitario}
                  onChange={(e) => setFormData({...formData, precioUnitario: e.target.value})}
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
