import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AcoesRegisto({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <View style={styles.area}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: aberto }}
        onPress={() => setAberto(!aberto)} style={styles.botao}>
        <Text style={styles.texto}>{aberto ? 'Fechar ações' : 'Gerir registo'}</Text>
        <MaterialCommunityIcons name={aberto ? 'chevron-up' : 'chevron-down'} size={22} color="#003B71" />
      </Pressable>
      {aberto && <View style={styles.conteudo}>{children}</View>}
    </View>
  );
}
const styles = StyleSheet.create({
  area: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#e6ebf2' },
  botao: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  texto: { color: '#003b71', fontWeight: '700', fontSize: 13 },
  seta: { color: '#003b71', fontSize: 22 },
  conteudo: { padding: 12, backgroundColor: '#F3F6FA', borderRadius: 12, marginBottom: 8 },
});
