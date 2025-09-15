import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Récupérer une propriété par ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const [properties] = await pool.query(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    );

    if (properties.length === 0) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 });
    }

    const property = properties[0];

    // Récupérer les unités de cette propriété
    const [units] = await pool.query(`
      SELECT u.*, t.name as tenant_name
      FROM units u
      LEFT JOIN tenants t ON u.id = t.unit_id
      WHERE u.property_id = ?
    `, [id]);
    
    property.units = units;

    return NextResponse.json(property);
  } catch (error) {
    console.error('Erreur lors de la récupération de la propriété:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Mettre à jour une propriété
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, address } = await request.json();

    if (!name || !address) {
      return NextResponse.json({ error: 'Nom et adresse requis' }, { status: 400 });
    }

    const [result] = await pool.query(
      'UPDATE properties SET name = ?, address = ? WHERE id = ?',
      [name, address, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ id: parseInt(id), name, address });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la propriété:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Supprimer une propriété
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const [result] = await pool.query(
      'DELETE FROM properties WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Propriété supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la propriété:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}