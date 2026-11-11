
import {
  getTransactionFormData,
  getTransactionsData,
  registerTransaction,
  editTransaction,
  removeTransaction
} from '../viewmodels/transactionViewModel';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

function formatCurrency(value) {
  return currencyFormatter.format(value / 100);
}

function formatDate(date) {
  const [year, month, day] = date.split('-');

  return dateFormatter.format(
    new Date(Number(year), Number(month) - 1, Number(day))
  );
}

function createElement(tag, className, text = '') {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function renderTransactions(container, businessId, onBack) {
  container.replaceChildren();

  let accounts = [];
  let categories = [];
  let editingTransactionId = null;

  // Cabeçalho
  const header = createElement('header', 'transaction-header');

  const title = createElement(
    'h1',
    'transaction-header__title',
    'Movimentações'
  );

  const backButton = createElement(
    'button',
    'transaction-header__back',
    'Voltar ao Dashboard'
  );

  backButton.type = 'button';

  backButton.addEventListener('click', () => {
    if (typeof onBack === 'function') {
      onBack();
    }
  });

  header.append(title, backButton);

  // Formulário
  const formSection = createElement(
    'section',
    'transaction-form-section'
  );

  const formTitle = createElement(
    'h2',
    'transaction-form-section__title',
    'Nova movimentação'
  );

  const form = createElement('form', 'transaction-form');

  // Tipo
  const typeLabel = createElement(
    'label',
    'transaction-form__label',
    'Tipo'
  );

  const typeSelect = createElement(
    'select',
    'transaction-form__input'
  );

  typeSelect.name = 'type';
  typeSelect.required = true;

  [
    { value: 'income', label: 'Receita' },
    { value: 'expense', label: 'Despesa' }
  ].forEach(option => {
    const optionElement = createElement(
      'option',
      '',
      option.label
    );

    optionElement.value = option.value;
    typeSelect.appendChild(optionElement);
  });

  typeLabel.appendChild(typeSelect);

  // Descrição
  const descriptionLabel = createElement(
    'label',
    'transaction-form__label',
    'Descrição'
  );

  const descriptionInput = createElement(
    'input',
    'transaction-form__input'
  );

  descriptionInput.type = 'text';
  descriptionInput.name = 'description';
  descriptionInput.required = true;
  descriptionInput.maxLength = 100;
  descriptionInput.placeholder = 'Ex.: Venda de produtos';

  descriptionLabel.appendChild(descriptionInput);

  // Valor
  const amountLabel = createElement(
    'label',
    'transaction-form__label',
    'Valor (R$)'
  );

  const amountInput = createElement(
    'input',
    'transaction-form__input'
  );

  amountInput.type = 'text';
  amountInput.name = 'amount';
  amountInput.inputMode = 'decimal';
  amountInput.placeholder = 'Ex.: 150,00';
  amountInput.required = true;

  amountLabel.appendChild(amountInput);

  // Conta
  const accountLabel = createElement(
    'label',
    'transaction-form__label',
    'Conta'
  );

  const accountSelect = createElement(
    'select',
    'transaction-form__input'
  );

  accountSelect.name = 'accountId';
  accountSelect.required = true;

  accountLabel.appendChild(accountSelect);

  // Categoria
  const categoryLabel = createElement(
    'label',
    'transaction-form__label',
    'Categoria'
  );

  const categorySelect = createElement(
    'select',
    'transaction-form__input'
  );

  categorySelect.name = 'categoryId';

  categoryLabel.appendChild(categorySelect);

  // Data
  const dateLabel = createElement(
    'label',
    'transaction-form__label',
    'Data'
  );

  const dateInput = createElement(
    'input',
    'transaction-form__input'
  );

  dateInput.type = 'date';
  dateInput.name = 'date';
  dateInput.required = true;
  dateInput.value = getTodayDate();

  dateLabel.appendChild(dateInput);

  // Botões
  const submitButton = createElement(
    'button',
    'transaction-form__submit',
    'Cadastrar movimentação'
  );

  submitButton.type = 'submit';

  const cancelButton = createElement(
    'button',
    'transaction-form__cancel',
    'Cancelar edição'
  );

  cancelButton.type = 'button';
  cancelButton.hidden = true;

  const feedback = createElement(
    'p',
    'transaction-form__feedback'
  );

  form.append(
    typeLabel,
    descriptionLabel,
    amountLabel,
    accountLabel,
    categoryLabel,
    dateLabel,
    submitButton,
    cancelButton,
    feedback
  );

  formSection.append(formTitle, form);

  // Listagem
  const listSection = createElement(
    'section',
    'transaction-list-section'
  );

  const listTitle = createElement(
    'h2',
    'transaction-list-section__title',
    'Movimentações cadastradas'
  );

  const transactionList = createElement(
    'div',
    'transaction-list'
  );

  listSection.append(listTitle, transactionList);

  container.append(header, formSection, listSection);

  // Popula o campo de contas.
  function populateAccounts() {
    accountSelect.replaceChildren();

    accounts.forEach(account => {
      const option = createElement(
        'option',
        '',
        account.name
      );

      option.value = account.id;
      accountSelect.appendChild(option);
    });
  }

  // Atualiza as categorias conforme o tipo selecionado.
  function updateCategories() {
    categorySelect.replaceChildren();

    const emptyOption = createElement(
      'option',
      '',
      'Sem categoria'
    );

    emptyOption.value = '';
    categorySelect.appendChild(emptyOption);

    const filteredCategories = categories.filter(
      category => category.type === typeSelect.value
    );

    filteredCategories.forEach(category => {
      const option = createElement(
        'option',
        '',
        category.name
      );

      option.value = category.id;
      categorySelect.appendChild(option);
    });
  }

  typeSelect.addEventListener('change', updateCategories);

  // Limpa o formulário e encerra o modo de edição.
  function resetForm() {
    form.reset();

    editingTransactionId = null;

    typeSelect.value = 'income';
    dateInput.value = getTodayDate();

    updateCategories();

    formTitle.textContent = 'Nova movimentação';
    submitButton.textContent = 'Cadastrar movimentação';
    cancelButton.hidden = true;
  }

  cancelButton.addEventListener('click', () => {
    resetForm();
    feedback.textContent = '';
  });

  // Prepara o formulário para editar uma movimentação.
  function startEditing(transaction) {
    editingTransactionId = transaction.id;

    typeSelect.value = transaction.type;
    updateCategories();

    descriptionInput.value = transaction.description;

    amountInput.value = (transaction.amountCents / 100)
      .toFixed(2)
      .replace('.', ',');

    accountSelect.value = transaction.accountId;
    categorySelect.value = transaction.categoryId || '';

    dateInput.value = transaction.date;

    formTitle.textContent = 'Editar movimentação';
    submitButton.textContent = 'Salvar alterações';
    cancelButton.hidden = false;

    feedback.textContent = '';

    form.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  // Cria os elementos de cada movimentação.
  function renderTransactionList(transactions) {
    transactionList.replaceChildren();

    if (transactions.length === 0) {
      transactionList.appendChild(
        createElement(
          'p',
          'transaction-list__empty',
          'Nenhuma movimentação cadastrada.'
        )
      );

      return;
    }

    transactions.forEach(transaction => {
      const card = createElement(
        'article',
        'transaction-card'
      );

      const description = createElement(
        'h3',
        'transaction-card__description',
        transaction.description
      );

      const details = createElement(
        'p',
        'transaction-card__details',
        `${transaction.accountName} • ${transaction.categoryName} • ${formatDate(transaction.date)}`
      );

      const amount = createElement(
        'p',
        `transaction-card__amount transaction-card__amount--${transaction.type}`,
        `${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amountCents)}`
      );

      const actions = createElement(
        'div',
        'transaction-card__actions'
      );

      const editButton = createElement(
        'button',
        'transaction-card__edit',
        'Editar'
      );

      editButton.type = 'button';

      editButton.addEventListener('click', () => {
        startEditing(transaction);
      });

      const deleteButton = createElement(
        'button',
        'transaction-card__delete',
        'Excluir'
      );

      deleteButton.type = 'button';

      deleteButton.addEventListener('click', async () => {
        const confirmed = window.confirm(
          `Deseja realmente excluir a movimentação "${transaction.description}"?`
        );

        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;

        try {
          await removeTransaction(transaction.id);

          if (editingTransactionId === transaction.id) {
            resetForm();
          }

          feedback.textContent = 'Movimentação excluída com sucesso.';

          await loadTransactions();
        } catch (error) {
          feedback.textContent = error.message;
          deleteButton.disabled = false;
        }
      });

      actions.append(editButton, deleteButton);

      card.append(
        description,
        details,
        amount,
        actions
      );

      transactionList.appendChild(card);
    });
  }

  // Atualiza a listagem.
  async function loadTransactions() {
    const transactions = await getTransactionsData(businessId);

    renderTransactionList(transactions);
  }

  // Carrega os dados iniciais.
  try {
    const formData = await getTransactionFormData(businessId);

    accounts = formData.accounts;
    categories = formData.categories;

    populateAccounts();
    updateCategories();

    if (accounts.length === 0) {
      feedback.textContent =
        'Cadastre uma conta antes de registrar movimentações.';

      submitButton.disabled = true;
    }

    await loadTransactions();
  } catch (error) {
    console.error('Erro ao carregar movimentações:', error);

    feedback.textContent =
      'Não foi possível carregar as movimentações.';
  }

  // Cadastro ou edição.
  form.addEventListener('submit', async event => {
    event.preventDefault();

    feedback.textContent = '';
    submitButton.disabled = true;

    const formData = {
      type: typeSelect.value,
      description: descriptionInput.value,
      amount: amountInput.value,
      accountId: accountSelect.value,
      categoryId: categorySelect.value,
      date: dateInput.value
    };

    try {
      if (editingTransactionId) {
        await editTransaction(editingTransactionId, formData);

        feedback.textContent =
          'Movimentação atualizada com sucesso.';
      } else {
        await registerTransaction(formData);

        feedback.textContent =
          'Movimentação cadastrada com sucesso.';
      }

      resetForm();

      await loadTransactions();
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      submitButton.disabled = accounts.length === 0;
    }
  });
}
