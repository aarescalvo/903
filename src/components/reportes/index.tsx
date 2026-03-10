'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, TrendingUp, Package, Calendar, Download, Filter, Printer, RefreshCw,
  FileSpreadsheet, Truck, ClipboardList, ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface FaenaDiaria {
  fecha: string
  totalAnimales: number
  totalMedias: number
  pesoTotal: number
}

interface Rendimiento {
  tropaCodigo: string
  productor?: { nombre: string }
  cantidad: number
  pesoVivoTotal: number
  pesoMediaTotal: number
  rinde: number
}

interface StockCamaras {
  camara: string
  tipo: string
  totalMedias: number
  pesoTotal: number
}

interface Operador {
  id: string
  nombre: string
  usuario?: string
  rol?: string
}

interface Tropa {
  id: string
  codigo: string
  productor?: { nombre: string; cuit?: string }
  usuarioFaena?: { nombre: string; cuit?: string }
  cantidadCabezas: number
  especie: string
  dte: string
  guia: string
  pesoNeto?: number
  fechaRecepcion: string
  corral?: { nombre: string }
  pesajeCamion?: {
    patenteChasis: string
    patenteAcoplado?: string
    transportista?: { nombre: string }
  }
}

interface Romaneo {
  id: string
  garron: number
  tropaCodigo?: string
  numeroAnimal?: number
  tipoAnimal?: string
  raza?: string
  pesoVivo?: number
  pesoMediaIzq?: number
  pesoMediaDer?: number
  pesoTotal?: number
  rinde?: number
  denticion?: string
  estado?: string
  tipificador?: { nombre: string; apellido: string }
  fecha: string
}

interface UsuarioFaena {
  id: string
  nombre: string
  cuit?: string
}

export function ReportesModule({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(false)
  const [faenaDiaria, setFaenaDiaria] = useState<FaenaDiaria[]>([])
  const [rendimientos, setRendimientos] = useState<Rendimiento[]>([])
  const [stockCamaras, setStockCamaras] = useState<StockCamaras[]>([])
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [romaneos, setRomaneos] = useState<Romaneo[]>([])
  const [usuariosFaena, setUsuariosFaena] = useState<UsuarioFaena[]>([])

  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroTropa, setFiltroTropa] = useState<string>('')
  const [filtroUsuarioFaena, setFiltroUsuarioFaena] = useState<string>('')
  const [selectedTropa, setSelectedTropa] = useState<Tropa | null>(null)
  const [activeTab, setActiveTab] = useState('planilla01')

  useEffect(() => {
    fetchData()
    fetchTropas()
    fetchUsuariosFaena()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fechaDesde) params.append('fechaDesde', fechaDesde)
      if (fechaHasta) params.append('fechaHasta', fechaHasta)
      if (filtroTipo !== 'todos') params.append('tipo', filtroTipo)

      const res = await fetch('/api/reportes?' + params.toString())
      const data = await res.json()

      if (data.success) {
        setFaenaDiaria(data.data.faenaDiaria || [])
        setRendimientos(data.data.rendimientos || [])
        setStockCamaras(data.data.stockCamaras || [])
      }
    } catch (error) {
      console.error('Error fetching reportes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTropas = async () => {
    try {
      const params = new URLSearchParams()
      params.append('limit', '100')
      if (filtroTipo !== 'todos') params.append('especie', filtroTipo.toUpperCase())
      if (filtroUsuarioFaena) params.append('usuarioFaenaId', filtroUsuarioFaena)

      const res = await fetch('/api/tropas?' + params.toString())
      const data = await res.json()
      setTropas(data.data || data || [])
    } catch (error) {
      console.error('Error fetching tropas:', error)
    }
  }

  const fetchUsuariosFaena = async () => {
    try {
      const res = await fetch('/api/clientes?esUsuarioFaena=true')
      const data = await res.json()
      const usuarios = Array.isArray(data) ? data : (data.data || [])
      setUsuariosFaena(usuarios.filter((c: UsuarioFaena & { esUsuarioFaena?: boolean }) => c.esUsuarioFaena !== false))
    } catch (error) {
      console.error('Error fetching usuarios faena:', error)
    }
  }

  const fetchRomaneosTropa = async (tropaCodigo: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('tropaCodigo', tropaCodigo)
      if (fechaDesde) params.append('fechaDesde', fechaDesde)
      if (fechaHasta) params.append('fechaHasta', fechaHasta)

      const res = await fetch('/api/reportes/faena?' + params.toString())
      const data = await res.json()

      if (data.success) {
        setRomaneos(data.data.romaneos || [])
      }
    } catch (error) {
      console.error('Error fetching romaneos:', error)
      toast.error('Error al cargar romaneos')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTropa = (tropa: Tropa) => {
    setSelectedTropa(tropa)
    fetchRomaneosTropa(tropa.codigo)
  }

  const exportarCSV = (tipo: string) => {
    let csvContent = ''

    if (tipo === 'faena') {
      csvContent = 'Fecha,Animales,Medias,Peso Total (kg)\n'
      faenaDiaria.forEach(d => {
        csvContent += `${new Date(d.fecha).toLocaleDateString('es-AR')},${d.totalAnimales},${d.totalMedias},${d.pesoTotal}\n`
      })
    } else if (tipo === 'rendimiento') {
      csvContent = 'Tropa,Productor,Cabezas,Peso Vivo (kg),Peso Media (kg),Rinde %\n'
      rendimientos.forEach(r => {
        csvContent += `${r.tropaCodigo},"${r.productor?.nombre || '-'}",${r.cantidad},${r.pesoVivoTotal},${r.pesoMediaTotal},${r.rinde.toFixed(1)}\n`
      })
    } else if (tipo === 'stock') {
      csvContent = 'Camara,Tipo,Medias,Peso (kg)\n'
      stockCamaras.forEach(s => {
        csvContent += `${s.camara},${s.tipo},${s.totalMedias},${s.pesoTotal}\n`
      })
    } else if (tipo === 'planilla01' && selectedTropa) {
      csvContent = generatePlanilla01CSV()
    } else if (tipo === 'romaneos') {
      csvContent = 'Garron,N Animal,Tropa,Tipo Animal,Raza,Peso Vivo,Media Izq,Media Der,Total,Rinde %,Denticion,Tipificador\n'
      romaneos.forEach(r => {
        csvContent += `${r.garron},${r.numeroAnimal || ''},${r.tropaCodigo || ''},${r.tipoAnimal || ''},${r.raza || ''},${r.pesoVivo || ''},${r.pesoMediaIzq || ''},${r.pesoMediaDer || ''},${r.pesoTotal || ''},${r.rinde?.toFixed(2) || ''},${r.denticion || ''},${r.tipificador ? `${r.tipificador.nombre} ${r.tipificador.apellido}` : ''}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('CSV descargado')
  }

  const generatePlanilla01CSV = () => {
    if (!selectedTropa) return ''

    let csv = 'PLANILLA 01 - BOVINO\n\n'
    csv += `Fecha de Entrada,${new Date(selectedTropa.fechaRecepcion).toLocaleDateString('es-AR')}\n`
    csv += `Tropa N,${selectedTropa.codigo}\n`
    csv += `Productor,${selectedTropa.productor?.nombre || '-'}\n`
    csv += `CUIT Productor,${selectedTropa.productor?.cuit || '-'}\n`
    csv += `Usuario de Faena,${selectedTropa.usuarioFaena?.nombre || '-'}\n`
    csv += `CUIT Usuario Faena,${selectedTropa.usuarioFaena?.cuit || '-'}\n`
    csv += `DTE,${selectedTropa.dte}\n`
    csv += `Guia,${selectedTropa.guia}\n`
    csv += `Cantidad Cabezas,${selectedTropa.cantidadCabezas}\n`
    csv += `Peso Neto (kg),${selectedTropa.pesoNeto || '-'}\n`
    csv += `Corral,${selectedTropa.corral?.nombre || '-'}\n`
    csv += `Patente Chasis,${selectedTropa.pesajeCamion?.patenteChasis || '-'}\n`
    csv += `Patente Acoplado,${selectedTropa.pesajeCamion?.patenteAcoplado || '-'}\n`
    csv += `Transportista,${selectedTropa.pesajeCamion?.transportista?.nombre || '-'}\n\n`
    csv += 'N,Tipo Animal,Raza,Peso Entrada,Nota\n'
    romaneos.forEach((r, i) => {
      csv += `${i + 1},${r.tipoAnimal || ''},${r.raza || ''},${r.pesoVivo || ''},\n`
    })

    return csv
  }

  const handleFilter = () => {
    fetchData()
    fetchTropas()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Reportes</h1>
            <p className="text-stone-500">Planilla 01, Romaneos de Faena y mas</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleFilter}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-stone-500">Desde</Label>
                  <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Hasta</Label>
                  <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Especie</Label>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="bovino">Bovinos</SelectItem>
                      <SelectItem value="equino">Equinos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Usuario Faena</Label>
                  <Select value={filtroUsuarioFaena || 'todos'} onValueChange={(v) => setFiltroUsuarioFaena(v === 'todos' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {usuariosFaena.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleFilter}>
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="planilla01">Planilla 01</TabsTrigger>
            <TabsTrigger value="romaneos">Romaneos</TabsTrigger>
            <TabsTrigger value="faena">Faena Diaria</TabsTrigger>
            <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>

          {/* Planilla 01 */}
          <TabsContent value="planilla01">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Lista tropas */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-stone-50 rounded-t-lg">
                  <CardTitle className="text-lg">Seleccionar Tropa</CardTitle>
                  <CardDescription>Clic para ver Planilla 01</CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {tropas.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay tropas</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {tropas.map(tropa => (
                        <div
                          key={tropa.id}
                          className={`p-3 cursor-pointer hover:bg-stone-50 transition-colors ${selectedTropa?.id === tropa.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''}`}
                          onClick={() => handleSelectTropa(tropa)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-medium">{tropa.codigo}</span>
                            <Badge variant="outline" className={tropa.especie === 'BOVINO' ? 'border-amber-500 text-amber-700' : 'border-purple-500 text-purple-700'}>
                              {tropa.especie === 'BOVINO' ? 'Bov' : 'Equ'}
                            </Badge>
                          </div>
                          <div className="text-sm text-stone-500 mt-1">
                            {tropa.productor?.nombre || tropa.usuarioFaena?.nombre || 'Sin datos'}
                          </div>
                          <div className="text-xs text-stone-400">
                            {tropa.cantidadCabezas} cabezas - {new Date(tropa.fechaRecepcion).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detalle Planilla 01 */}
              <Card className="border-0 shadow-md md:col-span-2">
                <CardHeader className="bg-stone-50 rounded-t-lg flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Planilla 01 - Bovino</CardTitle>
                    <CardDescription>Formulario de ingreso</CardDescription>
                  </div>
                  {selectedTropa && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => exportarCSV('planilla01')}>
                        <Download className="w-4 h-4 mr-1" /> CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-1" /> Imprimir
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  {!selectedTropa ? (
                    <div className="text-center py-12 text-stone-400">
                      <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Seleccione una tropa para ver la Planilla 01</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-stone-400">Fecha de Entrada</Label>
                          <p className="font-medium">{new Date(selectedTropa.fechaRecepcion).toLocaleDateString('es-AR')}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-stone-400">Tropa N</Label>
                          <p className="font-mono font-medium">{selectedTropa.codigo}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-stone-400">DTE</Label>
                          <p className="font-mono">{selectedTropa.dte}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-stone-400">Guia</Label>
                          <p className="font-mono">{selectedTropa.guia}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-stone-400">Cabezas</Label>
                          <p className="font-bold text-lg">{selectedTropa.cantidadCabezas}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-stone-400">Peso Neto (kg)</Label>
                          <p className="font-medium">{selectedTropa.pesoNeto?.toLocaleString('es-AR') || '-'}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-stone-50 rounded-lg">
                          <Label className="text-xs text-stone-400">Productor</Label>
                          <p className="font-medium">{selectedTropa.productor?.nombre || '-'}</p>
                          <p className="text-sm text-stone-500">{selectedTropa.productor?.cuit || ''}</p>
                        </div>
                        <div className="p-3 bg-stone-50 rounded-lg">
                          <Label className="text-xs text-stone-400">Usuario de Faena</Label>
                          <p className="font-medium">{selectedTropa.usuarioFaena?.nombre || '-'}</p>
                          <p className="text-sm text-stone-500">{selectedTropa.usuarioFaena?.cuit || ''}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-lg">
                        <Label className="text-xs text-stone-400">Transporte</Label>
                        <div className="grid grid-cols-3 gap-4 mt-1">
                          <div>
                            <span className="text-xs text-stone-400">Chasis:</span>
                            <p className="font-mono">{selectedTropa.pesajeCamion?.patenteChasis || '-'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-stone-400">Acoplado:</span>
                            <p className="font-mono">{selectedTropa.pesajeCamion?.patenteAcoplado || '-'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-stone-400">Transportista:</span>
                            <p>{selectedTropa.pesajeCamion?.transportista?.nombre || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {romaneos.length > 0 && (
                        <div>
                          <Label className="text-xs text-stone-400 mb-2 block">Detalle de Animales</Label>
                          <div className="max-h-48 overflow-y-auto border rounded-lg">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white">
                                <TableRow>
                                  <TableHead className="w-12">N</TableHead>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead>Raza</TableHead>
                                  <TableHead className="text-right">Peso (kg)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {romaneos.map((r, i) => (
                                  <TableRow key={r.id}>
                                    <TableCell className="font-mono">{r.numeroAnimal || i + 1}</TableCell>
                                    <TableCell>{r.tipoAnimal || '-'}</TableCell>
                                    <TableCell>{r.raza || '-'}</TableCell>
                                    <TableCell className="text-right">{r.pesoVivo?.toLocaleString('es-AR') || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Romaneos */}
          <TabsContent value="romaneos">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Romaneos de Faena</CardTitle>
                  <CardDescription>Detalle de pesaje de medias reses</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Filtrar tropa..."
                    value={filtroTropa}
                    onChange={(e) => setFiltroTropa(e.target.value)}
                    className="w-40"
                  />
                  <Button variant="outline" size="sm" onClick={() => exportarCSV('romaneos')}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {romaneos.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay romaneos</p>
                    <p className="text-sm mt-1">Seleccione una tropa en Planilla 01</p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                          <TableHead className="w-16">Garron</TableHead>
                          <TableHead>N Anim</TableHead>
                          <TableHead>Tropa</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Raza</TableHead>
                          <TableHead className="text-right">P. Vivo</TableHead>
                          <TableHead className="text-right">Media A</TableHead>
                          <TableHead className="text-right">Media B</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Rinde %</TableHead>
                          <TableHead>Dent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {romaneos
                          .filter(r => !filtroTropa || r.tropaCodigo?.toLowerCase().includes(filtroTropa.toLowerCase()))
                          .map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono font-bold">{r.garron}</TableCell>
                              <TableCell>{r.numeroAnimal || '-'}</TableCell>
                              <TableCell className="font-mono text-xs">{r.tropaCodigo || '-'}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{r.tipoAnimal || '-'}</Badge></TableCell>
                              <TableCell>{r.raza || '-'}</TableCell>
                              <TableCell className="text-right">{r.pesoVivo?.toLocaleString('es-AR') || '-'}</TableCell>
                              <TableCell className="text-right">{r.pesoMediaIzq?.toLocaleString('es-AR') || '-'}</TableCell>
                              <TableCell className="text-right">{r.pesoMediaDer?.toLocaleString('es-AR') || '-'}</TableCell>
                              <TableCell className="text-right font-medium">{r.pesoTotal?.toLocaleString('es-AR') || '-'}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={r.rinde && r.rinde >= 55 ? 'bg-green-100 text-green-700' : r.rinde && r.rinde >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                                  {r.rinde?.toFixed(1) || '-'}%
                                </Badge>
                              </TableCell>
                              <TableCell>{r.denticion || '-'}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Faena Diaria */}
          <TabsContent value="faena">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg flex flex-row items-center justify-between">
                <CardTitle>Reporte de Faena Diaria</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportarCSV('faena')}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {faenaDiaria.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay datos de faena</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Animales</TableHead>
                        <TableHead className="text-right">Medias</TableHead>
                        <TableHead className="text-right">Peso Total (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faenaDiaria.map((dia, i) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(dia.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="text-right font-bold">{dia.totalAnimales}</TableCell>
                          <TableCell className="text-right">{dia.totalMedias}</TableCell>
                          <TableCell className="text-right">{dia.pesoTotal.toLocaleString('es-AR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rendimiento */}
          <TabsContent value="rendimiento">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg flex flex-row items-center justify-between">
                <CardTitle>Rendimiento por Tropa</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportarCSV('rendimiento')}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {rendimientos.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay datos de rendimiento</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Productor</TableHead>
                        <TableHead className="text-right">Cabezas</TableHead>
                        <TableHead className="text-right">Peso Vivo (kg)</TableHead>
                        <TableHead className="text-right">Peso Media (kg)</TableHead>
                        <TableHead className="text-right">Rinde %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientos.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{r.tropaCodigo}</TableCell>
                          <TableCell>{r.productor?.nombre || '-'}</TableCell>
                          <TableCell className="text-right">{r.cantidad}</TableCell>
                          <TableCell className="text-right">{r.pesoVivoTotal.toLocaleString('es-AR')}</TableCell>
                          <TableCell className="text-right">{r.pesoMediaTotal.toLocaleString('es-AR')}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={r.rinde >= 55 ? 'bg-green-100 text-green-700' : r.rinde >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                              {r.rinde.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock */}
          <TabsContent value="stock">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg flex flex-row items-center justify-between">
                <CardTitle>Stock por Camara</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportarCSV('stock')}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {stockCamaras.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay datos de stock</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Camara</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Medias</TableHead>
                        <TableHead className="text-right">Peso (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockCamaras.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell>{s.camara}</TableCell>
                          <TableCell><Badge variant="outline">{s.tipo}</Badge></TableCell>
                          <TableCell className="text-right">{s.totalMedias}</TableCell>
                          <TableCell className="text-right">{s.pesoTotal.toLocaleString('es-AR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ReportesModule
