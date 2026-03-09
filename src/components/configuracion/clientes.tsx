'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Save, X, AlertTriangle, Phone, MapPin, Mail, UserCheck, Beef, CreditCard, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

const CONDICIONES_FISCALES = [
  { id: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto' },
  { id: 'MONOTRIBUTO', label: 'Monotributo' },
  { id: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
  { id: 'EXENTO', label: 'Exento' },
  { id: 'RESPONSABLE_NO_INSCRIPTO', label: 'Responsable No Inscripto' },
]

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
]

interface ClienteItem {
  id: string
  nombre: string
  dni?: string
  cuit?: string
  direccion?: string
  localidad?: string
  provincia?: string
  codigoPostal?: string
  telefono?: string
  contactoAlternativo?: string
  email?: string
  condicionFiscal?: string
  razonSocialFacturacion?: string
  domicilioFacturacion?: string
  cuitFacturacion?: string
  inicioActividades?: string
  esProductor: boolean
  esUsuarioFaena: boolean
  numeroMatricula?: string
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function Clientes({ operador }: { operador: Operador }) {
  const [clientes, setClientes] = useState<ClienteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editando, setEditando] = useState<ClienteItem | null>(null)
  const [activeTab, setActiveTab] = useState('todos')
  const [showFacturacion, setShowFacturacion] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    cuit: '',
    direccion: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    telefono: '',
    contactoAlternativo: '',
    email: '',
    condicionFiscal: '',
    razonSocialFacturacion: '',
    domicilioFacturacion: '',
    cuitFacturacion: '',
    inicioActividades: '',
    esProductor: false,
    esUsuarioFaena: false,
    numeroMatricula: ''
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      if (data.success) {
        setClientes(data.data)
      }
    } catch (error) {
      console.error('Error fetching clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = (tipo?: 'productor' | 'usuarioFaena') => {
    setEditando(null)
    setShowFacturacion(false)
    setFormData({ 
      nombre: '', 
      dni: '',
      cuit: '', 
      direccion: '', 
      localidad: '',
      provincia: '',
      codigoPostal: '',
      telefono: '', 
      contactoAlternativo: '',
      email: '',
      condicionFiscal: '',
      razonSocialFacturacion: '',
      domicilioFacturacion: '',
      cuitFacturacion: '',
      inicioActividades: '',
      esProductor: tipo === 'productor',
      esUsuarioFaena: tipo === 'usuarioFaena',
      numeroMatricula: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (c: ClienteItem) => {
    setEditando(c)
    setShowFacturacion(!!(c.condicionFiscal || c.razonSocialFacturacion || c.domicilioFacturacion))
    setFormData({
      nombre: c.nombre,
      dni: c.dni || '',
      cuit: c.cuit || '',
      direccion: c.direccion || '',
      localidad: c.localidad || '',
      provincia: c.provincia || '',
      codigoPostal: c.codigoPostal || '',
      telefono: c.telefono || '',
      contactoAlternativo: c.contactoAlternativo || '',
      email: c.email || '',
      condicionFiscal: c.condicionFiscal || '',
      razonSocialFacturacion: c.razonSocialFacturacion || '',
      domicilioFacturacion: c.domicilioFacturacion || '',
      cuitFacturacion: c.cuitFacturacion || '',
      inicioActividades: c.inicioActividades ? c.inicioActividades.split('T')[0] : '',
      esProductor: c.esProductor,
      esUsuarioFaena: c.esUsuarioFaena,
      numeroMatricula: c.numeroMatricula || ''
    })
    setDialogOpen(true)
  }

  const handleEliminar = (c: ClienteItem) => {
    setEditando(c)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.nombre) {
      toast.error('Ingrese el nombre')
      return
    }

    if (!formData.esProductor && !formData.esUsuarioFaena) {
      toast.error('Seleccione al menos un tipo: Productor o Usuario de Faena')
      return
    }

    setSaving(true)
    try {
      const url = '/api/clientes'
      const method = editando ? 'PUT' : 'POST'
      const body = editando ? { ...formData, id: editando.id } : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editando ? 'Cliente actualizado' : 'Cliente creado')
        setDialogOpen(false)
        fetchClientes()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!editando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/clientes?id=${editando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Cliente eliminado')
        setDeleteOpen(false)
        fetchClientes()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const clientesFiltrados = clientes.filter(c => {
    if (activeTab === 'todos') return true
    if (activeTab === 'productores') return c.esProductor
    if (activeTab === 'usuarios') return c.esUsuarioFaena
    return true
  })

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Gestión de Productores y Usuarios de Faena
              </CardTitle>
              <CardDescription>
                Proveedores de hacienda y usuarios del servicio de faena
              </CardDescription>
            </div>
            <Button onClick={() => handleNuevo()} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tabs de filtro */}
          <div className="border-b px-4 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="todos">Todos ({clientes.length})</TabsTrigger>
                <TabsTrigger value="productores">
                  <Beef className="w-4 h-4 mr-1" />
                  Productores ({clientes.filter(c => c.esProductor).length})
                </TabsTrigger>
                <TabsTrigger value="usuarios">
                  <UserCheck className="w-4 h-4 mr-1" />
                  Usuarios Faena ({clientes.filter(c => c.esUsuarioFaena).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <Users className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay clientes registrados en esta categoría</p>
              <Button onClick={() => handleNuevo()} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cliente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI/CUIT</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div>
                        {c.nombre}
                        {c.numeroMatricula && (
                          <div className="text-xs text-stone-500">Mat. {c.numeroMatricula}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {c.dni && <div>DNI: {c.dni}</div>}
                        {c.cuit && <div className="font-mono">CUIT: {c.cuit}</div>}
                        {!c.dni && !c.cuit && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {c.localidad && <div>{c.localidad}</div>}
                        {c.provincia && <div className="text-stone-500">{c.provincia}</div>}
                        {!c.localidad && !c.provincia && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {c.telefono && <div>{c.telefono}</div>}
                        {c.contactoAlternativo && <div className="text-stone-500">{c.contactoAlternativo}</div>}
                        {c.email && <div className="text-stone-500 text-xs">{c.email}</div>}
                        {!c.telefono && !c.contactoAlternativo && !c.email && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.esProductor && (
                          <Badge className="bg-green-100 text-green-700">
                            <Beef className="w-3 h-3 mr-1" />
                            Productor
                          </Badge>
                        )}
                        {c.esUsuarioFaena && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Usuario Faena
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditar(c)} title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEliminar(c)} className="text-red-500 hover:text-red-700" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
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

      {/* Dialog Nuevo/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Datos básicos */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-stone-700">
                <Users className="w-4 h-4" />
                Datos Personales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre / Razón Social *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>DNI</Label>
                  <Input
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CUIT</Label>
                  <Input
                    value={formData.cuit}
                    onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-stone-700">
                <MapPin className="w-4 h-4" />
                Dirección
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Dirección</Label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle y número"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Localidad</Label>
                  <Input
                    value={formData.localidad}
                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                    placeholder="Ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Select value={formData.provincia} onValueChange={(v) => setFormData({ ...formData, provincia: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCIAS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Código Postal</Label>
                  <Input
                    value={formData.codigoPostal}
                    onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                    placeholder="CP"
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-stone-700">
                <Phone className="w-4 h-4" />
                Contacto
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono Principal</Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="011-1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contacto Alternativo</Label>
                  <Input
                    value={formData.contactoAlternativo}
                    onChange={(e) => setFormData({ ...formData, contactoAlternativo: e.target.value })}
                    placeholder="Otro teléfono"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Datos de Facturación */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowFacturacion(!showFacturacion)}
                className="flex items-center gap-2 text-stone-700 font-medium w-full text-left"
              >
                <CreditCard className="w-4 h-4" />
                Datos de Facturación
                <Badge variant="outline" className="text-xs">Opcional</Badge>
                <span className="ml-auto text-xs text-stone-400">
                  {showFacturacion ? 'Ocultar' : 'Mostrar'}
                </span>
              </button>
              
              {showFacturacion && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Condición Fiscal</Label>
                    <Select value={formData.condicionFiscal} onValueChange={(v) => setFormData({ ...formData, condicionFiscal: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDICIONES_FISCALES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Inicio de Actividades</Label>
                    <Input
                      type="date"
                      value={formData.inicioActividades}
                      onChange={(e) => setFormData({ ...formData, inicioActividades: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Razón Social para Facturación</Label>
                    <Input
                      value={formData.razonSocialFacturacion}
                      onChange={(e) => setFormData({ ...formData, razonSocialFacturacion: e.target.value })}
                      placeholder="Si es diferente al nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CUIT para Facturación</Label>
                    <Input
                      value={formData.cuitFacturacion}
                      onChange={(e) => setFormData({ ...formData, cuitFacturacion: e.target.value })}
                      placeholder="Si es diferente al CUIT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Domicilio para Facturación</Label>
                    <Input
                      value={formData.domicilioFacturacion}
                      onChange={(e) => setFormData({ ...formData, domicilioFacturacion: e.target.value })}
                      placeholder="Si es diferente a la dirección"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de Cliente */}
            <div className="space-y-4 pt-2 border-t">
              <h4 className="font-medium flex items-center gap-2 text-stone-700">
                <FileText className="w-4 h-4" />
                Tipo de Cliente *
              </h4>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-stone-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.esProductor}
                    onChange={(e) => setFormData({ ...formData, esProductor: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <Beef className="w-4 h-4 text-green-600" />
                      Productor
                    </div>
                    <p className="text-xs text-stone-500">Proveedor de hacienda</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-stone-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.esUsuarioFaena}
                    onChange={(e) => setFormData({ ...formData, esUsuarioFaena: e.target.checked })}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Usuario de Faena (Matarife)
                    </div>
                    <p className="text-xs text-stone-500">Cliente del servicio de faena</p>
                  </div>
                </label>
                {formData.esUsuarioFaena && (
                  <div className="ml-8 space-y-2">
                    <Label>Número de Matrícula</Label>
                    <Input
                      value={formData.numeroMatricula}
                      onChange={(e) => setFormData({ ...formData, numeroMatricula: e.target.value })}
                      placeholder="N° de matrícula del matarife"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Cliente
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar a &quot;{editando?.nombre}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Clientes
