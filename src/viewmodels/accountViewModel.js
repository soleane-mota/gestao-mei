
import { createAccount, getAccounts } from '../models/accountModel';
import { getAccountBalance } from '../models/transactionModel';

// Converte um valor em reais para centavos.
function convertToCents(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  let normalizedValue = String(value).trim();

  // Aceita formatos brasileiros, como 1.250,00.
  if (normalizedValue.includes(',')) {
    normalizedValue = normalizedValue
      .replace(/\./g, '')
      .replace(',', '.');
  }

  // Aceita somente valores não negativos com até duas casas decimais.
  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error('Informe um saldo inicial válido.');
  }

  const amount = Number(normalizedValue);

  const amountCents = Math.round(amount * 100);

  if (!Number.isSafeInteger(amountCents)) {
    throw new Error('Saldo inicial inválido.');
  }

  return amountCents;
}

// Busca as contas e seus saldos atuais.
export async function getAccountsData(businessId) {
  if (!businessId) {
    throw new Error('Negócio não informado.');
  }

  const accounts = await getAccounts(businessId);

  const accountsWithBalance = await Promise.all(
    accounts.map(async account => {
      const balanceCents = await getAccountBalance(account.id);

      return {
        ...account,
        balanceCents
      };
    })
  );

  return accountsWithBalance;
}

// Cadastra uma nova conta.
export async function registerAccount(formData) {
  const {
    businessId,
    name,
    type,
    initialBalance
  } = formData;

  const initialBalanceCents = convertToCents(initialBalance);

  return createAccount({
    businessId,
    name,
    type,
    initialBalanceCents
  });
}
