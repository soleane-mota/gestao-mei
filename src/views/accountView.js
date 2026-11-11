
import {
  getAccountsData,
  registerAccount
} from '../viewmodels/accountViewModel';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

function formatCurrency(value) {
  return currencyFormatter.format(value / 100);
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

function getAccountTypeLabel(type) {
  const labels = {
    cash: 'Dinheiro',
    bank: 'Conta bancária',
    digital: 'Carteira digital'
  };

  return labels[type] || 'Não informado';
}

function renderAccountList(accounts, container) {
  container.replaceChildren();

  if (accounts.length === 0) {
    const emptyMessage = createElement(
      'p',
      'account-list__empty',
      'Nenhuma conta cadastrada.'
    );

    container.appendChild(emptyMessage);
    return;
  }

  accounts.forEach(account => {
    const card = createElement('article', 'account-card');

    const name = createElement(
      'h3',
      'account-card__name',
      account.name
    );

    const type = createElement(
      'p',
      'account-card__type',
      getAccountTypeLabel(account.type)
    );

    const balance = createElement(
      'p',
      'account-card__balance',
      formatCurrency(account.balanceCents)
    );

    const balanceLabel = createElement(
      'span',
      'account-card__balance-label',
      'Saldo atual'
    );

    card.append(name, type, balanceLabel, balance);
    container.appendChild(card);
  });
}

export async function renderAccounts(container, businessId, onBack) {
  container.replaceChildren();

  const header = createElement('header', 'account-header');

  const title = createElement(
    'h1',
    'account-header__title',
    'Minhas contas'
  );

  const backButton = createElement(
    'button',
    'account-header__back',
    'Voltar ao Dashboard'
  );

  backButton.type = 'button';

  backButton.addEventListener('click', () => {
    if (typeof onBack === 'function') {
      onBack();
    }
  });

  header.append(title, backButton);

  const formSection = createElement(
    'section',
    'account-form-section'
  );

  const formTitle = createElement(
    'h2',
    'account-form-section__title',
    'Cadastrar conta'
  );

  const form = createElement('form', 'account-form');

  const nameLabel = createElement(
    'label',
    'account-form__label',
    'Nome da conta'
  );

  const nameInput = createElement('input', 'account-form__input');
  nameInput.type = 'text';
  nameInput.name = 'name';
  nameInput.placeholder = 'Ex.: Conta principal';
  nameInput.required = true;
  nameInput.maxLength = 60;

  nameLabel.appendChild(nameInput);

  const typeLabel = createElement(
    'label',
    'account-form__label',
    'Tipo de conta'
  );

  const typeSelect = createElement('select', 'account-form__input');
  typeSelect.name = 'type';
  typeSelect.required = true;

  const typeOptions = [
    { value: '', label: 'Selecione o tipo' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'bank', label: 'Conta bancária' },
    { value: 'digital', label: 'Carteira digital' }
  ];

  typeOptions.forEach(option => {
    const optionElement = createElement(
      'option',
      '',
      option.label
    );

    optionElement.value = option.value;
    typeSelect.appendChild(optionElement);
  });

  typeLabel.appendChild(typeSelect);

  const balanceLabel = createElement(
    'label',
    'account-form__label',
    'Saldo inicial (R$)'
  );

  const balanceInput = createElement(
    'input',
    'account-form__input'
  );

  balanceInput.type = 'text';
  balanceInput.name = 'initialBalance';
  balanceInput.placeholder = 'Ex.: 500,00';
  balanceInput.inputMode = 'decimal';
  balanceInput.value = '0';

  balanceLabel.appendChild(balanceInput);

  const submitButton = createElement(
    'button',
    'account-form__submit',
    'Cadastrar conta'
  );

  submitButton.type = 'submit';

  const feedback = createElement('p', 'account-form__feedback');

  form.append(
    nameLabel,
    typeLabel,
    balanceLabel,
    submitButton,
    feedback
  );

  formSection.append(formTitle, form);

  const listSection = createElement(
    'section',
    'account-list-section'
  );

  const listTitle = createElement(
    'h2',
    'account-list-section__title',
    'Contas cadastradas'
  );

  const accountList = createElement(
    'div',
    'account-list'
  );

  listSection.append(listTitle, accountList);

  container.append(header, formSection, listSection);

  async function loadAccounts() {
    const accounts = await getAccountsData(businessId);

    renderAccountList(accounts, accountList);
  }

  try {
    await loadAccounts();
  } catch (error) {
    console.error('Erro ao carregar contas:', error);

    feedback.textContent = 'Não foi possível carregar as contas.';
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    feedback.textContent = '';
    submitButton.disabled = true;

    try {
      await registerAccount({
        businessId,
        name: nameInput.value,
        type: typeSelect.value,
        initialBalance: balanceInput.value
      });

      form.reset();
      balanceInput.value = '0';

      feedback.textContent = 'Conta cadastrada com sucesso.';

      await loadAccounts();
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });
}
