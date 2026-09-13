import type { Estudante } from './estudante';

export interface CartaoAcademico {
  id: number;
  numeroCartao: string;
  qrToken: string;
  dataEmissao: string;
  dataValidade?: string | null;
  estado: string;
  estudanteId: number;
  estudante: Estudante;
  criadoEm: string;
  atualizadoEm: string;
}