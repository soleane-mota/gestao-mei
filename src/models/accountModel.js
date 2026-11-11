
import { db } from '../database/database';

const allowedTypes = ['cash', 'bank', 'digital'];

export async function createAccount({
  businessId,
  name,
  type,
  initialBalanceCents = 0
}) {
  if (!businessId) {
    throw new Error('Negócio não informado.');
  }

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Informe o nome da conta.');
  }

  const normalizedName = name.trim();

  if (!allowedTypes.includes(type)) {
    throw new Error('Tipo de conta inválido.');
  }

  if (
    !Number.isSafeInteger(initialBalanceCents) ||
    initialBalanceCents < 0
  ) {
    throw new Error('Saldo inicial inválido.');
  }

  return db.transaction(
    'rw',
    db.businesses,
    db.accounts,
    async () => {
      const business = await db.businesses.get(businessId);

      if (!business) {
        throw new Error('Negócio não encontrado.');
      }

      const existingAccounts = await db.accounts
        .where('businessId')
        .equals(businessId)
        .toArray();

      const nameExists = existingAccounts.some(
        account =>
          account.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (nameExists) {
        throw new Error('Já existe uma conta com esse nome.');
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
  );
}

export async function getAccounts(businessId) {
  if (!businessId) {
    throw new Error('Negócio não informado.');
  }

  const accounts = await db.accounts
    .where('businessId')
    .equals(businessId)
    .toArray();

  return accounts.sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  );
}
