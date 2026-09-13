import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../../styles/theme';
import LogoUcm from '../brand/LogoUcm';

type AppHeaderProps = {
  titulo: string;
  descricao?: string;
  aoVoltar: () => void;
};

export default function AppHeader({
  titulo,
  descricao,
  aoVoltar,
}: AppHeaderProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  return (
    <View style={styles.container}>
      <View style={[styles.conteudo, desktop && styles.conteudoDesktop]}>
        <View style={styles.linhaSuperior}>
          <Pressable onPress={aoVoltar} hitSlop={10} style={styles.voltarBotao}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.primary} />
            <Text style={styles.voltar}>Painel</Text>
          </Pressable>

          <LogoUcm size={desktop ? 44 : 38} />
        </View>

        <Text style={styles.sobreTitulo}>GESTÃO ACADÉMICA</Text>
        <Text style={[styles.titulo, desktop && styles.tituloDesktop]}>{titulo}</Text>

        {descricao && (
          <Text style={[styles.descricao, desktop && styles.descricaoDesktop]}>{descricao}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  conteudo: { width: '100%', maxWidth: 1240, alignSelf: 'center' },
  conteudoDesktop: { paddingHorizontal: 24 },
  linhaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  voltarBotao: { paddingVertical: 7, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  voltar: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  marca: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold,
  },
  marcaTexto: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  sobreTitulo: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  titulo: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  tituloDesktop: { fontSize: 34, letterSpacing: -1 },
  descricao: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  descricaoDesktop: { fontSize: 15, maxWidth: 720, marginTop: 9 },
});
