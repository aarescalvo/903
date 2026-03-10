import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const especie = searchParams.get('especie')
    const activo = searchParams.get('activo')
    const apareceRendimiento = searchParams.get('apareceRendimiento')
    const apareceStock = searchParams.get('apareceStock')

    const where: Record<string, unknown> = {}

    if (especie) where.especie = especie.toUpperCase()
    if (activo !== null && activo !== undefined) where.activo = activo === 'true'
    if (apareceRendimiento === 'true') where.apareceRendimiento = true
    if (apareceStock === 'true') where.apareceStock = true

    const productos = await db.producto.findMany({
      where,
      orderBy: [
        { especie: 'asc' },
        { codigo: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: productos.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        nombreReportes: p.nombreReportes,
        especie: p.especie,
        codigoTipificacion: p.codigoTipificacion,
        codigoTipoTrabajo: p.codigoTipoTrabajo,
        codigoTransporte: p.codigoTransporte,
        codigoDestino: p.codigoDestino,
        tara: p.tara,
        diasConservacion: p.diasConservacion,
        requiereTipificacion: p.requiereTipificacion,
        tipoRotulo: p.tipoRotulo,
        precio: p.precio,
        temperaturaConservacion: p.temperaturaConservacion,
        apareceRendimiento: p.apareceRendimiento,
        apareceStock: p.apareceStock,
        activo: p.activo
      }))
    })
  } catch (error) {
    console.error('Error fetching productos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST - Crear producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      codigo,
      nombre,
      nombreReportes,
      especie,
      codigoTipificacion,
      codigoTipoTrabajo,
      codigoTransporte,
      codigoDestino,
      tara,
      diasConservacion,
      requiereTipificacion,
      tipoRotulo,
      precio,
      temperaturaConservacion,
      apareceRendimiento,
      apareceStock
    } = body

    if (!codigo || !nombre || !especie) {
      return NextResponse.json(
        { success: false, error: 'codigo, nombre y especie son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que no exista el código para la misma especie
    const existente = await db.producto.findUnique({
      where: {
        codigo_especie: {
          codigo,
          especie: especie.toUpperCase() as 'BOVINO' | 'EQUINO'
        }
      }
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un producto con ese código para esta especie' },
        { status: 400 }
      )
    }

    const producto = await db.producto.create({
      data: {
        codigo,
        nombre,
        nombreReportes,
        especie: especie.toUpperCase() as 'BOVINO' | 'EQUINO',
        codigoTipificacion,
        codigoTipoTrabajo,
        codigoTransporte,
        codigoDestino,
        tara: tara ? parseFloat(tara) : null,
        diasConservacion: diasConservacion ? parseInt(diasConservacion) : null,
        requiereTipificacion: requiereTipificacion || false,
        tipoRotulo,
        precio: precio ? parseFloat(precio) : null,
        temperaturaConservacion,
        apareceRendimiento: apareceRendimiento || false,
        apareceStock: apareceStock || false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, data: producto })
  } catch (error) {
    console.error('Error creating producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar producto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    // Convertir tipos numéricos
    const data: Record<string, unknown> = { ...updateData }
    if (data.tara !== undefined) data.tara = data.tara ? parseFloat(data.tara as string) : null
    if (data.diasConservacion !== undefined) data.diasConservacion = data.diasConservacion ? parseInt(data.diasConservacion as string) : null
    if (data.precio !== undefined) data.precio = data.precio ? parseFloat(data.precio as string) : null

    const producto = await db.producto.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, data: producto })
  } catch (error) {
    console.error('Error updating producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar producto (marcar inactivo)
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

    const producto = await db.producto.update({
      where: { id },
      data: { activo: false }
    })

    return NextResponse.json({ success: true, data: producto })
  } catch (error) {
    console.error('Error deleting producto:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}
