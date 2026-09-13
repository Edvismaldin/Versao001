import { api } from './api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { buscarToken } from './sessao.service';
import { baixarPdfNaWeb } from './pdf-web.service';
import type { CartaoAcademico } from '../types/cartao';

export interface CriarCartaoDados {
  estudanteId: number;
  dataValidade?: string;
}

async function validarPdfBaixado(
  uri: string,
  status: number,
) {
  if (status !== 200) {
    throw new Error('O servidor não conseguiu gerar o PDF.');
  }

  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists || !info.size || info.size < 100) {
    throw new Error('O ficheiro PDF foi baixado incompleto.');
  }

  const inicio = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
    position: 0,
    length: 16,
  });

  // "%PDF-" em Base64 começa por "JVBERi0".
  if (!inicio.startsWith('JVBERi0')) {
    throw new Error('O servidor devolveu um conteúdo que não é PDF.');
  }
}

export async function abrirPdfCartoesLote(
  ids: number[],
) {
  const token = await buscarToken();

  if (!token) {
    throw new Error('SessÃ£o nÃ£o encontrada.');
  }

  const baseUrl = api.defaults.baseURL;

  if (!baseUrl) {
    throw new Error('Endereço do servidor indisponível.');
  }

  const parametroIds = ids.length
    ? `?ids=${ids.join(',')}`
    : '';

  const nomeArquivo =
    `cartoes-lote-${new Date()
      .toISOString()
      .slice(0, 10)}-${Date.now()}.pdf`;

  if (Platform.OS === 'web') {
    await baixarPdfNaWeb(
      `${baseUrl}/cartoes/pdf/lote${parametroIds}`,
      nomeArquivo,
      token,
    );
    return;
  }

  const cache = FileSystem.cacheDirectory;

  if (!cache) {
    throw new Error('Armazenamento temporário indisponível.');
  }

  const resposta = await FileSystem.downloadAsync(
    `${baseUrl}/cartoes/pdf/lote${parametroIds}`,
    `${cache}${nomeArquivo}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (resposta.status !== 200) {
    throw new Error('NÃ£o foi possÃ­vel baixar o PDF em lote.');
  }

  await validarPdfBaixado(
    resposta.uri,
    resposta.status,
  );

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('VisualizaÃ§Ã£o de PDF nÃ£o disponÃ­vel.');
  }

  await Sharing.shareAsync(resposta.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'CartÃµes acadÃ©micos para impressÃ£o',
  });
}

export interface QrCodeResposta {
  numeroCartao: string;
  urlValidacao: string;
  qrCode: string;
}

export interface HistoricoCartaoItem {
  id: number;
  numeroCartao: string;
  estado: string;
  dataEmissao: string;
  dataValidade?: string | null;
  bloqueadoEm?: string | null;
  motivoBloqueio?: string | null;
  cartaoAnteriorId?: number | null;
}

export interface HistoricoCartoesResposta {
  estudante: {
    id: number;
    codigo: string;
    nomeCompleto: string;
  };

  total: number;

  cartoes: HistoricoCartaoItem[];
}

export async function listarCartoes() {
  const resposta =
    await api.get<CartaoAcademico[]>('/cartoes');

  return resposta.data;
}

export async function obterQrCode(
  id: number,
) {
  const resposta =
    await api.get<QrCodeResposta>(
      `/cartoes/${id}/qrcode`,
    );

  return resposta.data;
}

export async function obterHistoricoCartoes(
  estudanteId: number,
) {
  const resposta =
    await api.get<HistoricoCartoesResposta>(
      `/cartoes/estudante/${estudanteId}/historico`,
    );

  return resposta.data;
}

export async function bloquearCartao(
  id: number,
  motivo: string,
) {
  const resposta = await api.patch(
    `/cartoes/${id}/bloquear`,
    { motivo },
  );

  return resposta.data;
}

export async function reemitirCartao(
  id: number,
  motivo: string,
) {
  const resposta = await api.patch(
    `/cartoes/${id}/reemitir`,
    { motivo },
  );

  return resposta.data;
}

export async function criarCartao(
  dados: CriarCartaoDados,
) {
  const resposta =
    await api.post<CartaoAcademico>(
      '/cartoes',
      dados,
    );

  return resposta.data;
}

export async function obterMeuCartao() {
  const resposta =
    await api.get<CartaoAcademico>(
      '/cartoes/meu-cartao',
    );

  return resposta.data;
}

export async function buscarMeuCartao() {
  const resposta = await api.get<CartaoAcademico>(
    '/cartoes/meu-cartao',
  );

  return resposta.data;
}

export async function abrirPdfCartao(
  id: number,
  numeroCartao: string,
) {
  const token = await buscarToken();

  if (!token) {
    throw new Error('Sessão não encontrada.');
  }

  const baseUrl = api.defaults.baseURL;

  if (!baseUrl) {
    throw new Error('Endereço do servidor indisponível.');
  }

  const nomeArquivo = `cartao-${numeroCartao}-${Date.now()}.pdf`.replace(
    /[^a-zA-Z0-9.-]/g,
    '-',
  );

  if (Platform.OS === 'web') {
    await baixarPdfNaWeb(
      `${baseUrl}/cartoes/${id}/pdf`,
      nomeArquivo,
      token,
    );
    return;
  }

  const cache = FileSystem.cacheDirectory;

  if (!cache) {
    throw new Error('Armazenamento temporário indisponível.');
  }

  const resposta = await FileSystem.downloadAsync(
    `${baseUrl}/cartoes/${id}/pdf`,
    `${cache}${nomeArquivo}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (resposta.status !== 200) {
    throw new Error('Não foi possível baixar o PDF do cartão.');
  }

  await validarPdfBaixado(
    resposta.uri,
    resposta.status,
  );

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Visualização de PDF não disponível.');
  }

  await Sharing.shareAsync(resposta.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Cartão académico para impressão',
  });
}
