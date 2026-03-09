'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  FileText, Download, Search, Loader2, Calendar, Truck, User, Building2,
  Hash, ClipboardList, Printer, Eye
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Tropa {
  id: string
  numero: number
  codigo: string
  cantidadCabezas: number
  especie: string
  dte: string
  guia: string
  fechaRecepcion: string
  corral?: { nombre: string }
  productor?: { nombre: string; cuit: string }
  usuarioFaena: { nombre: string; cuit: string }
  pesajeCamion?: {
    patenteChasis: string
    patenteAcoplado?: string
    choferNombre?: string
    choferDni?: string
    transportista?: { nombre: string; cuit: string }
    precintos?: string
  }
  animales: Animal[]
}

interface Animal {
  id: string
  numero: number
  tipoAnimal: string
  caravana?: string
  pesoVivo?: number
  raza?: string
}

interface Props {
  operador: Operador
}

const TIPOS_ANIMAL_LABELS: Record<string, string> = {
  'TO': 'TORO',
  'VA': 'VACA',
  'VQ': 'VAQUILLONA',
  'MEJ': 'MEJ',
  'NO': 'NOVILLO',
  'NT': 'NOVILLITO',
}

export function Planilla01Module({ operador }: Props) {
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [tropaSeleccionada, setTropaSeleccionada] = useState<Tropa | null>(null)
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchTropas()
  }, [])

  const fetchTropas = async () => {
    try {
      const res = await fetch('/api/tropas?conAnimales=true')
      const data = await res.json()
      if (data.success) {
        setTropas(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar tropas')
    } finally {
      setLoading(false)
    }
  }

  const handleSeleccionarTropa = async (tropaId: string) => {
    try {
      const res = await fetch(`/api/tropas/${tropaId}?conAnimales=true`)
      const data = await res.json()
      if (data.success) {
        setTropaSeleccionada(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar tropa')
    }
  }

  const handleGenerarExcel = async () => {
    if (!tropaSeleccionada) return
    
    setGenerando(true)
    try {
      const res = await fetch('/api/planilla01', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tropaId: tropaSeleccionada.id })
      })
      
      if (!res.ok) throw new Error('Error al generar')
      
      // Descargar el archivo
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Planilla01_${tropaSeleccionada.codigo.replace(/\s/g, '_')}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Planilla generada correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar planilla')
    } finally {
      setGenerando(false)
    }
  }

  const handleImprimir = async () => {
    if (!tropaSeleccionada) return
    
    setGenerando(true)
    try {
      const res = await fetch('/api/planilla01', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tropaId: tropaSeleccionada.id })
      })
      
      if (!res.ok) throw new Error('Error al generar')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Abrir en nueva ventana para imprimir
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
      
      toast.success('Planilla abierta para impresión')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar planilla')
    } finally {
      setGenerando(false)
    }
  }

  const tropasFiltradas = tropas.filter(t => {
    if (!busqueda) return true
    const search = busqueda.toLowerCase()
    return (
      t.codigo.toLowerCase().includes(search) ||
      t.productor?.nombre?.toLowerCase().includes(search) ||
      t.usuarioFaena?.nombre?.toLowerCase().includes(search)
    )
  })

  const getTipoAnimalLabel = (tipo: string) => TIPOS_ANIMAL_LABELS[tipo] || tipo

  // Calcular semana del año
  const getSemana = (fecha: string) => {
    const d = new Date(fecha)
    const start = new Date(d.getFullYear(), 0, 1)
    const diff = d.getTime() - start.getTime()
    const oneWeek = 604800000
    return Math.ceil((diff + start.getDay() * 86400000) / oneWeek)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-amber-500" />
              Planilla 01 - Registro de Ingreso
            </h1>
            <p className="text-stone-500 mt-1">Planilla SENASA para registro de ingreso de hacienda</p>
          </div>
          {tropaSeleccionada && (
            <div className="flex gap-2">
              <Button 
                onClick={handleImprimir}
                disabled={generando}
                variant="outline"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button 
                onClick={handleGenerarExcel}
                disabled={generando}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {generando ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Descargar Excel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Tropas */}
          <Card className="border-0 shadow-md lg:col-span-1">
            <CardHeader className="bg-stone-50">
              <CardTitle className="text-lg">Seleccionar Tropa</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Buscar por código o productor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                </div>
              ) : tropasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  No hay tropas disponibles
                </div>
              ) : (
                <div className="divide-y">
                  {tropasFiltradas.map((tropa) => (
                    <button
                      key={tropa.id}
                      onClick={() => handleSeleccionarTropa(tropa.id)}
                      className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${
                        tropaSeleccionada?.id === tropa.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-stone-800">{tropa.codigo}</p>
                          <p className="text-sm text-stone-500">
                            {tropa.productor?.nombre || tropa.usuarioFaena?.nombre}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{tropa.cantidadCabezas} cabezas</Badge>
                          <p className="text-xs text-stone-400 mt-1">
                            {new Date(tropa.fechaRecepcion).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vista Previa de Planilla */}
          <Card className="border-0 shadow-md lg:col-span-2">
            <CardHeader className="bg-stone-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Vista Previa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!tropaSeleccionada ? (
                <div className="text-center py-12 text-stone-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Seleccione una tropa para ver la planilla</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Encabezado Planilla */}
                  <div className="border-2 border-stone-300 rounded-lg p-4 bg-white">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          <span className="font-semibold">Solemar Alimentaria S.A.</span>
                        </div>
                        <div className="text-stone-600">
                          <span className="font-medium">N° SENASA:</span> 3986
                        </div>
                        <div className="text-stone-600">
                          <span className="font-medium">Matrícula:</span> 300
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Badge className="bg-amber-100 text-amber-800 text-base px-4 py-1">
                          PLANILLA 01 - BOVINO
                        </Badge>
                        <div className="text-stone-600">
                          <span className="font-medium">Semana N°:</span> {getSemana(tropaSeleccionada.fechaRecepcion)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Datos de la Tropa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Productor */}
                    <div className="border rounded-lg p-4 bg-white space-y-2">
                      <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-500" />
                        Productor
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Nombre:</span> {tropaSeleccionada.productor?.nombre || '-'}</p>
                        <p><span className="font-medium">CUIT:</span> {tropaSeleccionada.productor?.cuit || '-'}</p>
                      </div>
                    </div>

                    {/* Usuario/Matarife */}
                    <div className="border rounded-lg p-4 bg-white space-y-2">
                      <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-500" />
                        Usuario/Matarife
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Nombre:</span> {tropaSeleccionada.usuarioFaena?.nombre || '-'}</p>
                        <p><span className="font-medium">CUIT:</span> {tropaSeleccionada.usuarioFaena?.cuit || '-'}</p>
                      </div>
                    </div>

                    {/* Transporte */}
                    <div className="border rounded-lg p-4 bg-white space-y-2">
                      <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-500" />
                        Transporte
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Transportista:</span> {tropaSeleccionada.pesajeCamion?.transportista?.nombre || '-'}</p>
                        <p><span className="font-medium">Chofer:</span> {tropaSeleccionada.pesajeCamion?.choferNombre || '-'}</p>
                        <p><span className="font-medium">DNI:</span> {tropaSeleccionada.pesajeCamion?.choferDni || '-'}</p>
                        <p><span className="font-medium">Patente Chasis:</span> {tropaSeleccionada.pesajeCamion?.patenteChasis || '-'}</p>
                        <p><span className="font-medium">Patente Acoplado:</span> {tropaSeleccionada.pesajeCamion?.patenteAcoplado || '-'}</p>
                      </div>
                    </div>

                    {/* Documentos */}
                    <div className="border rounded-lg p-4 bg-white space-y-2">
                      <h4 className="font-semibold text-stone-700 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-amber-500" />
                        Documentos
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">N° Tropa:</span> {tropaSeleccionada.codigo}</p>
                        <p><span className="font-medium">DTE:</span> {tropaSeleccionada.dte || '-'}</p>
                        <p><span className="font-medium">Guía:</span> {tropaSeleccionada.guia || '-'}</p>
                        <p><span className="font-medium">Precintos:</span> {tropaSeleccionada.pesajeCamion?.precintos || '-'}</p>
                        <p><span className="font-medium">Fecha:</span> {new Date(tropaSeleccionada.fechaRecepcion).toLocaleDateString('es-AR')}</p>
                        <p><span className="font-medium">Corral:</span> {tropaSeleccionada.corral?.nombre || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Animales */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="bg-stone-100 px-4 py-2 border-b">
                      <h4 className="font-semibold text-stone-700">Detalle de Animales ({tropaSeleccionada.animales?.length || 0})</h4>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50">
                          <TableHead className="w-16 text-center">N°</TableHead>
                          <TableHead className="text-center">Tipo</TableHead>
                          <TableHead>Raza</TableHead>
                          <TableHead>Caravana</TableHead>
                          <TableHead className="text-right">Peso (kg)</TableHead>
                          <TableHead className="text-center">Corral</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tropaSeleccionada.animales?.slice(0, 20).map((animal, idx) => (
                          <TableRow key={animal.id}>
                            <TableCell className="text-center font-medium">{animal.numero || idx + 1}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{getTipoAnimalLabel(animal.tipoAnimal)}</Badge>
                            </TableCell>
                            <TableCell>{animal.raza || '-'}</TableCell>
                            <TableCell className="font-mono text-sm">{animal.caravana || '-'}</TableCell>
                            <TableCell className="text-right">{animal.pesoVivo?.toFixed(0) || '-'}</TableCell>
                            <TableCell className="text-center">{tropaSeleccionada.corral?.nombre || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {tropaSeleccionada.animales?.length > 20 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-stone-500">
                              ... y {tropaSeleccionada.animales.length - 20} animales más
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Resumen por tipo */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Object.entries(
                      tropaSeleccionada.animales?.reduce((acc, a) => {
                        acc[a.tipoAnimal] = (acc[a.tipoAnimal] || 0) + 1
                        return acc
                      }, {} as Record<string, number>) || {}
                    ).map(([tipo, count]) => (
                      <div key={tipo} className="border rounded-lg p-2 text-center bg-white">
                        <Badge variant="outline" className="mb-1">{tipo}</Badge>
                        <p className="font-bold text-lg">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Planilla01Module
