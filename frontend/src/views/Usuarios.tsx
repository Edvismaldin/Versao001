import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  criarUsuario,
  atualizarUsuario,
  eliminarUsuario,
  listarUsuarios,
  type UsuarioCriado,
  type PerfilOperacional,
} from '../services/usuarios.service';
import { montarUrlArquivo } from '../services/api';
import AppHeader from '../components/layout/AppHeader';
import { theme } from '../styles/theme';

interface UsuariosProps {
  aoVoltar: () => void;
}

function obterMensagemErro(erro: unknown) {
  const resposta = erro as {
    response?: { data?: { message?: string | string[] } };
  };
  const mensagem = resposta.response?.data?.message;

  return Array.isArray(mensagem)
    ? mensagem.join('\n')
    : mensagem ?? 'Não foi possível cadastrar o utilizador.';
}

export default function Usuarios({ aoVoltar }: UsuariosProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<PerfilOperacional>(
    'OPERADOR_CARTAO',
  );
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioCriado | null>(null);
  const [usuarioParaEliminar, setUsuarioParaEliminar] = useState<UsuarioCriado | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioCriado[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(false);
  async function carregarUsuarios() {
    setCarregando(true);
    setErroLista(false);
    try { setUsuarios(await listarUsuarios()); }
    catch { setErroLista(true); }
    finally { setCarregando(false); }
  }
  useEffect(() => { void carregarUsuarios(); }, []);
  const filtrados = usuarios.filter((u) =>
    `${u.nome} ${u.email} ${u.perfil}`.toLowerCase().includes(pesquisa.trim().toLowerCase()));

  async function salvar() {
    if (!nome.trim() || !email.trim() || (!usuarioEmEdicao && !senha)) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e palavra-passe.');
      return;
    }

    if (senha && senha.length < 8) {
      Alert.alert(
        'Atenção',
        'A senha deve possuir pelo menos 8 caracteres.',
      );
      return;
    }

    try {
      setSalvando(true);
      if (usuarioEmEdicao) {
        await atualizarUsuario(usuarioEmEdicao.id, {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          perfil,
          ...(senha ? { senha } : {}),
        });
      } else {
        await criarUsuario({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha,
          perfil,
        });
      }

      setNome('');
      setEmail('');
      setSenha('');
      setPerfil('OPERADOR_CARTAO');
      setUsuarioEmEdicao(null);
      setMostrarFormulario(false);
      void carregarUsuarios();
      Alert.alert('Sucesso', usuarioEmEdicao ? 'Utilizador atualizado com sucesso.' : 'Utilizador cadastrado com sucesso.');
    } catch (erro) {
      Alert.alert('Erro', obterMensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(usuario: UsuarioCriado) {
    setUsuarioEmEdicao(usuario);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setSenha('');
    setPerfil(usuario.perfil as PerfilOperacional);
    setMostrarFormulario(true);
  }

  function confirmarEliminacao(usuario: UsuarioCriado) {
    setUsuarioParaEliminar(usuario);
  }

  async function eliminarSelecionado() {
    if (!usuarioParaEliminar) return;
    try {
      setEliminando(true);
      await eliminarUsuario(usuarioParaEliminar.id);
      setUsuarioParaEliminar(null);
      await carregarUsuarios();
      Alert.alert('Sucesso', 'Utilizador eliminado com sucesso.');
    } catch (erro) {
      Alert.alert('Erro', obterMensagemErro(erro));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader
        titulo="Utilizadores"
        descricao="Crie acessos para a equipa operacional."
        aoVoltar={aoVoltar}
      />

      {!mostrarFormulario ? (
        <ScrollView contentContainerStyle={styles.areaNova} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitulo}>Diretório de acessos</Text>
          <Pressable style={styles.botaoNovo} onPress={() => { setUsuarioEmEdicao(null); setNome(''); setEmail(''); setSenha(''); setPerfil('OPERADOR_CARTAO'); setMostrarFormulario(true); }}>
            <Text style={styles.textoBotao}>+ Criar acesso operacional</Text>
          </Pressable>
          <TextInput style={[styles.input, { marginTop: 16 }]} placeholder="Pesquisar por nome, e-mail ou perfil"
            value={pesquisa} onChangeText={setPesquisa} autoCapitalize="none" />
          <Text style={styles.label}>{carregando ? 'A carregar…' : `${filtrados.length} acessos encontrados`}</Text>
          {erroLista && <Pressable onPress={carregarUsuarios}><Text style={styles.label}>Não foi possível carregar. Tentar novamente</Text></Pressable>}
          {!carregando && !erroLista && filtrados.length === 0 && <Text style={styles.label}>Nenhum acesso encontrado.</Text>}
          {filtrados.map((u) => (
            <View key={u.id} style={styles.registo}>
              <View style={styles.avatarRegisto}>
                {u.foto ? (
                  <Image source={{ uri: montarUrlArquivo(u.foto) ?? undefined }} style={styles.avatarImagem} />
                ) : (
                  <Text style={styles.avatarInicial}>{u.nome.trim().charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.registoInfo}>
                <Text style={styles.registoNome}>{u.nome}</Text>
                <Text style={styles.registoEmail}>{u.email}</Text>
                <View style={styles.registoRodape}>
                  <View style={styles.registoPerfil}>
                    <Text style={styles.registoPerfilTexto}>{u.perfil.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.acoesRegisto}>
                <Pressable style={styles.acaoEditar} onPress={() => abrirEdicao(u)} accessibilityRole="button" accessibilityLabel={`Editar ${u.nome}`}>
                  <MaterialCommunityIcons name="pencil-outline" size={17} color={theme.colors.primary} />
                </Pressable>
                <Pressable style={styles.acaoEliminar} onPress={() => confirmarEliminacao(u)} accessibilityRole="button" accessibilityLabel={`Eliminar ${u.nome}`}>
                  <MaterialCommunityIcons name="trash-can-outline" size={17} color="#B42318" />
                </Pressable>
              </View>
              <View style={[styles.estado, u.ativo ? styles.estadoAtivo : styles.estadoInativo]}>
                <MaterialCommunityIcons
                  name={u.ativo ? 'check-circle-outline' : 'close-circle-outline'}
                  size={14}
                  color={u.ativo ? '#067647' : '#B42318'}
                />
                <Text style={[styles.estadoTexto, { color: u.ativo ? '#067647' : '#B42318' }]}>
                  {u.ativo ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.formulario}>
        <Text style={styles.subtitulo}>
          {usuarioEmEdicao ? 'Editar utilizador operacional' : 'Novo utilizador operacional'}
        </Text>
        <Text style={styles.formularioDescricao}>
          {usuarioEmEdicao ? 'Atualize os dados de acesso. Deixe a palavra-passe vazia para a manter.' : 'Crie um acesso institucional e atribua o perfil operacional adequado.'}
        </Text>
        <Text style={styles.campoRotulo}>Nome completo <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Nome completo do utilizador"
          placeholderTextColor={theme.colors.textMuted}
          value={nome}
          onChangeText={setNome}
        />
        <Text style={styles.campoRotulo}>E-mail institucional <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail institucional"
          placeholderTextColor={theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.campoRotulo}>Palavra-passe inicial <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder={usuarioEmEdicao ? 'Manter a palavra-passe atual' : 'Defina a palavra-passe inicial'}
          placeholderTextColor={theme.colors.textMuted}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <Text style={styles.label}>Perfil</Text>
        <View style={styles.perfis}>
          <Pressable
            style={[
              styles.perfil,
              perfil === 'PROFESSOR' && styles.perfilSelecionado,
            ]}
            onPress={() => setPerfil('PROFESSOR')}
          >
            <Text
              style={[
                styles.textoPerfil,
                perfil === 'PROFESSOR' && styles.textoPerfilSelecionado,
              ]}
            >
              Professor
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.perfil,
              perfil === 'OPERADOR_CARTAO' && styles.perfilSelecionado,
            ]}
            onPress={() => setPerfil('OPERADOR_CARTAO')}
          >
            <Text
              style={[
                styles.textoPerfil,
                perfil === 'OPERADOR_CARTAO' &&
                  styles.textoPerfilSelecionado,
              ]}
            >
              Operador de Cartão
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.perfil,
              perfil === 'RESPONSAVEL' && styles.perfilSelecionado,
            ]}
            onPress={() => setPerfil('RESPONSAVEL')}
          >
            <Text
              style={[
                styles.textoPerfil,
                perfil === 'RESPONSAVEL' && styles.textoPerfilSelecionado,
              ]}
            >
              Responsável
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.botao, salvando && styles.botaoDesabilitado]}
          onPress={salvar}
          disabled={salvando}
        >
          <Text style={styles.textoBotao}>
            {salvando ? 'A guardar...' : usuarioEmEdicao ? 'Guardar alterações' : 'Cadastrar utilizador'}
          </Text>
        </Pressable>
        <Pressable style={styles.botaoCancelar} onPress={() => { setMostrarFormulario(false); setUsuarioEmEdicao(null); }}>
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </Pressable>
      </View>
      </ScrollView>
      )}
      <Modal
        visible={Boolean(usuarioParaEliminar)}
        transparent
        animationType="fade"
        onRequestClose={() => !eliminando && setUsuarioParaEliminar(null)}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalCard} accessibilityRole="alert">
            <View style={styles.modalIcone}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color="#B42318" />
            </View>
            <Text style={styles.modalTitulo}>Eliminar utilizador?</Text>
            <Text style={styles.modalDescricao}>
              O acesso de {usuarioParaEliminar?.nome} será removido definitivamente.
            </Text>
            <View style={styles.modalAcoes}>
              <Pressable style={styles.modalCancelar} onPress={() => setUsuarioParaEliminar(null)} disabled={eliminando}>
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalEliminar, eliminando && styles.botaoDesabilitado]} onPress={() => void eliminarSelecionado()} disabled={eliminando}>
                <Text style={styles.modalEliminarTexto}>{eliminando ? 'A eliminar...' : 'Eliminar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  registo: { backgroundColor: '#fff', padding: 15, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', ...theme.shadows.sm },
  avatarRegisto: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#EAF4FB', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImagem: { width: '100%', height: '100%' },
  avatarInicial: { color: theme.colors.primary, fontWeight: '900', fontSize: 18 },
  registoInfo: { flex: 1, minWidth: 0 },
  registoNome: { fontSize: 16, fontWeight: '700', color: '#101828' },
  registoEmail: { fontSize: 13, color: '#667085', marginTop: 3 },
  registoRodape: { marginTop: 8, flexDirection: 'row' },
  registoPerfil: { backgroundColor: '#EAF4FB', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  registoPerfilTexto: { fontSize: 10, color: theme.colors.primary, fontWeight: '800', letterSpacing: 0.25 },
  acoesRegisto: { flexDirection: 'row', gap: 6, marginLeft: 10 },
  acaoEditar: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EAF4FB', alignItems: 'center', justifyContent: 'center' },
  acaoEliminar: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FEF3F2', alignItems: 'center', justifyContent: 'center' },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 10 },
  estadoAtivo: { backgroundColor: '#ECFDF3' },
  estadoInativo: { backgroundColor: '#FEF3F2' },
  estadoTexto: { fontSize: 11, fontWeight: '800' },
  container: { flex: 1, backgroundColor: theme.colors.background },
  cabecalho: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#003b71',
  },
  voltar: { color: '#ffffff', marginBottom: 14 },
  titulo: { color: '#ffffff', fontSize: 26, fontWeight: 'bold' },
  formulario: {
    width: '92%',
    maxWidth: 748,
    alignSelf: 'center',
    margin: 16,
    padding: 20,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 4,
    borderTopColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  areaNova: { padding: 16, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  botaoNovo: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.md, alignItems: 'center', ...theme.shadows.sm },
  botaoCancelar: { alignItems: 'center', paddingVertical: 13, marginTop: 4 },
  textoCancelar: { color: theme.colors.textSecondary, fontWeight: '700' },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  formularioDescricao: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  campoRotulo: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  obrigatorio: { color: theme.colors.danger },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    color: theme.colors.textPrimary,
    minHeight: 54,
  },
  label: { color: theme.colors.textSecondary, fontWeight: '700', marginBottom: 8, fontSize: 13 },
  perfis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  perfil: {
    minWidth: 130,
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 11,
    alignItems: 'center',
  },
  perfilSelecionado: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  textoPerfil: { color: '#344054', fontWeight: '600', fontSize: 12 },
  textoPerfilSelecionado: { color: '#ffffff' },
  botao: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  botaoDesabilitado: { opacity: 0.6 },
  textoBotao: { color: '#ffffff', fontWeight: 'bold' },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.52)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: theme.borderRadius.xl, padding: 24, ...theme.shadows.lg },
  modalIcone: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#FEF3F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitulo: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '900' },
  modalDescricao: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  modalCancelar: { minHeight: 44, paddingHorizontal: 16, borderRadius: theme.borderRadius.md, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalCancelarTexto: { color: theme.colors.textSecondary, fontWeight: '800' },
  modalEliminar: { minHeight: 44, paddingHorizontal: 17, borderRadius: theme.borderRadius.md, backgroundColor: '#B42318', alignItems: 'center', justifyContent: 'center' },
  modalEliminarTexto: { color: '#FFFFFF', fontWeight: '800' },
});
