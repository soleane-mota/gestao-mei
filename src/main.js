import './styles/main.css';

import { createBusiness, getBusiness } from './models/businessModel';
// import { createAccount } from './models/accountModel';

// import {
//   createTransaction,
//   getTransactionsByAccount,
//   getAccountBalance,
//   updateTransaction,
//   deleteTransaction
// } from './models/transactionModel';

import {
  createCategory,
  getCategories,
  getCategoriesByType,
  updateCategory,
  deleteCategory
} from './models/categoryModel';

async function testCategories() {
  try {
    const business = await getBusiness();

    if (!business) {
      throw new Error('Cadastre um negócio antes de testar.');
    }

    // Cadastro
    const category = await createCategory({
      businessId: business.id,
      name: 'Marketing',
      type: 'expense'
    });

    console.log('Categoria cadastrada:', category);

    // Listagem
    console.log(
      'Todas as categorias:',
      await getCategories(business.id)
    );

    // Listagem por tipo
    console.log(
      'Categorias de despesas:',
      await getCategoriesByType(business.id, 'expense')
    );

    // Edição
    const updated = await updateCategory(
      category.id,
      'Marketing e publicidade'
    );

    console.log('Categoria atualizada:', updated);

    // Exclusão
    await deleteCategory(category.id);

    console.log('Categoria excluída com sucesso.');

  } catch (error) {
    console.error('Erro nos testes:', error);
  }
}

testCategories();
