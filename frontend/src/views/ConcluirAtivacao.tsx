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
import { concluirAtivacaoEstudante } from '../services/autenticacao.service';
import { theme } from '../styles/theme';

type Props = {
  codigoEstudante: string;
  onVoltar: () => void;
  onConcluido: () => void;
};

export default function ConcluirAtivacao({
  codigoEstudante,
  onVoltar,
  onConcluido,
}: Props) {
  const [codigoAtivacao, setCodigoAtivacao] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [ativacaoConcluida, setAtivacaoConcluida] = useState(false);

  async function ativarConta() {
    if (codigoAtivacao.trim().length !== 6) {
      Alert.alert('Código inválido', 'Informe os seis dígitos enviados para o seu email.');
      return;
    }

    if (senha.length < 8) {
      Alert.alert('Senha insuficiente', 'Utilize pelo menos 8 caracteres na sua senha.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'A confirmação deve ser igual à nova senha.');
      return;
    }

    try {
      setCarregando(true);
      const resposta = await concluirAtivacaoEstudante(
        codigoEstudante,
        codigoAtivacao.trim(),
        senha,
        confirmarSenha,
      );

      if (Platform.OS === 'web') {
        setAtivacaoConcluida(true);
      } else {
        Alert.alert('Conta ativada', resposta.mensagem, [
          { text: 'Iniciar sessão', onPress: onConcluido },
        ]);
      }
    } catch (erro: any) {
      const mensagem = erro?.response?.data?.message;
      Alert.alert(
        'Falha na ativação',
        Array.isArray(mensagem)
          ? mensagem.join('\n')
          : mensagem ?? 'Não foi possível concluir a ativação.',
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell
      etapa="Primeiro acesso · Etapa 2 de 2"
      titulo="Proteja o seu acesso"
      descricao="Introduza o código recebido e defina uma palavra-passe segura."
    >
      <View style={styles.codigoBox}>
        <Text style={styles.codigoLabel}>ESTUDANTE</Text>
        <Text style={styles.codigoValor}>{codigoEstudante}</Text>
      </View>

      <Text style={styles.label}>Código de segurança</Text>
      <Text style={styles.ajuda}>Introduza os seis dígitos recebidos no seu e-mail.</Text>
      <TextInput
        value={codigoAtivacao}
        onChangeText={setCodigoAtivacao}
        placeholder="Código de verificação de 6 dígitos"
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        style={[styles.input, styles.inputCodigo]}
      />

      <Text style={styles.label}>Nova palavra-passe</Text>
      <Text style={styles.ajuda}>Use pelo menos 8 caracteres e evite dados pessoais.</Text>
      <TextInput
        value={senha}
        onChangeText={setSenha}
        placeholder="Defina uma palavra-passe segura"
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry
        textContentType="newPassword"
        style={styles.input}
      />

      <Text style={styles.label}>Confirmar palavra-passe</Text>
      <TextInput
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        placeholder="Confirme a palavra-passe"
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry
        textContentType="newPassword"
        style={styles.input}
      />

      <Pressable
        style={({ pressed }) => [
          styles.botao,
          pressed && styles.botaoPressionado,
          carregando && styles.botaoDesabilitado,
        ]}
        onPress={ativarConta}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color={theme.colors.textWhite} />
        ) : (
          <Text style={styles.textoBotao}>Concluir ativação</Text>
        )}
      </Pressable>

      {ativacaoConcluida && (
        <View style={styles.sucessoBox}>
          <Text style={styles.sucessoTitulo}>Conta ativada com sucesso</Text>
          <Text style={styles.sucessoTexto}>A sua conta académica já pode ser utilizada no portal.</Text>
          <Pressable style={styles.botaoContinuar} onPress={onConcluido}>
            <Text style={styles.textoBotao}>Ir para o início de sessão</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.voltar} onPress={onVoltar}>
        <Text style={styles.textoVoltar}>← Corrigir os dados anteriores</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  codigoBox: {
    padding: 14,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.accentLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 22,
  },
  codigoLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '800',
  },
  codigoValor: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    marginTop: 4,
    fontWeight: '800',
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
  inputCodigo: {
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  botao: {
    backgroundColor: theme.colors.primary,
    minHeight: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
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
