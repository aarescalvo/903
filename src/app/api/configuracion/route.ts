import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener configuración del frigorífico
export async function GET() {
  try {
    // Buscar la configuración (solo debería haber una)
    let config = await db.configuracionFrigorifico.findFirst()

    // Si no existe, crear una por defecto
    if (!config) {
      config = await db.configuracionFrigorifico.create({
        data: {
          nombre: 'Solemar Alimentaria',
          direccion: null,
          numeroEstablecimiento: null,
          cuit: null,
          numeroMatricula: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        nombre: config.nombre,
        direccion: config.direccion,
        numeroEstablecimiento: config.numeroEstablecimiento,
        cuit: config.cuit,
        numeroMatricula: config.numeroMatricula,
        logo: config.logo,
        emailHost: config.emailHost,
        emailPuerto: config.emailPuerto,
        emailUsuario: config.emailUsuario,
        emailHabilitado: config.emailHabilitado,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching configuración:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      nombre,
      direccion,
      numeroEstablecimiento,
      cuit,
      numeroMatricula,
      logo,
      emailHost,
      emailPuerto,
      emailUsuario,
      emailPassword,
      emailHabilitado
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (direccion !== undefined) updateData.direccion = direccion
    if (numeroEstablecimiento !== undefined) updateData.numeroEstablecimiento = numeroEstablecimiento
    if (cuit !== undefined) updateData.cuit = cuit
    if (numeroMatricula !== undefined) updateData.numeroMatricula = numeroMatricula
    if (logo !== undefined) updateData.logo = logo
    if (emailHost !== undefined) updateData.emailHost = emailHost
    if (emailPuerto !== undefined) updateData.emailPuerto = emailPuerto
    if (emailUsuario !== undefined) updateData.emailUsuario = emailUsuario
    if (emailPassword !== undefined) updateData.emailPassword = emailPassword
    if (emailHabilitado !== undefined) updateData.emailHabilitado = emailHabilitado

    const config = await db.configuracionFrigorifico.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        nombre: config.nombre,
        direccion: config.direccion,
        numeroEstablecimiento: config.numeroEstablecimiento,
        cuit: config.cuit,
        numeroMatricula: config.numeroMatricula,
        logo: config.logo,
        emailHost: config.emailHost,
        emailPuerto: config.emailPuerto,
        emailUsuario: config.emailUsuario,
        emailHabilitado: config.emailHabilitado
      }
    })
  } catch (error) {
    console.error('Error updating configuración:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

// POST - Subir logo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File
    const id = formData.get('id') as string

    if (!file || !id) {
      return NextResponse.json(
        { success: false, error: 'Logo e ID son requeridos' },
        { status: 400 }
      )
    }

    // En un entorno real, aquí guardarías el archivo
    // Por ahora, simulamos una URL
    const logoUrl = `/uploads/logo_${Date.now()}.${file.name.split('.').pop()}`

    const config = await db.configuracionFrigorifico.update({
      where: { id },
      data: { logo: logoUrl }
    })

    return NextResponse.json({
      success: true,
      data: { logo: config.logo }
    })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al subir logo' },
      { status: 500 }
    )
  }
}
