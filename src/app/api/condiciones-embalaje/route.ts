import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar condiciones de embalaje
export async function GET(request: NextRequest) {
  try {
    const condiciones = await db.condicionEmbalaje.findMany({
      include: {
        insumos: {
          include: {
            insumo: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: condiciones
    })
  } catch (error) {
    console.error('Error fetching condiciones embalaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener condiciones' },
      { status: 500 }
    )
  }
}

// POST - Crear condición de embalaje
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Calcular tara total
    let taraTotal = 0
    if (data.insumos && Array.isArray(data.insumos)) {
      for (const item of data.insumos) {
        const insumo = await db.insumo.findUnique({
          where: { id: item.insumoId }
        })
        if (insumo && insumo.pesoUnitario) {
          taraTotal += insumo.pesoUnitario * (item.cantidad || 1)
        }
      }
    }

    const condicion = await db.condicionEmbalaje.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        taraTotal,
        insumos: data.insumos ? {
          create: data.insumos.map((item: { insumoId: string; cantidad: number }) => ({
            insumoId: item.insumoId,
            cantidad: item.cantidad || 1
          }))
        } : undefined
      },
      include: {
        insumos: {
          include: { insumo: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: condicion
    })
  } catch (error) {
    console.error('Error creating condicion embalaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear condición' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar condición de embalaje
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, insumos, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Si hay insumos, recalcular tara y actualizar relaciones
    let taraTotal = 0
    if (insumos && Array.isArray(insumos)) {
      // Eliminar insumos existentes
      await db.condicionEmbalajeInsumo.deleteMany({
        where: { condicionEmbalajeId: id }
      })

      // Crear nuevos insumos
      for (const item of insumos) {
        const insumo = await db.insumo.findUnique({
          where: { id: item.insumoId }
        })
        if (insumo && insumo.pesoUnitario) {
          taraTotal += insumo.pesoUnitario * (item.cantidad || 1)
        }

        await db.condicionEmbalajeInsumo.create({
          data: {
            condicionEmbalajeId: id,
            insumoId: item.insumoId,
            cantidad: item.cantidad || 1,
            pesoTotal: insumo?.pesoUnitario ? insumo.pesoUnitario * (item.cantidad || 1) : 0
          }
        })
      }
    }

    const condicion = await db.condicionEmbalaje.update({
      where: { id },
      data: {
        ...updateData,
        taraTotal
      },
      include: {
        insumos: {
          include: { insumo: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: condicion
    })
  } catch (error) {
    console.error('Error updating condicion embalaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar condición' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar condición de embalaje
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

    // Eliminar insumos relacionados primero
    await db.condicionEmbalajeInsumo.deleteMany({
      where: { condicionEmbalajeId: id }
    })

    await db.condicionEmbalaje.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Condición eliminada'
    })
  } catch (error) {
    console.error('Error deleting condicion embalaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar condición' },
      { status: 500 }
    )
  }
}
