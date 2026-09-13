import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  abrirPdfCartao,
  buscarMeuCartao,
  obterQrCode,
} from '../services/cartoes.service';
import CartaoFrente from '../components/cartao/CartaoFrente';
import CartaoVerso from '../components/cartao/CartaoVerso';
import { theme } from '../styles/theme';

type Cartao = {
  id: number;
  numeroCartao: string;
  estado: string;
  dataEmissao: string;
  dataValidade?: string | null;

  estudante: {
    id: number;
    codigo: string;
    nomeCompleto: string;
    foto?: string | null;

    curso?: {
      nome: string;

      faculdade?: {
        nome: string;
        sigla: string;
      };
    };
  };
};

type Props = {
  onVoltar: () => void;
  onSolicitarReemissao?: (cartaoId: number) => void;
};

export default function MeuCartao({
  onVoltar,
  onSolicitarReemissao,
}: Props) {
  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'frente' | 'verso'>('frente');
  const [qrCode, setQrCode] = useState<string | null>(null);

  async function carregarCartao() {
    try {
      setCarregando(true);
      setErro('');
      const dados = await buscarMeuCartao();
      setCartao(dados);
      try {
        const qr = await obterQrCode(dados.id);
        setQrCode(qr.qrCode);
      } catch {
        setQrCode(null);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setErro(
          'Ainda não existe um cartão académico emitido para esta conta.',
        );
      } else {
        setErro(
          error?.response?.data?.message ??
            'Não foi possível carregar o cartão.',
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCartao();
  }, []);

  async function gerarPdfImpressao() {
    if (!cartao) {
      return;
    }

    try {
      await abrirPdfCartao(
        cartao.id,
        cartao.numeroCartao,
      );
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível gerar o PDF do cartão.',
      );
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.carregandoText}>A carregar o seu cartão...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centroErro}>
        <View style={styles.erroCard}>
          <Text style={styles.erroIcone}>⚠️</Text>
          <Text style={styles.erroTexto}>{erro}</Text>

          <Pressable style={styles.botaoRecarregar} onPress={carregarCartao}>
            <Text style={styles.textoBotaoRecarregar}>Tentar Novamente</Text>
          </Pressable>

          <Pressable style={styles.botaoVoltarErro} onPress={onVoltar}>
            <Text style={styles.textoVoltarErro}>← Voltar ao painel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!cartao) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable style={styles.btnVoltarTop} onPress={onVoltar}>
          <Text style={styles.txtVoltarTop}>← Voltar ao painel</Text>
        </Pressable>

        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.titulo}>Cartão Digital</Text>
            <Text style={styles.subtitulo}>Universidade Católica de Moçambique</Text>
          </View>

          <View
            style={[
              styles.badgeEstado,
              cartao.estado === 'ATIVO'
                ? styles.badgeAtivo
                : styles.badgeInativo,
            ]}
          >
            <Text
              style={[
                styles.badgeEstadoTexto,
                cartao.estado === 'ATIVO'
                  ? styles.txtAtivo
                  : styles.txtInativo,
              ]}
            >
              {cartao.estado}
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Control Switch (Frente / Verso) */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, abaAtiva === 'frente' && styles.tabButtonActive]}
          onPress={() => setAbaAtiva('frente')}
        >
          <Text
            style={[
              styles.tabText,
              abaAtiva === 'frente' && styles.tabTextActive,
            ]}
          >
            💳 Vista da Frente
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, abaAtiva === 'verso' && styles.tabButtonActive]}
          onPress={() => setAbaAtiva('verso')}
        >
          <Text
            style={[
              styles.tabText,
              abaAtiva === 'verso' && styles.tabTextActive,
            ]}
          >
            📱 Vista do Verso (QR)
          </Text>
        </Pressable>
      </View>

      {/* Card Visual Presentation Box */}
      <View style={styles.cardWrapper}>
        {abaAtiva === 'frente' ? (
          <CartaoFrente cartao={cartao} />
        ) : (
          <CartaoVerso cartao={cartao} qrCode={qrCode ?? undefined} />
        )}
      </View>

      {/* Detailed Info Sheet */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitulo}>Ficha do Cartão Académico</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>NÚMERO DE SÉRIE</Text>
            <Text style={styles.infoValorHighlight}>{cartao.numeroCartao}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>ESTUDANTE</Text>
            <Text style={styles.infoValor}>{cartao.estudante.nomeCompleto}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>CÓDIGO DE ESTUDANTE</Text>
            <Text style={styles.infoValor}>{cartao.estudante.codigo}</Text>
          </View>

          {cartao.estudante.curso && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>CURSO / FACULDADE</Text>
              <Text style={styles.infoValor}>
                {cartao.estudante.curso.nome}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <Pressable
        style={({ pressed }) => [
          styles.botaoPdf,
          pressed && styles.botaoPressed,
        ]}
        onPress={gerarPdfImpressao}
      >
        <Text style={styles.textoBotaoPdf}>
          PDF para impressão
        </Text>
      </Pressable>

      {onSolicitarReemissao && (
        <Pressable
          style={({ pressed }) => [
            styles.botaoReemissao,
            pressed && styles.botaoPressed,
          ]}
          onPress={() => onSolicitarReemissao(cartao.id)}
        >
          <Text style={styles.textoBotaoReemissao}>
            Solicitar 2ª Via do Cartão
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },

  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },

  carregandoText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  centroErro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },

  erroCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
    maxWidth: 380,
  },

  erroIcone: {
    fontSize: 36,
    marginBottom: 10,
  },

  erroTexto: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },

  botaoRecarregar: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 12,
  },

  textoBotaoRecarregar: {
    color: theme.colors.textWhite,
    fontWeight: '700',
  },

  botaoVoltarErro: {
    paddingVertical: 8,
  },

  textoVoltarErro: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },

  header: {
    marginBottom: 20,
  },

  btnVoltarTop: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },

  txtVoltarTop: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },

  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },

  subtitulo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  badgeEstado: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },

  badgeAtivo: {
    backgroundColor: theme.colors.status.ativo.bg,
    borderColor: theme.colors.status.ativo.border,
  },

  badgeInativo: {
    backgroundColor: theme.colors.status.rejeitado.bg,
    borderColor: theme.colors.status.rejeitado.border,
  },

  badgeEstadoTexto: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  txtAtivo: {
    color: theme.colors.status.ativo.text,
  },

  txtInativo: {
    color: theme.colors.status.rejeitado.text,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 4,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },

  tabButtonActive: {
    backgroundColor: theme.colors.cardBackground,
    ...theme.shadows.sm,
  },

  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },

  tabTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },

  cardWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },

  infoCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },

  infoTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },

  infoGrid: {
    gap: 12,
  },

  infoItem: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },

  infoValorHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.accent,
    marginTop: 2,
  },

  infoValor: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },

  botaoReemissao: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.sm,
  },

  botaoPdf: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.sm,
  },

  botaoPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  textoBotaoReemissao: {
    color: theme.colors.textWhite,
    fontWeight: '700',
    fontSize: 15,
  },

  textoBotaoPdf: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
});
