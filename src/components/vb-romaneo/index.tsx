'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Scale, User, Building2, ArrowRight, ArrowLeft, Check, AlertTriangle,
  Printer, RefreshCw, Settings, List, ChevronUp, ChevronDown, X, CheckCircle,
  Clock, Package, ToggleLeft, ToggleRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface SesionRomaneo {
  id: string
  tipificadorId?: string
  tipificador?: { id: string; nombre: string; apellido: string; matricula: string }
  camaraId?: string
  camara?: { id: string; nombre: string; tipo: string }
  ultimoGarron?: number
}

interface Garron {
  garron: number
  animalId: string
  numeroAnimal: number
  horaIngreso: string
  tropa?: {
    id: string
    codigo: string
    especie: string
    productor?: { nombre: string }
    usuarioFaena?: { nombre: string }
  }
  animal: {
    tipoAnimal: string
    raza?: string
    pesoVivo?: number
  }
  estado: 'PENDIENTE' | 'PARCIAL' | 'COMPLETO'
  tieneDer: boolean
  tieneIzq: boolean
  totalMedias: number
}

interface Tipificador {
  id: string
  nombre: string
  apellido: string
  matricula: string
}

interface Camara {
  id: string
  nombre: string
  tipo: string
}

interface ListaFaena {
  id: string
  fecha: string
  estado: string
  cantidadTotal: number
}

export function VBRomaneoModule({ operador }: { operador: Operador }) {
  // Estados principales
  const [sesion, setSesion] = useState<SesionRomaneo | null>(null)
  const [garrones, setGarrones] = useState<Garron[]>([])
  const [garronActual, setGarronActual] = useState<Garron | null>(null)
  const [listaFaenaActual, setListaFaenaActual] = useState<ListaFaena | null>(null)
  const [tipificadores, setTipificadores] = useState<Tipificador[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  
  // Estados de configuración
  const [denticion, setDenticion] = useState('2')
  const [pesoActual, setPesoActual] = useState('')
  const [ladoActual, setLadoActual] = useState<'DER' | 'IZQ'>('DER')
  const [ultimoCodigoImpreso, setUltimoCodigoImpreso] = useState('')
  
  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showGarronSelector, setShowGarronSelector] = useState(false)
  const [showConfirmacion, setShowConfirmacion] = useState(false)
  const [showIntercambio, setShowIntercambio] = useState(false)
  const [showCierre, setShowCierre] = useState(false)
  const [garronSelect1, setGarronSelect1] = useState<number | null>(null)
  const [garronSelect2, setGarronSelect2] = useState<number | null>(null)
  const [esDecomiso, setEsDecomiso] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  const cargarDatosIniciales = async () => {
    setLoading(true)
    try {
      // Cargar sesión
      const sesionRes = await fetch(`/api/sesion-romaneo?operadorId=${operador.id}`)
      const sesionData = await sesionRes.json()
      if (sesionData.success) {
        setSesion(sesionData.data)
      }

      // Cargar tipificadores
      const tipRes = await fetch('/api/tipificadores')
      const tipData = await tipRes.json()
      if (tipData.success) {
        setTipificadores(tipData.data)
      }

      // Cargar cámaras
      const camRes = await fetch('/api/camaras')
      const camData = await camRes.json()
      if (camData.success) {
        setCamaras(camData.data.filter((c: Camara) => c.tipo === 'FAENA'))
      }

      // Cargar lista de faena del día
      const hoy = new Date().toISOString().split('T')[0]
      const listaRes = await fetch(`/api/lista-faena?fecha=${hoy}`)
      const listaData = await listaRes.json()
      if (listaData.success && listaData.data?.length > 0) {
        const lista = listaData.data[0]
        setListaFaenaActual(lista)
        await cargarGarrones(lista.id)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar datos iniciales')
    } finally {
      setLoading(false)
    }
  }

  const cargarGarrones = async (listaFaenaId: string) => {
    try {
      const res = await fetch(`/api/garrones?listaFaenaId=${listaFaenaId}`)
      const data = await res.json()
      if (data.success) {
        setGarrones(data.data)
        // Seleccionar primer garrón pendiente o parcial
        const primerPendiente = data.data.find((g: Garron) => g.estado !== 'COMPLETO')
        if (primerPendiente) {
          setGarronActual(primerPendiente)
          setLadoActual(primerPendiente.tieneDer ? 'IZQ' : 'DER')
        }
      }
    } catch (error) {
      console.error('Error cargando garrones:', error)
    }
  }

  // Actualizar configuración de sesión
  const actualizarSesion = async (campo: string, valor: string | null) => {
    if (!sesion) return
    
    try {
      const res = await fetch('/api/sesion-romaneo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sesion.id, [campo]: valor })
      })
      const data = await res.json()
      if (data.success) {
        setSesion(data.data)
        toast.success('Configuración actualizada')
      }
    } catch (error) {
      toast.error('Error al actualizar configuración')
    }
  }

  // Registrar pesaje de media res
  const registrarPesaje = async () => {
    if (!garronActual || !pesoActual || !listaFaenaActual) {
      toast.error('Complete todos los campos')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/garrones/pesaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garron: garronActual.garron,
          lado: ladoActual,
          peso: pesoActual,
          denticion,
          camaraId: sesion?.camaraId,
          tipificadorId: sesion?.tipificadorId,
          operadorId: operador.id,
          listaFaenaId: listaFaenaActual.id,
          esDecomiso
        })
      })

      const data = await res.json()
      
      if (data.success) {
        setUltimoCodigoImpreso(data.data.codigo)
        toast.success(data.data.mensaje)
        
        // Recargar garrones
        await cargarGarrones(listaFaenaActual.id)
        
        // Si el garrón está completo, pasar al siguiente
        if (data.data.garronCompleto) {
          pasarSiguienteGarron()
        } else {
          // Cambiar de lado
          setLadoActual(ladoActual === 'DER' ? 'IZQ' : 'DER')
        }
        
        setPesoActual('')
        setShowConfirmacion(false)
      } else {
        toast.error(data.error || 'Error al registrar pesaje')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Pasar al siguiente garrón pendiente
  const pasarSiguienteGarron = () => {
    const indexActual = garrones.findIndex(g => g.garron === garronActual?.garron)
    
    // Buscar el siguiente garrón no completo
    for (let i = indexActual + 1; i < garrones.length; i++) {
      if (garrones[i].estado !== 'COMPLETO') {
        setGarronActual(garrones[i])
        setLadoActual(garrones[i].tieneDer ? 'IZQ' : 'DER')
        return
      }
    }
    
    // Si no hay más, buscar desde el inicio
    for (let i = 0; i < indexActual; i++) {
      if (garrones[i].estado !== 'COMPLETO') {
        setGarronActual(garrones[i])
        setLadoActual(garrones[i].tieneDer ? 'IZQ' : 'DER')
        return
      }
    }
    
    toast.success('¡Todos los garrones están completos!')
  }

  // Ir a garrón específico
  const irAGarron = (garron: Garron) => {
    setGarronActual(garron)
    setLadoActual(garron.tieneDer ? 'IZQ' : 'DER')
    setShowGarronSelector(false)
  }

  // Intercambiar garrones
  const intercambiarGarrones = async () => {
    if (!garronSelect1 || !garronSelect2 || !listaFaenaActual) {
      toast.error('Seleccione ambos garrones')
      return
    }

    try {
      const res = await fetch('/api/garrones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garron1: garronSelect1,
          garron2: garronSelect2,
          listaFaenaId: listaFaenaActual.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        await cargarGarrones(listaFaenaActual.id)
        setShowIntercambio(false)
        setGarronSelect1(null)
        setGarronSelect2(null)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al intercambiar garrones')
    }
  }

  // Cerrar romaneo del día
  const cerrarRomaneo = async () => {
    if (!listaFaenaActual) return

    setLoading(true)
    try {
      const res = await fetch('/api/romaneo/cierre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listaFaenaId: listaFaenaActual.id,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Romaneo cerrado correctamente')
        setShowCierre(false)
        cargarDatosIniciales()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al cerrar romaneo')
    } finally {
      setLoading(false)
    }
  }

  // Reimprimir última etiqueta
  const reimprimirUltima = () => {
    if (ultimoCodigoImpreso) {
      toast.success(`Reimprimiendo: ${ultimoCodigoImpreso}`)
      // Aquí iría la lógica de impresión real
    } else {
      toast.error('No hay etiqueta para reimprimir')
    }
  }

  // Calcular estadísticas
  const stats = {
    total: garrones.length,
    completos: garrones.filter(g => g.estado === 'COMPLETO').length,
    parciales: garrones.filter(g => g.estado === 'PARCIAL').length,
    pendientes: garrones.filter(g => g.estado === 'PENDIENTE').length
  }

  const puedeCerrar = stats.pendientes === 0 && stats.parciales === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">VB Romaneo</h1>
            <p className="text-stone-500 text-sm">
              {listaFaenaActual ? (
                <>Lista de Faena: {new Date(listaFaenaActual.fecha).toLocaleDateString('es-AR')} - {listaFaenaActual.cantidadTotal} animales</>
              ) : (
                'No hay lista de faena activa'
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
              <Settings className="w-4 h-4 mr-1" />
              Config
            </Button>
            <Button variant="outline" size="sm" onClick={reimprimirUltima} disabled={!ultimoCodigoImpreso}>
              <Printer className="w-4 h-4 mr-1" />
              Reimprimir
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => cargarGarrones(listaFaenaActual?.id || '')}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Panel de configuración */}
        {showConfig && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-stone-500">Tipificador</Label>
                  <Select 
                    value={sesion?.tipificadorId || ''} 
                    onValueChange={(v) => actualizarSesion('tipificadorId', v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tipificadores.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nombre} {t.apellido} - Mat: {t.matricula}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Cámara Destino</Label>
                  <Select 
                    value={sesion?.camaraId || ''} 
                    onValueChange={(v) => actualizarSesion('camaraId', v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Denticción (Default: 2)</Label>
                  <div className="flex gap-1">
                    {['0', '2', '4', '6', '8'].map(d => (
                      <Button
                        key={d}
                        variant={denticion === d ? 'default' : 'outline'}
                        size="sm"
                        className="w-10"
                        onClick={() => setDenticion(d)}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowIntercambio(true)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Intercambiar Garrones
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido principal */}
        <div className="grid md:grid-cols-3 gap-4">
          
          {/* Panel de pesaje principal */}
          <div className="md:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-stone-800 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="w-5 h-5" />
                      Pesaje de Media Res
                    </CardTitle>
                    <CardDescription className="text-stone-300">
                      Garrón {garronActual?.garron || '-'} | {ladoActual === 'DER' ? 'Derecha' : 'Izquierda'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white"
                      onClick={() => setShowGarronSelector(true)}
                    >
                      <List className="w-4 h-4 mr-1" />
                      Seleccionar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {garronActual ? (
                  <div className="space-y-6">
                    
                    {/* Info del garrón */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-stone-100 rounded-lg">
                        <Label className="text-xs text-stone-500">Tropa</Label>
                        <p className="font-mono font-bold text-lg">{garronActual.tropa?.codigo || '-'}</p>
                      </div>
                      <div className="p-3 bg-stone-100 rounded-lg">
                        <Label className="text-xs text-stone-500">N° Animal</Label>
                        <p className="font-bold text-lg">{garronActual.numeroAnimal}</p>
                      </div>
                      <div className="p-3 bg-stone-100 rounded-lg">
                        <Label className="text-xs text-stone-500">Peso Vivo</Label>
                        <p className="font-bold text-lg">{garronActual.animal.pesoVivo?.toLocaleString('es-AR') || '-'} kg</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-stone-100 rounded-lg">
                        <Label className="text-xs text-stone-500">Tipo Animal</Label>
                        <p className="font-medium">{garronActual.animal.tipoAnimal}</p>
                      </div>
                      <div className="p-3 bg-stone-100 rounded-lg">
                        <Label className="text-xs text-stone-500">Raza</Label>
                        <p className="font-medium">{garronActual.animal.raza || '-'}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Indicador de lado */}
                    <div className="flex justify-center gap-4">
                      <button
                        className={cn(
                          "px-8 py-4 rounded-xl text-xl font-bold transition-all",
                          ladoActual === 'DER' 
                            ? "bg-green-500 text-white shadow-lg scale-105" 
                            : "bg-stone-200 text-stone-500"
                        )}
                        onClick={() => setLadoActual('DER')}
                      >
                        DERECHA
                        {garronActual.tieneDer && <Check className="inline-block ml-2 w-5 h-5" />}
                      </button>
                      <button
                        className={cn(
                          "px-8 py-4 rounded-xl text-xl font-bold transition-all",
                          ladoActual === 'IZQ' 
                            ? "bg-green-500 text-white shadow-lg scale-105" 
                            : "bg-stone-200 text-stone-500"
                        )}
                        onClick={() => setLadoActual('IZQ')}
                      >
                        IZQUIERDA
                        {garronActual.tieneIzq && <Check className="inline-block ml-2 w-5 h-5" />}
                      </button>
                    </div>

                    {/* Toggle Decomiso */}
                    <div className="flex items-center justify-center gap-3">
                      <Label className="text-sm">¿Es decomiso?</Label>
                      <button
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                          esDecomiso ? "bg-red-500 text-white" : "bg-stone-200 text-stone-600"
                        )}
                        onClick={() => setEsDecomiso(!esDecomiso)}
                      >
                        {esDecomiso ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {esDecomiso ? 'Sí' : 'No'}
                      </button>
                    </div>

                    {/* Input de peso */}
                    <div className="space-y-2">
                      <Label className="text-center block text-lg font-medium">Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pesoActual}
                        onChange={(e) => setPesoActual(e.target.value)}
                        placeholder="Ingrese peso..."
                        className="text-3xl text-center h-16 font-bold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && pesoActual) {
                            setShowConfirmacion(true)
                          }
                        }}
                      />
                    </div>

                    {/* Denticción rápida */}
                    <div className="flex items-center justify-center gap-2">
                      <Label className="text-sm">Denticción:</Label>
                      {['0', '2', '4', '6', '8'].map(d => (
                        <Button
                          key={d}
                          variant={denticion === d ? 'default' : 'outline'}
                          size="sm"
                          className="w-12 h-10"
                          onClick={() => setDenticion(d)}
                        >
                          {d}
                        </Button>
                      ))}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 h-14 text-lg"
                        onClick={() => pasarSiguienteGarron()}
                        variant="outline"
                      >
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Saltar
                      </Button>
                      <Button
                        className="flex-1 h-14 text-lg"
                        onClick={() => setShowConfirmacion(true)}
                        disabled={!pesoActual}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Aceptar Peso
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Scale className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                    <p className="text-stone-500">No hay garrones pendientes</p>
                    <p className="text-sm text-stone-400 mt-1">Cargue una lista de faena para comenzar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral de garrones */}
          <div className="space-y-4">
            {/* Estadísticas */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-stone-500">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.completos}</p>
                    <p className="text-xs text-stone-500">Completos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{stats.parciales}</p>
                    <p className="text-xs text-stone-500">Parciales</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.pendientes}</p>
                    <p className="text-xs text-stone-500">Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de garrones */}
            <Card className="border-0 shadow-md">
              <CardHeader className="py-3 px-4 bg-stone-100">
                <CardTitle className="text-sm flex items-center justify-between">
                  Estado de Garrones
                  <Badge variant="outline">{stats.completos}/{stats.total}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {garrones.map((g) => (
                      <div
                        key={g.garron}
                        className={cn(
                          "p-2 flex items-center gap-2 cursor-pointer hover:bg-stone-50 transition-colors",
                          garronActual?.garron === g.garron && "bg-amber-50 border-l-4 border-amber-500"
                        )}
                        onClick={() => irAGarron(g)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          g.estado === 'COMPLETO' && "bg-green-500 text-white",
                          g.estado === 'PARCIAL' && "bg-amber-500 text-white",
                          g.estado === 'PENDIENTE' && "bg-stone-300 text-stone-600"
                        )}>
                          {g.garron}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{g.tropa?.codigo}</p>
                          <p className="text-xs text-stone-500">Animal {g.numeroAnimal}</p>
                        </div>
                        <div className="flex gap-1">
                          {g.tieneDer ? (
                            <Badge className="bg-green-100 text-green-700 text-xs px-1">D</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-1">D</Badge>
                          )}
                          {g.tieneIzq ? (
                            <Badge className="bg-green-100 text-green-700 text-xs px-1">I</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-1">I</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Botón de cierre */}
            <Button
              className="w-full h-12"
              variant={puedeCerrar ? "default" : "outline"}
              onClick={() => setShowCierre(true)}
              disabled={!puedeCerrar}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Cerrar Romaneo del Día
            </Button>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={showConfirmacion} onOpenChange={setShowConfirmacion}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pesaje</DialogTitle>
            <DialogDescription>
              Verifique los datos antes de imprimir la etiqueta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-center bg-stone-100 p-4 rounded-lg">
              <div>
                <Label className="text-xs">Garrón</Label>
                <p className="text-2xl font-bold">{garronActual?.garron}</p>
              </div>
              <div>
                <Label className="text-xs">Lado</Label>
                <p className="text-2xl font-bold">{ladoActual === 'DER' ? 'DERECHA' : 'IZQUIERDA'}</p>
              </div>
              <div>
                <Label className="text-xs">Peso</Label>
                <p className="text-2xl font-bold">{pesoActual} kg</p>
              </div>
              <div>
                <Label className="text-xs">Denticción</Label>
                <p className="text-2xl font-bold">{denticion}</p>
              </div>
            </div>
            {esDecomiso && (
              <div className="bg-red-100 text-red-700 p-2 rounded text-center text-sm font-medium">
                ⚠️ MARCADO COMO DECOMISO
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmacion(false)}>
              Cancelar
            </Button>
            <Button onClick={registrarPesaje} disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar e Imprimir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de selección de garrón */}
      <Dialog open={showGarronSelector} onOpenChange={setShowGarronSelector}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Seleccionar Garrón</DialogTitle>
            <DialogDescription>
              Elija un garrón específico para pesarlo
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-5 gap-2 p-2">
              {garrones.map((g) => (
                <button
                  key={g.garron}
                  className={cn(
                    "p-3 rounded-lg text-center font-bold transition-all",
                    g.estado === 'COMPLETO' && "bg-green-500 text-white",
                    g.estado === 'PARCIAL' && "bg-amber-500 text-white",
                    g.estado === 'PENDIENTE' && "bg-stone-200 hover:bg-stone-300",
                    garronActual?.garron === g.garron && "ring-2 ring-blue-500"
                  )}
                  onClick={() => irAGarron(g)}
                >
                  {g.garron}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Diálogo de intercambio de garrones */}
      <Dialog open={showIntercambio} onOpenChange={setShowIntercambio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Intercambiar Garrones</DialogTitle>
            <DialogDescription>
              Solo se pueden intercambiar garrones de la misma tropa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Garrón 1</Label>
                <Select 
                  value={garronSelect1?.toString() || ''} 
                  onValueChange={(v) => setGarronSelect1(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {garrones.map(g => (
                      <SelectItem key={g.garron} value={g.garron.toString()}>
                        Garrón {g.garron} - Tropa {g.tropa?.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Garrón 2</Label>
                <Select 
                  value={garronSelect2?.toString() || ''} 
                  onValueChange={(v) => setGarronSelect2(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {garrones.filter(g => g.garron !== garronSelect1).map(g => (
                      <SelectItem key={g.garron} value={g.garron.toString()}>
                        Garrón {g.garron} - Tropa {g.tropa?.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntercambio(false)}>
              Cancelar
            </Button>
            <Button onClick={intercambiarGarrones} disabled={!garronSelect1 || !garronSelect2}>
              Intercambiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cierre de romaneo */}
      <Dialog open={showCierre} onOpenChange={setShowCierre}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Romaneo del Día</DialogTitle>
            <DialogDescription>
              Esta acción finalizará el romaneo y actualizará los stocks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-stone-100 p-4 rounded-lg">
              <p className="text-center">
                ¿Está seguro de cerrar el romaneo del día?
              </p>
              <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-stone-500">Total</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{stats.completos}</p>
                  <p className="text-xs text-stone-500">Completos</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-600">{stats.parciales}</p>
                  <p className="text-xs text-stone-500">Parciales</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">{stats.pendientes}</p>
                  <p className="text-xs text-stone-500">Pendientes</p>
                </div>
              </div>
            </div>
            {!puedeCerrar && (
              <div className="bg-red-100 text-red-700 p-3 rounded text-sm">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                No se puede cerrar hasta completar todos los garrones
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCierre(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={cerrarRomaneo} 
              disabled={loading || !puedeCerrar}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Procesando...' : 'Confirmar Cierre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VBRomaneoModule
