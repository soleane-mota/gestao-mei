
import './styles/main.css';

import { checkOnboarding } from './viewmodels/onboardingViewModel';
import { renderDashboard } from './views/dashboardView';
import { renderOnboarding } from './views/onboardingView';
import { renderTransactions } from './views/transactionsView';

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

  await renderDashboard(app, () =>
    renderTransactions(app, business.id, () => init())
  );
}

init().catch(error => {
  console.error('Erro ao iniciar a aplicação:', error);

  const app = document.querySelector('#app');

  if (app) {
    app.textContent = 'Não foi possível carregar a aplicação.';
  }
});
