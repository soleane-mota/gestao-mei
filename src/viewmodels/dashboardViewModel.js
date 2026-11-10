
import { getBusiness } from '../models/businessModel';
import { getAccounts } from '../models/accountModel';
import {
  getTransactionsByAccount,
  getAccountBalance
} from '../models/transactionModel';

// Retorna o primeiro e o último dia do mês atual.
function getCurrentMonthPeriod() {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  };

  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

// Recupera e organiza os dados do dashboard.
export async function getDashboardData() {
  const business = await getBusiness();

  if (!business) {
    throw new Error('Nenhum negócio cadastrado.');
  }

  const accounts = await getAccounts(business.id);

  // Recupera as movimentações e os saldos de cada conta.
  const accountData = await Promise.all(
    accounts.map(async (account) => {
      const [transactions, balanceCents] = await Promise.all([
        getTransactionsByAccount(account.id),
        getAccountBalance(account.id)
      ]);

      return {
        ...account,
        balanceCents,
        transactions
      };
    })
  );

  // Reúne as movimentações de todas as contas.
  const allTransactions = accountData
    .flatMap((account) => account.transactions)
    .sort((a, b) => {
      return (
        b.date.localeCompare(a.date) ||
        b.createdAt.localeCompare(a.createdAt)
      );
    });

  // Define o período de referência.
  const period = getCurrentMonthPeriod();

  const monthlyTransactions = allTransactions.filter(
    (transaction) =>
      transaction.date >= period.start &&
      transaction.date <= period.end
  );

  // Calcula receitas e despesas do mês.
  const totalIncomeCents = monthlyTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amountCents, 0);

  const totalExpenseCents = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amountCents, 0);

  // Calcula o saldo consolidado de todas as contas.
  const totalBalanceCents = accountData.reduce(
    (total, account) => total + account.balanceCents,
    0
  );

  return {
    business,

    summary: {
      totalBalanceCents,
      totalIncomeCents,
      totalExpenseCents,
      periodBalanceCents: totalIncomeCents - totalExpenseCents
    },

    accounts: accountData.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balanceCents: account.balanceCents
    })),

    recentTransactions: allTransactions.slice(0, 5),

    period
  };
}
