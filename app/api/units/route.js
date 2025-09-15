import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Récupérer toutes les unités
export async function GET() {
  try {
    const [units] = await pool.query(`
      SELECT u.*, p.name as property_name, t.name as tenant_name
      FROM units u
      LEFT JOIN properties p ON u.property_id = p.id
      LEFT JOIN tenants t ON u.id = t.unit_id
    `);

    return NextResponse.json(units);
  } catch (error) {
    console.error('Erreur lors de la récupération des unités:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Créer une nouvelle unité
export async function POST(request) {
  try {
    const { property_id, name, type, size, rent } = await request.json();

    if (!property_id || !name || !type || !size || !rent) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Vérifier que la propriété existe
    const [properties] = await pool.query(
      'SELECT * FROM properties WHERE id = ?',
      [property_id]
    );

    if (properties.length === 0) {
      return NextResponse.json({ error: 'Propriété non trouvée' }, { status: 404 });
    }

    const [result] = await pool.query(
      'INSERT INTO units (property_id, name, type, size, rent, status) VALUES (?, ?, ?, ?, ?, ?)',
      [property_id, name, type, size, rent, 'vacant']
    );

    return NextResponse.json({ 
      id: result.insertId,
      property_id,
      name,
      type,
      size,
      rent,
      status: 'vacant'
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'unité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}