import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar insumos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const activo = searchParams.get('activo')

    const where: Record<string, unknown> = {}
    
    if (tipo) where.tipo = tipo
    if (activo !== null) where.activo = activo === 'true'

    const insumos = await db.insumo.findMany({
      where,
      include: {
        movimientos: {
          orderBy: { fecha: 'desc' },
          take: 5
        }
      },
      orderBy: { nombre: 'asc' }
    })

    // Alertas de stock bajo
    const alertas = insumos.filter(i => i.stockActual < i.stockMinimo)

    return NextResponse.json({
      success: true,
      data: insumos,
      alertas: alertas.map(a => ({
        id: a.id,
        nombre: a.nombre,
        stockActual: a.stockActual,
        stockMinimo: a.stockMinimo
      }))
    })
  } catch (error) {
    console.error('Error fetching insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener insumos' },
      { status: 500 }
    )
  }
}

// POST - Crear insumo
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const insumo = await db.insumo.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipo: data.tipo,
        unidad: data.unidad || 'KG',
        stockActual: parseFloat(data.stockActual) || 0,
        stockMinimo: parseFloat(data.stockMinimo) || 0,
        pesoUnitario: data.pesoUnitario ? parseFloat(data.pesoUnitario) : null
      }
    })

    // Registrar movimiento inicial si hay stock
    if (data.stockActual && parseFloat(data.stockActual) > 0) {
      await db.movimientoInsumo.create({
        data: {
          insumoId: insumo.id,
          tipo: 'INGRESO',
          cantidad: parseFloat(data.stockActual),
          motivo: 'Stock inicial'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: insumo
    })
  } catch (error) {
    console.error('Error creating insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear insumo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar insumo
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

    const insumo = await db.insumo.update({
      where: { id },
      data: {
        ...updateData,
        stockActual: updateData.stockActual ? parseFloat(updateData.stockActual) : undefined,
        stockMinimo: updateData.stockMinimo ? parseFloat(updateData.stockMinimo) : undefined,
        pesoUnitario: updateData.pesoUnitario ? parseFloat(updateData.pesoUnitario) : undefined
      }
    })

    // Verificar alerta
    if (insumo.stockActual < insumo.stockMinimo) {
      await db.insumo.update({
        where: { id },
        data: { alertaStockBajo: true }
      })
    }

    return NextResponse.json({
      success: true,
      data: insumo
    })
  } catch (error) {
    console.error('Error updating insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar insumo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar insumo
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

    await db.insumo.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Insumo eliminado'
    })
  } catch (error) {
    console.error('Error deleting insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar insumo' },
      { status: 500 }
    )
  }
}
