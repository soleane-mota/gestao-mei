
import { db } from '../database/database';

const allowedTypes = ['cash', 'bank', 'digital'];

export async function createAccount({
  businessId,
  name,
  type,
  initialBalanceCents = 0
}) {
  const normalizedName =
    typeof name === 'string' ? name.trim() : '';

  if (!businessId) {
    throw new Error('Negócio não informado.');
  }

  if (!normalizedName) {
    throw new Error('Informe o nome da conta.');
  }

  if (!allowedTypes.includes(type)) {
    throw new Error('Tipo de conta inválido.');
  }

  if (
    !Number.isSafeInteger(initialBalanceCents) ||
    initialBalanceCents < 0
  ) {
    throw new Error('Saldo inicial inválido.');
  }

  const business = await db.businesses.get(businessId);

  if (!business) {
    throw new Error('Negócio não encontrado.');
  }

  const account = {
    id: crypto.randomUUID(),
    businessId,
    name: normalizedName,
    type,
    initialBalanceCents,
    createdAt: new Date().toISOString()
  };

  await db.accounts.add(account);

  return account;
}

export async function getAccounts(businessId) {
  return db.accounts
    .where('businessId')
    .equals(businessId)
    .toArray();
}

// Atualiza os dados de uma conta.
export async function updateAccount(accountId, changes) {
  return db.transaction(
    'rw',
    db.accounts,
    db.transactions,
    async () => {
      const existingAccount = await db.accounts.get(accountId);

      if (!existingAccount) {
        throw new Error('Conta não encontrada.');
      }

      const updatedData = {
        ...existingAccount,
        ...changes
      };

      const normalizedName =
        typeof updatedData.name === 'string'
          ? updatedData.name.trim()
          : '';

      if (!normalizedName) {
        throw new Error('Informe o nome da conta.');
      }

      if (!allowedTypes.includes(updatedData.type)) {
        throw new Error('Tipo de conta inválido.');
      }

      if (
        !Number.isSafeInteger(updatedData.initialBalanceCents) ||
        updatedData.initialBalanceCents < 0
      ) {
        throw new Error('Saldo inicial inválido.');
      }

      // Calcula o resultado da conta com o novo saldo inicial.
      const transactions = await db.transactions
        .where('accountId')
        .equals(accountId)
        .toArray();

      const balance = transactions.reduce((total, transaction) => {
        if (transaction.type === 'income') {
          return total + transaction.amountCents;
        }

        return total - transaction.amountCents;
      }, updatedData.initialBalanceCents);

      if (!Number.isSafeInteger(balance)) {
        throw new Error('O saldo calculado é inválido.');
      }

      if (balance < 0) {
        throw new Error(
          'O novo saldo inicial não pode deixar a conta com saldo negativo.'
        );
      }

      const updatedAccount = {
        ...existingAccount,
        name: normalizedName,
        type: updatedData.type,
        initialBalanceCents: updatedData.initialBalanceCents,
        updatedAt: new Date().toISOString()
      };

      await db.accounts.put(updatedAccount);

      return updatedAccount;
    }
  );
}

// Exclui uma conta somente se não houver movimentações vinculadas.
export async function deleteAccount(accountId) {
  return db.transaction(
    'rw',
    db.accounts,
    db.transactions,
    async () => {
      const account = await db.accounts.get(accountId);

      if (!account) {
        throw new Error('Conta não encontrada.');
      }

      const transactionCount = await db.transactions
        .where('accountId')
        .equals(accountId)
        .count();

      if (transactionCount > 0) {
        throw new Error(
          'Não é possível excluir esta conta porque existem movimentações vinculadas a ela.'
        );
      }

      await db.accounts.delete(accountId);

      return true;
    }
  );
}
