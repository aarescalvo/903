import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar expediciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')
    const fecha = searchParams.get('fecha')

    const where: Record<string, unknown> = {}
    
    if (estado) {
      where.estado = estado
    }
    if (clienteId) {
      where.clienteId = clienteId
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

    const expediciones = await db.expedicion.findMany({
      where,
      include: {
        cliente: true,
        detalles: true
      },
      orderBy: { fecha: 'desc' }
    })

    // Calcular estadísticas
    const statsPorEstado = await db.expedicion.groupBy({
      by: ['estado'],
      _count: { id: true }
    })

    return NextResponse.json({
      success: true,
      data: expediciones,
      stats: statsPorEstado.map(s => ({
        estado: s.estado,
        cantidad: s._count.id
      }))
    })
  } catch (error) {
    console.error('Error fetching expediciones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener expediciones' },
      { status: 500 }
    )
  }
}

// POST - Crear expedición
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Generar número de remito
    const ultimaExpedicion = await db.expedicion.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    let numeroRemito = 'R-000001'
    if (ultimaExpedicion) {
      const ultimoNumero = parseInt(ultimaExpedicion.numeroRemito.split('-')[1] || '0')
      numeroRemito = `R-${String(ultimoNumero + 1).padStart(6, '0')}`
    }

    const expedicion = await db.expedicion.create({
      data: {
        numeroRemito,
        clienteId: data.clienteId,
        transportistaId: data.transportistaId || null,
        patente: data.patente || null,
        chofer: data.chofer || null,
        observaciones: data.observaciones || null,
        operadorId: data.operadorId || null,
        detalles: {
          create: data.detalles?.map((d: Record<string, unknown>) => ({
            tipoProducto: d.tipoProducto,
            descripcion: d.descripcion,
            cantidad: parseInt(d.cantidad as string) || 1,
            pesoKg: parseFloat(d.pesoKg as string) || null,
            tropaCodigo: d.tropaCodigo || null,
            lote: d.lote || null,
            precioUnitario: d.precioUnitario ? parseFloat(d.precioUnitario as string) : null,
            subtotal: d.subtotal ? parseFloat(d.subtotal as string) : null,
            stockProductoId: d.stockProductoId || null
          })) || []
        }
      },
      include: {
        detalles: true
      }
    })

    // Actualizar estado de los productos en stock
    for (const detalle of data.detalles || []) {
      if (detalle.stockProductoId) {
        await db.stockProducto.update({
          where: { id: detalle.stockProductoId as string },
          data: { estado: 'RESERVADO' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: expedicion
    })
  } catch (error) {
    console.error('Error creating expedición:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear expedición' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar expedición
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

    const expedicion = await db.expedicion.update({
      where: { id },
      data: {
        ...updateData,
        fechaDespacho: updateData.fechaDespacho ? new Date(updateData.fechaDespacho) : undefined
      },
      include: {
        cliente: true,
        detalles: true
      }
    })

    // Si se despacha, actualizar stock
    if (updateData.estado === 'DESPACHADO') {
      const detalles = await db.detalleExpedicion.findMany({
        where: { expedicionId: id }
      })
      
      for (const detalle of detalles) {
        if (detalle.stockProductoId) {
          await db.stockProducto.update({
            where: { id: detalle.stockProductoId },
            data: { estado: 'DESPACHADO' }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: expedicion
    })
  } catch (error) {
    console.error('Error updating expedición:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar expedición' },
      { status: 500 }
    )
  }
}
