import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Récupérer une unité par ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const [units] = await pool.query(`
      SELECT u.*, p.name as property_name, p.address as property_address
      FROM units u
      LEFT JOIN properties p ON u.property_id = p.id
      WHERE u.id = ?
    `, [id]);

    if (units.length === 0) {
      return NextResponse.json({ error: 'Unité non trouvée' }, { status: 404 });
    }

    const unit = units[0];

    // Récupérer le locataire actuel s'il y en a un
    const [tenants] = await pool.query(
      'SELECT * FROM tenants WHERE unit_id = ?',
      [id]
    );
    
    if (tenants.length > 0) {
      unit.tenant = tenants[0];
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'unité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Mettre à jour une unité
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, type, size, rent, status } = await request.json();

    if (!name || !type || !size || !rent || !status) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    const [result] = await pool.query(
      'UPDATE units SET name = ?, type = ?, size = ?, rent = ?, status = ? WHERE id = ?',
      [name, type, size, rent, status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Unité non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ 
      id: parseInt(id), 
      name, 
      type, 
      size, 
      rent, 
      status 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'unité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Supprimer une unité
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const [result] = await pool.query(
      'DELETE FROM units WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Unité non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Unité supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'unité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}