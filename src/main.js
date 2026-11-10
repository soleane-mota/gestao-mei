import './styles/main.css';

import { getBusiness } from './models/businessModel';

import {
  getTransactionFormData,
  registerTransaction,
  getTransactionsData,
  editTransaction,
  removeTransaction
} from './viewmodels/transactionsViewModel';

async function testTransactionsViewModel() {
  try {
    const business = await getBusiness();

    if (!business) {
      throw new Error('Cadastre um negócio antes de testar.');
    }

    // Carrega os dados necessários para o formulário.
    const formData = await getTransactionFormData(business.id);

    console.log('Contas disponíveis:', formData.accounts);
    console.log('Categorias disponíveis:', formData.categories);

    if (formData.accounts.length === 0) {
      throw new Error('Cadastre uma conta antes de testar.');
    }

    // Cadastra uma movimentação.
    const transaction = await registerTransaction({
      accountId: formData.accounts[0].id,
      categoryId: '',
      type: 'income',
      description: 'Venda de teste',
      amount: '150,75',
      date: '2026-11-10'
    });

    console.log('Movimentação cadastrada:', transaction);

    // Lista as movimentações.
    const transactions = await getTransactionsData(business.id);

    console.log('Movimentações:', transactions);

    // Edita a movimentação.
    const updated = await editTransaction(transaction.id, {
      description: 'Venda atualizada',
      amount: '200,00'
    });

    console.log('Movimentação atualizada:', updated);

    // Exclui a movimentação.
    await removeTransaction(transaction.id);

    console.log('Movimentação excluída com sucesso.');

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testTransactionsViewModel();
