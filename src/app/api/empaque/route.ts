import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar empaques
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const productoNombre = searchParams.get('producto')
    const tropaCodigo = searchParams.get('tropaCodigo')

    const where: Record<string, unknown> = {}
    
    if (estado) where.estado = estado
    if (productoNombre) where.productoNombre = { contains: productoNombre }
    if (tropaCodigo) where.tropaCodigo = tropaCodigo

    const empaques = await db.empaque.findMany({
      where,
      include: {
        condicionEmbalaje: true
      },
      orderBy: { fecha: 'desc' }
    })

    // Estadísticas
    const statsPorEstado = await db.empaque.groupBy({
      by: ['estado'],
      _count: { id: true },
      _sum: { pesoNeto: true, pesoBruto: true }
    })

    const statsPorProducto = await db.empaque.groupBy({
      by: ['productoNombre'],
      _count: { id: true },
      _sum: { pesoNeto: true },
      where: { estado: 'EN_STOCK' }
    })

    return NextResponse.json({
      success: true,
      data: empaques,
      stats: {
        porEstado: statsPorEstado,
        porProducto: statsPorProducto
      }
    })
  } catch (error) {
    console.error('Error fetching empaques:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener empaques' },
      { status: 500 }
    )
  }
}

// POST - Crear empaque
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Calcular tara si hay condición de embalaje
    let tara = data.pesoTara || 0
    if (data.condicionEmbalajeId) {
      const condicion = await db.condicionEmbalaje.findUnique({
        where: { id: data.condicionEmbalajeId },
        include: { insumos: true }
      })
      if (condicion) {
        tara = condicion.taraTotal
      }
    }

    // Generar código de barras
    const fecha = new Date()
    const codigo = data.codigo || `EMP-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(await db.empaque.count() + 1).padStart(6, '0')}`

    const pesoNeto = parseFloat(data.pesoNeto) || 0
    const pesoBruto = pesoNeto + tara

    const empaque = await db.empaque.create({
      data: {
        codigo,
        productoId: data.productoId || null,
        productoNombre: data.productoNombre,
        corteAnatomico: data.corteAnatomico || null,
        pesoNeto,
        pesoTara: tara,
        pesoBruto,
        cantidadPiezas: parseInt(data.cantidadPiezas) || 1,
        condicionEmbalajeId: data.condicionEmbalajeId || null,
        tropaCodigo: data.tropaCodigo || null,
        garron: data.garron ? parseInt(data.garron) : null,
        fechaFaena: data.fechaFaena ? new Date(data.fechaFaena) : null,
        camaraId: data.camaraId || null,
        lote: data.lote || null,
        operadorId: data.operadorId || null
      }
    })

    // Descontar stock de insumos si hay condición
    if (data.condicionEmbalajeId) {
      const condicion = await db.condicionEmbalaje.findUnique({
        where: { id: data.condicionEmbalajeId },
        include: { insumos: { include: { insumo: true } } }
      })
      
      if (condicion) {
        for (const item of condicion.insumos) {
          await db.insumo.update({
            where: { id: item.insumoId },
            data: {
              stockActual: { decrement: item.cantidad }
            }
          })
          
          await db.movimientoInsumo.create({
            data: {
              insumoId: item.insumoId,
              tipo: 'EGRESO',
              cantidad: item.cantidad,
              motivo: `Empaque ${codigo}`,
              destino: data.productoNombre
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: empaque
    })
  } catch (error) {
    console.error('Error creating empaque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear empaque' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar empaque
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

    const empaque = await db.empaque.update({
      where: { id },
      data: {
        ...updateData,
        pesoNeto: updateData.pesoNeto ? parseFloat(updateData.pesoNeto) : undefined,
        fechaFaena: updateData.fechaFaena ? new Date(updateData.fechaFaena) : undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: empaque
    })
  } catch (error) {
    console.error('Error updating empaque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar empaque' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar empaque
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

    await db.empaque.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Empaque eliminado'
    })
  } catch (error) {
    console.error('Error deleting empaque:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar empaque' },
      { status: 500 }
    )
  }
}
