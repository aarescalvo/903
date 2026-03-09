'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// Módulos existentes
import { ConfiguracionModule } from '@/components/configuracion'
import { PesajeCamionesModule } from '@/components/pesaje-camiones-module'
import { PesajeIndividualModule } from '@/components/pesaje-individual-module'
import { MovimientoHaciendaModule } from '@/components/movimiento-hacienda-module'
import { ListaFaenaModule } from '@/components/lista-faena'
import { RomaneoModule } from '@/components/romaneo'
import { MenudenciasModule } from '@/components/menudencias'
import { IngresoCajonModule } from '@/components/ingreso-cajon'
import { StockCamarasModule } from '@/components/stock-camaras'
import { ReportesModule } from '@/components/reportes'
import { VBRomaneoModule } from '@/components/vb-romaneo'
import { ConfiguracionRotulosModule } from '@/components/configuracion-rotulos'
import { CuerosModule } from '@/components/cueros'
import { GrasaDressingModule } from '@/components/grasa-dressing'
import { CuarteoModule } from '@/components/cuarteo'
import { ExpedicionModule } from '@/components/expedicion'
import { RenderingModule } from '@/components/rendering'
import { InsumosModule } from '@/components/insumos'
import { IngresoDespostadaModule } from '@/components/ingreso-despostada'
import { MovimientoDespostadaModule } from '@/components/movimiento-despostada'
import { EmpaqueModule } from '@/components/empaque'
import { FacturacionModule } from '@/components/facturacion'
import { CCIRModule } from '@/components/cumplimiento-regulatorio/ccir'
import { AuditoriaModule } from '@/components/auditoria-module'
import { CumplimientoRegulatorioModule } from '@/components/cumplimiento-regulatorio'
import { Planilla01Module } from '@/components/planilla-01'
import { UsuariosFaenaModule } from '@/components/configuracion/usuarios-faena'

// Placeholder module
import { PlaceholderModule } from '@/components/placeholders/placeholder-module'

// Lucide icons
import { 
  Truck, Beef, Scale, ClipboardList, TrendingUp, Package, Tag, Scissors, 
  Warehouse, FileText, Settings, Calendar, LogOut, Lock, Users,
  Loader2, RefreshCw, BoxSelect, Droplets,
  Send, Recycle, Box, ArrowDownToLine, ArrowRightLeft, ChevronDown, ChevronRight,
  LayoutDashboard, Factory, Layers, Building2, Receipt, Barcode, Printer, 
  Scale as ScaleIcon, Monitor, Database, FileSearch, PieChart, ClipboardCheck,
  UserCheck, Trash2, Droplet, Layers2
} from 'lucide-react'

// Types
interface Operador {
  id: string
  nombre: string
  usuario: string
  rol: string
  email?: string
  permisos: {
    puedePesajeCamiones: boolean
    puedePesajeIndividual: boolean
    puedeMovimientoHacienda: boolean
    puedeListaFaena: boolean
    puedeRomaneo: boolean
    puedeIngresoCajon: boolean
    puedeMenudencias: boolean
    puedeStock: boolean
    puedeReportes: boolean
    puedeFacturacion: boolean
    puedeCCIR: boolean
    puedeConfiguracion: boolean
  }
}

interface Tropa {
  id: string
  numero: number
  codigo: string
  productor?: { nombre: string }
  usuarioFaena: { nombre: string }
  especie: string
  cantidadCabezas: number
  corralId?: string
  corral?: { nombre: string }
  estado: string
  fechaRecepcion: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
}

interface Stats {
  tropasActivas: number
  enPesaje: number
  pesajesHoy: number
  enCamara: number
}

// Todos los tipos de página
type Page = 
  // Independiente
  | 'pesajeCamiones'
  // CICLO I
  | 'pesajeIndividual' | 'movimientoHacienda' | 'listaFaena' | 'ingresoCajon' 
  | 'romaneo' | 'vbRomaneo' | 'expedicion'
  // CICLO II
  | 'cuarteo' | 'ingresoDespostada' | 'movimientoDespostada' | 'cortesDespostada' | 'empaque'
  // Subproductos - Consumo
  | 'menudencias' | 'cueros'
  // Subproductos - Rendering
  | 'grasaDressing' | 'desperdicios' | 'fondoDigestor'
  // Reportes
  | 'stocksCorrales' | 'stock' | 'planilla01' | 'rindesTropa' | 'busquedaFiltro' | 'reportesSenasa'
  // Administración
  | 'facturacion' | 'insumos' | 'stocksInsumos'
  // Configuración
  | 'configRotulos' | 'configInsumos' | 'configUsuarios' | 'codigoBarras' 
  | 'impresoras' | 'balanzas' | 'terminales' | 'operadores' | 'productos' 
  | 'subproductosConfig' | 'listadoInsumos' | 'condicionesEmbalaje' | 'tiposProducto'
  // Calidad
  | 'registroUsuarios' | 'auditoria' | 'configuracion'

type MenuId = 'ciclo1' | 'ciclo2' | 'subproductos' | 'consumo' | 'rendering' | 'reportes' | 'admin' | 'config' | 'calidad'

interface NavItem {
  id: Page
  label: string
  icon: typeof LayoutDashboard
  permiso?: string
}

interface SubMenu {
  id: MenuId
  label: string
  items: NavItem[]
}

interface MenuSection {
  id: MenuId
  label: string
  icon: typeof LayoutDashboard
  color: string
  items?: NavItem[]
  subMenus?: SubMenu[]
}

// Módulo independiente (sin agrupar)
const MODULO_INDEPENDIENTE: NavItem = { 
  id: 'pesajeCamiones', 
  label: 'Pesaje Camiones', 
  icon: Truck, 
  permiso: 'puedePesajeCamiones' 
}

// Definición completa del menú
const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'ciclo1',
    label: 'CICLO I',
    icon: Beef,
    color: 'text-amber-600',
    items: [
      { id: 'pesajeIndividual', label: 'Pesaje Individual', icon: Scale, permiso: 'puedePesajeIndividual' },
      { id: 'movimientoHacienda', label: 'Movimiento de Hacienda', icon: RefreshCw, permiso: 'puedeMovimientoHacienda' },
      { id: 'listaFaena', label: 'Lista de Faena', icon: ClipboardList, permiso: 'puedeListaFaena' },
      { id: 'ingresoCajon', label: 'Ingreso a Cajón', icon: BoxSelect, permiso: 'puedeIngresoCajon' },
      { id: 'romaneo', label: 'Romaneo', icon: Scissors, permiso: 'puedeRomaneo' },
      { id: 'vbRomaneo', label: 'VB Romaneo', icon: TrendingUp, permiso: 'puedeRomaneo' },
      { id: 'expedicion', label: 'Expedición', icon: Send, permiso: 'puedeFacturacion' },
    ]
  },
  {
    id: 'ciclo2',
    label: 'CICLO II',
    icon: Layers,
    color: 'text-emerald-600',
    items: [
      { id: 'cuarteo', label: 'Cuarteo', icon: Scissors, permiso: 'puedeStock' },
      { id: 'ingresoDespostada', label: 'Ingreso a Despostada', icon: ArrowDownToLine, permiso: 'puedeStock' },
      { id: 'movimientoDespostada', label: 'Movimientos de Despostada', icon: ArrowRightLeft, permiso: 'puedeStock' },
      { id: 'cortesDespostada', label: 'Cortes en Despostada', icon: Scissors, permiso: 'puedeStock' },
      { id: 'empaque', label: 'Empaque', icon: Box, permiso: 'puedeStock' },
    ]
  },
  {
    id: 'subproductos',
    label: 'Subproductos',
    icon: Recycle,
    color: 'text-purple-600',
    subMenus: [
      {
        id: 'consumo',
        label: 'Consumo',
        items: [
          { id: 'menudencias', label: 'Menudencias', icon: Package, permiso: 'puedeMenudencias' },
          { id: 'cueros', label: 'Cueros', icon: Package, permiso: 'puedeStock' },
        ]
      },
      {
        id: 'rendering',
        label: 'Rendering',
        items: [
          { id: 'grasaDressing', label: 'Grasa', icon: Droplet, permiso: 'puedeStock' },
          { id: 'desperdicios', label: 'Desperdicios', icon: Trash2, permiso: 'puedeStock' },
          { id: 'fondoDigestor', label: 'Fondo de Digestor', icon: Droplets, permiso: 'puedeStock' },
        ]
      }
    ]
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: FileText,
    color: 'text-blue-600',
    items: [
      { id: 'stocksCorrales', label: 'Stocks Corrales', icon: Warehouse, permiso: 'puedeReportes' },
      { id: 'stock', label: 'Stocks Cámaras', icon: Warehouse, permiso: 'puedeStock' },
      { id: 'planilla01', label: 'Planilla 01', icon: FileText, permiso: 'puedeReportes' },
      { id: 'rindesTropa', label: 'Rindes por Tropa', icon: PieChart, permiso: 'puedeReportes' },
      { id: 'busquedaFiltro', label: 'Búsqueda por Filtro', icon: FileSearch, permiso: 'puedeReportes' },
      { id: 'reportesSenasa', label: 'Reportes SENASA', icon: ClipboardCheck, permiso: 'puedeReportes' },
    ]
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: Building2,
    color: 'text-stone-600',
    items: [
      { id: 'facturacion', label: 'Facturación', icon: Receipt, permiso: 'puedeFacturacion' },
      { id: 'insumos', label: 'Insumos', icon: Box, permiso: 'puedeStock' },
      { id: 'stocksInsumos', label: 'Stocks de Insumos', icon: Package, permiso: 'puedeStock' },
    ]
  },
  {
    id: 'config',
    label: 'Configuración',
    icon: Settings,
    color: 'text-stone-500',
    items: [
      { id: 'configRotulos', label: 'Rótulos', icon: Tag, permiso: 'puedeConfiguracion' },
      { id: 'configInsumos', label: 'Insumos', icon: Box, permiso: 'puedeConfiguracion' },
      { id: 'configUsuarios', label: 'Usuarios', icon: Users, permiso: 'puedeConfiguracion' },
      { id: 'codigoBarras', label: 'Código de Barras', icon: Barcode, permiso: 'puedeConfiguracion' },
      { id: 'impresoras', label: 'Impresoras', icon: Printer, permiso: 'puedeConfiguracion' },
      { id: 'balanzas', label: 'Balanzas', icon: ScaleIcon, permiso: 'puedeConfiguracion' },
      { id: 'terminales', label: 'Terminales', icon: Monitor, permiso: 'puedeConfiguracion' },
      { id: 'operadores', label: 'Operadores', icon: Users, permiso: 'puedeConfiguracion' },
      { id: 'productos', label: 'Productos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'subproductosConfig', label: 'Subproductos', icon: Layers2, permiso: 'puedeConfiguracion' },
      { id: 'listadoInsumos', label: 'Listado de Insumos', icon: Database, permiso: 'puedeConfiguracion' },
      { id: 'condicionesEmbalaje', label: 'Condiciones de Embalaje', icon: Box, permiso: 'puedeConfiguracion' },
      { id: 'tiposProducto', label: 'Tipos de Producto', icon: Tag, permiso: 'puedeConfiguracion' },
    ]
  },
  {
    id: 'calidad',
    label: 'Calidad',
    icon: ClipboardCheck,
    color: 'text-teal-600',
    items: [
      { id: 'registroUsuarios', label: 'Registro de Usuarios', icon: UserCheck, permiso: 'puedeConfiguracion' },
      { id: 'auditoria', label: 'Auditoría', icon: FileText, permiso: 'puedeConfiguracion' },
    ]
  }
]

// Helper para obtener el icono de un módulo
const getModuleIcon = (pageId: Page): typeof LayoutDashboard => {
  for (const section of MENU_SECTIONS) {
    if (section.items) {
      const item = section.items.find(i => i.id === pageId)
      if (item) return item.icon
    }
    if (section.subMenus) {
      for (const sub of section.subMenus) {
        const item = sub.items.find(i => i.id === pageId)
        if (item) return item.icon
      }
    }
  }
  return LayoutDashboard
}

// Helper para obtener permiso de una página
const getPagePermiso = (pageId: Page): string | undefined => {
  for (const section of MENU_SECTIONS) {
    if (section.items) {
      const item = section.items.find(i => i.id === pageId)
      if (item?.permiso) return item.permiso
    }
    if (section.subMenus) {
      for (const sub of section.subMenus) {
        const item = sub.items.find(i => i.id === pageId)
        if (item?.permiso) return item.permiso
      }
    }
  }
  return undefined
}

export default function FrigorificoApp() {
  const [operador, setOperador] = useState<Operador | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('pesajeCamiones')
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [stats, setStats] = useState<Stats>({ tropasActivas: 0, enPesaje: 0, pesajesHoy: 0, enCamara: 0 })
  
  // Estado de menús desplegables
  const [expandedMenus, setExpandedMenus] = useState<MenuId[]>(['ciclo1', 'config'])
  
  // Login state
  const [loginTab, setLoginTab] = useState<'usuario' | 'pin'>('usuario')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // Check for existing session
  useEffect(() => {
    const savedOperador = localStorage.getItem('operador')
    if (savedOperador) {
      try {
        setOperador(JSON.parse(savedOperador))
      } catch {
        localStorage.removeItem('operador')
      }
    }
    setLoading(false)
  }, [])

  // Fetch data
  useEffect(() => {
    if (operador) {
      fetchTropas()
      fetchStats()
    }
  }, [operador])

  const fetchTropas = async () => {
    try {
      const res = await fetch('/api/tropas')
      const data = await res.json()
      if (data.success) {
        setTropas(data.data)
      }
    } catch (error) {
      console.error('Error fetching tropas:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)
    
    try {
      const body = loginTab === 'usuario' 
        ? { usuario, password }
        : { pin }
      
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setOperador(data.data)
        localStorage.setItem('operador', JSON.stringify(data.data))
        setUsuario('')
        setPassword('')
        setPin('')
      } else {
        setLoginError(data.error || 'Error de autenticación')
      }
    } catch {
      setLoginError('Error de conexión')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    if (operador) {
      try {
        await fetch('/api/auth', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operadorId: operador.id })
        })
      } catch {
        // Ignore logout errors
      }
    }
    setOperador(null)
    localStorage.removeItem('operador')
    setCurrentPage('pesajeCamiones')
  }

  // Check permission
  const canAccess = (permiso?: string): boolean => {
    if (!operador || !permiso) return true
    return operador.permisos[permiso as keyof typeof operador.permisos] === true
  }

  // Toggle menu expand/collapse
  const toggleMenu = (menuId: MenuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  // Get visible items in a section
  const getVisibleItems = (items: NavItem[]) => {
    return items.filter(item => canAccess(item.permiso))
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // Login screen
  if (!operador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="relative w-64 h-64 mx-auto mb-4">
              <Image 
                src="/logo.png" 
                alt="Solemar Alimentaria" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl">Solemar Alimentaria</CardTitle>
            <CardDescription>Sistema de Gestión Frigorífica</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginTab} onValueChange={(v) => setLoginTab(v as 'usuario' | 'pin')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="usuario">Usuario</TabsTrigger>
                <TabsTrigger value="pin">PIN</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleLogin} className="space-y-4">
                {loginTab === 'usuario' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="usuario">Usuario</Label>
                      <Input
                        id="usuario"
                        type="text"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        placeholder="Ingrese su usuario"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="text-center text-2xl tracking-widest h-14"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                )}
                
                {loginError && (
                  <p className="text-red-500 text-sm text-center">{loginError}</p>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600"
                  disabled={(loginTab === 'usuario' && (!usuario || !password)) || (loginTab === 'pin' && pin.length < 4) || loggingIn}
                >
                  {loggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Ingresar
                    </>
                  )}
                </Button>
              </form>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t text-center text-xs text-stone-400">
              <p>Credenciales de prueba:</p>
              <p>Usuario: <span className="font-mono">admin</span> / Password: <span className="font-mono">admin123</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render current page
  const renderPage = () => {
    const permisoNecesario = getPagePermiso(currentPage)
    if (permisoNecesario && !canAccess(permisoNecesario)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6 flex items-center justify-center">
          <Card className="border-0 shadow-md max-w-md">
            <CardContent className="p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium text-stone-800">Acceso Denegado</p>
              <p className="text-sm text-stone-500 mt-2">No tiene permisos para acceder a este módulo</p>
              <Button className="mt-4" onClick={() => setCurrentPage('pesajeCamiones')}>
                Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    const Icon = getModuleIcon(currentPage)

    switch (currentPage) {
      // Independiente
      case 'pesajeCamiones':
        return <PesajeCamionesModule operador={operador} onTropaCreada={fetchTropas} />
      
      // CICLO I
      case 'pesajeIndividual':
        return <PesajeIndividualModule operador={operador} />
      case 'movimientoHacienda':
        return <MovimientoHaciendaModule operador={operador} />
      case 'listaFaena':
        return <ListaFaenaModule operador={operador} />
      case 'ingresoCajon':
        return <IngresoCajonModule operador={operador} />
      case 'romaneo':
        return <RomaneoModule operador={operador} />
      case 'vbRomaneo':
        return <VBRomaneoModule operador={operador} />
      case 'expedicion':
        return <ExpedicionModule operador={operador} />
      
      // CICLO II
      case 'cuarteo':
        return <CuarteoModule operador={operador} />
      case 'ingresoDespostada':
        return <IngresoDespostadaModule operador={operador} />
      case 'movimientoDespostada':
        return <MovimientoDespostadaModule operador={operador} />
      case 'cortesDespostada':
        return <PlaceholderModule title="Cortes en Despostada" description="Gestión de cortes en despostada" icon={<Scissors className="w-16 h-16" />} />
      case 'empaque':
        return <EmpaqueModule operador={operador} />
      
      // Subproductos - Consumo
      case 'menudencias':
        return <MenudenciasModule operador={operador} />
      case 'cueros':
        return <CuerosModule operador={operador} />
      
      // Subproductos - Rendering (todos usan RenderingModule con filtros por tipo)
      case 'grasaDressing':
        return <RenderingModule operador={operador} />
      case 'desperdicios':
        return <RenderingModule operador={operador} />
      case 'fondoDigestor':
        return <RenderingModule operador={operador} />
      
      // Reportes
      case 'stocksCorrales':
        return <PlaceholderModule title="Stocks Corrales" description="Stock de animales en corrales" icon={<Warehouse className="w-16 h-16" />} />
      case 'stock':
        return <StockCamarasModule operador={operador} />
      case 'planilla01':
        return <Planilla01Module operador={operador} />
      case 'rindesTropa':
        return <PlaceholderModule title="Rindes por Tropa" description="Análisis de rindes" icon={<PieChart className="w-16 h-16" />} />
      case 'busquedaFiltro':
        return <PlaceholderModule title="Búsqueda por Filtro" description="Búsqueda avanzada" icon={<FileSearch className="w-16 h-16" />} />
      case 'reportesSenasa':
        return <CumplimientoRegulatorioModule operador={operador} />
      
      // Administración
      case 'facturacion':
        return <FacturacionModule operador={operador} />
      case 'insumos':
        return <InsumosModule operador={operador} />
      case 'stocksInsumos':
        return <PlaceholderModule title="Stocks de Insumos" description="Control de stock de insumos" icon={<Package className="w-16 h-16" />} />
      
      // Configuración
      case 'configRotulos':
        return <ConfiguracionRotulosModule />
      case 'configInsumos':
        return <PlaceholderModule title="Config. Insumos" description="Configuración de insumos" icon={<Box className="w-16 h-16" />} />
      case 'configUsuarios':
        return <UsuariosFaenaModule operador={operador} />
      case 'codigoBarras':
        return <PlaceholderModule title="Código de Barras" description="Configuración de códigos de barras" icon={<Barcode className="w-16 h-16" />} />
      case 'impresoras':
        return <PlaceholderModule title="Impresoras" description="Configuración de impresoras" icon={<Printer className="w-16 h-16" />} />
      case 'balanzas':
        return <PlaceholderModule title="Balanzas" description="Configuración de balanzas" icon={<ScaleIcon className="w-16 h-16" />} />
      case 'terminales':
        return <PlaceholderModule title="Terminales" description="Configuración de terminales" icon={<Monitor className="w-16 h-16" />} />
      // Configuración - Redirige al módulo principal
      // Nota: Operadores, Productos, Corrales, Cámaras, Clientes, Transportistas están dentro de ConfiguracionModule
      case 'operadores':
      case 'productos':
      case 'corrales':
      case 'camaras':
      case 'clientes':
      case 'transportistas':
      case 'tipificadores':
        return <ConfiguracionModule operador={operador} />
      case 'subproductosConfig':
        return <PlaceholderModule title="Subproductos" description="Configuración de subproductos" icon={<Layers2 className="w-16 h-16" />} />
      case 'listadoInsumos':
        return <PlaceholderModule title="Listado de Insumos" description="Lista de insumos disponibles" icon={<Database className="w-16 h-16" />} />
      case 'condicionesEmbalaje':
        return <PlaceholderModule title="Condiciones de Embalaje" description="Configuración de embalaje" icon={<Box className="w-16 h-16" />} />
      case 'tiposProducto':
        return <PlaceholderModule title="Tipos de Producto" description="Configuración de tipos" icon={<Tag className="w-16 h-16" />} />
      
      // Calidad
      case 'registroUsuarios':
        return <PlaceholderModule title="Registro de Usuarios" description="Registro de usuarios de calidad" icon={<UserCheck className="w-16 h-16" />} />
      case 'auditoria':
        return <AuditoriaModule />
      
      // Configuración general
      case 'configuracion':
        return <ConfiguracionModule operador={operador} />
      
      default:
        return <PesajeCamionesModule operador={operador} onTropaCreada={fetchTropas} />
    }
  }

  // Render menu item
  const renderMenuItem = (item: NavItem, depth: number = 0) => {
    const isActive = currentPage === item.id
    const visible = canAccess(item.permiso)
    if (!visible) return null
    
    return (
      <button
        key={item.id}
        onClick={() => setCurrentPage(item.id)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 w-full text-left
          ${depth > 0 ? 'ml-2 text-xs' : 'text-sm'}
          ${isActive 
            ? 'bg-amber-50 text-amber-700 font-medium shadow-sm' 
            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
          }
        `}
      >
        <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : ''}`} />
        <span>{item.label}</span>
      </button>
    )
  }

  // Render menu section
  const renderMenuSection = (section: MenuSection) => {
    // Check if section has visible items
    let hasVisibleItems = false
    if (section.items) {
      hasVisibleItems = section.items.some(item => canAccess(item.permiso))
    }
    if (section.subMenus) {
      hasVisibleItems = section.subMenus.some(sub => 
        sub.items.some(item => canAccess(item.permiso))
      )
    }
    if (!hasVisibleItems) return null

    const isExpanded = expandedMenus.includes(section.id)
    const hasActiveItem = (() => {
      if (section.items) {
        return section.items.some(item => currentPage === item.id)
      }
      if (section.subMenus) {
        return section.subMenus.some(sub => sub.items.some(item => currentPage === item.id))
      }
      return false
    })()

    return (
      <div key={section.id} className="mb-1">
        {/* Header de la sección */}
        <button
          onClick={() => toggleMenu(section.id)}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150
            ${hasActiveItem 
              ? 'bg-stone-100 text-stone-800' 
              : 'text-stone-600 hover:bg-stone-50'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <section.icon className={`w-4 h-4 ${section.color}`} />
            <span className="text-xs font-semibold uppercase tracking-wide">{section.label}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-stone-400" />
          )}
        </button>
        
        {/* Items de la sección */}
        {isExpanded && (
          <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-stone-200 pl-2">
            {section.items?.map(item => renderMenuItem(item))}
            
            {/* Submenús */}
            {section.subMenus?.map(subMenu => {
              const subHasVisible = subMenu.items.some(item => canAccess(item.permiso))
              if (!subHasVisible) return null
              
              const subIsExpanded = expandedMenus.includes(subMenu.id)
              const subHasActive = subMenu.items.some(item => currentPage === item.id)
              
              return (
                <div key={subMenu.id} className="mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMenu(subMenu.id)
                    }}
                    className={`
                      w-full flex items-center justify-between px-2 py-1.5 rounded transition-all duration-150
                      ${subHasActive 
                        ? 'bg-stone-50 text-stone-800' 
                        : 'text-stone-500 hover:bg-stone-50'
                      }
                    `}
                  >
                    <span className="text-xs font-medium">{subMenu.label}</span>
                    {subIsExpanded ? (
                      <ChevronDown className="w-3 h-3 text-stone-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-stone-400" />
                    )}
                  </button>
                  
                  {subIsExpanded && (
                    <div className="ml-2 mt-1 space-y-0.5 border-l border-stone-200 pl-2">
                      {subMenu.items.map(item => renderMenuItem(item, 1))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r flex flex-col shadow-lg">
        {/* Logo */}
        <div className="h-20 flex items-center gap-3 px-4 border-b bg-gradient-to-r from-amber-50 to-white">
          <div className="relative w-14 h-14 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Solemar Alimentaria" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-stone-800 text-sm leading-tight">Solemar</h1>
            <p className="text-xs text-amber-600 font-medium">Frigorífico</p>
          </div>
        </div>
        
        {/* Operator info */}
        <div className="p-3 border-b bg-stone-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-700">{operador.nombre}</p>
                <p className="text-xs text-stone-400">{operador.rol}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-stone-400 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {/* Módulo independiente: Pesaje de Camiones */}
          {canAccess(MODULO_INDEPENDIENTE.permiso) && (
            <button
              onClick={() => setCurrentPage(MODULO_INDEPENDIENTE.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 mb-2
                ${currentPage === MODULO_INDEPENDIENTE.id 
                  ? 'bg-amber-500 text-white font-medium shadow-md' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }
              `}
            >
              <MODULO_INDEPENDIENTE.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{MODULO_INDEPENDIENTE.label}</span>
            </button>
          )}
          
          {/* Separador */}
          <div className="border-t border-stone-200 my-2"></div>
          
          {/* Secciones del menú */}
          {MENU_SECTIONS.map(section => renderMenuSection(section))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t bg-stone-50">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Beef className="w-4 h-4 text-amber-500" />
            <span>Frigorífico Solemar</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        {renderPage()}
      </main>
    </div>
  )
}
