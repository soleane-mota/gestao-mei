
import { registerBusiness } from '../viewmodels/onboardingViewModel';

export function renderOnboarding(container, onComplete) {
  container.innerHTML = `
    <section class="onboarding">
      <div class="onboarding__content">
        <h1>Bem-vindo!</h1>

        <p>
          Vamos começar cadastrando seu negócio.
          Essas informações serão utilizadas para organizar
          suas movimentações financeiras.
        </p>

        <form id="business-form">
          <div class="form-group">
            <label for="business-name">Nome do negócio</label>
            <input
              type="text"
              id="business-name"
              name="name"
              placeholder="Ex.: Minha Loja"
              required
              maxlength="100"
            >
          </div>

          <div class="form-group">
            <label for="business-document">
              CNPJ ou CPF
              <span>(opcional)</span>
            </label>

            <input
              type="text"
              id="business-document"
              name="document"
              placeholder="Digite seu CPF ou CNPJ"
              maxlength="18"
            >
          </div>

          <p
            id="onboarding-error"
            class="form-error"
            role="alert"
            hidden
          ></p>

          <button type="submit" id="submit-button">
            Cadastrar negócio
          </button>
        </form>
      </div>
    </section>
  `;

  const form = container.querySelector('#business-form');
  const errorMessage = container.querySelector('#onboarding-error');
  const submitButton = container.querySelector('#submit-button');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    errorMessage.hidden = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Cadastrando...';

    const formData = new FormData(form);

    try {
      await registerBusiness({
        name: formData.get('name'),
        document: formData.get('document')
      });

      if (typeof onComplete === 'function') {
        await onComplete();
      }
    } catch (error) {
      errorMessage.textContent =
        error.message || 'Não foi possível cadastrar o negócio.';

      errorMessage.hidden = false;

      submitButton.disabled = false;
      submitButton.textContent = 'Cadastrar negócio';
    }
  });
}
