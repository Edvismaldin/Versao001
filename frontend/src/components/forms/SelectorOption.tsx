import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { theme } from '../../styles/theme';

type SelectorOptionProps = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Opção de escolha institucional, reutilizável nos formulários UCM. */
export default function SelectorOption({
  title,
  subtitle,
  selected,
  onPress,
  compact = false,
  style,
  accessibilityLabel,
}: SelectorOptionProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.opcao,
        style,
        compact && styles.opcaoCompacta,
        selected && styles.opcaoSelecionada,
        pressed && styles.pressionada,
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View style={styles.textos}>
        <Text style={[styles.titulo, selected && styles.tituloSelecionado]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitulo, selected && styles.subtituloSelecionado]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.indicador, selected && styles.indicadorSelecionado]}>
        <MaterialCommunityIcons
          name={selected ? 'check' : 'circle-outline'}
          size={compact ? 16 : 18}
          color={selected ? '#FFFFFF' : theme.colors.textMuted}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opcao: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opcaoCompacta: { minHeight: 48, paddingVertical: 8, paddingHorizontal: 12 },
  opcaoSelecionada: {
    backgroundColor: '#EFF6FF',
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  pressionada: { opacity: 0.84 },
  textos: { flex: 1, minWidth: 0, paddingRight: 10 },
  titulo: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 14 },
  tituloSelecionado: { color: theme.colors.primary },
  subtitulo: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
  subtituloSelecionado: { color: '#2563A7' },
  indicador: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicadorSelecionado: { backgroundColor: theme.colors.primary },
});
