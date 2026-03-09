import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar ingresos a despostada
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoProducto = searchParams.get('tipoProducto')
    const fecha = searchParams.get('fecha')

    const where: Record<string, unknown> = {}
    
    if (tipoProducto) where.tipoProducto = tipoProducto
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fecha = { gte: fechaInicio, lte: fechaFin }
    }

    const ingresos = await db.ingresoDespostada.findMany({
      where,
      orderBy: { fecha: 'desc' }
    })

    // Agrupar por fecha
    const porFecha = ingresos.reduce((acc, ingreso) => {
      const fecha = ingreso.fecha.toISOString().split('T')[0]
      if (!acc[fecha]) acc[fecha] = []
      acc[fecha].push(ingreso)
      return acc
    }, {} as Record<string, typeof ingresos>)

    return NextResponse.json({
      success: true,
      data: ingresos,
      porFecha
    })
  } catch (error) {
    console.error('Error fetching ingresos despostada:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener ingresos' },
      { status: 500 }
    )
  }
}

// POST - Crear ingreso a despostada
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Si viene por código de barras, buscar el stock
    let productoNombre = data.productoNombre
    let tropaCodigo = data.tropaCodigo
    let pesoKg = parseFloat(data.pesoKg) || 0

    if (data.medioIngreso === 'CODIGO_BARRAS' && data.codigoBarras) {
      // Buscar en stock de productos
      const stock = await db.stockProducto.findFirst({
        where: {
          OR: [
            { lote: data.codigoBarras },
            { productoNombre: { contains: data.codigoBarras } }
          ]
        }
      })
      if (stock) {
        productoNombre = stock.productoNombre
        tropaCodigo = stock.tropaCodigo || null
        pesoKg = stock.pesoKg
      }
    }

    const ingreso = await db.ingresoDespostada.create({
      data: {
        tipoProducto: data.tipoProducto,
        productoId: data.productoId || null,
        productoNombre,
        tropaCodigo: tropaCodigo || null,
        fechaFaena: data.fechaFaena ? new Date(data.fechaFaena) : null,
        clienteId: data.clienteId || null,
        camaraId: data.camaraId || null,
        cantidad: parseInt(data.cantidad) || 1,
        pesoKg,
        medioIngreso: data.medioIngreso || 'SELECCION',
        codigoBarras: data.codigoBarras || null,
        operadorId: data.operadorId || null
      }
    })

    return NextResponse.json({
      success: true,
      data: ingreso
    })
  } catch (error) {
    console.error('Error creating ingreso despostada:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear ingreso' },
      { status: 500 }
    )
  }
}
