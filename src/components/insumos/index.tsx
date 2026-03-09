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
  Loader2, Plus, Search, Trash, Package, AlertTriangle,
  Edit, TrendingDown, TrendingUp, Box
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Insumo {
  id: string
  codigo: string
  nombre: string
  tipo: string
  unidad: string
  stockActual: number
  stockMinimo: number
  pesoUnitario: number | null
  alertaStockBajo: boolean
  activo: boolean
}

interface Props {
  operador: Operador
}

const TIPOS_INSUMO = [
  { value: 'BOLSA', label: 'Bolsa' },
  { value: 'LAMINA', label: 'Lámina' },
  { value: 'CAJA', label: 'Caja' },
  { value: 'FAJA', label: 'Faja' },
  { value: 'ROTULO', label: 'Rótulo' },
  { value: 'OTRO', label: 'Otro' }
]

export function InsumosModule({ operador }: Props) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<{id: string; nombre: string; stockActual: number; stockMinimo: number}[]>([])
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'BOLSA',
    unidad: 'KG',
    stockActual: '',
    stockMinimo: '',
    pesoUnitario: ''
  })

  useEffect(() => {
    fetchInsumos()
  }, [filtroTipo])

  const fetchInsumos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroTipo !== 'todos') params.append('tipo', filtroTipo)
      
      const res = await fetch(`/api/insumos?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setInsumos(data.data)
        setAlertas(data.alertas || [])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar insumos')
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!formData.codigo || !formData.nombre) {
      toast.error('Complete código y nombre')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        ...formData,
        operadorId: operador.id
      }

      if (editando) {
        const res = await fetch('/api/insumos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editando.id, ...payload })
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Insumo actualizado')
          fetchInsumos()
        } else {
          toast.error(data.error || 'Error al actualizar')
        }
      } else {
        const res = await fetch('/api/insumos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Insumo creado')
          fetchInsumos()
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

  const handleEditar = (insumo: Insumo) => {
    setEditando(insumo)
    setFormData({
      codigo: insumo.codigo,
      nombre: insumo.nombre,
      tipo: insumo.tipo,
      unidad: insumo.unidad,
      stockActual: insumo.stockActual.toString(),
      stockMinimo: insumo.stockMinimo.toString(),
      pesoUnitario: insumo.pesoUnitario?.toString() || ''
    })
    setModalOpen(true)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este insumo?')) return
    
    try {
      const res = await fetch(`/api/insumos?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Insumo eliminado')
        fetchInsumos()
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleAjustarStock = async (insumo: Insumo, cantidad: number) => {
    try {
      const nuevoStock = insumo.stockActual + cantidad
      if (nuevoStock < 0) {
        toast.error('Stock insuficiente')
        return
      }
      
      const res = await fetch('/api/insumos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: insumo.id,
          stockActual: nuevoStock
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(cantidad > 0 ? 'Stock incrementado' : 'Stock decrementado')
        fetchInsumos()
      }
    } catch (error) {
      toast.error('Error al ajustar stock')
    }
  }

  const resetForm = () => {
    setEditando(null)
    setFormData({
      codigo: '',
      nombre: '',
      tipo: 'BOLSA',
      unidad: 'KG',
      stockActual: '',
      stockMinimo: '',
      pesoUnitario: ''
    })
  }

  const insumosFiltrados = insumos.filter(i => {
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        i.codigo.toLowerCase().includes(busquedaLower) ||
        i.nombre.toLowerCase().includes(busquedaLower)
      )
    }
    return true
  })

  const getTipoBadge = (tipo: string) => {
    const colores: Record<string, string> = {
      BOLSA: 'bg-blue-100 text-blue-700',
      LAMINA: 'bg-purple-100 text-purple-700',
      CAJA: 'bg-emerald-100 text-emerald-700',
      FAJA: 'bg-amber-100 text-amber-700',
      ROTULO: 'bg-pink-100 text-pink-700',
      OTRO: 'bg-gray-100 text-gray-700'
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
              <Box className="w-8 h-8 text-amber-500" />
              Insumos
            </h1>
            <p className="text-stone-500 mt-1">Gestión de insumos para empaque</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Insumo
          </Button>
        </div>

        {/* Alertas de stock bajo */}
        {alertas.length > 0 && (
          <Card className="border-0 shadow-md mb-6 border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Alertas de Stock Bajo</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {alertas.map(a => (
                  <Badge key={a.id} variant="outline" className="border-red-300 text-red-600">
                    {a.nombre}: {a.stockActual} / {a.stockMinimo}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {TIPOS_INSUMO.slice(0, 4).map(tipo => {
            const count = insumos.filter(i => i.tipo === tipo.value).length
            return (
              <Card key={tipo.value} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <Badge className={getTipoBadge(tipo.value)}>{tipo.label}</Badge>
                  <p className="text-2xl font-bold mt-2">{count}</p>
                  <p className="text-xs text-stone-500">insumos</p>
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
                    placeholder="Buscar por código o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {TIPOS_INSUMO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
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
            ) : insumosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay insumos registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Mínimo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase">Peso Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {insumosFiltrados.map((insumo) => (
                      <tr key={insumo.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium">{insumo.codigo}</span>
                        </td>
                        <td className="px-4 py-3">{insumo.nombre}</td>
                        <td className="px-4 py-3">
                          <Badge className={getTipoBadge(insumo.tipo)}>
                            {TIPOS_INSUMO.find(t => t.value === insumo.tipo)?.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAjustarStock(insumo, -1)}
                              className="h-6 w-6 p-0 text-red-500"
                            >
                              -
                            </Button>
                            <span className={`font-bold ${insumo.stockActual < insumo.stockMinimo ? 'text-red-500' : ''}`}>
                              {insumo.stockActual}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAjustarStock(insumo, 1)}
                              className="h-6 w-6 p-0 text-emerald-500"
                            >
                              +
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-stone-500">{insumo.stockMinimo}</td>
                        <td className="px-4 py-3 text-center">
                          {insumo.pesoUnitario ? `${insumo.pesoUnitario} ${insumo.unidad}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditar(insumo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEliminar(insumo.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash className="w-4 h-4" />
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
                {editando ? 'Editar Insumo' : 'Nuevo Insumo'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                    placeholder="BOL001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(v) => setFormData({...formData, tipo: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_INSUMO.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Bolsa vacía 10kg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Select 
                    value={formData.unidad} 
                    onValueChange={(v) => setFormData({...formData, unidad: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="UN">UN</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Peso Unitario</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.pesoUnitario}
                    onChange={(e) => setFormData({...formData, pesoUnitario: e.target.value})}
                    placeholder="0.000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stock Actual</Label>
                  <Input
                    type="number"
                    value={formData.stockActual}
                    onChange={(e) => setFormData({...formData, stockActual: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Mínimo</Label>
                  <Input
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({...formData, stockMinimo: e.target.value})}
                    placeholder="10"
                  />
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
