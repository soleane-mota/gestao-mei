
import {
  createTransaction,
  getTransactionsByAccount,
  updateTransaction,
  deleteTransaction
} from '../models/transactionModel';

import { getAccounts } from '../models/accountModel';
import { getCategories } from '../models/categoryModel';

// Converte reais para centavos.
export function convertToCents(value) {
  if (typeof value === 'number') {
    value = String(value);
  }

  if (typeof value !== 'string') {
    throw new Error('Informe um valor válido.');
  }

  let normalizedValue = value.trim();

  if (normalizedValue.includes(',')) {
    normalizedValue = normalizedValue
      .replace(/\./g, '')
      .replace(',', '.');
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error('Informe um valor válido.');
  }

  const amountCents = Math.round(Number(normalizedValue) * 100);

  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0
  ) {
    throw new Error('O valor deve ser maior que zero.');
  }

  return amountCents;
}

// Busca contas e categorias disponíveis para o formulário.
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

// Busca e organiza as movimentações.
export async function getTransactionsData(businessId, filters = {}) {
  if (!businessId) {
    throw new Error('Negócio não informado.');
  }

  const accounts = await getAccounts(businessId);
  const categories = await getCategories(businessId);

  const accountMap = new Map(
    accounts.map(account => [account.id, account.name])
  );

  const categoryMap = new Map(
    categories.map(category => [category.id, category.name])
  );

  const transactionsByAccount = await Promise.all(
    accounts.map(account =>
      getTransactionsByAccount(account.id)
    )
  );

  let transactions = transactionsByAccount.flat();

  transactions = transactions.map(transaction => ({
    ...transaction,
    accountName: accountMap.get(transaction.accountId) || 'Conta',
    categoryName: transaction.categoryId
      ? categoryMap.get(transaction.categoryId) || 'Categoria'
      : 'Sem categoria'
  }));

  if (filters.accountId) {
    transactions = transactions.filter(
      transaction => transaction.accountId === filters.accountId
    );
  }

  if (filters.type) {
    transactions = transactions.filter(
      transaction => transaction.type === filters.type
    );
  }

  if (filters.startDate) {
    transactions = transactions.filter(
      transaction => transaction.date >= filters.startDate
    );
  }

  if (filters.endDate) {
    transactions = transactions.filter(
      transaction => transaction.date <= filters.endDate
    );
  }

  return transactions.sort((a, b) => {
    const dateComparison = b.date.localeCompare(a.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

// Cadastra uma movimentação.
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

// Edita uma movimentação existente.
export async function editTransaction(transactionId, formData) {
  const changes = {
    accountId: formData.accountId,
    categoryId: formData.categoryId || null,
    type: formData.type,
    description: formData.description,
    amountCents: convertToCents(formData.amount),
    date: formData.date
  };

  return updateTransaction(transactionId, changes);
}

// Exclui uma movimentação.
export async function removeTransaction(transactionId) {
  return deleteTransaction(transactionId);
}
