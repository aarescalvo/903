import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar rendering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enStock = searchParams.get('enStock')
    const tipoProducto = searchParams.get('tipoProducto')
    const clienteId = searchParams.get('clienteId')
    const fechaFaena = searchParams.get('fechaFaena')

    const where: Record<string, unknown> = {}
    
    if (enStock === 'true') where.enStock = true
    if (tipoProducto) where.tipoProducto = tipoProducto
    if (clienteId) where.clienteId = clienteId
    if (fechaFaena) {
      const fecha = new Date(fechaFaena)
      fecha.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fechaFaena = { gte: fecha, lte: fechaFin }
    }

    const renderings = await db.rendering.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true } }
      },
      orderBy: { fechaFaena: 'desc' }
    })

    // Estadísticas
    const statsPorTipo = await db.rendering.groupBy({
      by: ['tipoProducto'],
      _count: { id: true },
      _sum: { pesoKg: true },
      where: { enStock: true }
    })

    const statsPorCliente = await db.rendering.groupBy({
      by: ['clienteId'],
      _count: { id: true },
      _sum: { pesoKg: true },
      where: { enStock: true }
    })

    return NextResponse.json({
      success: true,
      data: renderings,
      stats: {
        porTipo: statsPorTipo.map(s => ({
          tipo: s.tipoProducto,
          cantidad: s._count.id,
          pesoKg: s._sum.pesoKg || 0
        })),
        porCliente: statsPorCliente.map(s => ({
          clienteId: s.clienteId,
          cantidad: s._count.id,
          pesoKg: s._sum.pesoKg || 0
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching rendering:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener rendering' },
      { status: 500 }
    )
  }
}

// POST - Crear registro de rendering
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const rendering = await db.rendering.create({
      data: {
        fechaFaena: data.fechaFaena ? new Date(data.fechaFaena) : new Date(),
        tropaCodigo: data.tropaCodigo || null,
        tipoProducto: data.tipoProducto,
        pesoKg: parseFloat(data.pesoKg) || 0,
        clienteId: data.clienteId || null,
        precioKg: data.precioKg ? parseFloat(data.precioKg) : null,
        fechaPrecio: data.precioKg ? new Date() : null,
        observaciones: data.observaciones || null,
        operadorId: data.operadorId || null
      }
    })

    // Guardar precio en historial si hay cliente y precio
    if (data.clienteId && data.precioKg) {
      // Desactivar precios anteriores
      await db.precioRendering.updateMany({
        where: {
          clienteId: data.clienteId,
          tipoProducto: data.tipoProducto,
          activo: true
        },
        data: { activo: false, fechaHasta: new Date() }
      })

      // Crear nuevo precio
      await db.precioRendering.create({
        data: {
          clienteId: data.clienteId,
          tipoProducto: data.tipoProducto,
          precioKg: parseFloat(data.precioKg)
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: rendering
    })
  } catch (error) {
    console.error('Error creating rendering:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear rendering' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar rendering
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

    const rendering = await db.rendering.update({
      where: { id },
      data: {
        ...updateData,
        fechaFaena: updateData.fechaFaena ? new Date(updateData.fechaFaena) : undefined,
        pesoKg: updateData.pesoKg ? parseFloat(updateData.pesoKg) : undefined,
        precioKg: updateData.precioKg ? parseFloat(updateData.precioKg) : undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: rendering
    })
  } catch (error) {
    console.error('Error updating rendering:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar rendering' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar rendering
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    await db.rendering.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Rendering eliminado'
    })
  } catch (error) {
    console.error('Error deleting rendering:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar rendering' },
      { status: 500 }
    )
  }
}
