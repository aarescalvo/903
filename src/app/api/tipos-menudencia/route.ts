import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener tipos de menudencia
export async function GET() {
  try {
    const tipos = await db.tipoMenudencia.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: tipos.map(t => ({
        id: t.id,
        nombre: t.nombre,
        observaciones: t.observaciones
      }))
    })
  } catch (error) {
    console.error('Error fetching tipos menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de menudencia' },
      { status: 500 }
    )
  }
}

// POST - Crear tipo de menudencia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, observaciones } = body

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'nombre es requerido' },
        { status: 400 }
      )
    }

    const tipo = await db.tipoMenudencia.create({
      data: {
        nombre,
        observaciones
      }
    })

    return NextResponse.json({ success: true, data: tipo })
  } catch (error) {
    console.error('Error creating tipo menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear tipo de menudencia' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar tipo de menudencia
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nombre, observaciones, activo } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (activo !== undefined) updateData.activo = activo

    const tipo = await db.tipoMenudencia.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, data: tipo })
  } catch (error) {
    console.error('Error updating tipo menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tipo de menudencia' },
      { status: 500 }
    )
  }
}
