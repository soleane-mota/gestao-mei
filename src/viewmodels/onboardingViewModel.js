
import {
  createBusiness,
  getBusiness
} from '../models/businessModel';

// Verifica se o usuário já realizou o cadastro inicial.
export async function checkOnboarding() {
  const business = await getBusiness();

  return {
    completed: Boolean(business),
    business
  };
}

// Cadastra o negócio informado pelo usuário.
export async function registerBusiness({ name, document = '' }) {
  if (!name?.trim()) {
    throw new Error('Informe o nome do negócio.');
  }

  const existingBusiness = await getBusiness();

  if (existingBusiness) {
    throw new Error('O negócio já está cadastrado.');
  }

  const business = await createBusiness(name, document);

  return {
    success: true,
    business
  };
}
