import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVE_TOKEN = 'ucm_card_access_token';

let aoSessaoExpirar:
  (() => void) | null = null;

export async function salvarToken(
  token: string,
) {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(CHAVE_TOKEN, token);
    return;
  }

  await SecureStore.setItemAsync(
    CHAVE_TOKEN,
    token,
  );
}

export async function obterToken() {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(CHAVE_TOKEN);
  }

  return SecureStore.getItemAsync(
    CHAVE_TOKEN,
  );
}

// Alias semântico usado pelos serviços que precisam autenticar um download.
export const buscarToken = obterToken;

export async function removerToken() {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(CHAVE_TOKEN);
    return;
  }

  await SecureStore.deleteItemAsync(
    CHAVE_TOKEN,
  );
}

export function definirEventoSessaoExpirada(
  callback: (() => void) | null,
) {
  aoSessaoExpirar = callback;
}

export async function expirarSessao() {
  await removerToken();

  if (aoSessaoExpirar) {
    aoSessaoExpirar();
  }
}
