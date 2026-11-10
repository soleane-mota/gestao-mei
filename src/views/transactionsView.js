
import {
  getTransactionFormData,
  getTransactionsData,
  registerTransaction
} from '../viewmodels/transactionsViewModel';

export async function renderTransactions(container, businessId, onBack) {
  container.innerHTML = `
    <section class="transactions">
      <header class="transactions__header">
        <button type="button" id="back-to-dashboard">
          Voltar ao Dashboard
        </button>
        <h1>Movimentações</h1>
        <p>Gerencie as receitas e despesas do seu negócio.</p>
      </header>

      <section class="transactions__form-section">
        <h2>Nova movimentação</h2>

        <form id="transaction-form">
          <div class="form-group">
            <label for="transaction-type">Tipo</label>
            <select id="transaction-type" name="type" required>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>

          <div class="form-group">
            <label for="transaction-description">Descrição</label>
            <input
              type="text"
              id="transaction-description"
              name="description"
              maxlength="150"
              required
            >
          </div>

          <div class="form-group">
            <label for="transaction-amount">Valor (R$)</label>
            <input
              type="text"
              id="transaction-amount"
              name="amount"
              placeholder="0,00"
              required
            >
          </div>

          <div class="form-group">
            <label for="transaction-account">Conta</label>
            <select
              id="transaction-account"
              name="accountId"
              required
            >
              <option value="">Selecione uma conta</option>
            </select>
          </div>

          <div class="form-group">
            <label for="transaction-category">Categoria</label>
            <select
              id="transaction-category"
              name="categoryId"
            >
              <option value="">Sem categoria</option>
            </select>
          </div>

          <div class="form-group">
            <label for="transaction-date">Data</label>
            <input
              type="date"
              id="transaction-date"
              name="date"
              required
            >
          </div>

          <p
            id="transaction-error"
            class="form-error"
            role="alert"
            hidden
          ></p>

          <button type="submit" id="transaction-submit">
            Salvar movimentação
          </button>
        </form>
      </section>

      <section class="transactions__list-section">
        <h2>Movimentações registradas</h2>

        <p id="transactions-empty" hidden>
          Nenhuma movimentação cadastrada.
        </p>

        <div id="transactions-list"></div>
      </section>
    </section>
  `;

  const backButton = container.querySelector('#back-to-dashboard');
  const form = container.querySelector('#transaction-form');
  const accountSelect = container.querySelector('#transaction-account');
  const categorySelect = container.querySelector('#transaction-category');
  const typeSelect = container.querySelector('#transaction-type');
  const errorMessage = container.querySelector('#transaction-error');
  const submitButton = container.querySelector('#transaction-submit');

  const listContainer = container.querySelector('#transactions-list');
  const emptyMessage = container.querySelector('#transactions-empty');

  let accounts = [];
  let categories = [];

  function formatCurrency(amountCents) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amountCents / 100);
  }

  function formatDate(date) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  function updateCategories() {
    const selectedType = typeSelect.value;

    const filteredCategories = categories.filter(
      category => category.type === selectedType
    );

    categorySelect.innerHTML = `
      <option value="">Sem categoria</option>
    `;

    filteredCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }

  async function loadTransactions() {
    const transactions = await getTransactionsData(businessId);

    listContainer.innerHTML = '';
    emptyMessage.hidden = transactions.length > 0;

    transactions.forEach(transaction => {
      const item = document.createElement('article');
      item.classList.add('transaction-item');

      const account = accounts.find(
        account => account.id === transaction.accountId
      );

      const category = categories.find(
        category => category.id === transaction.categoryId
      );

      const description = document.createElement('h3');
      description.textContent = transaction.description;

      const details = document.createElement('p');
      details.textContent = [
        account?.name || 'Conta não encontrada',
        category?.name || 'Sem categoria',
        formatDate(transaction.date)
      ].join(' • ');

      const amount = document.createElement('strong');
      amount.textContent = formatCurrency(transaction.amountCents);

      amount.classList.add(
        transaction.type === 'income'
          ? 'transaction-item__income'
          : 'transaction-item__expense'
      );

      item.append(description, details, amount);
      listContainer.appendChild(item);
    });
  }

  try {
    // Carrega contas e categorias
    const formData = await getTransactionFormData(businessId);

    accounts = formData.accounts;
    categories = formData.categories;

    // Preenche as opções de contas
    accounts.forEach(account => {
      const option = document.createElement('option');

      option.value = account.id;
      option.textContent = account.name;

      accountSelect.appendChild(option);
    });

    updateCategories();

    // Atualiza categorias quando o tipo muda
    typeSelect.addEventListener('change', updateCategories);

    // Define a data atual no formulário
    const today = new Date();

    const localDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');

    form.elements.date.value = localDate;

    // Evento para voltar ao Dashboard
    backButton.addEventListener('click', () => {
      if (typeof onBack === 'function') {
        onBack();
      }
    });

    // Evento de cadastro
    form.addEventListener('submit', async event => {
      event.preventDefault();

      errorMessage.hidden = true;
      submitButton.disabled = true;
      submitButton.textContent = 'Salvando...';

      const formData = Object.fromEntries(new FormData(form));

      try {
        await registerTransaction(formData);

        form.reset();
        form.elements.date.value = localDate;

        updateCategories();

        await loadTransactions();

      } catch (error) {
        errorMessage.textContent =
          error.message || 'Não foi possível salvar a movimentação.';

        errorMessage.hidden = false;

      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar movimentação';
      }
    });

    await loadTransactions();

  } catch (error) {
    container.innerHTML = `
      <p class="form-error">
        Não foi possível carregar as movimentações.
      </p>
    `;

    console.error('Erro ao carregar movimentações:', error);
  }
}
