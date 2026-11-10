
import { db } from '../database/database';

const defaultCategories = [
  { name: 'Vendas', type: 'income' },
  { name: 'Outras receitas', type: 'income' },
  { name: 'Fornecedores', type: 'expense' },
  { name: 'Aluguel', type: 'expense' },
  { name: 'Contas e serviços', type: 'expense' },
  { name: 'Outras despesas', type: 'expense' }
];

export async function createBusiness(name, document = '') {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error('Informe o nome do negócio.');
  }

  const business = {
    id: crypto.randomUUID(),
    name: normalizedName,
    document: document.trim(),
    currency: 'BRL',
    createdAt: new Date().toISOString()
  };

  await db.transaction(
    'rw',
    db.businesses,
    db.categories,
    async () => {
      await db.businesses.add(business);

      await db.categories.bulkAdd(
        defaultCategories.map((category) => ({
          id: crypto.randomUUID(),
          businessId: business.id,
          ...category
        }))
      );
    }
  );

  return business;
}

export async function getBusiness() {
  return db.businesses.toCollection().first();
}
