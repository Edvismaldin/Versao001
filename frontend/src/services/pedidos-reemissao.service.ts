import { api } from './api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { buscarToken } from './sessao.service';
import { baixarPdfNaWeb } from './pdf-web.service';

export interface PedidoReemissao {
  id: number;
  motivo: string;
  documento?: string | null;
  estado: string;
  observacao?: string | null;
  analisadoEm?: string | null;
  concluidoEm?: string | null;
  criadoEm: string;

  cartao: {
    id: number;
    numeroCartao: string;
    estado: string;
    dataEmissao?: string;
    dataValidade?: string | null;
  };

  responsavel?: {
    nome: string;
  } | null;
}

export async function criarPedidoReemissao(
  cartaoId: number,
  motivo: string,
) {
  const resposta = await api.post(
    '/pedidos-reemissao',
    {
      cartaoId,
      motivo,
    },
  );

  return resposta.data;
}

export async function enviarDocumentoReemissao(
  pedidoId: number,
  documento: {
    uri: string;
    name: string;
    mimeType?: string;
  },
) {
  const formData = new FormData();

  formData.append(
    'documento',
    {
      uri: documento.uri,
      name: documento.name,
      type:
        documento.mimeType ??
        'application/pdf',
    } as any,
  );

  const resposta = await api.post(
    `/pedidos-reemissao/${pedidoId}/documento`,
    formData,
  );

  return resposta.data;
}

export async function listarMeusPedidos() {
  const resposta =
    await api.get<PedidoReemissao[]>(
      '/pedidos-reemissao/meus-pedidos',
    );

  return resposta.data;
}

export interface PedidoResponsavel {
  id: number;
  motivo: string;
  documento?: string | null;
  estado: string;
  observacao?: string | null;
  localLevantamento?: string | null;
  prontoEm?: string | null;
  entregueEm?: string | null;
  analisadoEm?: string | null;
  concluidoEm?: string | null;
  criadoEm: string;

  estudante: {
    id: number;
    codigo: string;
    nomeCompleto: string;
    email?: string | null;
  };

  cartao: {
    id: number;
    numeroCartao: string;
    estado: string;
  };

  responsavel?: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
  } | null;
}

export async function listarPedidosPendentes() {
  const resposta =
    await api.get<PedidoResponsavel[]>(
      '/pedidos-reemissao/pendentes',
    );

  return resposta.data;
}

export async function iniciarAnalisePedido(
  pedidoId: number,
) {
  const resposta = await api.patch(
    `/pedidos-reemissao/${pedidoId}/iniciar-analise`,
    {},
  );

  return resposta.data;
}

export async function aprovarPedido(
  pedidoId: number,
  observacao?: string,
) {
  const resposta = await api.patch(
    `/pedidos-reemissao/${pedidoId}/aprovar`,
    {
      observacao,
    },
  );

  return resposta.data;
}

export async function rejeitarPedido(
  pedidoId: number,
  observacao: string,
) {
  const resposta = await api.patch(
    `/pedidos-reemissao/${pedidoId}/rejeitar`,
    {
      observacao,
    },
  );

  return resposta.data;
}

export async function marcarPedidoComoPronto(
  pedidoId: number,
  localLevantamento: string,
) {
  const resposta = await api.patch(
    `/pedidos-reemissao/${pedidoId}/pronto`,
    {
      localLevantamento,
    },
  );

  return resposta.data;
}

export async function marcarPedidoComoEntregue(
  pedidoId: number,
) {
  const resposta = await api.patch(
    `/pedidos-reemissao/${pedidoId}/entregar`,
    {},
  );

  return resposta.data;
}

export async function buscarTodosPedidos() {
  const resposta = await api.get('/pedidos-reemissao');
  return resposta.data;
}

/**
 * Endereço do documento privado. Não deve ser aberto diretamente pelo
 * navegador, pois o endpoint exige o JWT no cabeçalho Authorization.
 */
export function obterUrlDocumento(
  pedidoId: number,
) {
  return `${api.defaults.baseURL}/pedidos-reemissao/${pedidoId}/documento`;
}

/**
 * Obtém o PDF com o interceptor autenticado do Axios. A tela grava o arquivo
 * localmente e o entrega ao visualizador/partilha do dispositivo.
 */
export async function baixarDocumentoPedido(
  pedidoId: number,
) {
  const resposta = await api.get<ArrayBuffer>(
    `/pedidos-reemissao/${pedidoId}/documento`,
    {
      responseType: 'arraybuffer',
    },
  );

  return resposta.data;
}

/** Baixa e abre um documento privado com o JWT explicitamente no cabeçalho. */
export async function abrirDocumentoPedido(
  pedidoId: number,
) {
  const token = await buscarToken();

  if (!token) {
    throw new Error('Sessão não encontrada.');
  }

  const baseUrl = api.defaults.baseURL;

  if (!baseUrl) {
    throw new Error('Endereço do servidor indisponível.');
  }

  const nomeArquivo = `reemissao-${pedidoId}.pdf`;

  if (Platform.OS === 'web') {
    await baixarPdfNaWeb(
      `${baseUrl}/pedidos-reemissao/${pedidoId}/documento`,
      nomeArquivo,
      token,
    );
    return;
  }

  const cache = FileSystem.cacheDirectory;

  if (!cache) {
    throw new Error('Armazenamento temporário indisponível.');
  }

  const caminho = `${cache}${nomeArquivo}`;
  const resposta = await FileSystem.downloadAsync(
    `${baseUrl}/pedidos-reemissao/${pedidoId}/documento`,
    caminho,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (resposta.status !== 200) {
    throw new Error('Não foi possível baixar o documento.');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Visualização de documentos não disponível.');
  }

  await Sharing.shareAsync(resposta.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Documento de reemissão',
  });
}

export const iniciarAnalise = iniciarAnalisePedido;
export const marcarPronto = marcarPedidoComoPronto;
export const marcarEntregue = marcarPedidoComoEntregue;

export const solicitarReemissao = criarPedidoReemissao;
export const buscarMeusPedidos = listarMeusPedidos;
