import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import CartaoFrente from '../components/cartao/CartaoFrente';
import CartaoVerso from '../components/cartao/CartaoVerso';

import {
  abrirPdfCartao,
  bloquearCartao,
  obterQrCode,
  reemitirCartao,
} from '../services/cartoes.service';
import { montarUrlArquivo } from '../services/api';

import type { CartaoAcademico } from '../types/cartao';
import AppHeader from '../components/layout/AppHeader';

interface VisualizarCartaoProps {
  cartao: CartaoAcademico;
  aoVoltar: () => void;
  aoHistorico: (estudanteId: number) => void;
}

export default function VisualizarCartao({
  cartao,
  aoVoltar,
  aoHistorico,
}: VisualizarCartaoProps) {
  const [qrCode, setQrCode] =
    useState<string | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [processando, setProcessando] = useState(false);
  const [cartaoAtual, setCartaoAtual] =
    useState<CartaoAcademico>(cartao);
  const [modalVisivel, setModalVisivel] =
    useState(false);
  const [tipoAcao, setTipoAcao] =
    useState<'bloquear' | 'reemitir' | null>(null);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    carregarQrCode();
  }, []);

  async function carregarQrCode() {
    try {
      setCarregando(true);

      const dados =
        await obterQrCode(cartaoAtual.id);

      setQrCode(dados.qrCode);
    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível carregar o QR Code.',
      );
    } finally {
      setCarregando(false);
    }
  }

  function abrirModal(
    acao: 'bloquear' | 'reemitir',
  ) {
    setTipoAcao(acao);
    setMotivo('');
    setModalVisivel(true);
  }

  async function confirmarAcao() {
    if (!motivo.trim() || !tipoAcao) {
      Alert.alert(
        'Atenção',
        'Informe o motivo.',
      );
      return;
    }

    try {
      setProcessando(true);

      if (tipoAcao === 'bloquear') {
        const atualizado = await bloquearCartao(
          cartaoAtual.id,
          motivo,
        );

        setCartaoAtual(atualizado);

        Alert.alert(
          'Sucesso',
          'Cartão bloqueado com sucesso.',
        );
      } else {
        const resposta = await reemitirCartao(
          cartaoAtual.id,
          motivo,
        );

        const novoCartao = resposta.novoCartao;

        setCartaoAtual(novoCartao);

        const qr = await obterQrCode(
          novoCartao.id,
        );

        setQrCode(qr.qrCode);

        Alert.alert(
          'Sucesso',
          'Novo cartão emitido com sucesso.',
        );
      }

      setModalVisivel(false);
      setMotivo('');
      setTipoAcao(null);
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível concluir a operação.',
      );
    } finally {
      setProcessando(false);
    }
  }

  async function gerarPdfImpressao() {
    try {
      setProcessando(true);

      await abrirPdfCartao(
        cartaoAtual.id,
        cartaoAtual.numeroCartao,
      );
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível gerar o PDF do cartão.',
      );
    } finally {
      setProcessando(false);
    }
  }

  const foto = montarUrlArquivo(
    cartaoAtual.estudante?.foto,
  );

  const validade =
    cartaoAtual.dataValidade
      ? new Date(
          cartaoAtual.dataValidade,
        ).toLocaleDateString()
      : 'Sem validade';

  return (
    <View style={styles.container}>
      <AppHeader
        titulo="Visualizar cartão"
        descricao="Consulte os dados, QR Code e estado de emissão."
        aoVoltar={aoVoltar}
      />

      <ScrollView
        contentContainerStyle={
          styles.conteudo
        }
      >
        <Text style={styles.secao}>
          Frente
        </Text>

        <CartaoFrente
          nome={
            cartaoAtual.estudante.nomeCompleto
          }
          codigo={
            cartaoAtual.estudante.codigo
          }
          curso={
            cartaoAtual.estudante.curso.nome
          }
          faculdade={
            cartaoAtual.estudante.curso
              .faculdade.sigla
          }
          numeroCartao={
            cartaoAtual.numeroCartao
          }
          validade={validade}
          foto={foto}
        />

        <Text style={styles.secao}>
          Verso
        </Text>

        {carregando ? (
          <ActivityIndicator
            size="large"
            style={styles.loading}
          />
        ) : qrCode ? (
          <CartaoVerso
            numeroCartao={
              cartaoAtual.numeroCartao
            }
            qrCode={qrCode}
            faculdade={
              cartaoAtual.estudante.curso
                .faculdade.sigla
            }
          />
        ) : (
          <Text style={styles.erro}>
            QR Code indisponível.
          </Text>
        )}

        <View style={styles.info}>
          <Text style={styles.infoTitulo}>
            Estado do cartão
          </Text>

          <Text
            style={
              cartaoAtual.estado === 'ATIVO'
                ? styles.ativo
                : styles.inativo
            }
          >
            {cartaoAtual.estado}
          </Text>
        </View>

        <Pressable
          style={styles.botaoHistorico}
          onPress={() => aoHistorico(cartaoAtual.estudanteId)}
        >
          <Text style={styles.textoHistorico}>
            Ver histórico de cartões
          </Text>
        </Pressable>

        <Pressable
          style={styles.botaoPdf}
          onPress={gerarPdfImpressao}
          disabled={processando}
        >
          <Text style={styles.textoPdf}>
            PDF para impressão
          </Text>
        </Pressable>

        {cartaoAtual.estado === 'ATIVO' && (
          <Pressable
            style={styles.botaoBloquear}
            onPress={() => abrirModal('bloquear')}
            disabled={processando}
          >
            <Text style={styles.textoBotao}>
              Bloquear Cartão
            </Text>
          </Pressable>
        )}

        {cartaoAtual.estado === 'BLOQUEADO' && (
          <Pressable
            style={styles.botaoReemitir}
            onPress={() => abrirModal('reemitir')}
            disabled={processando}
          >
            <Text style={styles.textoBotao}>
              Reemitir Cartão
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={modalVisivel}
        animationType="fade"
        onRequestClose={() => {
          if (!processando) {
            setModalVisivel(false);
            setTipoAcao(null);
          }
        }}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>
              {tipoAcao === 'bloquear'
                ? 'Bloquear cartão'
                : 'Reemitir cartão'}
            </Text>

            <Text style={styles.modalDescricao}>
              Registe uma justificação objetiva para esta operação. O histórico do cartão será atualizado.
            </Text>

            <TextInput
              style={styles.inputMotivo}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Descreva o motivo desta operação"
              placeholderTextColor="#98A2B3"
              multiline
              editable={!processando}
            />

            <View style={styles.modalAcoes}>
              <Pressable
                style={styles.botaoCancelar}
                onPress={() => {
                  setModalVisivel(false);
                  setTipoAcao(null);
                }}
                disabled={processando}
              >
                <Text style={styles.cancelarTexto}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.botaoConfirmar
                }
                onPress={confirmarAcao}
                disabled={processando}
              >
                <Text style={styles.confirmarTexto}>
                  {processando
                    ? 'Processando...'
                    : 'Confirmar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  cabecalho: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#003b71',
  },

  voltar: {
    color: '#ffffff',
    marginBottom: 14,
    fontSize: 15,
  },

  titulo: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },

  conteudo: {
    width: '100%',
    maxWidth: 760,
    padding: 16,
    alignItems: 'center',
    paddingBottom: 40,
  },

  secao: {
    width: 340,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#344054',
    marginTop: 12,
    marginBottom: 10,
  },

  loading: {
    marginVertical: 40,
  },

  erro: {
    color: '#b42318',
    marginVertical: 30,
  },

  info: {
    width: 340,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },

  infoTitulo: {
    fontSize: 13,
    color: '#667085',
  },

  ativo: {
    color: '#067647',
    fontWeight: 'bold',
    marginTop: 5,
  },

  inativo: {
    color: '#b42318',
    fontWeight: 'bold',
    marginTop: 5,
  },

  botaoHistorico: {
    width: 340,
    marginTop: 12,
    backgroundColor: '#eef4ff',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },

  textoHistorico: {
    color: '#003b71',
    fontWeight: '600',
  },

  botaoPdf: {
    width: 340,
    marginTop: 12,
    backgroundColor: '#003b71',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },

  textoPdf: {
    color: '#ffffff',
    fontWeight: '700',
  },

  botaoBloquear: {
    width: 340,
    marginTop: 16,
    backgroundColor: '#b42318',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },

  botaoReemitir: {
    width: 340,
    marginTop: 16,
    backgroundColor: '#003b71',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },

  textoBotao: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },

  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
  },

  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#101828',
  },

  modalDescricao: {
    fontSize: 14,
    color: '#667085',
    marginTop: 6,
    marginBottom: 16,
  },

  inputMotivo: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
  },

  modalAcoes: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 16,
  },

  botaoCancelar: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#f2f4f7',
  },

  cancelarTexto: {
    color: '#344054',
    fontWeight: '600',
  },

  botaoConfirmar: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#003b71',
  },

  confirmarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
