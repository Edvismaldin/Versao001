import { api } from './api';
import { Platform } from 'react-native';

export type RespostaLogin = {
  accessToken: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
    ativo?: boolean;
    foto?: string | null;
  };
};

export interface UsuarioSessao {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  foto?: string | null;
}

export interface MeResposta {
  autenticado: boolean;
  usuario: UsuarioSessao;
}

export async function fazerLogin(email: string, senha: string) {
  const resposta = await api.post<RespostaLogin>('/autenticacao/login', {
    email,
    senha,
  });

  return resposta.data;
}

export async function obterUsuarioAtual() {
  const resposta =
    await api.get<MeResposta>(
      '/autenticacao/me',
    );

  return resposta.data;
}

export async function enviarFotoUsuario(origem: string | File) {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const ficheiro = typeof origem === 'string'
      ? await (await fetch(origem)).blob()
      : origem;
    const nomeArquivo = typeof origem === 'string' ? 'perfil.jpg' : origem.name;
    formData.append('foto', ficheiro, nomeArquivo);
  } else {
    const uri = origem as string;
    const nomeArquivo = uri.split('/').pop() ?? 'perfil.jpg';
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
    const tipo = extensao === 'png'
      ? 'image/png'
      : extensao === 'webp'
        ? 'image/webp'
        : 'image/jpeg';
    formData.append('foto', { uri, name: nomeArquivo, type: tipo } as any);
  }

  const resposta = await api.post<UsuarioSessao>(
    '/usuarios/me/foto',
    formData,
  );

  return resposta.data;
}

export async function solicitarAtivacaoEstudante(codigo: string, email: string) {
  const resposta = await api.post<{ mensagem: string; emailMascarado: string }>(
    '/autenticacao/estudante/solicitar-ativacao',
    { codigo, email },
  );
  return resposta.data;
}

export async function concluirAtivacaoEstudante(
  codigoEstudante: string,
  codigoAtivacao: string,
  senha: string,
  confirmarSenha: string,
) {
  const resposta = await api.post<{ mensagem: string }>(
    '/autenticacao/estudante/concluir-ativacao',
    {
      codigoEstudante,
      codigoAtivacao,
      senha,
      confirmarSenha,
    },
  );
  return resposta.data;
}
