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
  Loader2, Plus, Search, Scissors, Scale, ArrowRight,
  Edit, Calendar, TrendingDown, Package
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Cuarteo {
  id: string
  codigoMediaRes: string
  tropaCodigo: string | null
  garron: number | null
  lado: string
  pesoOriginal: number
  pesoAsado: number | null
  pesoDelantero: number | null
  pesoTrasero: number | null
  pesoTotal: number | null
  perdida: number | null
  fecha: string
}

interface MediaRes {
  id: string
  codigo: string
  peso: number
  estado: string
  romaneo: {
    garron: number
    tropaCodigo: string | null
  }
}

interface Props {
  operador: Operador
}

export function CuarteoModule({ operador }: Props) {
  const [cuarteos, setCuarteos] = useState<Cuarteo[]>([])
  const [mediasRes, setMediasRes] = useState<MediaRes[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pesoOriginal: 0,
    pesoAsado: 0,
    pesoDelantero: 0,
    pesoTrasero: 0,
    pesoTotal: 0,
    perdida: 0
  })
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    mediaResId: '',
    codigoMediaRes: '',
    tropaCodigo: '',
    garron: '',
    lado: '',
    pesoOriginal: '',
    pesoAsado: '',
    pesoDelantero: '',
    pesoTrasero: ''
  })

  useEffect(() => {
    fetchCuarteos()
    fetchMediasRes()
  }, [filtroFecha])

  const fetchCuarteos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroFecha) params.append('fecha', filtroFecha)
      
      const res = await fetch(`/api/cuarteo?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setCuarteos(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cuarteos')
    } finally {
      setLoading(false)
    }
  }

  const fetchMediasRes = async () => {
    try {
      const res = await fetch('/api/medias-res?estado=EN_CAMARA')
      const data = await res.json()
      if (data.success) {
        setMediasRes(data.data)
      }
    } catch (error) {
      console.error('Error fetching medias:', error)
    }
  }

  const handleSelectMedia = (mediaId: string) => {
    const media = mediasRes.find(m => m.id === mediaId)
    if (media) {
      setFormData({
        ...formData,
        mediaResId: media.id,
        codigoMediaRes: media.codigo,
        tropaCodigo: media.romaneo?.tropaCodigo || '',
        garron: media.romaneo?.garron?.toString() || '',
        lado: media.codigo.includes('DER') ? 'DERECHA' : 'IZQUIERDA',
        pesoOriginal: media.peso.toString()
      })
    }
  }

  const handleGuardar = async () => {
    if (!formData.mediaResId || !formData.pesoOriginal) {
      toast.error('Seleccione una media res')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        ...formData,
        operadorId: operador.id
      }

      const res = await fetch('/api/cuarteo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Cuarteo registrado correctamente')
        fetchCuarteos()
        fetchMediasRes()
        setModalOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Error al crear cuarteo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setGuardando(false)
    }
  }

  const resetForm = () => {
    setFormData({
      mediaResId: '',
      codigoMediaRes: '',
      tropaCodigo: '',
      garron: '',
      lado: '',
      pesoOriginal: '',
      pesoAsado: '',
      pesoDelantero: '',
      pesoTrasero: ''
    })
  }

  const cuarteosFiltrados = cuarteos.filter(c => {
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        c.codigoMediaRes?.toLowerCase().includes(busquedaLower) ||
        c.tropaCodigo?.toLowerCase().includes(busquedaLower) ||
        c.garron?.toString().includes(busquedaLower)
      )
    }
    return true
  })

  const calcularTotal = () => {
    const asado = parseFloat(formData.pesoAsado) || 0
    const delantero = parseFloat(formData.pesoDelantero) || 0
    const trasero = parseFloat(formData.pesoTrasero) || 0
    return asado + delantero + trasero
  }

  const calcularPerdida = () => {
    const original = parseFloat(formData.pesoOriginal) || 0
    return original - calcularTotal()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Scissors className="w-8 h-8 text-amber-500" />
              Cuarteo
            </h1>
            <p className="text-stone-500 mt-1">División de media res en 3 cuartos</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Cuarteo
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
                  <p className="text-xs text-stone-500">Total Cuarteos</p>
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
                  <p className="text-xs text-stone-500">Peso Original</p>
                  <p className="text-xl font-bold">{stats.pesoOriginal.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Peso Cuartos</p>
                  <p className="text-xl font-bold">{stats.pesoTotal.toFixed(1)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-500 p-2 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Pérdida</p>
                  <p className="text-xl font-bold">{stats.perdida.toFixed(1)} kg</p>
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
                    placeholder="Buscar por código, tropa o garrón..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-44"
              />
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
            ) : cuarteosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Scissors className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay cuarteos registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Tropa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Original</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Asado</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Delantero</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Trasero</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Pérdida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cuarteosFiltrados.map((cuarteo) => (
                      <tr key={cuarteo.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <span className="text-sm text-stone-600">
                            {new Date(cuarteo.fecha).toLocaleDateString('es-AR')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium text-stone-800">{cuarteo.codigoMediaRes}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {cuarteo.lado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-stone-600">{cuarteo.tropaCodigo || '-'}</span>
                          <span className="text-xs text-stone-400 ml-1">G{cuarteo.garron || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{cuarteo.pesoOriginal.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center">
                          {cuarteo.pesoAsado ? (
                            <Badge className="bg-emerald-100 text-emerald-700">{cuarteo.pesoAsado.toFixed(1)}</Badge>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {cuarteo.pesoDelantero ? (
                            <Badge className="bg-blue-100 text-blue-700">{cuarteo.pesoDelantero.toFixed(1)}</Badge>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {cuarteo.pesoTrasero ? (
                            <Badge className="bg-purple-100 text-purple-700">{cuarteo.pesoTrasero.toFixed(1)}</Badge>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-stone-800">
                          {cuarteo.pesoTotal?.toFixed(1) || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {cuarteo.perdida ? (
                            <span className={cuarteo.perdida > 0 ? 'text-red-500' : 'text-emerald-500'}>
                              {cuarteo.perdida.toFixed(1)}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Nuevo */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Cuarteo</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Selector de Media Res */}
              <div className="space-y-2">
                <Label>Media Res a Cuartear</Label>
                <Select onValueChange={handleSelectMedia}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una media res en cámara" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediasRes.length === 0 ? (
                      <SelectItem value="" disabled>No hay medias res disponibles</SelectItem>
                    ) : (
                      mediasRes.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.codigo} - {m.peso.toFixed(1)} kg (G{m.romaneo?.garron || '-'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.codigoMediaRes && (
                <>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-stone-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Código</p>
                      <p className="font-mono font-medium">{formData.codigoMediaRes}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Tropa</p>
                      <p className="font-mono">{formData.tropaCodigo || '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Peso Original</p>
                      <p className="font-bold text-lg">{formData.pesoOriginal} kg</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cuarto Asado (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.pesoAsado}
                        onChange={(e) => setFormData({...formData, pesoAsado: e.target.value})}
                        placeholder="0.0"
                        className="text-center font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cuarto Delantero (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.pesoDelantero}
                        onChange={(e) => setFormData({...formData, pesoDelantero: e.target.value})}
                        placeholder="0.0"
                        className="text-center font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cuarto Trasero (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.pesoTrasero}
                        onChange={(e) => setFormData({...formData, pesoTrasero: e.target.value})}
                        placeholder="0.0"
                        className="text-center font-bold"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Cuartos</p>
                      <p className="text-xl font-bold text-amber-700">{calcularTotal().toFixed(1)} kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Pérdida</p>
                      <p className={`text-xl font-bold ${calcularPerdida() > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {calcularPerdida().toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardar}
                disabled={guardando || !formData.mediaResId}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {guardando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Registrar Cuarteo'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
