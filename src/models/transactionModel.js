
import { db } from '../database/database';

const allowedTypes = ['income', 'expense'];

function validateDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Data da movimentação inválida.');
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error('Data da movimentação inválida.');
  }
}

// Calcula o saldo da conta, podendo ignorar uma movimentação.
async function calculateAccountBalance(accountId, excludedTransactionId = null) {
  const account = await db.accounts.get(accountId);

  if (!account) {
    throw new Error('Conta não encontrada.');
  }

  const transactions = await db.transactions
    .where('accountId')
    .equals(accountId)
    .toArray();

  return transactions.reduce((balance, transaction) => {
    if (transaction.id === excludedTransactionId) {
      return balance;
    }

    if (transaction.type === 'income') {
      return balance + transaction.amountCents;
    }

    return balance - transaction.amountCents;
  }, account.initialBalanceCents);
}

// Valida os dados e as referências da movimentação.
async function validateTransactionData(data, excludedTransactionId = null) {
  const {
    accountId,
    categoryId = null,
    type,
    description,
    amountCents,
    date
  } = data;

  if (!accountId) {
    throw new Error('Selecione uma conta.');
  }

  if (!allowedTypes.includes(type)) {
    throw new Error('Tipo de movimentação inválido.');
  }

  const normalizedDescription = typeof description === 'string' ? description.trim() : '';

  if (!normalizedDescription) {
    throw new Error('Informe a descrição da movimentação.');
  }

  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0
  ) {
    throw new Error('Valor da movimentação inválido.');
  }

  validateDate(date);

  const account = await db.accounts.get(accountId);

  if (!account) {
    throw new Error('Conta não encontrada.');
  }

  if (categoryId) {
    const category = await db.categories.get(categoryId);

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    if (
      category.businessId !== account.businessId ||
      category.type !== type
    ) {
      throw new Error('Categoria incompatível com a movimentação.');
    }
  }

  // Para despesas, verifica o saldo disponível.
  if (type === 'expense') {
    const availableBalance = await calculateAccountBalance(
      accountId,
      excludedTransactionId
    );

    if (amountCents > availableBalance) {
      throw new Error(
        'Saldo insuficiente. A despesa não pode ser maior que o saldo disponível na conta.'
      );
    }
  }

  return {
    accountId,
    categoryId: categoryId || null,
    type,
    description: normalizedDescription,
    amountCents,
    date
  };
}

export async function createTransaction({
  accountId,
  categoryId = null,
  type,
  description,
  amountCents,
  date
}) {
  return db.transaction(
    'rw',
    db.transactions,
    db.accounts,
    db.categories,
    async () => {
      const validatedData = await validateTransactionData({
        accountId,
        categoryId,
        type,
        description,
        amountCents,
        date
      });

      const transaction = {
        id: crypto.randomUUID(),
        ...validatedData,
        createdAt: new Date().toISOString()
      };

      await db.transactions.add(transaction);

      return transaction;
    }
  );
}

export async function getTransaction(transactionId) {
  return db.transactions.get(transactionId);
}

export async function getTransactionsByAccount(accountId) {
  return db.transactions
    .where('accountId')
    .equals(accountId)
    .toArray();
}

export async function updateTransaction(transactionId, changes) {
  return db.transaction(
    'rw',
    db.transactions,
    db.accounts,
    db.categories,
    async () => {
      const existingTransaction = await db.transactions.get(transactionId);

      if (!existingTransaction) {
        throw new Error('Movimentação não encontrada.');
      }

      const updatedData = {
        ...existingTransaction,
        ...changes
      };

      const validatedData = await validateTransactionData(
        updatedData,
        transactionId
      );

      const updatedTransaction = {
        ...existingTransaction,
        ...validatedData,
        updatedAt: new Date().toISOString()
      };

      await db.transactions.put(updatedTransaction);

      return updatedTransaction;
    }
  );
}

export async function deleteTransaction(transactionId) {
  const existingTransaction = await db.transactions.get(transactionId);

  if (!existingTransaction) {
    throw new Error('Movimentação não encontrada.');
  }

  await db.transactions.delete(transactionId);

  return true;
}

export async function getAccountBalance(accountId) {
  return calculateAccountBalance(accountId);
}
