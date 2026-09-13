import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

type Props = {
  titulo: string;
  valor: number | string;
  descricao?: string;
};

export default function CardEstatistica({
  titulo,
  valor,
  descricao,
}: Props) {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  const icones: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Estudantes: 'account-group-outline',
    'Cartões ativos': 'card-account-details-outline',
    Pendentes: 'clock-outline',
    'Em análise': 'file-search-outline',
    'Em produção': 'printer-outline',
    Prontos: 'check-decagram-outline',
    Entregues: 'handshake-outline',
    Rejeitados: 'alert-circle-outline',
  };
  const variantes: Record<string, { cor: string; fundo: string }> = {
    Estudantes: { cor: '#175CD3', fundo: '#EFF8FF' },
    'Cartões ativos': { cor: '#067647', fundo: '#ECFDF3' },
    Pendentes: { cor: '#B54708', fundo: '#FFFAEB' },
    'Em análise': { cor: '#6941C6', fundo: '#F4F3FF' },
    'Em produção': { cor: '#0E7090', fundo: '#ECFDFF' },
    Prontos: { cor: '#027A48', fundo: '#ECFDF3' },
    Entregues: { cor: '#175CD3', fundo: '#EFF8FF' },
    Rejeitados: { cor: '#B42318', fundo: '#FEF3F2' },
  };
  const variante = variantes[titulo] ?? { cor: theme.colors.accent, fundo: theme.colors.accentLight };

  return (
    <View style={[styles.card, { borderTopColor: variante.cor }, desktop && styles.cardDesktop]}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{titulo}</Text>
        <View style={[styles.iconeBox, { backgroundColor: variante.fundo }]}>
          <MaterialCommunityIcons
            name={icones[titulo] ?? 'chart-box-outline'}
            size={18}
            color={variante.cor}
          />
        </View>
      </View>

      <Text style={[styles.valor, { color: variante.cor }]}>
        {valor}
      </Text>
      <View style={styles.rodape}>
        <View style={[styles.ponto, { backgroundColor: variante.cor }]} />
        <Text style={styles.descricao}>{descricao ?? 'Monitorização ativa'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE6F0',
    borderTopWidth: 3,
    borderTopColor: theme.colors.accent,
    ...theme.shadows.sm,
  },
  cardDesktop: {
    width: '31.9%',
    minHeight: 132,
    padding: 20,
  },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconeBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentLight,
  },

  titulo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  valor: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 10,
    color: theme.colors.primary,
  },

  rodape: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  ponto: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#12B76A' },
  descricao: {
    fontSize: 12,
    color: '#6B7280',
  },
});
