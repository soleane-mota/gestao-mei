
import { getDashboardData } from '../viewmodels/dashboardViewModel';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

function formatCurrency(amountCents) {
  return currencyFormatter.format(amountCents / 100);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  return dateFormatter.format(
    new Date(Number(year), Number(month) - 1, Number(day))
  );
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createSummaryCard(title, value, className = '') {
  const card = createElement('article', `summary-card ${className}`);
  const label = createElement('h3', '', title);
  const amount = createElement('p', 'summary-card__value', value);

  card.append(label, amount);

  return card;
}

function renderAccounts(accounts) {
  const section = createElement('section', 'dashboard-section');
  const title = createElement('h2', '', 'Minhas contas');
  const list = createElement('div', 'account-list');

  section.append(title);

  if (accounts.length === 0) {
    list.append(
      createElement('p', 'empty-message', 'Nenhuma conta cadastrada.')
    );
  } else {
    accounts.forEach(account => {
      const card = createElement('article', 'account-card');
      const name = createElement('h3', '', account.name);
      const balance = createElement(
        'p',
        'account-card__balance',
        formatCurrency(account.balanceCents)
      );

      card.append(name, balance);
      list.append(card);
    });
  }

  section.append(list);
  return section;
}

function renderRecentTransactions(transactions) {
  const section = createElement('section', 'dashboard-section');
  const title = createElement('h2', '', 'Movimentações recentes');
  const list = createElement('div', 'transaction-list');

  section.append(title);

  if (transactions.length === 0) {
    list.append(
      createElement(
        'p',
        'empty-message',
        'Nenhuma movimentação registrada.'
      )
    );
  } else {
    transactions.forEach(transaction => {
      const item = createElement('article', 'transaction-item');

      const details = createElement('div', 'transaction-item__details');
      const description = createElement(
        'h3',
        '',
        transaction.description
      );
      const date = createElement(
        'p',
        '',
        formatDate(transaction.date)
      );

      const isIncome = transaction.type === 'income';
      const amount = createElement(
        'p',
        `transaction-item__amount ${isIncome ? 'income' : 'expense'}`,
        `${isIncome ? '+' : '-'} ${formatCurrency(transaction.amountCents)}`
      );

      details.append(description, date);
      item.append(details, amount);
      list.append(item);
    });
  }

  section.append(list);
  return section;
}

export async function renderDashboard(container, onNavigateTransactions) {
  container.innerHTML = '';

  container.append(
    createElement('p', 'loading-message', 'Carregando informações...')
  );

  try {
    const data = await getDashboardData();

    container.innerHTML = '';

    const main = createElement('main', 'dashboard');

    const header = createElement('header', 'dashboard-header');
    const title = createElement('h1', '', 'Visão geral');
    const businessName = createElement(
      'p',
      '',
      data.business.name
    );
    const transactionsButton = createElement(
      'button',
      'dashboard-header__action',
      'Movimentações'
    );

    transactionsButton.addEventListener('click', () => {
      if (typeof onNavigateTransactions === 'function') {
        onNavigateTransactions();
      }
    });

    header.append(title, businessName, transactionsButton);

    const summary = createElement('section', 'dashboard-summary');
    summary.append(
      createSummaryCard(
        'Saldo total',
        formatCurrency(data.summary.totalBalanceCents)
      ),
      createSummaryCard(
        'Receitas do mês',
        formatCurrency(data.summary.totalIncomeCents),
        'income'
      ),
      createSummaryCard(
        'Despesas do mês',
        formatCurrency(data.summary.totalExpenseCents),
        'expense'
      ),
      createSummaryCard(
        'Resultado do mês',
        formatCurrency(data.summary.periodBalanceCents)
      )
    );

    const content = createElement('div', 'dashboard-content');

    content.append(
      renderAccounts(data.accounts),
      renderRecentTransactions(data.recentTransactions)
    );

    main.append(header, summary, content);
    container.append(main);
  } catch (error) {
    console.error('Erro ao carregar o dashboard:', error);

    container.innerHTML = '';

    const message = createElement(
      'p',
      'error-message',
      'Não foi possível carregar as informações. Tente atualizar a página.'
    );

    container.append(message);
  }
}
