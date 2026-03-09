'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Save, X, AlertTriangle, Phone, MapPin, Mail, UserCheck, CreditCard, FileText, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

const CONDICIONES_FISCALES = [
  { id: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto' },
  { id: 'MONOTRIBUTO', label: 'Monotributo' },
  { id: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
  { id: 'EXENTO', label: 'Exento' },
]

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
]

interface Usuario {
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
  numeroMatricula?: string
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function UsuariosFaenaModule({ operador }: { operador: Operador }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
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
    numeroMatricula: ''
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/clientes?tipo=usuarioFaena')
      const data = await res.json()
      if (data.success) {
        setUsuarios(data.data)
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNuevo = () => {
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
      numeroMatricula: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (u: Usuario) => {
    setEditando(u)
    setShowFacturacion(!!(u.condicionFiscal || u.razonSocialFacturacion))
    setFormData({
      nombre: u.nombre,
      dni: u.dni || '',
      cuit: u.cuit || '',
      direccion: u.direccion || '',
      localidad: u.localidad || '',
      provincia: u.provincia || '',
      codigoPostal: u.codigoPostal || '',
      telefono: u.telefono || '',
      contactoAlternativo: u.contactoAlternativo || '',
      email: u.email || '',
      condicionFiscal: u.condicionFiscal || '',
      razonSocialFacturacion: u.razonSocialFacturacion || '',
      domicilioFacturacion: u.domicilioFacturacion || '',
      cuitFacturacion: u.cuitFacturacion || '',
      inicioActividades: u.inicioActividades ? u.inicioActividades.split('T')[0] : '',
      numeroMatricula: u.numeroMatricula || ''
    })
    setDialogOpen(true)
  }

  const handleEliminar = (u: Usuario) => {
    setEditando(u)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.nombre) {
      toast.error('Ingrese el nombre')
      return
    }

    setSaving(true)
    try {
      const body = {
        ...formData,
        esProductor: false,
        esUsuarioFaena: true,
        id: editando?.id
      }

      const res = await fetch('/api/clientes', {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(editando ? 'Usuario actualizado' : 'Usuario creado')
        setDialogOpen(false)
        fetchUsuarios()
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
      const res = await fetch(`/api/clientes?id=${editando.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Usuario eliminado')
        setDeleteOpen(false)
        fetchUsuarios()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Usuarios de Faena (Matarifes)
                </CardTitle>
                <CardDescription>
                  Personas que faenan con número de matrícula
                </CardDescription>
              </div>
              <Button onClick={handleNuevo} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 animate-pulse mx-auto text-blue-500" />
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay usuarios de faena registrados</p>
                <Button onClick={handleNuevo} variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Usuario
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>DNI/CUIT</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nombre}</TableCell>
                      <TableCell>
                        {u.numeroMatricula ? (
                          <Badge className="bg-blue-100 text-blue-700 font-mono">
                            {u.numeroMatricula}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {u.dni && <div>DNI: {u.dni}</div>}
                          {u.cuit && <div className="font-mono">CUIT: {u.cuit}</div>}
                          {!u.dni && !u.cuit && '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {u.telefono && <div>{u.telefono}</div>}
                          {u.email && <div className="text-stone-500 text-xs">{u.email}</div>}
                          {!u.telefono && !u.email && '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {u.localidad && <div>{u.localidad}</div>}
                          {u.provincia && <div className="text-stone-500">{u.provincia}</div>}
                          {!u.localidad && !u.provincia && '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditar(u)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEliminar(u)} className="text-red-500 hover:text-red-700" title="Eliminar">
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                {editando ? 'Editar Usuario de Faena' : 'Nuevo Usuario de Faena'}
              </DialogTitle>
              <DialogDescription>
                Complete los datos del matarife
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Datos básicos */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-stone-700">
                  <IdCard className="w-4 h-4" />
                  Datos Personales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nombre Completo *</Label>
                    <Input
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre del matarife"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de Matrícula *</Label>
                    <Input
                      value={formData.numeroMatricula}
                      onChange={(e) => setFormData({ ...formData, numeroMatricula: e.target.value })}
                      placeholder="Ej: 1234"
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={saving} className="bg-blue-500 hover:bg-blue-600">
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
                Eliminar Usuario
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
    </div>
  )
}

export default UsuariosFaenaModule
