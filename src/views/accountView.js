
import {
  getAccountsData,
  registerAccount,
  editAccount,
  removeAccount
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

export async function renderAccounts(container, businessId, onBack) {
  container.replaceChildren();

  let editingAccountId = null;

  // Cabeçalho
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

  // Formulário
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

  // Nome
  const nameLabel = createElement(
    'label',
    'account-form__label',
    'Nome da conta'
  );

  const nameInput = createElement(
    'input',
    'account-form__input'
  );

  nameInput.type = 'text';
  nameInput.name = 'name';
  nameInput.placeholder = 'Ex.: Conta principal';
  nameInput.required = true;
  nameInput.maxLength = 60;

  nameLabel.appendChild(nameInput);

  // Tipo
  const typeLabel = createElement(
    'label',
    'account-form__label',
    'Tipo de conta'
  );

  const typeSelect = createElement(
    'select',
    'account-form__input'
  );

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

  // Saldo inicial
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

  // Botões do formulário
  const submitButton = createElement(
    'button',
    'account-form__submit',
    'Cadastrar conta'
  );

  submitButton.type = 'submit';

  const cancelButton = createElement(
    'button',
    'account-form__cancel',
    'Cancelar edição'
  );

  cancelButton.type = 'button';
  cancelButton.hidden = true;

  const feedback = createElement(
    'p',
    'account-form__feedback'
  );

  form.append(
    nameLabel,
    typeLabel,
    balanceLabel,
    submitButton,
    cancelButton,
    feedback
  );

  formSection.append(formTitle, form);

  // Listagem
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

  // Reseta o formulário e encerra a edição.
  function resetForm() {
    form.reset();

    editingAccountId = null;

    balanceInput.value = '0';

    formTitle.textContent = 'Cadastrar conta';
    submitButton.textContent = 'Cadastrar conta';
    cancelButton.hidden = true;
  }

  cancelButton.addEventListener('click', () => {
    resetForm();
    feedback.textContent = '';
  });

  // Prepara o formulário para editar uma conta.
  function startEditing(account) {
    editingAccountId = account.id;

    nameInput.value = account.name;
    typeSelect.value = account.type;

    balanceInput.value = (
      account.initialBalanceCents / 100
    ).toFixed(2).replace('.', ',');

    formTitle.textContent = 'Editar conta';
    submitButton.textContent = 'Salvar alterações';
    cancelButton.hidden = false;

    feedback.textContent = '';

    form.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  // Renderiza a listagem.
  function renderAccountList(accounts) {
    accountList.replaceChildren();

    if (accounts.length === 0) {
      accountList.appendChild(
        createElement(
          'p',
          'account-list__empty',
          'Nenhuma conta cadastrada.'
        )
      );

      return;
    }

    accounts.forEach(account => {
      const card = createElement(
        'article',
        'account-card'
      );

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

      const balanceLabel = createElement(
        'span',
        'account-card__balance-label',
        'Saldo atual'
      );

      const balance = createElement(
        'p',
        'account-card__balance',
        formatCurrency(account.balanceCents)
      );

      const actions = createElement(
        'div',
        'account-card__actions'
      );

      const editButton = createElement(
        'button',
        'account-card__edit',
        'Editar'
      );

      editButton.type = 'button';

      editButton.addEventListener('click', () => {
        startEditing(account);
      });

      const deleteButton = createElement(
        'button',
        'account-card__delete',
        'Excluir'
      );

      deleteButton.type = 'button';

      deleteButton.addEventListener('click', async () => {
        const confirmed = window.confirm(
          `Deseja realmente excluir a conta "${account.name}"?`
        );

        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;
        feedback.textContent = '';

        try {
          await removeAccount(account.id);

          if (editingAccountId === account.id) {
            resetForm();
          }

          feedback.textContent =
            'Conta excluída com sucesso.';

          await loadAccounts();
        } catch (error) {
          feedback.textContent = error.message;
          deleteButton.disabled = false;
        }
      });

      actions.append(editButton, deleteButton);

      card.append(
        name,
        type,
        balanceLabel,
        balance,
        actions
      );

      accountList.appendChild(card);
    });
  }

  // Atualiza a listagem.
  async function loadAccounts() {
    const accounts = await getAccountsData(businessId);

    renderAccountList(accounts);
  }

  // Carrega as contas iniciais.
  try {
    await loadAccounts();
  } catch (error) {
    console.error('Erro ao carregar contas:', error);

    feedback.textContent =
      'Não foi possível carregar as contas.';
  }

  // Cadastro ou edição.
  form.addEventListener('submit', async event => {
    event.preventDefault();

    feedback.textContent = '';
    submitButton.disabled = true;

    const formData = {
      name: nameInput.value,
      type: typeSelect.value,
      initialBalance: balanceInput.value
    };

    try {
      if (editingAccountId) {
        await editAccount(editingAccountId, formData);

        feedback.textContent =
          'Conta atualizada com sucesso.';
      } else {
        await registerAccount({
          businessId,
          ...formData
        });

        feedback.textContent =
          'Conta cadastrada com sucesso.';
      }

      resetForm();

      await loadAccounts();
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });
}
