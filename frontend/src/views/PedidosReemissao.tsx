import AcoesRegisto from '../components/layout/AcoesRegisto';
import { useEffect, useMemo, useState } from 'react';
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

import {
  aprovarPedido,
  abrirDocumentoPedido,
  buscarTodosPedidos,
  iniciarAnalise,
  marcarEntregue,
  marcarPronto,
  rejeitarPedido,
  type PedidoResponsavel,
} from '../services/pedidos-reemissao.service';
import { theme } from '../styles/theme';

type EstadoFiltro =
  | 'TODOS'
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'EM_PRODUCAO'
  | 'PRONTO_LEVANTAMENTO'
  | 'REJEITADO'
  | 'ENTREGUE';

type AcaoModal = 'rejeitar' | 'pronto' | null;

type Props = {
  onVoltar?: () => void;
  aoVoltar?: () => void;
  perfil?: 'ADMIN' | 'RESPONSAVEL' | 'OPERADOR_CARTAO';
};

const filtros: Array<{ id: EstadoFiltro; titulo: string }> = [
  { id: 'TODOS', titulo: 'Todos' },
  { id: 'PENDENTE', titulo: 'Pendentes' },
  { id: 'EM_ANALISE', titulo: 'Em analise' },
  { id: 'EM_PRODUCAO', titulo: 'Producao' },
  { id: 'PRONTO_LEVANTAMENTO', titulo: 'Prontos' },
  { id: 'REJEITADO', titulo: 'Rejeitados' },
  { id: 'ENTREGUE', titulo: 'Entregues' },
];

const nomesEstado: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em analise',
  APROVADO: 'Aprovado',
  EM_PRODUCAO: 'Em producao',
  PRONTO_LEVANTAMENTO: 'Pronto',
  ENTREGUE: 'Entregue',
  REJEITADO: 'Rejeitado',
  CONCLUIDO: 'Concluido',
};

function obterEstadoReal(pedido: PedidoResponsavel) {
  if (pedido.entregueEm || pedido.concluidoEm || pedido.estado === 'ENTREGUE') {
    return 'ENTREGUE';
  }

  return pedido.estado;
}

export default function PedidosReemissao({
  onVoltar,
  aoVoltar,
  perfil = 'RESPONSAVEL',
}: Props) {
  const handleVoltar = onVoltar ?? aoVoltar ?? (() => {});
  const modoOperador = perfil === 'OPERADOR_CARTAO';

  const [pedidos, setPedidos] = useState<PedidoResponsavel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [documentoId, setDocumentoId] = useState<number | null>(null);
  const [pesquisa, setPesquisa] = useState('');
  const [filtro, setFiltro] = useState<EstadoFiltro>(
    modoOperador ? 'EM_PRODUCAO' : 'TODOS',
  );

  const [modalVisivel, setModalVisivel] = useState(false);
  const [acaoModal, setAcaoModal] = useState<AcaoModal>(null);
  const [pedidoModal, setPedidoModal] = useState<PedidoResponsavel | null>(
    null,
  );
  const [textoModal, setTextoModal] = useState('');

  useEffect(() => {
    void carregarPedidos();
  }, []);

  async function carregarPedidos() {
    try {
      setCarregando(true);

      const dados = await buscarTodosPedidos();
      setPedidos(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error?.response?.data?.message ??
          'Nao foi possivel carregar os pedidos de reemissao.',
      );
    } finally {
      setCarregando(false);
    }
  }

  const pedidosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase();
    const estadosPermitidosOperador = [
      'EM_PRODUCAO',
      'PRONTO_LEVANTAMENTO',
      'ENTREGUE',
    ];

    return pedidos.filter((pedido) => {
      const estadoReal = obterEstadoReal(pedido);
      const permitidoParaOperador =
        !modoOperador || estadosPermitidosOperador.includes(estadoReal);
      const correspondeAoEstado =
        filtro === 'TODOS' || estadoReal === filtro;

      const texto = [
        pedido.estudante?.nomeCompleto,
        pedido.estudante?.codigo,
        pedido.cartao?.numeroCartao,
        pedido.motivo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();

      return (
        permitidoParaOperador &&
        correspondeAoEstado &&
        (!termo || texto.includes(termo))
      );
    });
  }, [filtro, modoOperador, pedidos, pesquisa]);

  const filtrosDisponiveis = modoOperador
    ? filtros.filter((item) =>
        [
          'EM_PRODUCAO',
          'PRONTO_LEVANTAMENTO',
          'ENTREGUE',
        ].includes(item.id),
      )
    : filtros;

  async function executar(
    pedidoId: number,
    acao: () => Promise<unknown>,
    mensagem: string,
  ) {
    try {
      setProcessandoId(pedidoId);
      await acao();
      Alert.alert('Sucesso', mensagem);
      await carregarPedidos();
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error?.response?.data?.message ??
          'Nao foi possivel realizar a operacao.',
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function abrirDocumento(pedido: PedidoResponsavel) {
    try {
      setDocumentoId(pedido.id);
      await abrirDocumentoPedido(pedido.id);
    } catch (error: any) {
      Alert.alert(
        'Documento indisponivel',
        error?.response?.data?.message ??
          'Nao foi possivel abrir o documento enviado pelo estudante.',
      );
    } finally {
      setDocumentoId(null);
    }
  }

  function abrirModal(acao: Exclude<AcaoModal, null>, pedido: PedidoResponsavel) {
    setAcaoModal(acao);
    setPedidoModal(pedido);
    setTextoModal('');
    setModalVisivel(true);
  }

  function fecharModal() {
    if (processandoId) {
      return;
    }

    setModalVisivel(false);
    setAcaoModal(null);
    setPedidoModal(null);
    setTextoModal('');
  }

  async function confirmarModal() {
    if (!pedidoModal || !acaoModal) {
      return;
    }

    const valor = textoModal.trim();

    if (!valor) {
      Alert.alert(
        'Atencao',
        acaoModal === 'rejeitar'
          ? 'Informe o motivo da rejeicao.'
          : 'Informe o local de levantamento.',
      );
      return;
    }

    await executar(
      pedidoModal.id,
      () =>
        acaoModal === 'rejeitar'
          ? rejeitarPedido(pedidoModal.id, valor)
          : marcarPronto(pedidoModal.id, valor),
      acaoModal === 'rejeitar'
        ? 'Pedido rejeitado com sucesso.'
        : 'Cartao marcado como pronto para levantamento.',
    );

    fecharModal();
  }

  function estiloEstado(estado: string) {
    switch (estado) {
      case 'EM_ANALISE':
        return styles.statusAnalise;
      case 'EM_PRODUCAO':
        return styles.statusProducao;
      case 'PRONTO_LEVANTAMENTO':
        return styles.statusPronto;
      case 'ENTREGUE':
        return styles.statusEntregue;
      case 'REJEITADO':
        return styles.statusRejeitado;
      default:
        return styles.statusPendente;
    }
  }

  function renderPedido(pedido: PedidoResponsavel) {
    const processando = processandoId === pedido.id;
    const abrindoDocumento = documentoId === pedido.id;
    const estadoReal = obterEstadoReal(pedido);

    return (
      <View key={pedido.id} style={styles.card}>
        <View style={styles.cardTopo}>
          <View style={styles.cardTituloArea}>
            <Text style={styles.nomeEstudante}>
              {pedido.estudante.nomeCompleto}
            </Text>

            <Text style={styles.codigo}>
              Codigo: {pedido.estudante.codigo}
            </Text>
          </View>

          <View style={[styles.status, estiloEstado(estadoReal)]}>
            <Text style={styles.statusTexto}>
              {nomesEstado[estadoReal] ?? estadoReal}
            </Text>
          </View>
        </View>

        <Text style={styles.cartao}>
          Cartao: {pedido.cartao.numeroCartao}
        </Text>

        <Text style={styles.motivoTitulo}>Motivo</Text>
        <Text style={styles.motivo}>{pedido.motivo}</Text>

        <Text style={styles.data}>
          Pedido em {new Date(pedido.criadoEm).toLocaleDateString('pt-PT')}
        </Text>

<AcoesRegisto>
        {pedido.observacao ? (
          <View style={styles.informacao}>
            <Text style={styles.informacaoLabel}>Observacao</Text>
            <Text style={styles.informacaoTexto}>{pedido.observacao}</Text>
          </View>
        ) : null}

        {pedido.localLevantamento ? (
          <View style={styles.informacao}>
            <Text style={styles.informacaoLabel}>Levantamento</Text>
            <Text style={styles.informacaoTexto}>
              {pedido.localLevantamento}
            </Text>
          </View>
        ) : null}

        {pedido.documento ? (
          <Pressable
            style={styles.botaoDocumento}
            disabled={abrindoDocumento || processando}
            onPress={() => void abrirDocumento(pedido)}
          >
            {abrindoDocumento ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={styles.botaoDocumentoTexto}>Ver documento PDF</Text>
            )}
          </Pressable>
        ) : (
          <Text style={styles.semDocumento}>
            Documento ainda nao enviado pelo estudante.
          </Text>
        )}

        {!modoOperador && estadoReal === 'PENDENTE' ? (
          <Pressable
            style={styles.botaoPrimario}
            disabled={processando}
            onPress={() =>
              void executar(
                pedido.id,
                () => iniciarAnalise(pedido.id),
                'Pedido colocado em analise.',
              )
            }
          >
            <Text style={styles.botaoPrimarioTexto}>Iniciar analise</Text>
          </Pressable>
        ) : null}

        {!modoOperador && estadoReal === 'EM_ANALISE' ? (
          <View style={styles.acoes}>
            <Pressable
              style={styles.botaoPrimarioSemMargem}
              disabled={processando}
              onPress={() =>
                void executar(
                  pedido.id,
                  () => aprovarPedido(pedido.id),
                  'Pedido aprovado e enviado para producao.',
                )
              }
            >
              <Text style={styles.botaoPrimarioTexto}>Aprovar e produzir</Text>
            </Pressable>

            <Pressable
              style={styles.botaoPerigo}
              disabled={processando}
              onPress={() => abrirModal('rejeitar', pedido)}
            >
              <Text style={styles.botaoPerigoTexto}>Rejeitar pedido</Text>
            </Pressable>
          </View>
        ) : null}

        {estadoReal === 'EM_PRODUCAO' ? (
          <Pressable
            style={styles.botaoPrimario}
            disabled={processando}
            onPress={() => abrirModal('pronto', pedido)}
          >
            <Text style={styles.botaoPrimarioTexto}>Marcar como pronto</Text>
          </Pressable>
        ) : null}

        {estadoReal === 'PRONTO_LEVANTAMENTO' ? (
          <Pressable
            style={styles.botaoSucesso}
            disabled={processando}
            onPress={() =>
              void executar(
                pedido.id,
                () => marcarEntregue(pedido.id),
                'Entrega confirmada com sucesso.',
              )
            }
          >
            <Text style={styles.botaoSucessoTexto}>Confirmar entrega</Text>
          </Pressable>
        ) : null}

        {processando ? (
          <ActivityIndicator style={styles.processando} color={theme.colors.gold} />
        ) : null}
</AcoesRegisto>
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
        <Text style={styles.carregandoText}>
          A carregar pedidos de reemissao...
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.voltar} onPress={handleVoltar}>
            <Text style={styles.voltarTexto}>Voltar ao painel</Text>
          </Pressable>

          <Text style={styles.identificador}>
            {modoOperador ? 'OPERADOR DE CARTOES' : 'RESPONSAVEL'}
          </Text>
          <Text style={styles.titulo}>
            {modoOperador ? 'Producao e entrega' : 'Pedidos de Reemissao'}
          </Text>
          <Text style={styles.subtitulo}>
            {modoOperador
              ? 'Acompanhe os cartoes em producao, registe o local de levantamento e confirme entregas.'
              : 'Analise documentos, acompanhe a producao e registe cada decisao.'}
          </Text>
        </View>

        <View style={styles.ferramentas}>
          <TextInput
            value={pesquisa}
            onChangeText={setPesquisa}
            placeholder="Pesquisar por estudante, código académico ou cartão"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.pesquisa}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtros}
          >
            {filtrosDisponiveis.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.filtro, filtro === item.id && styles.filtroAtivo]}
                onPress={() => setFiltro(item.id)}
              >
                <Text
                  style={[
                    styles.filtroTexto,
                    filtro === item.id && styles.filtroTextoAtivo,
                  ]}
                >
                  {item.titulo}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.resultado}>
            {pedidosFiltrados.length}{' '}
            {pedidosFiltrados.length === 1
              ? 'pedido encontrado'
              : 'pedidos encontrados'}
          </Text>
        </View>

        <View style={styles.lista}>
          {pedidosFiltrados.length === 0 ? (
            <View style={styles.vazioBox}>
              <Text style={styles.vazioTitulo}>Nenhum pedido encontrado</Text>
              <Text style={styles.vazioTexto}>
                Altere a pesquisa ou o filtro para consultar outros pedidos.
              </Text>
            </View>
          ) : (
            pedidosFiltrados.map(renderPedido)
          )}
        </View>

        <Pressable style={styles.botaoAtualizar} onPress={() => void carregarPedidos()}>
          <Text style={styles.botaoAtualizarTexto}>Atualizar pedidos</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>
              {acaoModal === 'rejeitar'
                ? 'Rejeitar pedido'
                : 'Marcar cartao como pronto'}
            </Text>

            <Text style={styles.modalDescricao}>
              {acaoModal === 'rejeitar'
                ? 'Registe o motivo para o estudante consultar depois.'
                : 'Informe o local onde o estudante deve levantar o cartao.'}
            </Text>

            <TextInput
              style={styles.inputModal}
              value={textoModal}
              onChangeText={setTextoModal}
              placeholder={
                acaoModal === 'rejeitar'
                  ? 'Registe a fundamentação da rejeição'
                  : 'Indique o local de levantamento'
              }
              placeholderTextColor={theme.colors.textMuted}
              multiline={acaoModal === 'rejeitar'}
              textAlignVertical={acaoModal === 'rejeitar' ? 'top' : 'center'}
            />

            <View style={styles.modalAcoes}>
              <Pressable
                style={styles.botaoCancelar}
                onPress={fecharModal}
                disabled={!!processandoId}
              >
                <Text style={styles.cancelarTexto}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={styles.botaoConfirmar}
                onPress={() => void confirmarModal()}
                disabled={!!processandoId}
              >
                {processandoId ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmarTexto}>Confirmar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingBottom: 40 },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  carregandoText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    backgroundColor: theme.colors.primary,
    borderBottomColor: theme.colors.gold,
    borderBottomWidth: 4,
    paddingTop: 52,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  voltar: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 24 },
  voltarTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  identificador: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
    marginTop: 7,
  },
  subtitulo: {
    color: '#DDE9F5',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  ferramentas: { paddingHorizontal: 16, paddingTop: 16 },
  pesquisa: {
    backgroundColor: '#FFFFFF',
    color: theme.colors.textPrimary,
    borderRadius: 8,
    borderColor: '#D8E0EA',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  filtros: { gap: 8, paddingVertical: 14 },
  filtro: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  filtroAtivo: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filtroTexto: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  filtroTextoAtivo: { color: '#FFFFFF' },
  resultado: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  lista: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 10 },
  vazioBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vazioTitulo: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  vazioTexto: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
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
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTituloArea: { flex: 1 },
  nomeEstudante: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  codigo: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 3 },
  status: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  statusPendente: { backgroundColor: '#FEF3C7' },
  statusAnalise: { backgroundColor: '#DBEAFE' },
  statusProducao: { backgroundColor: '#EDE9FE' },
  statusPronto: { backgroundColor: '#D1FAE5' },
  statusEntregue: { backgroundColor: '#DCFCE7' },
  statusRejeitado: { backgroundColor: '#FEE2E2' },
  statusTexto: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cartao: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 13,
  },
  motivoTitulo: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  motivo: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  data: { color: theme.colors.textMuted, fontSize: 12, marginTop: 10 },
  informacao: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 11,
    marginTop: 12,
  },
  informacaoLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  informacaoTexto: {
    color: theme.colors.textPrimary,
    marginTop: 4,
    fontSize: 13,
  },
  botaoDocumento: {
    alignItems: 'center',
    borderColor: theme.colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    minHeight: 43,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botaoDocumentoTexto: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  semDocumento: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 15,
  },
  acoes: { marginTop: 12, gap: 10 },
  botaoPrimario: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 13,
  },
  botaoPrimarioSemMargem: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 13,
  },
  botaoPrimarioTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  botaoPerigo: {
    alignItems: 'center',
    backgroundColor: '#B42318',
    borderRadius: 8,
    paddingVertical: 13,
  },
  botaoPerigoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  botaoSucesso: {
    alignItems: 'center',
    backgroundColor: '#067647',
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 13,
  },
  botaoSucessoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  processando: { marginTop: 12 },
  botaoAtualizar: {
    alignItems: 'center',
    borderColor: theme.colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 13,
  },
  botaoAtualizarTexto: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    borderTopWidth: 4,
    borderTopColor: theme.colors.gold,
  },
  modalTitulo: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  modalDescricao: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  inputModal: {
    minHeight: 94,
    borderWidth: 1,
    borderColor: '#D4DCE6',
    borderRadius: 8,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  modalAcoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  botaoCancelar: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  cancelarTexto: { color: theme.colors.textSecondary, fontWeight: '800' },
  botaoConfirmar: {
    minWidth: 104,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  confirmarTexto: { color: '#FFFFFF', fontWeight: '800' },
});
