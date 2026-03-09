import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch stock por cámara
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const camaraId = searchParams.get('camaraId')
    const especie = searchParams.get('especie')
    
    const where: Record<string, unknown> = {}
    
    if (camaraId) {
      where.camaraId = camaraId
    }
    if (especie) {
      where.especie = especie.toUpperCase()
    }
    
    // Usar StockMediaRes que es el modelo correcto
    const stock = await db.stockMediaRes.findMany({
      where,
      include: {
        camara: true
      },
      orderBy: {
        fechaIngreso: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: stock.map(s => ({
        id: s.id,
        camaraId: s.camaraId,
        camara: s.camara?.nombre || '-',
        tropaCodigo: s.tropaCodigo,
        especie: s.especie,
        cantidad: s.cantidad,
        pesoTotal: s.pesoTotal,
        fechaIngreso: s.fechaIngreso.toLocaleDateString('es-AR')
      }))
    })
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener stock' },
      { status: 500 }
    )
  }
}

// POST - Crear/actualizar stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { camaraId, tropaCodigo, especie, cantidad, pesoTotal } = body
    
    // Buscar si ya existe stock para esta cámara/tropa/especie
    const existente = await db.stockMediaRes.findUnique({
      where: {
        camaraId_tropaCodigo_especie: {
          camaraId,
          tropaCodigo: tropaCodigo || null,
          especie: especie.toUpperCase()
        }
      }
    })
    
    if (existente) {
      // Actualizar sumando
      const actualizado = await db.stockMediaRes.update({
        where: { id: existente.id },
        data: {
          cantidad: existente.cantidad + parseInt(cantidad),
          pesoTotal: existente.pesoTotal + parseFloat(pesoTotal)
        }
      })
      return NextResponse.json({ success: true, data: actualizado })
    }
    
    // Crear nuevo
    const stock = await db.stockMediaRes.create({
      data: {
        camaraId,
        tropaCodigo,
        especie: especie.toUpperCase(),
        cantidad: parseInt(cantidad),
        pesoTotal: parseFloat(pesoTotal)
      }
    })
    
    return NextResponse.json({ success: true, data: stock })
  } catch (error) {
    console.error('Error creating stock:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear stock' },
      { status: 500 }
    )
  }
}
