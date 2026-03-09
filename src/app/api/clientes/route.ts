import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    
    let where: any = {}
    if (tipo === 'productor') {
      where.esProductor = true
    } else if (tipo === 'usuarioFaena') {
      where.esUsuarioFaena = true
    }
    
    const clientes = await db.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      data: clientes
    })
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

// POST - Create new cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      nombre, dni, cuit, 
      direccion, localidad, provincia, codigoPostal,
      telefono, contactoAlternativo, email,
      condicionFiscal, razonSocialFacturacion, domicilioFacturacion, cuitFacturacion, inicioActividades,
      esProductor, esUsuarioFaena, numeroMatricula 
    } = body
    
    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    
    const cliente = await db.cliente.create({
      data: {
        nombre,
        dni: dni || null,
        cuit: cuit || null,
        direccion: direccion || null,
        localidad: localidad || null,
        provincia: provincia || null,
        codigoPostal: codigoPostal || null,
        telefono: telefono || null,
        contactoAlternativo: contactoAlternativo || null,
        email: email || null,
        condicionFiscal: condicionFiscal || null,
        razonSocialFacturacion: razonSocialFacturacion || null,
        domicilioFacturacion: domicilioFacturacion || null,
        cuitFacturacion: cuitFacturacion || null,
        inicioActividades: inicioActividades ? new Date(inicioActividades) : null,
        esProductor: esProductor || false,
        esUsuarioFaena: esUsuarioFaena || false,
        numeroMatricula: numeroMatricula || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error creating cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}

// PUT - Update cliente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, nombre, dni, cuit, 
      direccion, localidad, provincia, codigoPostal,
      telefono, contactoAlternativo, email,
      condicionFiscal, razonSocialFacturacion, domicilioFacturacion, cuitFacturacion, inicioActividades,
      esProductor, esUsuarioFaena, numeroMatricula,
      activo // For toggling active status
    } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }
    
    // If only updating activo status (toggle)
    if (activo !== undefined && Object.keys(body).length === 2) {
      const cliente = await db.cliente.update({
        where: { id },
        data: { activo }
      })
      return NextResponse.json({
        success: true,
        data: cliente
      })
    }
    
    const cliente = await db.cliente.update({
      where: { id },
      data: {
        nombre,
        dni: dni || null,
        cuit: cuit || null,
        direccion: direccion || null,
        localidad: localidad || null,
        provincia: provincia || null,
        codigoPostal: codigoPostal || null,
        telefono: telefono || null,
        contactoAlternativo: contactoAlternativo || null,
        email: email || null,
        condicionFiscal: condicionFiscal || null,
        razonSocialFacturacion: razonSocialFacturacion || null,
        domicilioFacturacion: domicilioFacturacion || null,
        cuitFacturacion: cuitFacturacion || null,
        inicioActividades: inicioActividades ? new Date(inicioActividades) : null,
        esProductor: esProductor || false,
        esUsuarioFaena: esUsuarioFaena || false,
        numeroMatricula: numeroMatricula || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error updating cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE - Delete cliente
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
    
    await db.cliente.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}
