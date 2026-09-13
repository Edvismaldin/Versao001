import type { Curso } from './curso';

export interface Estudante {
  id: number;
  codigo: string;
  nomeCompleto: string;
  email?: string | null;
  telefone?: string | null;
  dataNascimento?: string | null;
  sexo?: string | null;
  foto?: string | null;
  ativo: boolean;
  cursoId: number;
  curso: Curso;
  criadoEm: string;
  atualizadoEm: string;
}