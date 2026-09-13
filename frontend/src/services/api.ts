import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

import {
  expirarSessao,
  obterToken,
} from './sessao.service';

function removerBarraFinal(valor: string) {
  return valor.replace(/\/+$/, '');
}

function obterHostDoAplicativo() {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined'
  ) {
    const hostWeb = window.location.hostname;

    return hostWeb === 'localhost'
      ? '127.0.0.1'
      : hostWeb || '127.0.0.1';
  }

  const urlBundle = NativeModules.SourceCode
    ?.scriptURL as string | undefined;

  const hostEncontrado = urlBundle?.match(
    /^(?:https?|exp):\/\/([^/:]+)/i,
  )?.[1];

  return hostEncontrado || 'localhost';
}

const apiConfigurada =
  process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = removerBarraFinal(
  apiConfigurada ||
    `http://${obterHostDoAplicativo()}:3001`,
);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export function montarUrlArquivo(
  caminho?: string | null,
) {
  if (!caminho) {
    return null;
  }

  if (caminho.startsWith('http')) {
    return caminho;
  }

  return `${API_BASE_URL}${caminho}`;
}

api.interceptors.request.use(
  async (config) => {
    const token = await obterToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (erro) => {
    return Promise.reject(erro);
  },
);

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    if (erro.response?.status === 401) {
      await expirarSessao();
    }

    return Promise.reject(erro);
  },
);

export default api;