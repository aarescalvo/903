import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get stock by corral
export async function GET(request: NextRequest) {
  try {
    // Get all tropas with corral assigned
    const tropas = await db.tropa.findMany({
      where: {
        corral: { not: null },
        estado: { notIn: ['FAENADO', 'DESPACHADO'] }
      },
      include: {
        _count: {
          select: { animales: true }
        }
      }
    })

    // Group by corral
    const corralesMap = new Map<string, { totalCabezas: number; tropas: { codigo: string; cantidad: number }[] }>()

    for (const tropa of tropas) {
      if (!tropa.corral) continue

      const corral = tropa.corral
      const existing = corralesMap.get(corral) || { totalCabezas: 0, tropas: [] }
      
      // Use animal count if available, otherwise use cantidadCabezas
      const cantidad = tropa._count.animales || tropa.cantidadCabezas
      
      existing.totalCabezas += cantidad
      existing.tropas.push({ codigo: tropa.codigo, cantidad })
      
      corralesMap.set(corral, existing)
    }

    // Convert to array
    const stock = Array.from(corralesMap.entries()).map(([corral, data]) => ({
      corral,
      totalCabezas: data.totalCabezas,
      tropas: data.tropas
    }))

    return NextResponse.json({
      success: true,
      data: stock
    })
  } catch (error) {
    console.error('Error fetching corral stock:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock de corrales' },
      { status: 500 }
    )
  }
}
