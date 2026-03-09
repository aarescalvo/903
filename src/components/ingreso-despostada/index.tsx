'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Loader2, Plus, Search, Package, ArrowDownToLine, 
  Barcode, Calendar, Scale, Building
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

interface Cliente {
  id: string
  nombre: string
  cuit?: string
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

interface IngresoDespostada {
  id: string
  fecha: Date
  tipoProducto: string
  productoNombre: string
  tropaCodigo?: string
  fechaFaena?: Date
  clienteId?: string
  cliente?: { nombre: string }
  camaraId?: string
  camara?: { nombre: string }
  cantidad: number
  pesoKg: number
  medioIngreso: string
  codigoBarras?: string
}

interface Props {
  operador: Operador
}

const TIPOS_PRODUCTO = [
  { value: 'CUARTO_ASADO', label: 'Cuarto Asado' },
  { value: 'CUARTO_DELANTERO', label: 'Cuarto Delantero' },
  { value: 'CUARTO_TRASERO', label: 'Cuarto Trasero' },
  { value: 'MEDIA_RES', label: 'Media Res' },
]

export function IngresoDespostadaModule({ operador }: Props) {
  const [ingresos, setIngresos] = useState<IngresoDespostada[]>([])
  const [stockDisponible, setStockDisponible] = useState<StockProducto[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [medioIngreso, setMedioIngreso] = useState<'SELECCION' | 'CODIGO_BARRAS'>('SELECCION')
  const [formData, setFormData] = useState({
    tipoProducto: 'CUARTO_ASADO',
    productoNombre: '',
    tropaCodigo: '',
    fechaFaena: '',
    clienteId: '',
    camaraId: '',
    cantidad: '1',
    pesoKg: '',
    codigoBarras: ''
  })

  useEffect(() => {
    fetchData()
  }, [filtroTipo])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ingresosRes, stockRes, camarasRes, clientesRes] = await Promise.all([
        fetch(`/api/ingreso-despostada${filtroTipo !== 'todos' ? `?tipoProducto=${filtroTipo}` : ''}`),
        fetch('/api/stock-productos?estado=DISPONIBLE'),
        fetch('/api/camaras'),
        fetch('/api/clientes')
      ])
      
      const [ingresosData, stockData, camarasData, clientesData] = await Promise.all([
        ingresosRes.json(),
        stockRes.json(),
        camarasRes.json(),
        clientesRes.json()
      ])
      
      if (ingresosData.success) setIngresos(ingresosData.data)
      if (stockData.success) setStockDisponible(stockData.data)
      if (camarasData.success) setCamaras(camarasData.data)
      if (clientesData.success) setClientes(clientesData.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleBuscarCodigoBarras = async (codigo: string) => {
    if (!codigo || codigo.length < 3) return
    
    try {
      const res = await fetch(`/api/stock-productos?busqueda=${codigo}`)
      const data = await res.json()
      
      if (data.success && data.data.length > 0) {
        const encontrado = data.data[0]
        setFormData(prev => ({
          ...prev,
          productoNombre: encontrado.productoNombre,
          tropaCodigo: encontrado.tropaCodigo || '',
          pesoKg: encontrado.pesoKg.toString()
        }))
        toast.success('Producto encontrado')
      } else {
        toast.error('Código no encontrado en stock')
      }
    } catch (error) {
      toast.error('Error al buscar código')
    }
  }

  const handleGuardar = async () => {
    if (!formData.productoNombre || !formData.pesoKg) {
      toast.error('Complete producto y peso')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        ...formData,
        medioIngreso,
        pesoKg: parseFloat(formData.pesoKg),
        cantidad: parseInt(formData.cantidad),
        clienteId: formData.clienteId || null,
        camaraId: formData.camaraId || null,
        fechaFaena: formData.fechaFaena || null,
        operadorId: operador.id
      }

      const res = await fetch('/api/ingreso-despostada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Ingreso registrado')
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
      tropaCodigo: '',
      fechaFaena: '',
      clienteId: '',
      camaraId: '',
      cantidad: '1',
      pesoKg: '',
      codigoBarras: ''
    })
    setMedioIngreso('SELECCION')
  }

  const ingresosFiltrados = ingresos.filter(i => {
    if (busqueda) {
      const b = busqueda.toLowerCase()
      return i.productoNombre.toLowerCase().includes(b) || 
             (i.tropaCodigo?.toLowerCase().includes(b))
    }
    return true
  })

  // Agrupar por fecha
  const porFecha = ingresosFiltrados.reduce((acc, i) => {
    const fecha = new Date(i.fecha).toLocaleDateString('es-AR')
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(i)
    return acc
  }, {} as Record<string, IngresoDespostada[]>)

  const getTipoLabel = (tipo: string) => {
    return TIPOS_PRODUCTO.find(t => t.value === tipo)?.label || tipo
  }

  const getTipoBadge = (tipo: string) => {
    const colores: Record<string, string> = {
      'CUARTO_ASADO': 'bg-amber-100 text-amber-700',
      'CUARTO_DELANTERO': 'bg-blue-100 text-blue-700',
      'CUARTO_TRASERO': 'bg-purple-100 text-purple-700',
      'MEDIA_RES': 'bg-emerald-100 text-emerald-700'
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
              <ArrowDownToLine className="w-8 h-8 text-amber-500" />
              Ingreso a Despostada
            </h1>
            <p className="text-stone-500 mt-1">Registro de ingresos a sala de desposte</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ingreso
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {TIPOS_PRODUCTO.map(tipo => {
            const count = ingresos.filter(i => i.tipoProducto === tipo.value).length
            const pesoTotal = ingresos
              .filter(i => i.tipoProducto === tipo.value)
              .reduce((acc, i) => acc + i.pesoKg, 0)
            return (
              <Card key={tipo.value} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <Badge className={getTipoBadge(tipo.value)}>{tipo.label}</Badge>
                  <p className="text-2xl font-bold mt-2">{count}</p>
                  <p className="text-xs text-stone-500">{pesoTotal.toFixed(1)} kg total</p>
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
                    placeholder="Buscar por producto o tropa..."
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
                  {TIPOS_PRODUCTO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
              <ArrowDownToLine className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay ingresos registrados</p>
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
                    {items.map((ingreso) => (
                      <div key={ingreso.id} className="p-4 hover:bg-stone-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getTipoBadge(ingreso.tipoProducto)}>
                              {getTipoLabel(ingreso.tipoProducto)}
                            </Badge>
                            <div>
                              <p className="font-medium">{ingreso.productoNombre}</p>
                              <p className="text-xs text-stone-500">
                                {ingreso.tropaCodigo && `Tropa: ${ingreso.tropaCodigo}`}
                                {ingreso.cliente && ` • Cliente: ${ingreso.cliente.nombre}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{ingreso.pesoKg.toFixed(1)} kg</p>
                            <p className="text-xs text-stone-500">{ingreso.cantidad} piezas</p>
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

        {/* Modal Nuevo Ingreso */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-amber-500" />
                Nuevo Ingreso a Despostada
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Medio de ingreso */}
              <div className="space-y-2">
                <Label>Medio de Ingreso</Label>
                <Tabs value={medioIngreso} onValueChange={(v) => setMedioIngreso(v as 'SELECCION' | 'CODIGO_BARRAS')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="SELECCION">Selección</TabsTrigger>
                    <TabsTrigger value="CODIGO_BARRAS">Código Barras</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="SELECCION" className="space-y-4 mt-4">
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
                      <Label>Producto</Label>
                      <Select 
                        value={formData.productoNombre} 
                        onValueChange={(v) => {
                          const stock = stockDisponible.find(s => s.productoNombre === v)
                          setFormData({
                            ...formData, 
                            productoNombre: v,
                            tropaCodigo: stock?.tropaCodigo || '',
                            pesoKg: stock?.pesoKg?.toString() || ''
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {stockDisponible
                            .filter(s => formData.tipoProducto === 'MEDIA_RES' || s.tipo === formData.tipoProducto)
                            .map(s => (
                              <SelectItem key={s.id} value={s.productoNombre}>
                                {s.productoNombre} ({s.pesoKg.toFixed(1)} kg)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="CODIGO_BARRAS" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Barcode className="w-4 h-4" />
                        Código de Barras
                      </Label>
                      <Input
                        value={formData.codigoBarras}
                        onChange={(e) => setFormData({...formData, codigoBarras: e.target.value})}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleBuscarCodigoBarras(formData.codigoBarras)
                          }
                        }}
                        placeholder="Escanear o escribir código..."
                        className="font-mono"
                        autoFocus
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBuscarCodigoBarras(formData.codigoBarras)}
                      >
                        Buscar
                      </Button>
                    </div>
                    
                    {formData.productoNombre && (
                      <div className="bg-stone-50 p-3 rounded-lg">
                        <p className="font-medium">{formData.productoNombre}</p>
                        <p className="text-sm text-stone-500">
                          {formData.tropaCodigo && `Tropa: ${formData.tropaCodigo}`}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Peso (kg) *
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.pesoKg}
                    onChange={(e) => setFormData({...formData, pesoKg: e.target.value})}
                    required
                  />
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
                  <Label>Fecha Faena</Label>
                  <Input
                    type="date"
                    value={formData.fechaFaena}
                    onChange={(e) => setFormData({...formData, fechaFaena: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Cliente
                  </Label>
                  <Select 
                    value={formData.clienteId} 
                    onValueChange={(v) => setFormData({...formData, clienteId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cámara Destino</Label>
                  <Select 
                    value={formData.camaraId} 
                    onValueChange={(v) => setFormData({...formData, camaraId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.filter(c => c.tipo === 'CUARTEO' || c.tipo === 'DEPOSITO').map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  'Registrar Ingreso'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
