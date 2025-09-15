import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Fonction pour générer une quittance de loyer en PDF
export const generateRentReceipt = async (payment, tenant, property, unit) => {
  // Créer un élément HTML temporaire pour la quittance
  const receiptElement = document.createElement('div');
  receiptElement.style.width = '210mm';
  receiptElement.style.padding = '20mm';
  receiptElement.style.position = 'absolute';
  receiptElement.style.left = '-9999px';
  receiptElement.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 24px; margin-bottom: 5px;">QUITTANCE DE LOYER</h1>
        <p style="font-size: 14px; margin: 0;">Période: ${payment.period}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p style="font-size: 14px; margin: 0;"><strong>Propriétaire:</strong></p>
        <p style="font-size: 14px; margin: 0;">Ma Société Immobilière</p>
        <p style="font-size: 14px; margin: 0;">123 Rue des Propriétaires</p>
        <p style="font-size: 14px; margin: 0;">75000 Paris</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p style="font-size: 14px; margin: 0;"><strong>Locataire:</strong></p>
        <p style="font-size: 14px; margin: 0;">${tenant.name}</p>
        <p style="font-size: 14px; margin: 0;">${property.address}</p>
        <p style="font-size: 14px; margin: 0;">${unit.name}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p style="font-size: 14px; margin: 0;">Je soussigné, <strong>Ma Société Immobilière</strong>, propriétaire du logement désigné ci-dessus,</p>
        <p style="font-size: 14px; margin: 0;">déclare avoir reçu de <strong>${tenant.name}</strong>, la somme de <strong>${payment.amount} €</strong></p>
        <p style="font-size: 14px; margin: 0;">au titre du loyer et des charges pour la période de location du <strong>${payment.period}</strong>.</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p style="font-size: 14px; margin: 0;"><strong>Détail du paiement:</strong></p>
        <p style="font-size: 14px; margin: 0;">Loyer: ${unit.rent} €</p>
        <p style="font-size: 14px; margin: 0;">Charges: ${payment.amount - unit.rent} €</p>
        <p style="font-size: 14px; margin: 0;"><strong>Total: ${payment.amount} €</strong></p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p style="font-size: 14px; margin: 0;">Date de paiement: ${new Date(payment.date).toLocaleDateString('fr-FR')}</p>
      </div>
      
      <div style="margin-top: 50px; text-align: right;">
        <p style="font-size: 14px; margin: 0;">Fait le ${new Date().toLocaleDateString('fr-FR')}</p>
        <p style="font-size: 14px; margin: 0;">Signature:</p>
        <div style="height: 50px;"></div>
        <p style="font-size: 14px; margin: 0;">Ma Société Immobilière</p>
      </div>
    </div>
  `;

  document.body.appendChild(receiptElement);

  try {
    // Convertir l'élément HTML en canvas
    const canvas = await html2canvas(receiptElement, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Créer un PDF au format A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Ajouter l'image du canvas au PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    
    // Télécharger le PDF
    pdf.save(`Quittance_${tenant.name.replace(/\s+/g, '_')}_${payment.period.replace(/\s+/g, '_')}.pdf`);
  } finally {
    // Nettoyer l'élément temporaire
    document.body.removeChild(receiptElement);
  }
};

// Fonction pour générer un rapport financier en PDF
export const generateFinancialReport = async (title, data, period) => {
  // Créer un élément HTML temporaire pour le rapport
  const reportElement = document.createElement('div');
  reportElement.style.width = '210mm';
  reportElement.style.padding = '20mm';
  reportElement.style.position = 'absolute';
  reportElement.style.left = '-9999px';
  reportElement.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 24px; margin-bottom: 5px;">${title}</h1>
        <p style="font-size: 14px; margin: 0;">Période: ${period}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              ${Object.keys(data[0] || {}).map(key => 
                `<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">${key}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => 
              `<tr>
                ${Object.values(row).map(value => 
                  `<td style="padding: 8px; border: 1px solid #ddd;">${value}</td>`
                ).join('')}
              </tr>`
            ).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 50px; text-align: right;">
        <p style="font-size: 14px; margin: 0;">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  `;

  document.body.appendChild(reportElement);

  try {
    // Convertir l'élément HTML en canvas
    const canvas = await html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Créer un PDF au format A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Ajouter l'image du canvas au PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    
    // Télécharger le PDF
    pdf.save(`${title.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`);
  } finally {
    // Nettoyer l'élément temporaire
    document.body.removeChild(reportElement);
  }
};