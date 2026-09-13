import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { buscarMeusPedidos } from '../services/pedidos-reemissao.service';
import { theme } from '../styles/theme';

type Pedido = {
  id: number;
  motivo: string;
  estado: string;
  observacao?: string | null;
  criadoEm: string;
  analisadoEm?: string | null;
  prontoEm?: string | null;
  entregueEm?: string | null;
  concluidoEm?: string | null;
  localLevantamento?: string | null;

  cartao?: {
    id: number;
    numeroCartao: string;
  };
};

type Props = {
  onVoltar: () => void;
};

function obterEstadoReal(pedido: Pedido) {
  if (pedido.entregueEm || pedido.concluidoEm || pedido.estado === 'ENTREGUE') {
    return 'ENTREGUE';
  }

  return pedido.estado;
}

export default function MeusPedidos({ onVoltar }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregarPedidos() {
    try {
      setCarregando(true);
      setErro('');
      const dados = await buscarMeusPedidos();
      setPedidos(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      setErro(
        error?.response?.data?.message ??
          'Não foi possível carregar os pedidos.',
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  function formatarEstado(estado: string) {
    const estados: Record<string, string> = {
      PENDENTE: 'Pendente',
      EM_ANALISE: 'Em Análise',
      APROVADO: 'Aprovado',
      EM_PRODUCAO: 'Em Produção',
      PRONTO_LEVANTAMENTO: 'Pronto p/ Levantamento',
      ENTREGUE: 'Entregue',
      REJEITADO: 'Rejeitado',
      CONCLUIDO: 'Concluído',
    };
    return estados[estado] ?? estado;
  }

  function getEstiloStatus(estado: string) {
    switch (estado) {
      case 'PENDENTE':
        return theme.colors.status.pendente;
      case 'EM_ANALISE':
        return theme.colors.status.analise;
      case 'EM_PRODUCAO':
        return theme.colors.status.producao;
      case 'PRONTO_LEVANTAMENTO':
        return theme.colors.status.pronto;
      case 'ENTREGUE':
        return theme.colors.status.entregue;
      case 'REJEITADO':
        return theme.colors.status.rejeitado;
      default:
        return theme.colors.status.pendente;
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.textoCarregando}>A carregar pedidos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.botaoVoltarTop} onPress={onVoltar}>
          <Text style={styles.textoVoltarTop}>← Voltar ao painel</Text>
        </Pressable>

        <Text style={styles.titulo}>Meus Pedidos de 2ª Via</Text>
        <Text style={styles.subtitulo}>
          Acompanhe em tempo real o processamento da sua solicitação.
        </Text>
      </View>

      {erro ? (
        <View style={styles.erroBox}>
          <Text style={styles.erroTexto}>{erro}</Text>
          <Pressable style={styles.botaoTentar} onPress={carregarPedidos}>
            <Text style={styles.textoBotaoTentar}>Tentar Novamente</Text>
          </Pressable>
        </View>
      ) : pedidos.length === 0 ? (
        <View style={styles.vazioBox}>
          <Text style={styles.vazioIcone}>📬</Text>
          <Text style={styles.vazioTitulo}>Nenhum pedido registado</Text>
          <Text style={styles.vazioTexto}>
            Quando solicitar a reemissão do seu cartão académico, poderá consultar
            aqui o estado de fabrico e levantamento.
          </Text>
        </View>
      ) : (
        pedidos.map((pedido) => {
          const estadoReal = obterEstadoReal(pedido);
          const statusStyle = getEstiloStatus(estadoReal);

          return (
            <View key={pedido.id} style={styles.card}>
              {/* Header do Card */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.numeroPedido}>Pedido #{pedido.id}</Text>
                  <Text style={styles.dataCriado}>
                    Solicitado a: {formatarData(pedido.criadoEm)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.badgeStatus,
                    {
                      backgroundColor: statusStyle.bg,
                      borderColor: statusStyle.border,
                    },
                  ]}
                >
                  <Text style={[styles.textoStatus, { color: statusStyle.text }]}>
                    {formatarEstado(estadoReal)}
                  </Text>
                </View>
              </View>

              <View style={styles.divisor} />

              {/* Informações */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Motivo do Pedido</Text>
                <Text style={styles.valorMotivo}>{pedido.motivo}</Text>
              </View>

              {pedido.cartao?.numeroCartao && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Cartão Associado</Text>
                  <Text style={styles.valorHighlight}>
                    {pedido.cartao.numeroCartao}
                  </Text>
                </View>
              )}

              {pedido.localLevantamento ? (
                <View style={styles.localBox}>
                  <Text style={styles.localIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.localLabel}>Local de Levantamento</Text>
                    <Text style={styles.localValor}>
                      {pedido.localLevantamento}
                    </Text>
                  </View>
                </View>
              ) : null}

              {pedido.observacao ? (
                <View style={styles.obsBox}>
                  <Text style={styles.obsLabel}>Observação da Direção:</Text>
                  <Text style={styles.obsTexto}>{pedido.observacao}</Text>
                </View>
              ) : null}
            </View>
          );
        })
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
    maxWidth: 860,
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

  textoCarregando: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  header: {
    marginBottom: 20,
  },

  botaoVoltarTop: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },

  textoVoltarTop: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },

  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },

  subtitulo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  numeroPedido: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },

  dataCriado: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  badgeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },

  textoStatus: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  divisor: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 14,
  },

  infoRow: {
    marginBottom: 10,
  },

  label: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  valorMotivo: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginTop: 2,
    fontWeight: '500',
  },

  valorHighlight: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: '700',
    marginTop: 2,
  },

  localBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.status.pronto.bg,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.status.pronto.border,
  },

  localIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  localLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.status.pronto.text,
    textTransform: 'uppercase',
  },

  localValor: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },

  obsBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  obsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },

  obsTexto: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },

  erroBox: {
    backgroundColor: theme.colors.dangerLight,
    padding: 20,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },

  erroTexto: {
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },

  botaoTentar: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },

  textoBotaoTentar: {
    color: theme.colors.textWhite,
    fontWeight: '700',
  },

  vazioBox: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  vazioIcone: {
    fontSize: 40,
    marginBottom: 10,
  },

  vazioTitulo: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },

  vazioTexto: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
