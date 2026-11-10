
import { db } from '../database/database';

const allowedTypes = ['cash', 'bank', 'digital'];

export async function createAccount({
  businessId,
  name,
  type,
  initialBalanceCents = 0
}) {
  const normalizedName = name.trim();

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
