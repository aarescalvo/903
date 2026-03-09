import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener tipificadores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')

    const where: Record<string, unknown> = {}
    if (activo !== null) where.activo = activo === 'true'

    const tipificadores = await db.tipificador.findMany({
      where,
      orderBy: [
        { activo: 'desc' },
        { apellido: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: tipificadores.map(t => ({
        id: t.id,
        nombre: t.nombre,
        apellido: t.apellido,
        nombreCompleto: `${t.nombre} ${t.apellido}`,
        numero: t.numero,
        matricula: t.matricula,
        activo: t.activo
      }))
    })
  } catch (error) {
    console.error('Error fetching tipificadores:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipificadores' },
      { status: 500 }
    )
  }
}

// POST - Crear tipificador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, apellido, numero, matricula } = body

    if (!nombre || !apellido || !matricula) {
      return NextResponse.json(
        { success: false, error: 'nombre, apellido y matricula son requeridos' },
        { status: 400 }
      )
    }

    // Verificar matrícula única
    const existente = await db.tipificador.findUnique({
      where: { matricula }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un tipificador con esa matrícula' },
        { status: 400 }
      )
    }

    const tipificador = await db.tipificador.create({
      data: {
        nombre,
        apellido,
        numero,
        matricula
      }
    })

    return NextResponse.json({ success: true, data: tipificador })
  } catch (error) {
    console.error('Error creating tipificador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear tipificador' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar tipificador
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nombre, apellido, numero, matricula, activo } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (apellido !== undefined) updateData.apellido = apellido
    if (numero !== undefined) updateData.numero = numero
    if (matricula !== undefined) updateData.matricula = matricula
    if (activo !== undefined) updateData.activo = activo

    const tipificador = await db.tipificador.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, data: tipificador })
  } catch (error) {
    console.error('Error updating tipificador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tipificador' },
      { status: 500 }
    )
  }
}

// DELETE - Desactivar tipificador
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const tipificador = await db.tipificador.update({
      where: { id },
      data: { activo: false }
    })

    return NextResponse.json({ success: true, data: tipificador })
  } catch (error) {
    console.error('Error deleting tipificador:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar tipificador' },
      { status: 500 }
    )
  }
}
