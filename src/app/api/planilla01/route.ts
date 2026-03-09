import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const body = await request.json()
    const { tropaId } = body

    if (!tropaId) {
      return NextResponse.json({ error: 'ID de tropa requerido' }, { status: 400 })
    }

    // Obtener datos de la tropa
    const tropa = await db.tropa.findUnique({
      where: { id: tropaId },
      include: {
        productor: true,
        usuarioFaena: true,
        corral: true,
        pesajeCamion: {
          include: {
            transportista: true
          }
        },
        animales: {
          orderBy: { numero: 'asc' }
        }
      }
    })

    if (!tropa) {
      return NextResponse.json({ error: 'Tropa no encontrada' }, { status: 404 })
    }

    // Preparar datos para el script Python
    const data = {
      id: tropa.id,
      codigo: tropa.codigo,
      cantidadCabezas: tropa.cantidadCabezas,
      fechaRecepcion: tropa.fechaRecepcion.toISOString(),
      dte: tropa.dte,
      guia: tropa.guia,
      productor: tropa.productor ? {
        nombre: tropa.productor.nombre,
        cuit: tropa.productor.cuit
      } : null,
      usuarioFaena: tropa.usuarioFaena ? {
        nombre: tropa.usuarioFaena.nombre,
        cuit: tropa.usuarioFaena.cuit
      } : null,
      corral: tropa.corral ? {
        nombre: tropa.corral.nombre
      } : null,
      pesajeCamion: tropa.pesajeCamion ? {
        patenteChasis: tropa.pesajeCamion.patenteChasis,
        patenteAcoplado: tropa.pesajeCamion.patenteAcoplado,
        choferNombre: tropa.pesajeCamion.choferNombre,
        choferDni: tropa.pesajeCamion.choferDni,
        precintos: tropa.pesajeCamion.precintos,
        transportista: tropa.pesajeCamion.transportista ? {
          nombre: tropa.pesajeCamion.transportista.nombre,
          cuit: tropa.pesajeCamion.transportista.cuit
        } : null
      } : null,
      animales: tropa.animales.map(a => ({
        id: a.id,
        numero: a.numero,
        tipoAnimal: a.tipoAnimal,
        caravana: a.caravana,
        pesoVivo: a.pesoVivo,
        raza: a.raza
      }))
    }

    // Crear archivo temporal
    const tempDir = os.tmpdir()
    const fileName = `planilla01_${tropa.codigo.replace(/\s/g, '_')}_${Date.now()}.xlsx`
    tempFilePath = path.join(tempDir, fileName)

    // Ejecutar script Python
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_planilla01.py')
    const dataJson = JSON.stringify(data).replace(/"/g, '\\"')
    
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${dataJson}" "${tempFilePath}"`,
      { maxBuffer: 1024 * 1024 * 10 }
    )

    if (stderr && !stderr.includes('WARNING')) {
      console.error('Python stderr:', stderr)
    }

    const result = JSON.parse(stdout)
    if (result.error) {
      throw new Error(result.error)
    }

    // Leer el archivo generado
    const fileBuffer = await readFile(tempFilePath)

    // Retornar el archivo
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Planilla01_${tropa.codigo.replace(/\s/g, '_')}.xlsx"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generando planilla:', error)
    return NextResponse.json(
      { error: 'Error al generar la planilla', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    // Limpiar archivo temporal
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch {
        // Ignorar errores de limpieza
      }
    }
  }
}
