import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get tropa by ID with animals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tropa = await db.tropa.findUnique({
      where: { id },
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
      }
    })

    if (!tropa) {
      return NextResponse.json(
        { success: false, error: 'Tropa no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tropa,
        pesajeCamion: tropa.PesajeCamion ? {
          patenteChasis: tropa.PesajeCamion.patenteChasis,
          patenteAcoplado: tropa.PesajeCamion.patenteAcoplado,
          choferNombre: tropa.PesajeCamion.choferNombre,
          choferDni: tropa.PesajeCamion.choferDni,
          precintos: tropa.PesajeCamion.precintos,
          transportista: tropa.PesajeCamion.Transportista
        } : null,
        animales: tropa.Animal.map(a => ({
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
          motivoBaja: a.motivoBaja
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching tropa:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener tropa' },
      { status: 500 }
    )
  }
}
