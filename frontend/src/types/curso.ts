import type { Faculdade } from './faculdade';

export interface Curso {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
  faculdadeId: number;
  faculdade: Faculdade;
  criadoEm: string;
  atualizadoEm: string;
}