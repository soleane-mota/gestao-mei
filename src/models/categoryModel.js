
import { db } from '../database/database';

const allowedTypes = ['income', 'expense'];

// Valida os dados básicos de uma categoria.
function validateCategory({ businessId, name, type }) {
  if (!businessId) {
    throw new Error('Negócio não informado.');
  }

  if (!name?.trim()) {
    throw new Error('Informe o nome da categoria.');
  }

  if (!allowedTypes.includes(type)) {
    throw new Error('Tipo de categoria inválido.');
  }
}

// Verifica se já existe uma categoria com o mesmo nome e tipo.
async function categoryAlreadyExists(businessId, name, type, excludeId = null) {
  const categories = await db.categories
    .where('businessId')
    .equals(businessId)
    .toArray();

  return categories.some((category) => {
    return (
      category.id !== excludeId &&
      category.type === type &&
      category.name.toLowerCase() === name.trim().toLowerCase()
    );
  });
}

// Cadastra uma nova categoria.
export async function createCategory({ businessId, name, type }) {
  validateCategory({ businessId, name, type });

  const normalizedName = name.trim();

  return db.transaction(
    'rw',
    db.businesses,
    db.categories,
    async () => {
      const business = await db.businesses.get(businessId);

      if (!business) {
        throw new Error('Negócio não encontrado.');
      }

      const exists = await categoryAlreadyExists(
        businessId,
        normalizedName,
        type
      );

      if (exists) {
        throw new Error('Já existe uma categoria com esse nome.');
      }

      const category = {
        id: crypto.randomUUID(),
        businessId,
        name: normalizedName,
        type,
        createdAt: new Date().toISOString()
      };

      await db.categories.add(category);

      return category;
    }
  );
}

// Lista todas as categorias de um negócio.
export async function getCategories(businessId) {
  return db.categories
    .where('businessId')
    .equals(businessId)
    .toArray()
    .then((categories) =>
      categories.sort((a, b) => a.name.localeCompare(b.name))
    );
}

// Lista as categorias de acordo com o tipo.
export async function getCategoriesByType(businessId, type) {
  if (!allowedTypes.includes(type)) {
    throw new Error('Tipo de categoria inválido.');
  }

  const categories = await getCategories(businessId);

  return categories.filter((category) => category.type === type);
}

// Altera o nome de uma categoria.
export async function updateCategory(categoryId, newName) {
  if (!newName?.trim()) {
    throw new Error('Informe o nome da categoria.');
  }

  return db.transaction(
    'rw',
    db.categories,
    async () => {
      const category = await db.categories.get(categoryId);

      if (!category) {
        throw new Error('Categoria não encontrada.');
      }

      const normalizedName = newName.trim();

      const exists = await categoryAlreadyExists(
        category.businessId,
        normalizedName,
        category.type,
        categoryId
      );

      if (exists) {
        throw new Error('Já existe uma categoria com esse nome.');
      }

      const updatedCategory = {
        ...category,
        name: normalizedName,
        updatedAt: new Date().toISOString()
      };

      await db.categories.put(updatedCategory);

      return updatedCategory;
    }
  );
}

// Exclui uma categoria somente se ela não estiver em uso.
export async function deleteCategory(categoryId) {
  return db.transaction(
    'rw',
    db.categories,
    db.transactions,
    async () => {
      const category = await db.categories.get(categoryId);

      if (!category) {
        throw new Error('Categoria não encontrada.');
      }

      const transactionCount = await db.transactions
        .where('categoryId')
        .equals(categoryId)
        .count();

      if (transactionCount > 0) {
        throw new Error(
          'Não é possível excluir uma categoria que possui movimentações.'
        );
      }

      await db.categories.delete(categoryId);

      return true;
    }
  );
}
