'use client'

import { useState, useEffect } from 'react'
import {
  Receipt, Plus, Printer, Search, Eye, Trash2, Save, X,
  Loader2, FileText, User, Calendar, DollarSign, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Factura {
  id: string
  numero: string
  fecha: string
  cliente: { id: string; nombre: string; cuit?: string }
  subtotal: number
  iva: number
  total: number
  estado: string
  condicionVenta?: string
  remito?: string
  observaciones?: string
  detalles?: DetalleFactura[]
  vecesImpreso: number
}

interface DetalleFactura {
  id: string
  tipoProducto: string
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  subtotal: number
  tropaCodigo?: string
  garron?: number
  pesoKg?: number
}

interface Cliente {
  id: string
  nombre: string
  cuit?: string
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

const TIPOS_PRODUCTO = [
  { value: 'MEDIA_RES', label: 'Media Res' },
  { value: 'CUARTO_DELANTERO', label: 'Cuarto Delantero' },
  { value: 'CUARTO_TRASERO', label: 'Cuarto Trasero' },
  { value: 'MENUDENCIA', label: 'Menudencia' },
  { value: 'OTRO', label: 'Otro' },
]

const CONDICIONES_VENTA = [
  'Contado',
  'Cuenta Corriente',
  'Tarjeta Crédito',
  'Tarjeta Débito',
  'Transferencia'
]

export function FacturacionModule({ operador }: { operador: Operador }) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  const [formData, setFormData] = useState({
    clienteId: '',
    condicionVenta: '',
    remito: '',
    observaciones: '',
    detalles: [{
      tipoProducto: 'MEDIA_RES',
      descripcion: '',
      cantidad: 1,
      unidad: 'KG',
      precioUnitario: 0,
    }]
  })

  useEffect(() => {
    fetchFacturas()
    fetchClientes()
  }, [filtroEstado])

  const fetchFacturas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/facturacion?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setFacturas(data.data)
      }
    } catch (error) {
      console.error('Error fetching facturas:', error)
      toast.error('Error al cargar las facturas')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes?esUsuarioFaena=true')
      const data = await res.json()
      if (data.success) {
        setClientes(data.data)
      }
    } catch (error) {
      console.error('Error fetching clientes:', error)
    }
  }

  const handleNuevo = () => {
    setFormData({
      clienteId: '',
      condicionVenta: 'Contado',
      remito: '',
      observaciones: '',
      detalles: [{
        tipoProducto: 'MEDIA_RES',
        descripcion: '',
        cantidad: 1,
        unidad: 'KG',
        precioUnitario: 0,
      }]
    })
    setDialogOpen(true)
  }

  const handleVer = async (factura: Factura) => {
    try {
      const res = await fetch(`/api/facturacion?id=${factura.id}`)
      const data = await res.json()
      if (data.success) {
        setFacturaSeleccionada(data.data)
        setViewOpen(true)
      }
    } catch (error) {
      toast.error('Error al cargar los detalles')
    }
  }

  const handleEliminar = (factura: Factura) => {
    setFacturaSeleccionada(factura)
    setDeleteOpen(true)
  }

  const agregarDetalle = () => {
    setFormData({
      ...formData,
      detalles: [...formData.detalles, {
        tipoProducto: 'MEDIA_RES',
        descripcion: '',
        cantidad: 1,
        unidad: 'KG',
        precioUnitario: 0,
      }]
    })
  }

  const eliminarDetalle = (index: number) => {
    if (formData.detalles.length > 1) {
      const nuevos = formData.detalles.filter((_, i) => i !== index)
      setFormData({ ...formData, detalles: nuevos })
    }
  }

  const actualizarDetalle = (index: number, field: string, value: any) => {
    const nuevos = [...formData.detalles]
    nuevos[index] = { ...nuevos[index], [field]: value }
    setFormData({ ...formData, detalles: nuevos })
  }

  const calcularTotales = () => {
    const subtotal = formData.detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0)
    const iva = subtotal * 0.21 // IVA 21%
    return { subtotal, iva, total: subtotal + iva }
  }

  const handleGuardar = async () => {
    if (!formData.clienteId) {
      toast.error('Debe seleccionar un cliente')
      return
    }

    if (formData.detalles.some(d => !d.descripcion || d.precioUnitario <= 0)) {
      toast.error('Complete todos los detalles con precio válido')
      return
    }

    setSaving(true)
    try {
      const totales = calcularTotales()
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...totales,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Factura ${data.data.numero} creada exitosamente`)
        setDialogOpen(false)
        fetchFacturas()
      } else {
        toast.error(data.error || 'Error al crear la factura')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = async (factura: Factura) => {
    try {
      // Obtener detalles completos
      const res = await fetch(`/api/facturacion?id=${factura.id}`)
      const data = await res.json()
      if (data.success) {
        // Marcar como impreso
        await fetch('/api/facturacion', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: factura.id, marcarImpreso: true })
        })

        // Abrir ventana de impresión
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(generatePrintHTML(data.data))
          printWindow.document.close()
          printWindow.print()
        }

        toast.success('Factura enviada a impresión')
        fetchFacturas()
      }
    } catch (error) {
      toast.error('Error al imprimir')
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!facturaSeleccionada) return

    setSaving(true)
    try {
      const res = await fetch(`/api/facturacion?id=${facturaSeleccionada.id}&operadorId=${operador.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Factura anulada')
        setDeleteOpen(false)
        fetchFacturas()
      } else {
        toast.error(data.error || 'Error al anular')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, string> = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-700',
      'EMITIDA': 'bg-green-100 text-green-700',
      'PAGADA': 'bg-blue-100 text-blue-700',
      'ANULADA': 'bg-red-100 text-red-700'
    }
    return estilos[estado] || 'bg-gray-100 text-gray-700'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const generatePrintHTML = (factura: Factura) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura ${factura.numero}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; margin-bottom: 8px; }
          .label { font-weight: bold; width: 200px; color: #555; }
          .value { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .totals { margin-top: 20px; text-align: right; }
          .totals p { margin: 5px 0; }
          .total-row { font-size: 18px; font-weight: bold; }
          .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">FACTURA</div>
          <div class="subtitle">${factura.numero}</div>
        </div>

        <div class="section">
          <div class="section-title">DATOS DE LA FACTURA</div>
          <div class="row"><span class="label">Fecha:</span><span class="value">${new Date(factura.fecha).toLocaleDateString('es-AR')}</span></div>
          <div class="row"><span class="label">Cliente:</span><span class="value">${factura.cliente.nombre}</span></div>
          ${factura.cliente.cuit ? `<div class="row"><span class="label">CUIT:</span><span class="value">${factura.cliente.cuit}</span></div>` : ''}
          ${factura.condicionVenta ? `<div class="row"><span class="label">Condición:</span><span class="value">${factura.condicionVenta}</span></div>` : ''}
          ${factura.remito ? `<div class="row"><span class="label">Remito:</span><span class="value">${factura.remito}</span></div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">DETALLE</div>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>P. Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(factura.detalles || []).map(d => `
                <tr>
                  <td>${d.descripcion}</td>
                  <td>${d.cantidad} ${d.unidad}</td>
                  <td>${formatCurrency(d.precioUnitario)}</td>
                  <td>${formatCurrency(d.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <p>Subtotal: ${formatCurrency(factura.subtotal)}</p>
          <p>IVA (21%): ${formatCurrency(factura.iva)}</p>
          <p class="total-row">TOTAL: ${formatCurrency(factura.total)}</p>
        </div>

        <div class="footer">
          <p>Solemar Alimentaria - Frigorífico</p>
          <p>Documento generado el ${new Date().toLocaleString('es-AR')}</p>
        </div>
      </body>
      </html>
    `
  }

  const totales = calcularTotales()

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Facturación</h1>
          <p className="text-stone-500">Gestión de facturas - Solemar Alimentaria</p>
        </div>

        {/* Barra de herramientas */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-600" />
                  Facturas
                </CardTitle>
                <CardDescription>
                  Listado y gestión de facturas emitidas
                </CardDescription>
              </div>
              <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Buscar por número, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFacturas()}
                  className="pl-10"
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                  <SelectItem value="EMITIDA">Emitidas</SelectItem>
                  <SelectItem value="PAGADA">Pagadas</SelectItem>
                  <SelectItem value="ANULADA">Anuladas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchFacturas}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Facturas */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="mt-2 text-stone-500">Cargando facturas...</p>
              </div>
            ) : facturas.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay facturas registradas</p>
                <Button onClick={handleNuevo} variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera factura
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Factura</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturas.map((factura) => (
                      <TableRow key={factura.id}>
                        <TableCell className="font-mono font-medium">{factura.numero}</TableCell>
                        <TableCell>{new Date(factura.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{factura.cliente?.nombre || '-'}</TableCell>
                        <TableCell>{formatCurrency(factura.total)}</TableCell>
                        <TableCell>
                          <Badge className={getEstadoBadge(factura.estado)}>
                            {factura.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleVer(factura)} title="Ver detalles">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleImprimir(factura)} title="Imprimir" disabled={factura.estado === 'ANULADA'}>
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEliminar(factura)} title="Anular" className="text-red-500" disabled={factura.estado === 'ANULADA'}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Nueva Factura */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                Nueva Factura
              </DialogTitle>
              <DialogDescription>
                Complete los datos para generar una nueva factura
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Cliente y datos generales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={formData.clienteId} onValueChange={(v) => setFormData({ ...formData, clienteId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condición de Venta</Label>
                  <Select value={formData.condicionVenta} onValueChange={(v) => setFormData({ ...formData, condicionVenta: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDICIONES_VENTA.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Remito</Label>
                  <Input
                    value={formData.remito}
                    onChange={(e) => setFormData({ ...formData, remito: e.target.value })}
                    placeholder="N° de remito (opcional)"
                  />
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Detalles</Label>
                  <Button variant="outline" size="sm" onClick={agregarDetalle}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar línea
                  </Button>
                </div>

                {formData.detalles.map((detalle, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-stone-50 rounded-lg">
                    <div className="col-span-2">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={detalle.tipoProducto} onValueChange={(v) => actualizarDetalle(index, 'tipoProducto', v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PRODUCTO.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">Descripción</Label>
                      <Input
                        className="h-9"
                        value={detalle.descripcion}
                        onChange={(e) => actualizarDetalle(index, 'descripcion', e.target.value)}
                        placeholder="Descripción del producto"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        className="h-9"
                        value={detalle.cantidad}
                        onChange={(e) => actualizarDetalle(index, 'cantidad', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">P. Unitario</Label>
                      <Input
                        type="number"
                        className="h-9"
                        value={detalle.precioUnitario}
                        onChange={(e) => actualizarDetalle(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="h-9 px-2 flex items-center bg-stone-100 rounded text-sm">
                        {formatCurrency(detalle.cantidad * detalle.precioUnitario)}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500"
                        onClick={() => eliminarDetalle(index)}
                        disabled={formData.detalles.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Totales */}
                <div className="flex justify-end pt-4 border-t">
                  <div className="w-64 space-y-2 text-right">
                    <p className="text-sm">Subtotal: <span className="font-medium">{formatCurrency(totales.subtotal)}</span></p>
                    <p className="text-sm">IVA (21%): <span className="font-medium">{formatCurrency(totales.iva)}</span></p>
                    <p className="text-lg font-bold">Total: {formatCurrency(totales.total)}</p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Guardando...' : 'Crear Factura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Ver Detalles */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                Detalles de Factura
              </DialogTitle>
              <DialogDescription>
                {facturaSeleccionada?.numero}
              </DialogDescription>
            </DialogHeader>
            {facturaSeleccionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-500 text-xs">N° Factura</Label>
                    <p className="font-mono font-medium">{facturaSeleccionada.numero}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Fecha</Label>
                    <p>{new Date(facturaSeleccionada.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Cliente</Label>
                    <p>{facturaSeleccionada.cliente?.nombre}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Estado</Label>
                    <Badge className={getEstadoBadge(facturaSeleccionada.estado)}>
                      {facturaSeleccionada.estado}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-stone-700 mb-2">Detalle de Productos</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>P. Unitario</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(facturaSeleccionada.detalles || []).map((d, i) => (
                          <TableRow key={i}>
                            <TableCell>{d.descripcion}</TableCell>
                            <TableCell>{d.cantidad} {d.unidad}</TableCell>
                            <TableCell>{formatCurrency(d.precioUnitario)}</TableCell>
                            <TableCell>{formatCurrency(d.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="border-t pt-4 text-right space-y-1">
                  <p className="text-sm">Subtotal: <span className="font-medium">{formatCurrency(facturaSeleccionada.subtotal)}</span></p>
                  <p className="text-sm">IVA (21%): <span className="font-medium">{formatCurrency(facturaSeleccionada.iva)}</span></p>
                  <p className="text-lg font-bold">Total: {formatCurrency(facturaSeleccionada.total)}</p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setViewOpen(false)}>
                    Cerrar
                  </Button>
                  <Button onClick={() => { setViewOpen(false); handleImprimir(facturaSeleccionada); }} className="bg-amber-500 hover:bg-amber-600">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Eliminar/Anular */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Anular Factura</DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea anular la factura &quot;{facturaSeleccionada?.numero}&quot;?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmarEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
                {saving ? 'Anulando...' : 'Anular Factura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default FacturacionModule
