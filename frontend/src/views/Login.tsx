import { useState } from 'react';
import axios from 'axios';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { fazerLogin } from '../services/autenticacao.service';
import { salvarToken } from '../services/sessao.service';
import type { UsuarioSessao } from '../services/autenticacao.service';
import { theme } from '../styles/theme';
import LogoUcm from '../components/brand/LogoUcm';

interface LoginProps {
  aoEntrar: (usuario: UsuarioSessao) => void | Promise<void>;
  onAtivarConta?: () => void;
}

export default function Login({ aoEntrar, onAtivarConta }: LoginProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      setMensagemErro('Preencha o e-mail institucional e a palavra-passe.');
      return;
    }

    try {
      setMensagemErro(null);
      setCarregando(true);
      const resposta = await fazerLogin(email.trim(), senha);
      await salvarToken(resposta.accessToken);

      await aoEntrar({
        ...resposta.usuario,
        ativo: resposta.usuario.ativo ?? true,
      });
    } catch (erro) {
      if (axios.isAxiosError(erro)) {
        if (erro.response?.status === 401) {
          setMensagemErro('E-mail ou palavra-passe incorretos.');
          return;
        }

        if (!erro.response) {
          setMensagemErro(
            'Não foi possível comunicar com o servidor. Confirme se o backend está ligado.',
          );
          return;
        }

        const mensagemServidor =
          typeof erro.response.data?.message === 'string'
            ? erro.response.data.message
            : 'O servidor não conseguiu concluir o início de sessão.';

        setMensagemErro(mensagemServidor);
        return;
      }
      setMensagemErro('Ocorreu um erro inesperado ao iniciar sessão.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={[styles.container, desktop && styles.containerDesktop]} keyboardShouldPersistTaps="handled">
      <View style={[styles.content, desktop && styles.contentDesktop]}>
        {/* Brand Badge Header */}
        <View style={[styles.brandHeader, desktop && styles.brandHeaderDesktop]}>
          <LogoUcm size={desktop ? 78 : 58} />
          <Text style={[styles.titulo, desktop && styles.tituloDesktop]}>UCM Cartão</Text>
          <Text style={[styles.subtitulo, desktop && styles.subtituloDesktop]}>
            Plataforma Digital de Cartões Académicos
          </Text>
          {desktop && (
            <>
              <View style={styles.linhaDourada} />
              <Text style={styles.mensagemDesktop}>
                Identidade académica, emissão de cartões e serviços institucionais num único portal seguro.
              </Text>
            </>
          )}
        </View>

        <View style={[styles.formColumn, desktop && styles.formColumnDesktop]}>
          {/* Card Form Container */}
          <View style={[styles.card, desktop && styles.cardDesktop]}>
            <Text style={styles.formEyebrow}>ACESSO INSTITUCIONAL</Text>
            <Text style={styles.formTitle}>Iniciar Sessão</Text>
            <Text style={styles.formDescription}>
              Utilize as credenciais associadas à sua conta UCM.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-mail institucional</Text>
              <TextInput
                style={styles.input}
                placeholder="nome@ucm.ac.mz"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={(valor) => {
                  setEmail(valor);
                  setMensagemErro(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Palavra-passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Introduza a sua palavra-passe"
                placeholderTextColor={theme.colors.textMuted}
                value={senha}
                onChangeText={(valor) => {
                  setSenha(valor);
                  setMensagemErro(null);
                }}
                secureTextEntry
                onSubmitEditing={() => void entrar()}
              />
            </View>

            {mensagemErro && (
              <View style={styles.erroBox} accessibilityRole="alert">
                <Text style={styles.erroTitulo}>Não foi possível entrar</Text>
                <Text style={styles.erroTexto}>{mensagemErro}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.botao,
                pressed && styles.botaoPressed,
                carregando && styles.botaoDisabled,
              ]}
              onPress={entrar}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color={theme.colors.textWhite} />
              ) : (
                <Text style={styles.textoBotao}>Entrar no portal</Text>
              )}
            </Pressable>
          </View>

          {/* Ativar Conta Banner */}
          {onAtivarConta && (
            <View style={styles.ativarBox}>
              <Text style={styles.ativarTextoAux}>Primeiro acesso de estudante?</Text>
              <Pressable
                onPress={onAtivarConta}
                style={({ pressed }) => [
                  styles.ativarBotao,
                  pressed && styles.ativarBotaoPressed,
                ]}
              >
                <Text style={styles.ativarBotaoTexto}>
                  Ativar conta académica →
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: 20,
  },

  erroBox: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1B8B8',
    borderRadius: 12,
    backgroundColor: '#FFF3F3',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  erroTitulo: {
    color: '#9F1D1D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  erroTexto: {
    color: '#7F1D1D',
    fontSize: 13,
    lineHeight: 19,
  },
  containerDesktop: {
    padding: 40,
    backgroundColor: '#EAF0F6',
  },

  content: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  contentDesktop: {
    maxWidth: 1120,
    minHeight: 650,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },

  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandHeaderDesktop: {
    flex: 1.1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 58,
    paddingVertical: 54,
    marginBottom: 0,
    backgroundColor: theme.colors.primary,
  },
  formColumn: {},
  formColumnDesktop: {
    flex: 0.9,
    justifyContent: 'center',
    padding: 50,
  },

  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.colors.gold,
    ...theme.shadows.md,
  },

  logoBadgeText: {
    color: theme.colors.gold,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },

  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  tituloDesktop: {
    color: '#FFFFFF',
    fontSize: 44,
    letterSpacing: -1.2,
    marginTop: 26,
  },

  subtitulo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  subtituloDesktop: {
    color: '#BFDBFE',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  linhaDourada: {
    width: 64,
    height: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.gold,
    marginTop: 32,
  },
  mensagemDesktop: {
    color: '#DBEAFE',
    fontSize: 17,
    lineHeight: 28,
    maxWidth: 410,
    marginTop: 24,
  },

  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  cardDesktop: {
    borderWidth: 0,
    padding: 0,
    shadowOpacity: 0,
    elevation: 0,
  },

  formEyebrow: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },

  formDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 25,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    minHeight: 54,
  },

  botao: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 10,
    ...theme.shadows.sm,
  },

  botaoPressed: {
    backgroundColor: theme.colors.primaryLight,
    transform: [{ scale: 0.99 }],
  },

  botaoDisabled: {
    opacity: 0.7,
  },

  textoBotao: {
    color: theme.colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },

  ativarBox: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: theme.colors.accentLight,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  ativarTextoAux: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },

  ativarBotao: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  ativarBotaoPressed: {
    opacity: 0.7,
  },

  ativarBotaoTexto: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
