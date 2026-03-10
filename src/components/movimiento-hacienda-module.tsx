'use client'

import { useState, useEffect } from 'react'
import { 
  Beef, Search, Filter, Plus, Eye, Edit, Trash2, 
  Lock, Save, ArrowRight, Calendar, Warehouse, Skull,
  Move, AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

const ESTADOS = [
  { id: 'RECIBIDO', label: 'Recibido', color: 'bg-amber-100 text-amber-700' },
  { id: 'EN_CORRAL', label: 'En Corral', color: 'bg-blue-100 text-blue-700' },
  { id: 'EN_PESAJE', label: 'En Pesaje', color: 'bg-purple-100 text-purple-700' },
  { id: 'PESADO', label: 'Pesado', color: 'bg-green-100 text-green-700' },
  { id: 'LISTO_FAENA', label: 'Listo Faena', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'EN_FAENA', label: 'En Faena', color: 'bg-orange-100 text-orange-700' },
  { id: 'FAENADO', label: 'Faenado', color: 'bg-gray-100 text-gray-700' },
  { id: 'DESPACHADO', label: 'Despachado', color: 'bg-stone-100 text-stone-500' },
]

const CORRALES = ['Corral A', 'Corral B', 'Corral C', 'Corral D', 'Corral E1', 'Corral E2']

interface Tropa {
  id: string
  numero: number
  codigo: string
  productor?: { id: string; nombre: string }
  usuarioFaena: { id: string; nombre: string }
  especie: string
  cantidadCabezas: number
  corral?: { id: string; nombre: string } | string
  corralId?: string
  estado: string
  fechaRecepcion: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  pesoTotalIndividual?: number
  dte?: string
  guia?: string
  observaciones?: string
  tiposAnimales?: { tipoAnimal: string; cantidad: number }[]
  animales?: Animal[]
}

interface Animal {
  id: string
  numero: number
  codigo: string
  tipoAnimal: string
  caravana?: string
  raza?: string
  pesoVivo?: number
  estado: string
  corral?: string
  fechaBaja?: string
  motivoBaja?: string
}

interface CorralStock {
  corral: string
  totalCabezas: number
  tropas: { codigo: string; cantidad: number }[]
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

export function MovimientoHaciendaModule({ operador }: { operador: Operador }) {
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [corralesStock, setCorralesStock] = useState<CorralStock[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [activeTab, setActiveTab] = useState('corrales')
  
  // Dialogs
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [bajaOpen, setBajaOpen] = useState(false)
  const [moverOpen, setMoverOpen] = useState(false)
  const [claveSupervisor, setClaveSupervisor] = useState('')
  const [tropaSeleccionada, setTropaSeleccionada] = useState<Tropa | null>(null)
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(null)
  const [editData, setEditData] = useState({
    cantidadCabezas: 0,
    corral: '',
    estado: '',
    observaciones: ''
  })
  const [saving, setSaving] = useState(false)
  
  // Mover corral
  const [corralDestino, setCorralDestino] = useState('')
  
  // Baja
  const [motivoBaja, setMotivoBaja] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tropasRes, stockRes] = await Promise.all([
        fetch('/api/tropas'),
        fetch('/api/corrales/stock')
      ])
      
      const tropasData = await tropasRes.json()
      const stockData = await stockRes.json()
      
      if (tropasData.success) {
        setTropas(tropasData.data)
      }
      
      if (stockData.success) {
        setCorralesStock(stockData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerDetalle = async (tropa: Tropa) => {
    try {
      const res = await fetch(`/api/tropas/${tropa.id}`)
      const data = await res.json()
      if (data.success) {
        setTropaSeleccionada(data.data)
        setDetalleOpen(true)
      }
    } catch (error) {
      toast.error('Error al cargar detalle')
    }
  }

  const handleEditar = (tropa: Tropa) => {
    setTropaSeleccionada(tropa)
    setEditData({
      cantidadCabezas: tropa.cantidadCabezas,
      corral: typeof tropa.corral === 'object' ? tropa.corral?.nombre : tropa.corral || '',
      estado: tropa.estado,
      observaciones: tropa.observaciones || ''
    })
    setClaveSupervisor('')
    setEditarOpen(true)
  }

  const handleGuardarEdicion = async () => {
    if (!claveSupervisor) {
      toast.error('Ingrese la clave de supervisor')
      return
    }

    try {
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: claveSupervisor })
      })
      
      const authData = await authRes.json()
      
      if (!authData.success || (authData.data.nivel !== 'SUPERVISOR' && authData.data.nivel !== 'ADMINISTRADOR')) {
        toast.error('Clave de supervisor inválida')
        return
      }
    } catch {
      toast.error('Error al verificar clave')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/tropas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tropaSeleccionada?.id,
          cantidadCabezas: editData.cantidadCabezas,
          corral: editData.corral,
          estado: editData.estado,
          observaciones: editData.observaciones,
          operadorEditorId: operador.id
        })
      })
      
      if (res.ok) {
        toast.success('Tropa actualizada')
        setEditarOpen(false)
        fetchData()
      } else {
        toast.error('Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleMoverCorral = async () => {
    if (!tropaSeleccionada || !corralDestino) {
      toast.error('Seleccione el corral destino')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/tropas/mover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tropaId: tropaSeleccionada.id,
          corralDestino
        })
      })
      
      if (res.ok) {
        toast.success(`Tropa movida a ${corralDestino}`)
        setMoverOpen(false)
        setCorralDestino('')
        fetchData()
      } else {
        toast.error('Error al mover tropa')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleBajaAnimal = async () => {
    if (!animalSeleccionado || !motivoBaja) {
      toast.error('Ingrese el motivo de la baja')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/animales/baja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId: animalSeleccionado.id,
          motivoBaja
        })
      })
      
      if (res.ok) {
        toast.success('Baja registrada')
        setBajaOpen(false)
        setMotivoBaja('')
        fetchData()
      } else {
        toast.error('Error al registrar baja')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar tropas
  const tropasFiltradas = tropas.filter(tropa => {
    if (filtroEstado !== 'todos' && tropa.estado !== filtroEstado) return false
    if (busqueda) {
      const search = busqueda.toLowerCase()
      return (
        tropa.codigo.toLowerCase().includes(search) ||
        tropa.usuarioFaena.nombre.toLowerCase().includes(search) ||
        tropa.productor?.nombre?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const getEstadoBadge = (estado: string) => {
    const est = ESTADOS.find(e => e.id === estado)
    return (
      <Badge className={est?.color || 'bg-gray-100'}>
        {est?.label || estado}
      </Badge>
    )
  }

  // Calcular totales
  const totalAnimales = corralesStock.reduce((acc, c) => acc + c.totalCabezas, 0)
  const corralesOcupados = corralesStock.filter(c => c.totalCabezas > 0).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Movimiento de Hacienda</h2>
            <p className="text-stone-500">Control y seguimiento de tropas y corrales</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Beef className="h-4 w-4 mr-2 text-amber-500" />
              {totalAnimales} animales en {corralesOcupados} corrales
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="corrales">Stock por Corral</TabsTrigger>
            <TabsTrigger value="tropas">Tropas</TabsTrigger>
            <TabsTrigger value="animales">Animales</TabsTrigger>
          </TabsList>

          {/* STOCK POR CORRAL */}
          <TabsContent value="corrales" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CORRALES.map((corral) => {
                const stock = corralesStock.find(c => c.corral === corral)
                const isEmpty = !stock || stock.totalCabezas === 0
                
                return (
                  <Card 
                    key={corral} 
                    className={`border-0 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                      isEmpty ? 'opacity-60' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Warehouse className={`w-5 h-5 ${isEmpty ? 'text-stone-400' : 'text-amber-500'}`} />
                          {corral}
                        </CardTitle>
                        <Badge variant={isEmpty ? 'secondary' : 'default'} className={isEmpty ? '' : 'bg-green-600'}>
                          {isEmpty ? 'Vacío' : 'Ocupado'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEmpty ? (
                        <div className="text-center py-4 text-stone-400">
                          <Warehouse className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Sin animales</p>
                        </div>
                      ) : (
                        <>
                          <div className="text-center mb-4">
                            <p className="text-3xl font-bold text-stone-800">{stock?.totalCabezas || 0}</p>
                            <p className="text-sm text-stone-500">cabezas</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-xs text-stone-500 font-medium">Tropas:</p>
                            {stock?.tropas.map((t, i) => (
                              <div key={i} className="flex justify-between text-sm bg-stone-50 p-2 rounded">
                                <span className="font-mono font-medium">{t.codigo}</span>
                                <span className="text-stone-600">{t.cantidad} cab.</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Resumen general */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-amber-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Beef className="w-5 h-5 text-amber-600" />
                  Resumen de Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-stone-800">{totalAnimales}</p>
                    <p className="text-sm text-stone-500">Total Animales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{corralesOcupados}</p>
                    <p className="text-sm text-stone-500">Corrales Ocupados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-stone-400">{CORRALES.length - corralesOcupados}</p>
                    <p className="text-sm text-stone-500">Corrales Vacíos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">
                      {tropas.filter(t => t.estado === 'FALLECIDO').reduce((acc, t) => acc + t.cantidadCabezas, 0)}
                    </p>
                    <p className="text-sm text-stone-500">Bajas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TROPAS */}
          <TabsContent value="tropas" className="space-y-6">
            {/* Filtros */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Buscar por tropa, cliente, productor..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Resumen por estado */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ESTADOS.slice(0, 4).map((estado) => {
                const count = tropas.filter(t => t.estado === estado.id).length
                return (
                  <Card 
                    key={estado.id} 
                    className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setFiltroEstado(estado.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm px-2 py-1 rounded ${estado.color}`}>{estado.label}</span>
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Tabla de tropas */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                  <Beef className="w-5 h-5" />
                  Tropas Registradas
                </CardTitle>
                <CardDescription>
                  Mostrando {tropasFiltradas.length} de {tropas.length} tropas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">Cargando...</div>
                ) : tropasFiltradas.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Beef className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay tropas que mostrar</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Usuario Faena</TableHead>
                        <TableHead>Especie</TableHead>
                        <TableHead>Tipos</TableHead>
                        <TableHead>Corral</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Peso Neto</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tropasFiltradas.map((tropa) => (
                        <TableRow key={tropa.id} className="hover:bg-stone-50">
                          <TableCell>
                            <div>
                              <span className="font-mono font-bold">{tropa.codigo}</span>
                              <div className="text-xs text-stone-400">
                                {new Date(tropa.fechaRecepcion).toLocaleDateString('es-AR')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{tropa.usuarioFaena.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tropa.especie}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {tropa.tiposAnimales?.map((t, i) => (
                                <div key={i}>{t.tipoAnimal}: {t.cantidad}</div>
                              ))}
                              <div className="font-bold">Total: {tropa.cantidadCabezas}</div>
                            </div>
                          </TableCell>
                          <TableCell>{typeof tropa.corral === 'object' ? tropa.corral?.nombre : tropa.corral || '-'}</TableCell>
                          <TableCell>{getEstadoBadge(tropa.estado)}</TableCell>
                          <TableCell>
                            {tropa.pesoTotalIndividual 
                              ? `${tropa.pesoTotalIndividual.toLocaleString()} kg`
                              : tropa.pesoNeto 
                                ? `${tropa.pesoNeto.toLocaleString()} kg`
                                : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleVerDetalle(tropa)}
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditar(tropa)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setTropaSeleccionada(tropa)
                                  setMoverOpen(true)
                                }}
                                title="Mover de corral"
                                className="text-blue-600"
                              >
                                <Move className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANIMALES */}
          <TabsContent value="animales" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Beef className="w-5 h-5" />
                  Animales Individuales
                </CardTitle>
                <CardDescription>
                  Gestión de animales por unidad - baja por muerte, movimientos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {tropas.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Beef className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay animales registrados</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {tropas.filter(t => t.animales && t.animales.length > 0).map((tropa) => (
                      <div key={tropa.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-mono font-bold text-stone-800">{tropa.codigo}</span>
                            <span className="text-sm text-stone-500 ml-2">- {tropa.usuarioFaena.nombre}</span>
                          </div>
                          <Badge variant="outline">{tropa.animales?.length || 0} animales</Badge>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nº</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>Caravana</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Raza</TableHead>
                              <TableHead>Peso</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tropa.animales?.map((animal) => (
                              <TableRow key={animal.id} className={animal.estado === 'FALLECIDO' ? 'bg-red-50' : ''}>
                                <TableCell>{animal.numero}</TableCell>
                                <TableCell className="font-mono">{animal.codigo}</TableCell>
                                <TableCell>{animal.caravana || '-'}</TableCell>
                                <TableCell><Badge variant="outline">{animal.tipoAnimal}</Badge></TableCell>
                                <TableCell>{animal.raza || '-'}</TableCell>
                                <TableCell>{animal.pesoVivo?.toLocaleString() || '-'} kg</TableCell>
                                <TableCell>
                                  {animal.estado === 'FALLECIDO' ? (
                                    <Badge className="bg-red-100 text-red-700">
                                      <Skull className="w-3 h-3 mr-1" />
                                      Fallecido
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">{animal.estado}</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {animal.estado !== 'FALLECIDO' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        setAnimalSeleccionado(animal)
                                        setBajaOpen(true)
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Skull className="w-4 h-4 mr-1" />
                                      Baja
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Detalle */}
        <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Tropa</DialogTitle>
            </DialogHeader>
            {tropaSeleccionada && (
              <div className="space-y-4 py-4">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold">{tropaSeleccionada.codigo}</p>
                    <p className="text-sm text-stone-500">Código de tropa</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-stone-500">Usuario Faena:</span>
                    <p className="font-medium">{tropaSeleccionada.usuarioFaena.nombre}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Productor:</span>
                    <p className="font-medium">{tropaSeleccionada.productor?.nombre || '-'}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Especie:</span>
                    <p className="font-medium">{tropaSeleccionada.especie}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Corral:</span>
                    <p className="font-medium">{tropaSeleccionada.corral || '-'}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">DTE:</span>
                    <p className="font-medium">{tropaSeleccionada.dte || '-'}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Guía:</span>
                    <p className="font-medium">{tropaSeleccionada.guia || '-'}</p>
                  </div>
                </div>

                {tropaSeleccionada.tiposAnimales && tropaSeleccionada.tiposAnimales.length > 0 && (
                  <div>
                    <span className="text-stone-500 text-sm">Tipos de Animales:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tropaSeleccionada.tiposAnimales.map((t, i) => (
                        <Badge key={i} variant="outline">
                          {t.tipoAnimal}: {t.cantidad}
                        </Badge>
                      ))}
                    </div>
                    <p className="font-bold mt-2">Total: {tropaSeleccionada.cantidadCabezas} cabezas</p>
                  </div>
                )}

                <div className="bg-stone-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-stone-500 text-xs">Peso Bruto</p>
                      <p className="font-bold">{tropaSeleccionada.pesoBruto?.toLocaleString() || '-'} kg</p>
                    </div>
                    <div>
                      <p className="text-stone-500 text-xs">Peso Tara</p>
                      <p className="font-bold">{tropaSeleccionada.pesoTara?.toLocaleString() || '-'} kg</p>
                    </div>
                    <div>
                      <p className="text-stone-500 text-xs">Peso Neto</p>
                      <p className="font-bold text-green-600">{tropaSeleccionada.pesoNeto?.toLocaleString() || '-'} kg</p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-stone-500 text-sm">Estado actual:</span>
                  <div className="mt-2">{getEstadoBadge(tropaSeleccionada.estado)}</div>
                </div>

                {tropaSeleccionada.observaciones && (
                  <div>
                    <span className="text-stone-500 text-sm">Observaciones:</span>
                    <p className="bg-stone-50 p-2 rounded mt-1">{tropaSeleccionada.observaciones}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Editar */}
        <Dialog open={editarOpen} onOpenChange={setEditarOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Tropa</DialogTitle>
              <DialogDescription>
                Se requiere clave de supervisor para realizar cambios
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-700">Autorización Requerida</span>
                </div>
                <Label>Clave de Supervisor</Label>
                <Input
                  type="password"
                  value={claveSupervisor}
                  onChange={(e) => setClaveSupervisor(e.target.value)}
                  placeholder="••••••"
                  className="mt-1"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cantidad de Cabezas</Label>
                  <Input
                    type="number"
                    value={editData.cantidadCabezas || ''}
                    onChange={(e) => setEditData({...editData, cantidadCabezas: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Corral</Label>
                  <Select value={editData.corral} onValueChange={(v) => setEditData({...editData, corral: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CORRALES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={editData.estado} onValueChange={(v) => setEditData({...editData, estado: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    value={editData.observaciones}
                    onChange={(e) => setEditData({...editData, observaciones: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditarOpen(false)}>Cancelar</Button>
              <Button onClick={handleGuardarEdicion} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Mover Corral */}
        <Dialog open={moverOpen} onOpenChange={setMoverOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mover Tropa de Corral</DialogTitle>
              <DialogDescription>
                Seleccione el corral destino para la tropa {tropaSeleccionada?.codigo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-stone-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-stone-500">Corral Actual:</span>
                  <span className="font-medium">{tropaSeleccionada?.corral || 'Sin asignar'}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-stone-500">Cabezas:</span>
                  <span className="font-medium">{tropaSeleccionada?.cantidadCabezas}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Corral Destino *</Label>
                <Select value={corralDestino} onValueChange={setCorralDestino}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CORRALES.filter(c => c !== tropaSeleccionada?.corral).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMoverOpen(false)}>Cancelar</Button>
              <Button onClick={handleMoverCorral} disabled={saving || !corralDestino} className="bg-blue-600 hover:bg-blue-700">
                <Move className="w-4 h-4 mr-2" />
                Mover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Baja Animal */}
        <Dialog open={bajaOpen} onOpenChange={setBajaOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Baja de Animal</DialogTitle>
              <DialogDescription>
                Registre el fallecimiento o decomiso del animal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-700">Esta acción es irreversible</span>
                </div>
                <p className="text-sm text-red-600">
                  Animal: {animalSeleccionado?.codigo} - {animalSeleccionado?.tipoAnimal}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Motivo de la Baja *</Label>
                <Select value={motivoBaja} onValueChange={setMotivoBaja}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MUERTE_NATURAL">Muerte Natural</SelectItem>
                    <SelectItem value="MUERTE_ENFERMEDAD">Muerte por Enfermedad</SelectItem>
                    <SelectItem value="DECOMISO">Decomiso Sanitario</SelectItem>
                    <SelectItem value="ACCIDENTE">Accidente</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBajaOpen(false)}>Cancelar</Button>
              <Button onClick={handleBajaAnimal} disabled={saving || !motivoBaja} className="bg-red-600 hover:bg-red-700">
                <Skull className="w-4 h-4 mr-2" />
                Registrar Baja
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default MovimientoHaciendaModule
