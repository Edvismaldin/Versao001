import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  titulo: string;
  descricao?: string;
  onPress: () => void;
};

export default function MenuDashboard({
  titulo,
  descricao,
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
      onPress={onPress}
    >
      <View style={styles.linha}>
        <View style={styles.marca}>
          <Text style={styles.marcaTexto}>{titulo.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.conteudo}>
          <Text style={styles.titulo}>{titulo}</Text>
          {descricao && <Text style={styles.descricao}>{descricao}</Text>}
        </View>
        <Text style={styles.seta}>→</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    elevation: 3,
  },

  pressionado: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  linha: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  marca: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EAF4FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  marcaTexto: {
    color: '#003B71',
    fontSize: 12,
    fontWeight: '900',
  },

  conteudo: {
    flex: 1,
  },

  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  descricao: {
    fontSize: 13,
    marginTop: 4,
    color: '#6B7280',
  },

  seta: {
    color: '#94A3B8',
    fontSize: 22,
    marginLeft: 8,
  },
});
