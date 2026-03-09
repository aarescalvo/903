import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar cuarteos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tropaCodigo = searchParams.get('tropaCodigo')
    const fecha = searchParams.get('fecha')

    const where: Record<string, unknown> = {}
    
    if (tropaCodigo) {
      where.tropaCodigo = tropaCodigo
    }
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fecha = {
        gte: fechaInicio,
        lte: fechaFin
      }
    }

    const cuarteos = await db.cuarteo.findMany({
      where,
      orderBy: { fecha: 'desc' }
    })

    // Calcular estadísticas
    const stats = await db.cuarteo.aggregate({
      _count: { id: true },
      _sum: { 
        pesoOriginal: true,
        pesoAsado: true,
        pesoDelantero: true,
        pesoTrasero: true,
        pesoTotal: true,
        perdida: true
      }
    })

    return NextResponse.json({
      success: true,
      data: cuarteos,
      stats: {
        total: stats._count.id || 0,
        pesoOriginal: stats._sum.pesoOriginal || 0,
        pesoAsado: stats._sum.pesoAsado || 0,
        pesoDelantero: stats._sum.pesoDelantero || 0,
        pesoTrasero: stats._sum.pesoTrasero || 0,
        pesoTotal: stats._sum.pesoTotal || 0,
        perdida: stats._sum.perdida || 0
      }
    })
  } catch (error) {
    console.error('Error fetching cuarteos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cuarteos' },
      { status: 500 }
    )
  }
}

// POST - Crear cuarteo
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Calcular pesos totales y pérdida
    const pesoAsado = parseFloat(data.pesoAsado) || 0
    const pesoDelantero = parseFloat(data.pesoDelantero) || 0
    const pesoTrasero = parseFloat(data.pesoTrasero) || 0
    const pesoOriginal = parseFloat(data.pesoOriginal) || 0
    const pesoTotal = pesoAsado + pesoDelantero + pesoTrasero
    const perdida = pesoOriginal - pesoTotal

    const cuarteo = await db.cuarteo.create({
      data: {
        mediaResId: data.mediaResId,
        codigoMediaRes: data.codigoMediaRes,
        tropaCodigo: data.tropaCodigo || null,
        garron: data.garron ? parseInt(data.garron) : null,
        lado: data.lado,
        pesoOriginal: pesoOriginal,
        pesoAsado: pesoAsado || null,
        pesoDelantero: pesoDelantero || null,
        pesoTrasero: pesoTrasero || null,
        pesoTotal: pesoTotal || null,
        perdida: perdida || null,
        camaraId: data.camaraId || null,
        operadorId: data.operadorId || null
      }
    })

    // Actualizar estado de la media res
    await db.mediaRes.update({
      where: { id: data.mediaResId },
      data: { estado: 'EN_CUARTEO' }
    })

    // Crear stock de productos para cada cuarto
    if (pesoAsado > 0) {
      await db.stockProducto.create({
        data: {
          productoNombre: 'Cuarto Asado',
          tipo: 'CUARTO_ASADO',
          pesoKg: pesoAsado,
          cantidad: 1,
          tropaCodigo: data.tropaCodigo || null,
          camaraId: data.camaraId || null
        }
      })
    }
    
    if (pesoDelantero > 0) {
      await db.stockProducto.create({
        data: {
          productoNombre: 'Cuarto Delantero',
          tipo: 'CUARTO_DELANTERO',
          pesoKg: pesoDelantero,
          cantidad: 1,
          tropaCodigo: data.tropaCodigo || null,
          camaraId: data.camaraId || null
        }
      })
    }
    
    if (pesoTrasero > 0) {
      await db.stockProducto.create({
        data: {
          productoNombre: 'Cuarto Trasero',
          tipo: 'CUARTO_TRASERO',
          pesoKg: pesoTrasero,
          cantidad: 1,
          tropaCodigo: data.tropaCodigo || null,
          camaraId: data.camaraId || null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: cuarteo
    })
  } catch (error) {
    console.error('Error creating cuarteo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cuarteo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cuarteo
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Recalcular pesos
    const pesoAsado = updateData.pesoAsado ? parseFloat(updateData.pesoAsado) : 0
    const pesoDelantero = updateData.pesoDelantero ? parseFloat(updateData.pesoDelantero) : 0
    const pesoTrasero = updateData.pesoTrasero ? parseFloat(updateData.pesoTrasero) : 0
    const pesoOriginal = updateData.pesoOriginal ? parseFloat(updateData.pesoOriginal) : 0
    const pesoTotal = pesoAsado + pesoDelantero + pesoTrasero
    const perdida = pesoOriginal - pesoTotal

    const cuarteo = await db.cuarteo.update({
      where: { id },
      data: {
        ...updateData,
        pesoAsado: pesoAsado || null,
        pesoDelantero: pesoDelantero || null,
        pesoTrasero: pesoTrasero || null,
        pesoTotal: pesoTotal || null,
        perdida: perdida || null
      }
    })

    return NextResponse.json({
      success: true,
      data: cuarteo
    })
  } catch (error) {
    console.error('Error updating cuarteo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cuarteo' },
      { status: 500 }
    )
  }
}
