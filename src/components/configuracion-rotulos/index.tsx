'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, Printer, Plus, Edit, Trash2, Save, X, Eye, 
  Settings, Code, Type, Ruler, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ConfiguracionRotulo {
  id?: string
  tipo: string
  nombre: string
  ancho: number
  alto: number
  campos: string[]
  incluyeCodigoBarras: boolean
  codigoBarrasTipo: string
  codigoBarrasPosicion?: string
  orientacion: string
  margenes?: { top: number; right: number; bottom: number; left: number }
  plantilla?: string
  activo: boolean
}

const TIPOS_ROTULO = [
  { value: 'ANIMAL_EN_PIE', label: 'Animal en Pie', descripcion: 'Rótulo para identificación de animal vivo' },
  { value: 'MEDIA_RES', label: 'Media Res', descripcion: 'Rótulo para media res en cámara' },
  { value: 'PRODUCTO', label: 'Producto', descripcion: 'Rótulo para producto terminado' },
  { value: 'SUBPRODUCTO', label: 'Subproducto', descripcion: 'Rótulo para menudencias y subproductos' },
  { value: 'CAJA', label: 'Caja', descripcion: 'Rótulo para cajas/empaques' }
]

const CAMPOS_DISPONIBLES = [
  { value: 'tropaCodigo', label: 'Código Tropa' },
  { value: 'garron', label: 'Garrón' },
  { value: 'lado', label: 'Lado' },
  { value: 'peso', label: 'Peso' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'especie', label: 'Especie' },
  { value: 'tipificador', label: 'Tipificador' },
  { value: 'camara', label: 'Cámara' },
  { value: 'productor', label: 'Productor' },
  { value: 'usuarioFaena', label: 'Usuario Faena' },
  { value: 'denticion', label: 'Denticción' },
  { value: 'codigoBarras', label: 'Código de Barras' },
  { value: 'numeroAnimal', label: 'N° Animal' },
  { value: 'tipoAnimal', label: 'Tipo Animal' },
  { value: 'raza', label: 'Raza' },
  { value: 'codigoArticulo', label: 'Código Artículo' },
  { value: 'nombreProducto', label: 'Nombre Producto' },
  { value: 'numeroBolsa', label: 'N° Bolsa' },
  { value: 'lote', label: 'Lote' },
  { value: 'vencimiento', label: 'Vencimiento' }
]

const TIPOS_CODIGO_BARRAS = [
  { value: 'CODE128', label: 'Code 128 (Alfanumérico)' },
  { value: 'EAN13', label: 'EAN-13 (Numérico 13 dígitos)' },
  { value: 'EAN8', label: 'EAN-8 (Numérico 8 dígitos)' },
  { value: 'QR', label: 'QR Code' },
  { value: 'UPC', label: 'UPC-A' }
]

export function ConfiguracionRotulosModule() {
  const [rotulos, setRotulos] = useState<ConfiguracionRotulo[]>([])
  const [loading, setLoading] = useState(false)
  const [editando, setEditando] = useState<ConfiguracionRotulo | null>(null)
  const [nuevo, setNuevo] = useState<ConfiguracionRotulo | null>(null)

  useEffect(() => {
    cargarRotulos()
  }, [])

  const cargarRotulos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/configuracion-rotulos')
      const data = await res.json()
      if (data.success) {
        setRotulos(data.data)
      }
    } catch (error) {
      console.error('Error cargando rótulos:', error)
    } finally {
      setLoading(false)
    }
  }

  const guardarRotulo = async (rotulo: ConfiguracionRotulo) => {
    setLoading(true)
    try {
      const method = rotulo.id ? 'PUT' : 'POST'
      const body = rotulo.id 
        ? { id: rotulo.id, ...rotulo }
        : rotulo

      const res = await fetch('/api/configuracion-rotulos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(rotulo.id ? 'Rótulo actualizado' : 'Rótulo creado')
        setEditando(null)
        setNuevo(null)
        cargarRotulos()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const eliminarRotulo = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este rótulo?')) return

    try {
      const res = await fetch(`/api/configuracion-rotulos?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Rótulo eliminado')
        cargarRotulos()
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const iniciarNuevo = (tipo: string) => {
    const tipoInfo = TIPOS_ROTULO.find(t => t.value === tipo)
    setNuevo({
      tipo,
      nombre: tipoInfo?.label || tipo,
      ancho: 100,
      alto: 50,
      campos: ['codigoBarras', 'tropaCodigo', 'garron', 'peso', 'fecha'],
      incluyeCodigoBarras: true,
      codigoBarrasTipo: 'CODE128',
      codigoBarrasPosicion: 'BOTTOM',
      orientacion: 'HORIZONTAL',
      activo: true
    })
  }

  const toggleCampo = (campo: string) => {
    const target = editando || nuevo
    if (!target) return

    const campos = target.campos || []
    const nuevosCampos = campos.includes(campo)
      ? campos.filter(c => c !== campo)
      : [...campos, campo]

    if (editando) {
      setEditando({ ...editando, campos: nuevosCampos })
    } else if (nuevo) {
      setNuevo({ ...nuevo, campos: nuevosCampos })
    }
  }

  const getRotuloPorTipo = (tipo: string) => {
    return rotulos.find(r => r.tipo === tipo)
  }

  const renderEditor = (rotulo: ConfiguracionRotulo, esNuevo: boolean = false) => (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {esNuevo ? `Nuevo: ${TIPOS_ROTULO.find(t => t.value === rotulo.tipo)?.label}` : `Editando: ${rotulo.nombre}`}
          <Button variant="ghost" size="sm" onClick={() => {
            setEditando(null)
            setNuevo(null)
          }}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dimensiones */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Nombre</Label>
            <Input 
              value={rotulo.nombre}
              onChange={(e) => {
                if (editando) setEditando({ ...editando, nombre: e.target.value })
                else if (nuevo) setNuevo({ ...nuevo, nombre: e.target.value })
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Ancho (mm)</Label>
              <Input 
                type="number"
                value={rotulo.ancho}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 100
                  if (editando) setEditando({ ...editando, ancho: val })
                  else if (nuevo) setNuevo({ ...nuevo, ancho: val })
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Alto (mm)</Label>
              <Input 
                type="number"
                value={rotulo.alto}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 50
                  if (editando) setEditando({ ...editando, alto: val })
                  else if (nuevo) setNuevo({ ...nuevo, alto: val })
                }}
              />
            </div>
          </div>
        </div>

        {/* Código de barras */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rotulo.incluyeCodigoBarras}
              onChange={(e) => {
                if (editando) setEditando({ ...editando, incluyeCodigoBarras: e.target.checked })
                else if (nuevo) setNuevo({ ...nuevo, incluyeCodigoBarras: e.target.checked })
              }}
              className="w-4 h-4"
            />
            <Label className="text-xs">Incluir código de barras</Label>
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select 
              value={rotulo.codigoBarrasTipo}
              onValueChange={(v) => {
                if (editando) setEditando({ ...editando, codigoBarrasTipo: v })
                else if (nuevo) setNuevo({ ...nuevo, codigoBarrasTipo: v })
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_CODIGO_BARRAS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Posición</Label>
            <Select 
              value={rotulo.codigoBarrasPosicion || 'BOTTOM'}
              onValueChange={(v) => {
                if (editando) setEditando({ ...editando, codigoBarrasPosicion: v })
                else if (nuevo) setNuevo({ ...nuevo, codigoBarrasPosicion: v })
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOP">Arriba</SelectItem>
                <SelectItem value="BOTTOM">Abajo</SelectItem>
                <SelectItem value="LEFT">Izquierda</SelectItem>
                <SelectItem value="RIGHT">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Campos a mostrar */}
        <div>
          <Label className="text-xs mb-2 block">Campos a incluir en el rótulo</Label>
          <div className="flex flex-wrap gap-2">
            {CAMPOS_DISPONIBLES.map(campo => (
              <Badge
                key={campo.value}
                variant={rotulo.campos?.includes(campo.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleCampo(campo.value)}
              >
                {campo.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Orientación */}
        <div className="flex items-center gap-4">
          <Label className="text-xs">Orientación:</Label>
          <div className="flex gap-2">
            {['HORIZONTAL', 'VERTICAL'].map(o => (
              <Button
                key={o}
                variant={rotulo.orientacion === o ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (editando) setEditando({ ...editando, orientacion: o })
                  else if (nuevo) setNuevo({ ...nuevo, orientacion: o })
                }}
              >
                {o === 'HORIZONTAL' ? 'Horizontal' : 'Vertical'}
              </Button>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button onClick={() => guardarRotulo(rotulo)} disabled={loading}>
            <Save className="w-4 h-4 mr-1" />
            Guardar
          </Button>
          <Button variant="outline" onClick={() => {
            setEditando(null)
            setNuevo(null)
          }}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Configuración de Rótulos</h1>
            <p className="text-stone-500 text-sm">Configure el diseño y contenido de cada tipo de rótulo</p>
          </div>
          <Button variant="outline" size="sm" onClick={cargarRotulos}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
        </div>

        {/* Editor activo */}
        {(editando || nuevo) && renderEditor(editando || nuevo!, !!nuevo)}

        {/* Lista de rótulos por tipo */}
        <div className="grid md:grid-cols-2 gap-4">
          {TIPOS_ROTULO.map(tipo => {
            const rotuloExistente = getRotuloPorTipo(tipo.value)
            
            return (
              <Card key={tipo.value} className="border-0 shadow-md">
                <CardHeader className="bg-stone-100 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{tipo.label}</CardTitle>
                      <CardDescription>{tipo.descripcion}</CardDescription>
                    </div>
                    {rotuloExistente ? (
                      <Badge className="bg-green-100 text-green-700">Configurado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-stone-500">Sin configurar</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {rotuloExistente ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-stone-500">Dimensiones:</span>
                          <span className="font-medium ml-1">{rotuloExistente.ancho}x{rotuloExistente.alto}mm</span>
                        </div>
                        <div>
                          <span className="text-stone-500">Código:</span>
                          <span className="font-medium ml-1">{rotuloExistente.codigoBarrasTipo}</span>
                        </div>
                        <div>
                          <span className="text-stone-500">Orientación:</span>
                          <span className="font-medium ml-1">{rotuloExistente.orientacion}</span>
                        </div>
                        <div>
                          <span className="text-stone-500">Campos:</span>
                          <span className="font-medium ml-1">{rotuloExistente.campos?.length || 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rotuloExistente.campos?.slice(0, 5).map(c => (
                          <Badge key={c} variant="outline" className="text-xs">
                            {CAMPOS_DISPONIBLES.find(cd => cd.value === c)?.label || c}
                          </Badge>
                        ))}
                        {(rotuloExistente.campos?.length || 0) > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{(rotuloExistente.campos?.length || 0) - 5} más
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => setEditando(rotuloExistente)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => eliminarRotulo(rotuloExistente.id!)}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                      <p className="text-sm text-stone-500 mb-3">No configurado</p>
                      <Button size="sm" onClick={() => iniciarNuevo(tipo.value)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Configurar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Vista previa */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-800 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vista Previa de Rótulos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {TIPOS_ROTULO.slice(0, 3).map(tipo => {
                const rotulo = getRotuloPorTipo(tipo.value)
                return (
                  <div 
                    key={tipo.value}
                    className="border-2 border-dashed border-stone-300 rounded-lg p-4 flex flex-col items-center"
                    style={{
                      width: rotulo ? `${Math.min(rotulo.ancho / 2, 200)}px` : '150px',
                      minHeight: rotulo ? `${Math.min(rotulo.alto / 2, 100)}px` : '80px'
                    }}
                  >
                    <p className="text-xs text-stone-400 mb-2">{tipo.label}</p>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-full h-8 bg-stone-200 rounded mb-1 flex items-center justify-center">
                        <Code className="w-4 h-4 text-stone-400" />
                      </div>
                      <p className="text-xs text-stone-500 truncate">
                        {rotulo?.campos?.slice(0, 3).join(' | ') || 'Sin configurar'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-stone-400 mt-4 text-center">
              * Vista previa simplificada. El tamaño real se ajusta según las dimensiones configuradas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ConfiguracionRotulosModule
