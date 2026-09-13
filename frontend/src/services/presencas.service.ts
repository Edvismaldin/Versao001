import { api } from './api';

export type Presenca = {
  id: number;
  registadaEm: string;
  estado: 'PRESENTE' | 'ATRASADO' | 'NAO_ADMITIDO';
  minutosAtraso: number;
  estudante: { id: number; codigo: string; nomeCompleto: string };
};

export type SessaoPresenca = {
  id: number;
  disciplina: string;
  turma?: string | null;
  tipo: 'AULA' | 'TESTE';
  horaInicio: string;
  toleranciaMinutos: number;
  limiteEntradaMinutos: number;
  duracaoMinutos?: number | null;
  abertaEm: string;
  fechadaEm?: string | null;
  presencas?: Presenca[];
  _count?: { presencas: number };
};

export type ConfiguracaoSessaoPresenca = {
  tipo: 'AULA' | 'TESTE';
  horaInicio: string;
  toleranciaMinutos: number;
  limiteEntradaMinutos: number;
  duracaoMinutos?: number;
};

export async function abrirSessaoPresenca(
  disciplina: string,
  turma?: string,
  configuracao?: ConfiguracaoSessaoPresenca,
) {
  return (await api.post<SessaoPresenca>('/presencas/sessoes', {
    disciplina,
    turma,
    ...configuracao,
  })).data;
}

export async function listarSessoesPresenca() {
  return (await api.get<SessaoPresenca[]>('/presencas/sessoes')).data;
}

export async function registarPresenca(sessaoId: number, qrCode: string) {
  return (await api.post<{ mensagem: string; presenca: Presenca }>(
    `/presencas/sessoes/${sessaoId}/registos`, { qrCode },
  )).data;
}

export async function buscarSessaoPresenca(sessaoId: number) {
  return (await api.get<SessaoPresenca>(`/presencas/sessoes/${sessaoId}`)).data;
}

export async function fecharSessaoPresenca(sessaoId: number) {
  return (await api.patch<SessaoPresenca>(`/presencas/sessoes/${sessaoId}/fechar`)).data;
}
