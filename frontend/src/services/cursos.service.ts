import { api } from './api';
import type { Curso } from '../types/curso';

export interface CriarCursoDados {
  nome: string;
  codigo: string;
  faculdadeId: number;
}

export async function listarCursos() {
  const resposta =
    await api.get<Curso[]>('/cursos');

  return resposta.data;
}

export async function criarCurso(
  dados: CriarCursoDados,
) {
  const resposta =
    await api.post<Curso>(
      '/cursos',
      dados,
    );

  return resposta.data;
}

export async function atualizarCurso(
  id: number,
  dados: {
    nome?: string;
    codigo?: string;
    faculdadeId?: number;
    ativo?: boolean;
  },
) {
  const resposta = await api.patch<Curso>(
    `/cursos/${id}`,
    dados,
  );

  return resposta.data;
}
