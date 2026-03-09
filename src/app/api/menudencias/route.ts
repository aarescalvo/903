import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener menudencias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tropaCodigo = searchParams.get('tropaCodigo')
    const tipoMenudenciaId = searchParams.get('tipoMenudenciaId')
    const rotuloImpreso = searchParams.get('rotuloImpreso')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}
    if (tropaCodigo) where.tropaCodigo = tropaCodigo
    if (tipoMenudenciaId) where.tipoMenudenciaId = tipoMenudenciaId
    if (rotuloImpreso !== null) where.rotuloImpreso = rotuloImpreso === 'true'

    const menudencias = await db.menudencia.findMany({
      where,
      include: {
        tipoMenudencia: true
      },
      orderBy: { fechaIngreso: 'desc' },
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: menudencias.map(m => ({
        id: m.id,
        tipoMenudencia: m.tipoMenudencia ? {
          id: m.tipoMenudencia.id,
          nombre: m.tipoMenudencia.nombre
        } : null,
        tropaCodigo: m.tropaCodigo,
        pesoIngreso: m.pesoIngreso,
        pesoElaborado: m.pesoElaborado,
        numeroBolsa: m.numeroBolsa,
        cantidadBolsas: m.cantidadBolsas,
        operadorElaboracion: m.operadorElaboracion,
        fechaIngreso: m.fechaIngreso.toISOString(),
        fechaElaboracion: m.fechaElaboracion?.toISOString(),
        rotuloImpreso: m.rotuloImpreso,
        observaciones: m.observaciones
      }))
    })
  } catch (error) {
    console.error('Error fetching menudencias:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener menudencias' },
      { status: 500 }
    )
  }
}

// POST - Crear menudencia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tipoMenudenciaId,
      tropaCodigo,
      pesoIngreso,
      pesoElaborado,
      numeroBolsa,
      cantidadBolsas,
      operadorElaboracion,
      observaciones
    } = body

    if (!tipoMenudenciaId) {
      return NextResponse.json(
        { success: false, error: 'tipoMenudenciaId es requerido' },
        { status: 400 }
      )
    }

    const menudencia = await db.menudencia.create({
      data: {
        tipoMenudenciaId,
        tropaCodigo,
        pesoIngreso: pesoIngreso ? parseFloat(pesoIngreso) : null,
        pesoElaborado: pesoElaborado ? parseFloat(pesoElaborado) : null,
        numeroBolsa: numeroBolsa ? parseInt(numeroBolsa) : null,
        cantidadBolsas: cantidadBolsas ? parseInt(cantidadBolsas) : null,
        operadorElaboracion,
        observaciones
      },
      include: { tipoMenudencia: true }
    })

    return NextResponse.json({ success: true, data: menudencia })
  } catch (error) {
    console.error('Error creating menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear menudencia' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar menudencia (elaboración, impresión)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, pesoElaborado, numeroBolsa, cantidadBolsas, operadorElaboracion, rotuloImpreso, observaciones } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (pesoElaborado !== undefined) {
      updateData.pesoElaborado = parseFloat(pesoElaborado)
      updateData.fechaElaboracion = new Date()
    }
    if (numeroBolsa !== undefined) updateData.numeroBolsa = parseInt(numeroBolsa)
    if (cantidadBolsas !== undefined) updateData.cantidadBolsas = parseInt(cantidadBolsas)
    if (operadorElaboracion !== undefined) updateData.operadorElaboracion = operadorElaboracion
    if (rotuloImpreso !== undefined) updateData.rotuloImpreso = rotuloImpreso
    if (observaciones !== undefined) updateData.observaciones = observaciones

    const menudencia = await db.menudencia.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, data: menudencia })
  } catch (error) {
    console.error('Error updating menudencia:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar menudencia' },
      { status: 500 }
    )
  }
}
