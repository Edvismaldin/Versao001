import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AuthShell from '../components/layout/AuthShell';
import { solicitarAtivacaoEstudante } from '../services/autenticacao.service';
import { theme } from '../styles/theme';

type Props = {
  onVoltar: () => void;
  onCodigoEnviado: (codigoEstudante: string) => void;
};

export default function AtivarConta({
  onVoltar,
  onCodigoEnviado,
}: Props) {
  const [codigo, setCodigo] = useState('');
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  async function solicitarCodigo() {
    if (!codigo.trim() || !email.trim()) {
      Alert.alert('Dados incompletos', 'Informe o código e o email institucional.');
      return;
    }

    try {
      setCarregando(true);
      const resposta = await solicitarAtivacaoEstudante(
        codigo.trim(),
        email.trim().toLowerCase(),
      );

      if (Platform.OS === 'web') {
        setCodigoEnviado(true);
      } else {
        Alert.alert('Código enviado', resposta.mensagem, [
          {
            text: 'Continuar',
            onPress: () => onCodigoEnviado(codigo.trim()),
          },
        ]);
      }
    } catch (erro: any) {
      const mensagem = erro?.response?.data?.message;
      Alert.alert(
        'Não foi possível ativar',
        Array.isArray(mensagem)
          ? mensagem.join('\n')
          : mensagem ?? 'Não foi possível enviar o código de ativação.',
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell
      etapa="Primeiro acesso · Etapa 1 de 2"
      titulo="Ative a sua conta"
      descricao="Confirme os seus dados académicos para receber um código de segurança."
    >
      <View style={styles.aviso}>
        <Text style={styles.avisoIcone}>i</Text>
        <Text style={styles.avisoTexto}>
          Use o mesmo código e email registados pela UCM.
        </Text>
      </View>

      <Text style={styles.label}>Código académico</Text>
      <Text style={styles.ajuda}>O código foi atribuído no momento do seu cadastro.</Text>
      <TextInput
        value={codigo}
        onChangeText={setCodigo}
        placeholder="Código académico do estudante"
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        textContentType="username"
        style={styles.input}
      />

      <Text style={styles.label}>Email institucional</Text>
      <Text style={styles.ajuda}>Utilize o e-mail registado pelo setor académico.</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="E-mail institucional"
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        style={styles.input}
      />

      <Pressable
        style={({ pressed }) => [
          styles.botao,
          pressed && styles.botaoPressionado,
          carregando && styles.botaoDesabilitado,
        ]}
        onPress={solicitarCodigo}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color={theme.colors.textWhite} />
        ) : (
          <Text style={styles.textoBotao}>Enviar código de segurança</Text>
        )}
      </Pressable>

      {codigoEnviado && (
        <View style={styles.sucessoBox}>
          <Text style={styles.sucessoTitulo}>Código enviado com sucesso</Text>
          <Text style={styles.sucessoTexto}>Verifique o seu e-mail institucional para continuar a ativação.</Text>
          <Pressable style={styles.botaoContinuar} onPress={() => onCodigoEnviado(codigo.trim())}>
            <Text style={styles.textoBotao}>Continuar</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.voltar} onPress={onVoltar}>
        <Text style={styles.textoVoltar}>← Voltar ao início de sessão</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: theme.borderRadius.lg,
    padding: 15,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 22,
  },
  avisoIcone: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    color: theme.colors.textWhite,
    fontWeight: '800',
    textAlign: 'center',
    marginRight: 9,
    overflow: 'hidden',
  },
  avisoTexto: {
    flex: 1,
    color: '#1e40af',
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  ajuda: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 7,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: theme.colors.textPrimary,
    fontSize: 15,
    marginBottom: 20,
    minHeight: 54,
  },
  botao: {
    backgroundColor: theme.colors.primary,
    minHeight: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  botaoPressionado: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  botaoDesabilitado: { opacity: 0.65 },
  textoBotao: { color: theme.colors.textWhite, fontSize: 15, fontWeight: '800' },
  sucessoBox: { backgroundColor: theme.colors.status.ativo.bg, borderColor: theme.colors.status.ativo.border, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 14 },
  sucessoTitulo: { color: theme.colors.status.ativo.text, fontSize: 14, fontWeight: '900' },
  sucessoTexto: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  botaoContinuar: { backgroundColor: theme.colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minHeight: 46, marginTop: 12 },
  voltar: { alignItems: 'center', paddingTop: 20, paddingBottom: 2 },
  textoVoltar: { color: theme.colors.accent, fontWeight: '700', fontSize: 14 },
});
