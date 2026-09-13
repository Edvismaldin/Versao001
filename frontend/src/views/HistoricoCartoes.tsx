import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  obterHistoricoCartoes,
} from '../services/cartoes.service';
import type {
  HistoricoCartaoItem,
  HistoricoCartoesResposta,
} from '../services/cartoes.service';
import AppHeader from '../components/layout/AppHeader';
import { theme } from '../styles/theme';

interface HistoricoCartoesProps {
  estudanteId: number;
  aoVoltar: () => void;
}

export default function HistoricoCartoes({
  estudanteId,
  aoVoltar,
}: HistoricoCartoesProps) {
  const [dados, setDados] =
    useState<HistoricoCartoesResposta | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, [estudanteId]);

  async function carregar() {
    try {
      setCarregando(true);

      const resposta = await obterHistoricoCartoes(
        estudanteId,
      );

      setDados(resposta);
    } finally {
      setCarregando(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString();
  }

  function renderCartao({
    item,
  }: {
    item: HistoricoCartaoItem;
  }) {
    return (
      <View style={styles.card}>
        <View style={styles.topoCard}>
          <Text style={styles.numero}>
            {item.numeroCartao}
          </Text>

          <View
            style={[
              styles.estado,
              item.estado === 'ATIVO'
                ? styles.estadoAtivo
                : item.estado === 'REEMITIDO'
                  ? styles.estadoReemitido
                  : styles.estadoBloqueado,
            ]}
          >
            <Text style={styles.estadoTexto}>
              {item.estado}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Data de emissão</Text>
        <Text style={styles.valor}>
          {formatarData(item.dataEmissao)}
        </Text>

        <Text style={styles.label}>Validade</Text>
        <Text style={styles.valor}>
          {formatarData(item.dataValidade)}
        </Text>

        {item.bloqueadoEm && (
          <>
            <Text style={styles.label}>Bloqueado em</Text>
            <Text style={styles.valor}>
              {formatarData(item.bloqueadoEm)}
            </Text>
          </>
        )}

        {item.motivoBloqueio && (
          <View style={styles.motivo}>
            <Text style={styles.motivoTitulo}>Motivo</Text>
            <Text style={styles.motivoTexto}>
              {item.motivoBloqueio}
            </Text>
          </View>
        )}

        {item.cartaoAnteriorId && (
          <Text style={styles.reemissao}>
            Reemissão do cartão anterior #{item.cartaoAnteriorId}
          </Text>
        )}
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" />
        <Text style={styles.carregando}>
          Carregando histórico...
        </Text>
      </View>
    );
  }

  if (!dados) {
    return (
      <View style={styles.centralizado}>
        <Text>Histórico indisponível.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        titulo="Histórico de cartões"
        descricao={`${dados.estudante.nomeCompleto} · ${dados.estudante.codigo}`}
        aoVoltar={aoVoltar}
      />

      <FlatList
        data={dados.cartoes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCartao}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <Text style={styles.total}>
            {dados.total}{' '}
            {dados.total === 1
              ? 'cartão registado'
              : 'cartões registados'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  cabecalho: {
    backgroundColor: '#003b71',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  voltar: { color: '#ffffff', fontSize: 15, marginBottom: 15 },
  titulo: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  nome: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  codigo: { color: '#d0e2f2', fontSize: 13, marginTop: 3 },
  lista: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 16, paddingBottom: 40 },
  total: { color: '#667085', marginBottom: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  topoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  numero: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#101828',
    flex: 1,
  },
  estado: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  estadoAtivo: { backgroundColor: '#ecfdf3' },
  estadoReemitido: { backgroundColor: '#fff6ed' },
  estadoBloqueado: { backgroundColor: '#fef3f2' },
  estadoTexto: { fontSize: 10, fontWeight: 'bold', color: '#344054' },
  label: {
    fontSize: 10,
    color: '#667085',
    textTransform: 'uppercase',
    marginTop: 7,
  },
  valor: { color: '#101828', fontSize: 13, marginTop: 2 },
  motivo: {
    backgroundColor: '#f9fafb',
    padding: 11,
    borderRadius: 8,
    marginTop: 12,
  },
  motivoTitulo: { fontSize: 11, fontWeight: 'bold', color: '#475467' },
  motivoTexto: { color: '#344054', marginTop: 3, fontSize: 13 },
  reemissao: {
    color: '#175cd3',
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  carregando: { marginTop: 10, color: '#667085' },
});
