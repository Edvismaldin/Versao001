import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';
import AppHeader from '../components/layout/AppHeader';
import { theme } from '../styles/theme';

import {
  criarPedidoReemissao,
  enviarDocumentoReemissao,
  listarMeusPedidos,
  PedidoReemissao,
} from '../services/pedidos-reemissao.service';

type Props = {
  cartaoId: number;
  aoVoltar: () => void;
};

export default function ReemissaoCartao({
  cartaoId,
  aoVoltar,
}: Props) {
  const [motivo, setMotivo] =
    useState('');

  const [documento, setDocumento] =
    useState<DocumentPicker.DocumentPickerAsset | null>(
      null,
    );

  const [pedidos, setPedidos] =
    useState<PedidoReemissao[]>([]);

  const [enviando, setEnviando] =
    useState(false);

  const [carregando, setCarregando] =
    useState(true);

  async function carregarPedidos() {
    try {
      const dados =
        await listarMeusPedidos();

      setPedidos(dados);
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível carregar os pedidos.',
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  async function selecionarDocumento() {
    const resultado =
      await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

    if (!resultado.canceled) {
      setDocumento(
        resultado.assets[0],
      );
    }
  }

  async function enviarPedido() {
    if (!motivo.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o motivo da reemissão.',
      );

      return;
    }

    if (!documento) {
      Alert.alert(
        'Atenção',
        'Selecione o documento PDF.',
      );

      return;
    }

    try {
      setEnviando(true);

      const pedido =
        await criarPedidoReemissao(
          cartaoId,
          motivo.trim(),
        );

      await enviarDocumentoReemissao(
        pedido.id,
        {
          uri: documento.uri,
          name: documento.name,
          mimeType:
            documento.mimeType,
        },
      );

      Alert.alert(
        'Sucesso',
        'Pedido de reemissão enviado com sucesso.',
      );

      setMotivo('');
      setDocumento(null);

      await carregarPedidos();
    } catch (erro: any) {
      const mensagem =
        erro?.response?.data?.message ??
        'Não foi possível enviar o pedido.';

      Alert.alert(
        'Erro',
        Array.isArray(mensagem)
          ? mensagem.join('\n')
          : mensagem,
      );
    } finally {
      setEnviando(false);
    }
  }

  function corEstado(estado: string) {
    switch (estado) {
      case 'PENDENTE':
        return '#B7791F';

      case 'EM_ANALISE':
        return '#2B6CB0';

      case 'CONCLUIDO':
        return '#2F855A';

      case 'REJEITADO':
        return '#C53030';

      default:
        return '#4A5568';
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader
        titulo="Reemissão de cartão"
        descricao="Solicite uma segunda via e acompanhe o seu pedido."
        aoVoltar={aoVoltar}
      />

      <View style={styles.conteudo}>
      <Text style={styles.titulo}>
        Reemissão de Cartão
      </Text>

      <Text style={styles.label}>
        Motivo do pedido
      </Text>

      <Text style={styles.ajuda}>
        Explique de forma objetiva por que precisa de uma segunda via.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Descreva o motivo do pedido de reemissão"
        placeholderTextColor={theme.colors.textMuted}
        value={motivo}
        onChangeText={setMotivo}
        multiline
      />

      <Pressable
        style={styles.botaoSecundario}
        onPress={selecionarDocumento}
      >
        <Text style={styles.textoBotaoSecundario}>
          Anexar documento PDF (opcional)
        </Text>
      </Pressable>

      {documento && (
        <Text style={styles.documento}>
          Documento: {documento.name}
        </Text>
      )}

      <Pressable
        style={styles.botao}
        onPress={enviarPedido}
        disabled={enviando}
      >
        <Text style={styles.textoBotao}>
          {enviando
            ? 'Enviando...'
            : 'Enviar pedido'}
        </Text>
      </Pressable>

      <Text style={styles.subtitulo}>
        Meus pedidos
      </Text>

      {carregando ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) =>
            item.id.toString()
          }
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Nenhum pedido encontrado.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <Text style={styles.numeroPedido}>
                  Pedido #{item.id}
                </Text>

                <View
                  style={[
                    styles.estado,
                    {
                      backgroundColor:
                        corEstado(
                          item.estado,
                        ),
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.estadoTexto
                    }
                  >
                    {item.estado}
                  </Text>
                </View>
              </View>

              <Text style={styles.info}>
                Cartão:{' '}
                {item.cartao.numeroCartao}
              </Text>

              <Text style={styles.info}>
                Motivo: {item.motivo}
              </Text>

              {item.observacao && (
                <Text style={styles.info}>
                  Observação:{' '}
                  {item.observacao}
                </Text>
              )}

              {item.responsavel && (
                <Text style={styles.info}>
                  Responsável:{' '}
                  {item.responsavel.nome}
                </Text>
              )}
            </View>
          )}
        />
      )}

      <Pressable
        style={styles.voltar}
        onPress={aoVoltar}
      >
        <Text style={styles.voltarTexto}>
          Voltar
        </Text>
      </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    conteudo: {
      flex: 1,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      padding: 16,
    },

    titulo: {
      display: 'none',
    },

    subtitulo: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginTop: 30,
      marginBottom: 15,
    },

    label: {
      color: theme.colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 7,
    },

    ajuda: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 8,
    },

    input: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.colors.borderDark,
      borderRadius: theme.borderRadius.md,
      padding: 15,
      minHeight: 112,
      color: theme.colors.textPrimary,
      textAlignVertical: 'top',
    },

    botao: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: 14,
      alignItems: 'center',
      marginTop: 15,
      ...theme.shadows.sm,
    },

    textoBotao: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    botaoSecundario: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: 12,
      alignItems: 'center',
      marginTop: 15,
    },

    textoBotaoSecundario: {
      color: theme.colors.primary,
      fontWeight: '600',
    },

    documento: {
      marginTop: 8,
      color: '#4A5568',
    },

    card: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.borderRadius.lg,
      padding: 17,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },

    cardTopo: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },

    numeroPedido: {
      fontWeight: '700',
      fontSize: 16,
    },

    estado: {
      borderRadius: 15,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    estadoTexto: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },

    info: {
      marginTop: 4,
      color: '#4A5568',
    },

    vazio: {
      color: '#718096',
      textAlign: 'center',
      marginTop: 20,
    },

    voltar: {
      marginTop: 20,
      padding: 12,
      alignItems: 'center',
    },

    voltarTexto: {
      color: '#1A365D',
      fontWeight: '600',
    },
  });
