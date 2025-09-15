-- Table des dépenses
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category ENUM('maintenance', 'water', 'electricity', 'insurance', 'taxes', 'other') NOT NULL,
  receipt_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Ajouter quelques dépenses d'exemple
INSERT INTO expenses (property_id, amount, date, description, category) 
VALUES 
  (1, 75000, '2023-12-15', 'Réparation de la plomberie', 'maintenance'),
  (1, 45000, '2023-12-20', 'Facture d''électricité', 'electricity'),
  (2, 35000, '2023-12-10', 'Facture d''eau', 'water'),
  (2, 120000, '2023-12-05', 'Assurance annuelle', 'insurance'),
  (3, 85000, '2023-12-18', 'Réparation de la toiture', 'maintenance'),
  (3, 65000, '2023-12-22', 'Taxes foncières', 'taxes');

