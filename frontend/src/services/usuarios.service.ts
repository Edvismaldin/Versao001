import { api } from './api';

export type PerfilOperacional =
  | 'PROFESSOR'
  | 'OPERADOR_CARTAO'
  | 'RESPONSAVEL';

export interface CriarUsuarioDados {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilOperacional;
}

export interface UsuarioCriado {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilOperacional | 'ADMIN' | 'ESTUDANTE';
  ativo: boolean;
  foto?: string | null;
}

export interface AtualizarUsuarioDados {
  nome?: string;
  email?: string;
  senha?: string;
  perfil?: PerfilOperacional;
  ativo?: boolean;
}

export async function criarUsuario(
  dados: CriarUsuarioDados,
) {
  const resposta = await api.post<UsuarioCriado>('/usuarios', dados);
  return resposta.data;
}

export async function listarUsuarios() {
  return (await api.get<UsuarioCriado[]>('/usuarios')).data;
}

export async function atualizarUsuario(id: number, dados: AtualizarUsuarioDados) {
  return (await api.patch<UsuarioCriado>(`/usuarios/${id}`, dados)).data;
}

export async function eliminarUsuario(id: number) {
  return (await api.delete(`/usuarios/${id}`)).data;
}
