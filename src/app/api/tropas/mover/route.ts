import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Move tropa to another corral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tropaId, corralDestino } = body

    if (!tropaId || !corralDestino) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Get tropa
    const tropa = await db.tropa.findUnique({
      where: { id: tropaId },
      include: { Animal: true }
    })

    if (!tropa) {
      return NextResponse.json(
        { success: false, error: 'Tropa no encontrada' },
        { status: 404 }
      )
    }

    // Update tropa corral
    await db.tropa.update({
      where: { id: tropaId },
      data: { corralId: corralDestino }
    })

    // Update all animals corral
    if (tropa.Animal.length > 0) {
      await db.animal.updateMany({
        where: { tropaId },
        data: { corralId: corralDestino }
      })
    }

    // Register audit
    await db.auditoria.create({
      data: {
        operadorId: null,
        modulo: 'MOVIMIENTO_HACIENDA',
        accion: 'UPDATE',
        entidad: 'Tropa',
        entidadId: tropaId,
        descripcion: `Tropa ${tropa.codigo} movida de ${tropa.corralId || 'sin corral'} a ${corralDestino}`
      }
    })

    return NextResponse.json({
      success: true,
      data: { codigo: tropa.codigo, corralAnterior: tropa.corralId, corralDestino }
    })
  } catch (error) {
    console.error('Error moving tropa:', error)
    return NextResponse.json(
      { success: false, error: 'Error al mover tropa' },
      { status: 500 }
    )
  }
}
