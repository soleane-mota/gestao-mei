
import { getAccounts } from '../models/accountModel';
import { getCategories } from '../models/categoryModel';

import {
  createTransaction,
  getTransaction,
  getTransactionsByAccount,
  updateTransaction,
  deleteTransaction
} from '../models/transactionModel';

const allowedTypes = ['income', 'expense'];

// Converte um valor em reais para centavos.
function convertToCents(amount) {
  if (typeof amount === 'string') {
    amount = amount.trim();

    // Aceita vírgula como separador decimal.
    if (amount.includes(',')) {
      amount = amount.replace(/\./g, '').replace(',', '.');
    }
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Informe um valor válido e maior que zero.');
  }

  const amountCents = Math.round(numericAmount * 100);

  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('O valor informado é inválido.');
  }

  return amountCents;
}

// Carrega contas e categorias para os formulários.
export async function getTransactionFormData(businessId) {
  if (!businessId) {
    throw new Error('Negócio não informado.');
  }

  const [accounts, categories] = await Promise.all([
    getAccounts(businessId),
    getCategories(businessId)
  ]);

  return {
    accounts,
    categories
  };
}

// Lista movimentações e aplica os filtros solicitados.
export async function getTransactionsData(businessId, filters = {}) {
  if (!businessId) {
    throw new Error('Negócio não informado.');
  }

  const accounts = await getAccounts(businessId);

  const transactionsByAccount = await Promise.all(
    accounts.map((account) =>
      getTransactionsByAccount(account.id)
    )
  );

  let transactions = transactionsByAccount.flat();

  if (filters.accountId) {
    transactions = transactions.filter(
      (transaction) => transaction.accountId === filters.accountId
    );
  }

  if (filters.type) {
    if (!allowedTypes.includes(filters.type)) {
      throw new Error('Tipo de movimentação inválido.');
    }

    transactions = transactions.filter(
      (transaction) => transaction.type === filters.type
    );
  }

  if (filters.startDate) {
    transactions = transactions.filter(
      (transaction) => transaction.date >= filters.startDate
    );
  }

  if (filters.endDate) {
    transactions = transactions.filter(
      (transaction) => transaction.date <= filters.endDate
    );
  }

  transactions.sort((a, b) => {
    return (
      b.date.localeCompare(a.date) ||
      b.createdAt.localeCompare(a.createdAt)
    );
  });

  return transactions;
}

// Cadastra uma movimentação a partir dos dados do formulário.
export async function registerTransaction(formData) {
  const amountCents = convertToCents(formData.amount);

  return createTransaction({
    accountId: formData.accountId,
    categoryId: formData.categoryId || null,
    type: formData.type,
    description: formData.description,
    amountCents,
    date: formData.date
  });
}

// Atualiza uma movimentação existente.
export async function editTransaction(transactionId, formData) {
  const existing = await getTransaction(transactionId);

  if (!existing) {
    throw new Error('Movimentação não encontrada.');
  }

  const changes = {
    ...formData
  };

  if (formData.amount !== undefined) {
    changes.amountCents = convertToCents(formData.amount);
    delete changes.amount;
  }

  if (formData.categoryId !== undefined) {
    changes.categoryId = formData.categoryId || null;
  }

  return updateTransaction(transactionId, changes);
}

// Exclui uma movimentação.
export async function removeTransaction(transactionId) {
  return deleteTransaction(transactionId);
}
