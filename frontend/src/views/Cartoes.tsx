import AcoesRegisto from '../components/layout/AcoesRegisto';
import { createElement, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import {
  abrirPdfCartoesLote,
  criarCartao,
  listarCartoes,
  obterQrCode,
} from '../services/cartoes.service';

import {
  listarEstudantes,
} from '../services/estudantes.service';

import type { CartaoAcademico } from '../types/cartao';
import type { Estudante } from '../types/estudante';
import AppHeader from '../components/layout/AppHeader';
import SelectorOption from '../components/forms/SelectorOption';
import { theme } from '../styles/theme';

interface CartoesProps {
  aoVoltar: () => void;

  aoVisualizar: (
    cartao: CartaoAcademico,
  ) => void;

  aoVerHistorico: (
    estudanteId: number,
  ) => void;
}

export default function Cartoes({
  aoVoltar,
  aoVisualizar,
  aoVerHistorico,
}: CartoesProps) {
  const [cartoes, setCartoes] =
    useState<CartaoAcademico[]>([]);

  const [estudantes, setEstudantes] =
    useState<Estudante[]>([]);

  const [estudanteId, setEstudanteId] =
    useState<number | null>(null);

  const [dataValidade, setDataValidade] =
    useState('');
  const [mostrarSeletorValidade, setMostrarSeletorValidade] = useState(false);

  const [carregando, setCarregando] =
    useState(true);

  const [gerando, setGerando] =
    useState(false);

  const [qrCode, setQrCode] =
    useState<string | null>(null);

  const [cartaoQrId, setCartaoQrId] =
    useState<number | null>(null);

  const [carregandoQr, setCarregandoQr] =
    useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gerandoPdfLote, setGerandoPdfLote] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  function dataValidadeSelecionada() {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataValidade)) {
      const [ano, mes, dia] = dataValidade.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }
    return new Date();
  }

  function abrirSeletorValidade() {
    setMostrarSeletorValidade(true);
  }

  function selecionarDataValidadeNativa(
    evento: DateTimePickerEvent,
    dataSelecionada?: Date,
  ) {
    if (Platform.OS === 'android') setMostrarSeletorValidade(false);
    if (evento.type !== 'set' || !dataSelecionada) return;

    setDataValidade(
      `${dataSelecionada.getFullYear()}-${String(dataSelecionada.getMonth() + 1).padStart(2, '0')}-${String(dataSelecionada.getDate()).padStart(2, '0')}`,
    );
  }


  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        dadosCartoes,
        dadosEstudantes,
      ] = await Promise.all([
        listarCartoes(),
        listarEstudantes(),
      ]);

      setCartoes(dadosCartoes);

      setEstudantes(
        dadosEstudantes.filter(
          (estudante) => estudante.ativo,
        ),
      );
    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados.',
      );
    } finally {
      setCarregando(false);
    }
  }

  async function gerarCartao() {
    if (estudanteId === null) {
      Alert.alert(
        'Atenção',
        'Selecione um estudante.',
      );
      return;
    }

    try {
      setGerando(true);

      await criarCartao({
        estudanteId,
        dataValidade:
          dataValidade.trim() || undefined,
      });

      setEstudanteId(null);
      setDataValidade('');

      await carregarDados();
      setMostrarFormulario(false);

      Alert.alert(
        'Sucesso',
        'Cartão académico gerado com sucesso.',
      );
    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível gerar o cartão.',
      );
    } finally {
      setGerando(false);
    }
  }

  async function mostrarQrCode(
    cartao: CartaoAcademico,
  ) {
    try {
      if (
        cartaoQrId === cartao.id &&
        qrCode
      ) {
        setCartaoQrId(null);
        setQrCode(null);
        return;
      }

      setCarregandoQr(true);

      const dados =
        await obterQrCode(cartao.id);

      setCartaoQrId(cartao.id);
      setQrCode(dados.qrCode);
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível carregar o QR Code.',
      );
    } finally {
      setCarregandoQr(false);
    }
  }

  async function gerarPdfLote() {
    const cartoesAtivos = cartoes.filter(
      (cartao) => cartao.estado === 'ATIVO',
    );

    if (!cartoesAtivos.length) {
      Alert.alert(
        'AtenÃ§Ã£o',
        'NÃ£o existem cartÃµes ativos para impressÃ£o em lote.',
      );
      return;
    }

    try {
      setGerandoPdfLote(true);

      await abrirPdfCartoesLote(
        cartoesAtivos.map((cartao) => cartao.id),
      );
    } catch {
      Alert.alert(
        'Erro',
        'NÃ£o foi possÃ­vel gerar o PDF em lote.',
      );
    } finally {
      setGerandoPdfLote(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        titulo="Cartões académicos"
        descricao="Emita, consulte e valide cartões da comunidade UCM."
        aoVoltar={aoVoltar}
      />

      <FlatList
        data={mostrarFormulario ? [] : cartoes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          styles.conteudo
        }

        ListHeaderComponent={
          !mostrarFormulario ? (
            <View style={styles.barraAcoes}>
            <Pressable
              style={styles.botaoNovo}
              onPress={() => setMostrarFormulario(true)}
            >
              <Text style={styles.botaoNovoTexto}>+ Emitir novo cartão</Text>
            </Pressable>
            <Pressable
              style={[
                styles.botaoLote,
                gerandoPdfLote && styles.botaoDesabilitado,
              ]}
              onPress={gerarPdfLote}
              disabled={gerandoPdfLote}
            >
              <Text style={styles.botaoLoteTexto}>
                {gerandoPdfLote
                  ? 'Gerando PDF...'
                  : 'PDF em lote'}
              </Text>
            </Pressable>
            </View>
          ) : (
          <View style={styles.formulario}>
            <Text style={styles.formularioTitulo}>
              Gerar Novo Cartão
            </Text>

            <Text style={styles.formularioDescricao}>
              Selecione o estudante e defina a validade para emitir o cartão académico.
            </Text>

            <Text style={styles.label}>
              Estudante
            </Text>

            <View style={styles.grupoSelecao} accessibilityRole="radiogroup">
              {estudantes.map((estudante) => (
                <SelectorOption
                  key={estudante.id}
                  title={estudante.nomeCompleto}
                  subtitle={`Código académico · ${estudante.codigo}`}
                  selected={estudanteId === estudante.id}
                  onPress={() => setEstudanteId(estudante.id)}
                  accessibilityLabel={`Selecionar estudante ${estudante.nomeCompleto}`}
                />
              ))}
            </View>

            <Text style={styles.campoRotulo}>
              Data de validade <Text style={styles.obrigatorio}>*</Text>
            </Text>

            {Platform.OS === 'web' ? (
              <View style={styles.campoDataWeb}>
                {createElement('input', {
                  type: 'date',
                  value: dataValidade,
                  min: new Date().toISOString().slice(0, 10),
                  onChange: (evento: { target: { value: string } }) => setDataValidade(evento.target.value),
                  style: {
                    width: '100%', height: '100%', minHeight: 52, border: 'none', outline: 'none',
                    backgroundColor: 'transparent', color: theme.colors.textPrimary, fontSize: 15,
                    padding: '0 16px', boxSizing: 'border-box',
                  } as any,
                  'aria-label': 'Data de validade',
                })}
              </View>
            ) : (
              <>
                <Pressable style={styles.seletorData} onPress={abrirSeletorValidade}>
                  <Text style={[styles.seletorDataTexto, !dataValidade && styles.seletorDataPlaceholder]}>
                    {dataValidade || 'Selecionar data de validade'}
                  </Text>
                  <Text style={styles.seletorDataAcao}>Selecionar</Text>
                </Pressable>
                {mostrarSeletorValidade && (
              <DateTimePicker
                value={dataValidadeSelecionada()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={selecionarDataValidadeNativa}
              />
                )}
              </>
            )}

            <Pressable
              style={[
                styles.botaoGerar,
                gerando &&
                  styles.botaoDesabilitado,
              ]}
              onPress={gerarCartao}
              disabled={gerando}
            >
              <Text
                style={
                  styles.botaoGerarTexto
                }
              >
                {gerando
                  ? 'Gerando...'
                  : 'Gerar Cartão'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.botaoCancelar}
              onPress={() => setMostrarFormulario(false)}
            >
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </Pressable>
          </View>
          )
        }

        ListEmptyComponent={mostrarFormulario ? null : (
          <Text style={styles.vazio}>
            Nenhum cartão gerado.
          </Text>
        )}

        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.numero}>
              {item.numeroCartao}
            </Text>

            <Text style={styles.nome}>
              {item.estudante?.nomeCompleto}
            </Text>

            <Text style={styles.detalhe}>
              Código:{' '}
              {item.estudante?.codigo}
            </Text>

            <Text style={styles.detalhe}>
              Curso:{' '}
              {item.estudante?.curso?.codigo}
            </Text>

            <Text style={styles.detalhe}>
              Emissão:{' '}
              {new Date(
                item.dataEmissao,
              ).toLocaleDateString()}
            </Text>

            <Text style={styles.detalhe}>
              Validade:{' '}
              {item.dataValidade
                ? new Date(
                    item.dataValidade,
                  ).toLocaleDateString()
                : 'Sem validade'}
            </Text>

            <Text
              style={
                item.estado === 'ATIVO'
                  ? styles.ativo
                  : styles.inativo
              }
            >
              {item.estado}
            </Text>

<AcoesRegisto>
            <Pressable
              style={styles.botaoVisualizar}
              onPress={() => aoVisualizar(item)}
            >
              <Text style={styles.botaoVisualizarTexto}>
                Visualizar Cartão
              </Text>
            </Pressable>

            <Pressable
              style={styles.botaoHistorico}
              onPress={() =>
                aoVerHistorico(item.estudanteId)
              }
            >
              <Text style={styles.botaoHistoricoTexto}>
                Ver Histórico
              </Text>
            </Pressable>

            <Pressable
              style={styles.botaoQr}
              onPress={() => mostrarQrCode(item)}
            >
              <Text style={styles.botaoQrTexto}>
                {cartaoQrId === item.id
                  ? 'Ocultar QR Code'
                  : 'Ver QR Code'}
              </Text>
            </Pressable>

            {cartaoQrId === item.id && (
              <View style={styles.areaQr}>
                {carregandoQr ? (
                  <ActivityIndicator size="large" />
                ) : qrCode ? (
                  <>
                    <Image
                      source={{ uri: qrCode }}
                      style={styles.qrCode}
                    />

                    <Text style={styles.qrAviso}>
                      Escaneie para validar este cartão académico.
                    </Text>
                  </>
                ) : null}
              </View>
            )}
</AcoesRegisto>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  centralizado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 16,
  },

  barraAcoes: {
    marginBottom: 18,
  },

  botaoNovo: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    ...theme.shadows.sm,
  },
  botaoNovoTexto: { color: theme.colors.textWhite, fontWeight: '800' },

  botaoLote: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: theme.colors.cardBackground,
  },

  botaoLoteTexto: {
    color: theme.colors.primary,
    fontWeight: '800',
  },

  botaoCancelar: { alignItems: 'center', paddingVertical: 13, marginTop: 4 },
  textoCancelar: { color: theme.colors.textSecondary, fontWeight: '700' },

  formulario: {
    width: '100%',
    maxWidth: 780,
    alignSelf: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: 20,
    borderRadius: theme.borderRadius.xl,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 4,
    borderTopColor: theme.colors.primary,
    ...theme.shadows.md,
  },

  formularioTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },

  formularioDescricao: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  campoRotulo: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  obrigatorio: { color: theme.colors.danger },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
    marginBottom: 8,
  },

  grupoSelecao: { gap: 9, marginBottom: 16 },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    color: theme.colors.textPrimary,
    minHeight: 54,
  },

  seletorData: { minHeight: 54, borderWidth: 1, borderColor: theme.colors.borderDark, backgroundColor: '#F8FAFC', borderRadius: theme.borderRadius.md, paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  campoDataWeb: { minHeight: 54, borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: theme.borderRadius.md, backgroundColor: '#F8FAFC', marginBottom: 16, overflow: 'hidden' },
  seletorDataTexto: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700' },
  seletorDataPlaceholder: { color: theme.colors.textMuted, fontWeight: '400' },
  seletorDataAcao: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.58)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalData: { width: '100%', maxWidth: 560, maxHeight: '82%', backgroundColor: '#fff', borderRadius: 20, padding: 20, ...theme.shadows.lg },
  modalEtiqueta: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  modalTitulo: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 5 },
  breadcrumbData: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 14 },
  breadcrumbAtivo: { color: theme.colors.primary, fontSize: 13, fontWeight: '900' },
  breadcrumbPassivo: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  breadcrumbSeparador: { color: theme.colors.textMuted, fontWeight: '800' },
  gradeData: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 },
  opcaoData: { width: 104, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: theme.colors.borderDark, backgroundColor: '#F8FAFC' },
  opcaoDia: { width: 48, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: theme.colors.borderDark, backgroundColor: '#F8FAFC' },
  opcaoDataAtiva: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  opcaoDataTexto: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '800' },
  opcaoDataTextoAtiva: { color: theme.colors.textWhite },
  modalCancelar: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },

  botaoGerar: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoGerarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8f0',
    borderLeftWidth: 3,
    borderLeftColor: '#003b71',
  },

  numero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003b71',
  },

  nome: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
    color: '#101828',
  },

  detalhe: {
    color: '#667085',
    marginTop: 4,
  },

  ativo: {
    color: theme.colors.status.ativo.text,
    backgroundColor: theme.colors.status.ativo.bg,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 10,
    fontWeight: '800',
    fontSize: 11,
  },

  inativo: {
    color: theme.colors.status.bloqueado.text,
    backgroundColor: theme.colors.status.bloqueado.bg,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 10,
    fontWeight: '800',
    fontSize: 11,
  },

  botaoVisualizar: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 11,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 10,
    ...theme.shadows.sm,
  },

  botaoVisualizarTexto: {
    color: '#ffffff',
    fontWeight: '600',
  },

  botaoHistorico: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },

  botaoHistoricoTexto: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  botaoQr: {
    backgroundColor: '#eef4ff',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },

  botaoQrTexto: {
    color: '#003b71',
    fontWeight: '600',
  },

  areaQr: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaecf0',
  },

  qrCode: {
    width: 190,
    height: 190,
  },

  qrAviso: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },

  vazio: {
    textAlign: 'center',
    color: '#667085',
    marginTop: 30,
  },
});
