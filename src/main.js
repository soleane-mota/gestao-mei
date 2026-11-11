
import './styles/main.css';

import { checkOnboarding } from './viewmodels/onboardingViewModel';
import { renderOnboarding } from './views/onboardingView';
import { renderDashboard } from './views/dashboardView';
import { renderTransactions } from './views/transactionsView';
import { renderAccounts } from './views/accountView';

async function init() {
  const app = document.querySelector('#app');

  if (!app) {
    throw new Error('Elemento principal da aplicação não encontrado.');
  }

  const { completed, business } = await checkOnboarding();

  if (!completed) {
    renderOnboarding(app, init);
    return;
  }

  await renderDashboard(
    app,
    () => showTransactions(app, business.id),
    () => showAccounts(app, business.id)
  );
}

async function showTransactions(app, businessId) {
  await renderTransactions(
    app,
    businessId,
    () => init()
  );
}

async function showAccounts(app, businessId) {
  await renderAccounts(
    app,
    businessId,
    () => init()
  );
}

init().catch(error => {
  console.error('Erro ao iniciar a aplicação:', error);

  const app = document.querySelector('#app');

  if (app) {
    app.textContent = 'Não foi possível carregar a aplicação.';
  }
});
