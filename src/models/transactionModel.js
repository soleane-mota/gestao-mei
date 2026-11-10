import { db } from '../database/database';

const allowedTypes = ['income', 'expense'];

function validateAmount(amountCents) {
  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0
  ) {
    throw new Error('O valor deve ser um número inteiro positivo em centavos.');
  }
}

function validateDate(date) {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error('Informe uma data válida no formato AAAA-MM-DD.');
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new Error('A data informada não existe.');
  }
}

async function validateReferences({ accountId, categoryId, type }) {
  if (!allowedTypes.includes(type)) {
    throw new Error('Tipo de movimentação inválido.');
  }

  const account = await db.accounts.get(accountId);

  if (!account) {
    throw new Error('Conta financeira não encontrada.');
  }

  if (categoryId) {
    const category = await db.categories.get(categoryId);

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    if (category.businessId !== account.businessId) {
      throw new Error('A categoria não pertence ao negócio desta conta.');
    }

    if (category.type !== type) {
      throw new Error('A categoria não corresponde ao tipo de movimentação.');
    }
  }

  return account;
}

// Cadastra uma receita ou despesa.
export async function createTransaction({
  accountId,
  categoryId = null,
  type,
  description,
  amountCents,
  date
}) {
  if (!accountId) {
    throw new Error('Selecione uma conta financeira.');
  }

  if (!description?.trim()) {
    throw new Error('Informe uma descrição para a movimentação.');
  }

  validateAmount(amountCents);
  validateDate(date);

  return db.transaction(
    'rw',
    db.accounts,
    db.categories,
    db.transactions,
    async () => {
      await validateReferences({ accountId, categoryId, type });

      const transaction = {
        id: crypto.randomUUID(),
        accountId,
        categoryId,
        type,
        description: description.trim(),
        amountCents,
        date,
        createdAt: new Date().toISOString(),
        updatedAt: null
      };

      await db.transactions.add(transaction);

      return transaction;
    }
  );
}

// Busca uma movimentação pelo identificador.
export async function getTransaction(transactionId) {
  return db.transactions.get(transactionId);
}

// Lista as movimentações de uma conta, da mais recente para a mais antiga.
export async function getTransactionsByAccount(accountId) {
  const transactions = await db.transactions
    .where('accountId')
    .equals(accountId)
    .toArray();

  return transactions.sort((a, b) => {
    return (
      b.date.localeCompare(a.date) ||
      b.createdAt.localeCompare(a.createdAt)
    );
  });
}

// Edita uma movimentação existente.
export async function updateTransaction(transactionId, changes) {
  return db.transaction(
    'rw',
    db.accounts,
    db.categories,
    db.transactions,
    async () => {
      const existing = await db.transactions.get(transactionId);

      if (!existing) {
        throw new Error('Movimentação não encontrada.');
      }

      const updated = {
        ...existing,
        ...changes,
        description:
          changes.description !== undefined
            ? changes.description.trim()
            : existing.description,
        categoryId:
          changes.categoryId !== undefined
            ? changes.categoryId
            : existing.categoryId,
        updatedAt: new Date().toISOString()
      };

      if (!updated.description) {
        throw new Error('Informe uma descrição para a movimentação.');
      }

      validateAmount(updated.amountCents);
      validateDate(updated.date);

      await validateReferences(updated);

      await db.transactions.put(updated);

      return updated;
    }
  );
}

// Exclui uma movimentação.
export async function deleteTransaction(transactionId) {
  const existing = await db.transactions.get(transactionId);

  if (!existing) {
    throw new Error('Movimentação não encontrada.');
  }

  await db.transactions.delete(transactionId);

  return true;
}

// Calcula o saldo atual de uma conta.
export async function getAccountBalance(accountId) {
  const account = await db.accounts.get(accountId);

  if (!account) {
    throw new Error('Conta financeira não encontrada.');
  }

  const transactions = await getTransactionsByAccount(accountId);

  return transactions.reduce((balance, transaction) => {
    if (transaction.type === 'income') {
      return balance + transaction.amountCents;
    }

    return balance - transaction.amountCents;
  }, account.initialBalanceCents);
}