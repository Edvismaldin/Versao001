import { api } from './api';
import type { Faculdade } from '../types/faculdade';

export interface CriarFaculdadeDados {
  nome: string;
  sigla: string;
  ativo?: boolean;
}

export async function listarFaculdades() {
  const resposta =
    await api.get<Faculdade[]>('/faculdades');

  return resposta.data;
}

export async function criarFaculdade(
  dados: CriarFaculdadeDados,
) {
  const resposta =
    await api.post<Faculdade>(
      '/faculdades',
      dados,
    );

  return resposta.data;
}

export async function atualizarFaculdade(
  id: number,
  dados: {
    nome?: string;
    sigla?: string;
    ativo?: boolean;
  },
) {
  const resposta = await api.patch<Faculdade>(
    `/faculdades/${id}`,
    dados,
  );

  return resposta.data;
}
