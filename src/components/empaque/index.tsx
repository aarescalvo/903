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
  Loader2, Plus, Search, Package, Barcode, 
  Scale, Calendar, Box, Layers
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
}

interface Producto {
  id: string
  codigo: string
  nombre: string
  tara?: number
}

interface CondicionEmbalaje {
  id: string
  nombre: string
  codigo: string
  taraTotal: number
}

interface Empaque {
  id: string
  codigo: string
  productoNombre: string
  corteAnatomico?: string
  pesoNeto: number
  pesoTara: number
  pesoBruto: number
  cantidadPiezas: number
  tropaCodigo?: string
  garron?: number
  fechaFaena?: Date
  estado: string
  lote?: string
  condicionEmbalaje?: { nombre: string }
  camaraId?: string
  camara?: { nombre: string }
}

interface Props {
  operador: Operador
}

const CORTES_ANATOMICOS = [
  'Bola de Lomo', 'Peceto', 'Cuadril', 'Colita de Cuadril',
  'Nalga', 'Contra', 'Bifes', 'Asado', 'Vacio',
  'Entraña', 'Matambre', 'Falda', 'Costilla',
  'Achuras', 'Higado', 'Riñon', 'Lengua'
]

export function EmpaqueModule({ operador }: Props) {
  const [empaques, setEmpaques] = useState<Empaque[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [condicionesEmbalaje, setCondicionesEmbalaje] = useState<CondicionEmbalaje[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    productoNombre: '',
    corteAnatomico: '',
    pesoNeto: '',
    cantidadPiezas: '1',
    condicionEmbalajeId: '',
    tropaCodigo: '',
    garron: '',
    fechaFaena: '',
    camaraId: '',
    lote: ''
  })

  useEffect(() => {
    fetchData()
  }, [filtroEstado])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [empaquesRes, productosRes, condicionesRes, camarasRes] = await Promise.all([
        fetch(`/api/empaque${filtroEstado !== 'todos' ? `?estado=${filtroEstado}` : ''}`),
        fetch('/api/productos'),
        fetch('/api/condiciones-embalaje'),
        fetch('/api/camaras')
      ])
      
      const [empaquesData, productosData, condicionesData, camarasData] = await Promise.all([
        empaquesRes.json(),
        productosRes.json(),
        condicionesRes.json(),
        camarasRes.json()
      ])
      
      if (empaquesData.success) setEmpaques(empaquesData.data)
      if (productosData.success) setProductos(productosData.data)
      if (condicionesData.success) setCondicionesEmbalaje(condicionesData.data)
      if (camarasData.success) setCamaras(camarasData.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!formData.productoNombre || !formData.pesoNeto) {
      toast.error('Complete producto y peso neto')
      return
    }

    setGuardando(true)
    try {
      const res = await fetch('/api/empaque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pesoNeto: parseFloat(formData.pesoNeto),
          cantidadPiezas: parseInt(formData.cantidadPiezas),
          garron: formData.garron ? parseInt(formData.garron) : null,
          fechaFaena: formData.fechaFaena || null,
          condicionEmbalajeId: formData.condicionEmbalajeId || null,
          camaraId: formData.camaraId || null,
          operadorId: operador.id
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Empaque registrado')
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
      productoNombre: '',
      corteAnatomico: '',
      pesoNeto: '',
      cantidadPiezas: '1',
      condicionEmbalajeId: '',
      tropaCodigo: '',
      garron: '',
      fechaFaena: '',
      camaraId: '',
      lote: ''
    })
  }

  const empaquesFiltrados = empaques.filter(e => {
    if (busqueda) {
      const b = busqueda.toLowerCase()
      return e.productoNombre.toLowerCase().includes(b) || 
             e.codigo.toLowerCase().includes(b) ||
             (e.tropaCodigo?.toLowerCase().includes(b))
    }
    return true
  })

  // Calcular tara según condición seleccionada
  const taraCalculada = formData.condicionEmbalajeId 
    ? condicionesEmbalaje.find(c => c.id === formData.condicionEmbalajeId)?.taraTotal || 0
    : 0
  
  const pesoBrutoCalculado = (parseFloat(formData.pesoNeto) || 0) + taraCalculada

  // Stats
  const statsPorEstado = empaques.reduce((acc, e) => {
    acc[e.estado] = (acc[e.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pesoTotalStock = empaques
    .filter(e => e.estado === 'EN_STOCK')
    .reduce((acc, e) => acc + e.pesoNeto, 0)

  const getEstadoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      'EN_STOCK': 'bg-emerald-100 text-emerald-700',
      'RESERVADO': 'bg-amber-100 text-amber-700',
      'DESPACHADO': 'bg-blue-100 text-blue-700'
    }
    return colores[estado] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Box className="w-8 h-8 text-amber-500" />
              Empaque
            </h1>
            <p className="text-stone-500 mt-1">Gestión de cajas y empaques con tara automática</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Empaque
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <Badge className="bg-emerald-100 text-emerald-700">En Stock</Badge>
              <p className="text-2xl font-bold mt-2">{statsPorEstado['EN_STOCK'] || 0}</p>
              <p className="text-xs text-stone-500">{pesoTotalStock.toFixed(1)} kg total</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <Badge className="bg-amber-100 text-amber-700">Reservados</Badge>
              <p className="text-2xl font-bold mt-2">{statsPorEstado['RESERVADO'] || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <Badge className="bg-blue-100 text-blue-700">Despachados</Badge>
              <p className="text-2xl font-bold mt-2">{statsPorEstado['DESPACHADO'] || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <Badge className="bg-purple-100 text-purple-700">Condiciones</Badge>
              <p className="text-2xl font-bold mt-2">{condicionesEmbalaje.length}</p>
              <p className="text-xs text-stone-500">de embalaje</p>
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
                    placeholder="Buscar por código, producto o tropa..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="EN_STOCK">En Stock</SelectItem>
                  <SelectItem value="RESERVADO">Reservado</SelectItem>
                  <SelectItem value="DESPACHADO">Despachado</SelectItem>
                </SelectContent>
              </Select>
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
            ) : empaquesFiltrados.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay empaques registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Corte</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Piezas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase">P. Neto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase">Tara</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase">P. Bruto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {empaquesFiltrados.map((empaque) => (
                      <tr key={empaque.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium">{empaque.codigo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{empaque.productoNombre}</p>
                          {empaque.tropaCodigo && (
                            <p className="text-xs text-stone-500">Tropa: {empaque.tropaCodigo}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {empaque.corteAnatomico || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">{empaque.cantidadPiezas}</td>
                        <td className="px-4 py-3 text-right font-medium">{empaque.pesoNeto.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-stone-500">{empaque.pesoTara.toFixed(3)}</td>
                        <td className="px-4 py-3 text-right font-bold">{empaque.pesoBruto.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={getEstadoBadge(empaque.estado)}>
                            {empaque.estado.replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Nuevo Empaque */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-500" />
                Nuevo Empaque
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Producto *</Label>
                <Select 
                  value={formData.productoNombre} 
                  onValueChange={(v) => setFormData({...formData, productoNombre: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map(p => (
                      <SelectItem key={p.id} value={p.nombre}>
                        {p.codigo} - {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Corte Anatómico</Label>
                  <Select 
                    value={formData.corteAnatomico} 
                    onValueChange={(v) => setFormData({...formData, corteAnatomico: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CORTES_ANATOMICOS.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad Piezas</Label>
                  <Input
                    type="number"
                    value={formData.cantidadPiezas}
                    onChange={(e) => setFormData({...formData, cantidadPiezas: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Peso Neto (kg) *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.pesoNeto}
                    onChange={(e) => setFormData({...formData, pesoNeto: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Condición Embalaje
                  </Label>
                  <Select 
                    value={formData.condicionEmbalajeId} 
                    onValueChange={(v) => setFormData({...formData, condicionEmbalajeId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {condicionesEmbalaje.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre} (Tara: {c.taraTotal.toFixed(3)} kg)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tara calculada */}
              <div className="bg-stone-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Peso Neto:</span>
                  <span className="font-medium">{(parseFloat(formData.pesoNeto) || 0).toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Tara:</span>
                  <span className="font-medium">{taraCalculada.toFixed(3)} kg</span>
                </div>
                <div className="flex justify-between text-sm border-t mt-2 pt-2">
                  <span className="font-medium">Peso Bruto:</span>
                  <span className="font-bold text-amber-600">{pesoBrutoCalculado.toFixed(2)} kg</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código Tropa</Label>
                  <Input
                    value={formData.tropaCodigo}
                    onChange={(e) => setFormData({...formData, tropaCodigo: e.target.value})}
                    placeholder="B2026-0001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Garrón</Label>
                  <Input
                    type="number"
                    value={formData.garron}
                    onChange={(e) => setFormData({...formData, garron: e.target.value})}
                    placeholder="Número"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Faena</Label>
                  <Input
                    type="date"
                    value={formData.fechaFaena}
                    onChange={(e) => setFormData({...formData, fechaFaena: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cámara</Label>
                  <Select 
                    value={formData.camaraId} 
                    onValueChange={(v) => setFormData({...formData, camaraId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.filter(c => c.tipo === 'DEPOSITO').map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lote</Label>
                <Input
                  value={formData.lote}
                  onChange={(e) => setFormData({...formData, lote: e.target.value})}
                  placeholder="Código de lote..."
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
                  'Registrar Empaque'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
