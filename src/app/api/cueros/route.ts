import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar cueros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enStock = searchParams.get('enStock')
    const tropaCodigo = searchParams.get('tropaCodigo')

    const where: Record<string, unknown> = {}
    
    if (enStock === 'true') {
      where.enStock = true
    }
    if (tropaCodigo) {
      where.tropaCodigo = tropaCodigo
    }

    const cueros = await db.cuero.findMany({
      where,
      orderBy: { fechaIngreso: 'desc' }
    })

    // Calcular estadísticas
    const stats = await db.cuero.aggregate({
      _count: { id: true },
      _sum: { peso: true }
    })

    const statsEnStock = await db.cuero.aggregate({
      where: { enStock: true },
      _count: { id: true },
      _sum: { peso: true }
    })

    return NextResponse.json({
      success: true,
      data: cueros,
      stats: {
        total: stats._count.id || 0,
        pesoTotal: stats._sum.peso || 0,
        enStock: statsEnStock._count.id || 0,
        pesoEnStock: statsEnStock._sum.peso || 0
      }
    })
  } catch (error) {
    console.error('Error fetching cueros:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cueros' },
      { status: 500 }
    )
  }
}

// POST - Crear cuero
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const cuero = await db.cuero.create({
      data: {
        tropaId: data.tropaId || null,
        tropaCodigo: data.tropaCodigo || null,
        garron: data.garron || null,
        peso: data.peso ? parseFloat(data.peso) : null,
        clasificacion: data.clasificacion || 'SELECCION',
        observaciones: data.observaciones || null,
        destino: data.destino || null,
        precioUnitario: data.precioUnitario ? parseFloat(data.precioUnitario) : null,
        operadorId: data.operadorId || null
      }
    })

    return NextResponse.json({
      success: true,
      data: cuero
    })
  } catch (error) {
    console.error('Error creating cuero:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cuero' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cuero
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

    const cuero = await db.cuero.update({
      where: { id },
      data: {
        ...updateData,
        peso: updateData.peso ? parseFloat(updateData.peso) : undefined,
        precioUnitario: updateData.precioUnitario ? parseFloat(updateData.precioUnitario) : undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: cuero
    })
  } catch (error) {
    console.error('Error updating cuero:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cuero' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cuero
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

    await db.cuero.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cuero eliminado'
    })
  } catch (error) {
    console.error('Error deleting cuero:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cuero' },
      { status: 500 }
    )
  }
}
