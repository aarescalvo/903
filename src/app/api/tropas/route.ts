import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all tropas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const especie = searchParams.get('especie')
    
    const where: Record<string, unknown> = {}
    
    if (estado && estado !== 'todos') {
      where.estado = estado.toUpperCase()
    }
    
    if (especie && especie !== 'todos') {
      where.especie = especie.toUpperCase()
    }
    
    const tropas = await db.tropa.findMany({
      where,
      include: {
        Cliente_Tropa_productorIdToCliente: true,
        Cliente_Tropa_usuarioFaenaIdToCliente: true,
        Corral: true,
        TropaAnimalCantidad: true,
        PesajeCamion: {
          include: {
            Transportista: true
          }
        },
        Animal: {
          orderBy: { numero: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: tropas.map(t => ({
        id: t.id,
        numero: t.numero,
        codigo: t.codigo,
        codigoSimplificado: t.codigoSimplificado,
        productor: t.Cliente_Tropa_productorIdToCliente,
        usuarioFaena: t.Cliente_Tropa_usuarioFaenaIdToCliente,
        especie: t.especie,
        cantidadCabezas: t.cantidadCabezas,
        corralId: t.corralId,
        corral: t.Corral,
        estado: t.estado,
        fechaRecepcion: t.fechaRecepcion.toISOString(),
        pesoBruto: t.pesoBruto,
        pesoTara: t.pesoTara,
        pesoNeto: t.pesoNeto,
        pesoTotalIndividual: t.pesoTotalIndividual,
        dte: t.dte,
        guia: t.guia,
        observaciones: t.observaciones,
        tiposAnimales: t.TropaAnimalCantidad,
        pesajeCamion: t.PesajeCamion ? {
          patenteChasis: t.PesajeCamion.patenteChasis,
          patenteAcoplado: t.PesajeCamion.patenteAcoplado,
          transportista: t.PesajeCamion.Transportista
        } : null,
        animales: t.Animal?.map(a => ({
          id: a.id,
          numero: a.numero,
          codigo: a.codigo,
          tipoAnimal: a.tipoAnimal,
          caravana: a.caravana,
          raza: a.raza,
          pesoVivo: a.pesoVivo,
          estado: a.estado,
          corralId: a.corralId,
          fechaBaja: a.fechaBaja,
          motivoBaja: a.motivoBaja,
          pesoBaja: a.pesoBaja
        }))
      }))
    })
  } catch (error) {
    console.error('Error fetching tropas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tropas' },
      { status: 500 }
    )
  }
}

// PUT - Update tropa
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, estado, cantidadCabezas, corralId, pesoBruto, pesoTara, pesoNeto, pesoTotalIndividual, observaciones } = body

    const updateData: Record<string, unknown> = {}
    
    if (estado) updateData.estado = estado
    if (corralId !== undefined) updateData.corralId = corralId || null
    if (cantidadCabezas) updateData.cantidadCabezas = parseInt(cantidadCabezas)
    if (pesoBruto !== undefined) updateData.pesoBruto = parseFloat(pesoBruto) || null
    if (pesoTara !== undefined) updateData.pesoTara = parseFloat(pesoTara) || null
    if (pesoNeto !== undefined) updateData.pesoNeto = parseFloat(pesoNeto) || null
    if (pesoTotalIndividual !== undefined) updateData.pesoTotalIndividual = parseFloat(pesoTotalIndividual) || null
    if (observaciones !== undefined) updateData.observaciones = observaciones

    const tropa = await db.tropa.update({
      where: { id },
      data: updateData,
      include: {
        Cliente_Tropa_productorIdToCliente: true,
        Cliente_Tropa_usuarioFaenaIdToCliente: true,
        Corral: true,
        TropaAnimalCantidad: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: tropa.id,
        numero: tropa.numero,
        codigo: tropa.codigo,
        productor: tropa.Cliente_Tropa_productorIdToCliente,
        usuarioFaena: tropa.Cliente_Tropa_usuarioFaenaIdToCliente,
        especie: tropa.especie,
        cantidadCabezas: tropa.cantidadCabezas,
        corralId: tropa.corralId,
        corral: tropa.Corral,
        estado: tropa.estado,
        tiposAnimales: tropa.TropaAnimalCantidad
      }
    })
  } catch (error) {
    console.error('Error updating tropa:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar tropa' },
      { status: 500 }
    )
  }
}
