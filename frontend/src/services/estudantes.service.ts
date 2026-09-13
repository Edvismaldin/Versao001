import { api } from './api';
import type { Estudante } from '../types/estudante';
import { Platform } from 'react-native';

export interface EstudanteDados {
  codigo?: string;
  nomeCompleto: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  sexo?: string;
  cursoId: number;
}

export async function listarEstudantes() {
  const resposta =
    await api.get<Estudante[]>('/estudantes');

  return resposta.data;
}

export async function criarEstudante(
  dados: EstudanteDados,
) {
  const resposta =
    await api.post<Estudante>(
      '/estudantes',
      dados,
    );

  return resposta.data;
}

export async function atualizarEstudante(
  id: number,
  dados: Partial<EstudanteDados> & {
    ativo?: boolean;
  },
) {
  const resposta =
    await api.patch<Estudante>(
      `/estudantes/${id}`,
      dados,
    );

  return resposta.data;
}

export async function enviarFotoEstudante(
  id: number,
  origem: string | File,
) {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const ficheiro =
      typeof origem === 'string'
        ? await (await fetch(origem)).blob()
        : origem;
    const nomeArquivo =
      typeof origem === 'string'
        ? `estudante-${id}.jpg`
        : origem.name;

    formData.append('foto', ficheiro, nomeArquivo);
  } else {
    const uri = origem as string;

    const nomeArquivo =
      uri.split('/').pop() ??
      `estudante-${id}.jpg`;

  const extensao =
    nomeArquivo.split('.').pop()?.toLowerCase();

  const tipo =
    extensao === 'png'
      ? 'image/png'
      : extensao === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

    formData.append(
      'foto',
      {
        uri,
        name: nomeArquivo,
        type: tipo,
      } as any,
    );
  }

  const resposta = await api.post(
    `/estudantes/${id}/foto`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return resposta.data;
}
