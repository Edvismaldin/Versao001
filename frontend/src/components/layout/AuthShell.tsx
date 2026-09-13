import type { ReactNode } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { theme } from '../../styles/theme';
import LogoUcm from '../brand/LogoUcm';

type AuthShellProps = {
  etapa: string;
  titulo: string;
  descricao: string;
  children: ReactNode;
};

export default function AuthShell({
  etapa,
  titulo,
  descricao,
  children,
}: AuthShellProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.hero, desktop && styles.heroDesktop]}>
        <View style={styles.marcaLinha}>
          <LogoUcm size={42} />
          <Text style={styles.marcaNome}>UCM CARD</Text>
        </View>

        <Text style={styles.etapa}>{etapa}</Text>
        <Text style={[styles.titulo, desktop && styles.tituloDesktop]}>{titulo}</Text>
        <Text style={styles.descricao}>{descricao}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, desktop && styles.cardDesktop]}>{children}</View>
        <Text style={styles.rodape}>
          Universidade Católica de Moçambique
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  hero: {
    backgroundColor: theme.colors.primary,
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 92,
  },
  heroDesktop: { paddingHorizontal: 0, alignItems: 'center' },
  marcaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 34,
  },
  marca: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marcaTexto: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  marcaNome: {
    color: '#cbd5e1',
    marginLeft: 10,
    letterSpacing: 1.6,
    fontSize: 12,
    fontWeight: '800',
  },
  etapa: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 10,
  },
  titulo: {
    color: theme.colors.textWhite,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: -0.8,
    fontWeight: '800',
  },
  tituloDesktop: { fontSize: 36, lineHeight: 43 },
  descricao: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 340,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scrollDesktop: { width: '100%', maxWidth: 660, alignSelf: 'center' },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 22,
    padding: 22,
    marginTop: -58,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.lg,
  },
  cardDesktop: { marginTop: -64, padding: 30 },
  rodape: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 22,
  },
});
