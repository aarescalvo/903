import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar movimientos de despostada
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const camaraId = searchParams.get('camaraId')
    const tipoProducto = searchParams.get('tipoProducto')
    const fecha = searchParams.get('fecha')

    const where: Record<string, unknown> = {}
    
    if (camaraId) {
      where.OR = [
        { camaraOrigenId: camaraId },
        { camaraDestinoId: camaraId }
      ]
    }
    if (tipoProducto) where.tipoProducto = tipoProducto
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fecha = { gte: fechaInicio, lte: fechaFin }
    }

    const movimientos = await db.movimientoDespostada.findMany({
      where,
      include: {
        camaraOrigen: { select: { nombre: true } },
        camaraDestino: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: movimientos
    })
  } catch (error) {
    console.error('Error fetching movimientos despostada:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener movimientos' },
      { status: 500 }
    )
  }
}

// POST - Crear movimiento de despostada
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Crear el movimiento
    const movimiento = await db.movimientoDespostada.create({
      data: {
        tipoProducto: data.tipoProducto,
        productoId: data.productoId || null,
        productoNombre: data.productoNombre,
        cantidad: parseInt(data.cantidad) || 1,
        pesoKg: parseFloat(data.pesoKg) || 0,
        camaraOrigenId: data.camaraOrigenId || null,
        camaraDestinoId: data.camaraDestinoId,
        tropaCodigo: data.tropaCodigo || null,
        lote: data.lote || null,
        observaciones: data.observaciones || null,
        operadorId: data.operadorId || null
      }
    })

    // Actualizar stock de productos
    // Si hay cámara de origen, decrementar stock allí
    if (data.camaraOrigenId && data.productoNombre) {
      await db.stockProducto.updateMany({
        where: {
          productoNombre: data.productoNombre,
          camaraId: data.camaraOrigenId
        },
        data: {
          cantidad: { decrement: parseInt(data.cantidad) || 1 },
          pesoKg: { decrement: parseFloat(data.pesoKg) || 0 }
        }
      })
    }

    // Incrementar stock en cámara destino
    if (data.camaraDestinoId && data.productoNombre) {
      const stockExistente = await db.stockProducto.findFirst({
        where: {
          productoNombre: data.productoNombre,
          camaraId: data.camaraDestinoId
        }
      })

      if (stockExistente) {
        await db.stockProducto.update({
          where: { id: stockExistente.id },
          data: {
            cantidad: { increment: parseInt(data.cantidad) || 1 },
            pesoKg: { increment: parseFloat(data.pesoKg) || 0 }
          }
        })
      } else {
        await db.stockProducto.create({
          data: {
            productoNombre: data.productoNombre,
            tipo: data.tipoProducto as 'CUARTO_ASADO' | 'CUARTO_DELANTERO' | 'CUARTO_TRASERO' | 'MENUDENCIA' | 'OTRO',
            cantidad: parseInt(data.cantidad) || 1,
            pesoKg: parseFloat(data.pesoKg) || 0,
            camaraId: data.camaraDestinoId,
            tropaCodigo: data.tropaCodigo || null,
            lote: data.lote || null,
            estado: 'DISPONIBLE'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: movimiento
    })
  } catch (error) {
    console.error('Error creating movimiento despostada:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear movimiento' },
      { status: 500 }
    )
  }
}
