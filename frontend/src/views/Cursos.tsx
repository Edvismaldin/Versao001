import AcoesRegisto from '../components/layout/AcoesRegisto';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  atualizarCurso,
  criarCurso,
  listarCursos,
} from '../services/cursos.service';

import {
  listarFaculdades,
} from '../services/faculdades.service';

import type { Curso } from '../types/curso';
import type { Faculdade } from '../types/faculdade';
import AppHeader from '../components/layout/AppHeader';
import SelectorOption from '../components/forms/SelectorOption';
import { theme } from '../styles/theme';

interface CursosProps {
  aoVoltar: () => void;
}

export default function Cursos({
  aoVoltar,
}: CursosProps) {
  const [cursos, setCursos] =
    useState<Curso[]>([]);

  const [faculdades, setFaculdades] =
    useState<Faculdade[]>([]);

  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');

  const [faculdadeId, setFaculdadeId] =
    useState<number | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [idEditar, setIdEditar] =
    useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        dadosCursos,
        dadosFaculdades,
      ] = await Promise.all([
        listarCursos(),
        listarFaculdades(),
      ]);

      setCursos(dadosCursos);

      setFaculdades(
        dadosFaculdades.filter(
          (faculdade) => faculdade.ativo,
        ),
      );
    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados.',
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarCurso() {
    if (!nome.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o nome do curso.',
      );
      return;
    }

    if (!codigo.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o código do curso.',
      );
      return;
    }

    if (faculdadeId === null) {
      Alert.alert(
        'Atenção',
        'Selecione uma faculdade.',
      );
      return;
    }

    try {
      setSalvando(true);

      const dados = {
        nome: nome.trim(),
        codigo: codigo
          .trim()
          .toUpperCase(),
        faculdadeId,
      };

      if (idEditar !== null) {
        await atualizarCurso(idEditar, dados);

        Alert.alert(
          'Sucesso',
          'Curso atualizado com sucesso.',
        );
      } else {
        await criarCurso(dados);

        Alert.alert(
          'Sucesso',
          'Curso cadastrado com sucesso.',
        );
      }

      limparFormulario();

      await carregarDados();
    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível salvar o curso.',
      );
    } finally {
      setSalvando(false);
    }
  }

  function limparFormulario() {
    setNome('');
    setCodigo('');
    setFaculdadeId(null);
    setIdEditar(null);
    setMostrarFormulario(false);
  }

  function editarCurso(curso: Curso) {
    setIdEditar(curso.id);
    setNome(curso.nome);
    setCodigo(curso.codigo);
    setFaculdadeId(curso.faculdadeId);
    setMostrarFormulario(true);
  }

  async function alterarEstado(curso: Curso) {
    try {
      await atualizarCurso(curso.id, {
        ativo: !curso.ativo,
      });

      await carregarDados();
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível alterar o estado do curso.',
      );
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader
        titulo="Cursos"
        descricao="Configure a oferta formativa e as suas faculdades."
        aoVoltar={aoVoltar}
      />

      {carregando ? (
        <ActivityIndicator
          size="large"
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={mostrarFormulario ? [] : cursos}
          keyExtractor={(item) =>
            item.id.toString()
          }
          contentContainerStyle={
            styles.conteudo
          }

          ListHeaderComponent={
            !mostrarFormulario ? (
              <Pressable style={styles.botaoNovo} onPress={() => setMostrarFormulario(true)}>
                <Text style={styles.botaoNovoTexto}>+ Novo Curso</Text>
              </Pressable>
            ) : (
            <View style={styles.formulario}>
              <Text style={styles.formularioTitulo}>
                {idEditar !== null
                  ? 'Editar Curso'
                  : 'Novo Curso'}
              </Text>

              <Text style={styles.formularioDescricao}>
                Associe o curso à respetiva faculdade e informe a sua identificação institucional.
              </Text>

              <Text style={styles.campoRotulo}>
                Designação do curso <Text style={styles.obrigatorio}>*</Text>
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Designação oficial do curso"
                placeholderTextColor={theme.colors.textMuted}
                value={nome}
                onChangeText={setNome}
              />

              <Text style={styles.campoRotulo}>
                Código institucional <Text style={styles.obrigatorio}>*</Text>
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Código institucional do curso"
                placeholderTextColor={theme.colors.textMuted}
                value={codigo}
                onChangeText={setCodigo}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>
                Faculdade
              </Text>

              <View style={styles.grupoSelecao} accessibilityRole="radiogroup">
                {faculdades.map((faculdade) => (
                  <SelectorOption
                    key={faculdade.id}
                    title={faculdade.sigla}
                    subtitle={faculdade.nome}
                    selected={faculdadeId === faculdade.id}
                    onPress={() => setFaculdadeId(faculdade.id)}
                    accessibilityLabel={`Selecionar faculdade ${faculdade.sigla}: ${faculdade.nome}`}
                  />
                ))}
              </View>

              <Pressable
                style={[
                  styles.botaoSalvar,
                  salvando &&
                    styles.botaoDesabilitado,
                ]}
                onPress={salvarCurso}
                disabled={salvando}
              >
                <Text
                  style={
                    styles.botaoSalvarTexto
                  }
                >
                  {salvando
                    ? 'Salvando...'
                    : idEditar !== null
                      ? 'Atualizar Curso'
                      : 'Cadastrar Curso'}
                </Text>
              </Pressable>

              {idEditar !== null && (
                <Pressable
                  style={styles.botaoCancelar}
                  onPress={limparFormulario}
                >
                  <Text style={styles.textoCancelar}>
                    Cancelar edição
                  </Text>
                </Pressable>
              )}
              {idEditar === null && (
                <Pressable style={styles.botaoCancelar} onPress={limparFormulario}>
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </Pressable>
              )}
            </View>
            )
          }

          ListEmptyComponent={mostrarFormulario ? null : (
            <Text style={styles.vazio}>
              Nenhum curso cadastrado.
            </Text>
          )}

          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.codigo}>
                <Text
                  style={styles.codigoTexto}
                >
                  {item.codigo}
                </Text>
              </View>

              <View style={styles.informacoes}>
                <Text style={styles.nome}>
                  {item.nome}
                </Text>

                <Text style={styles.faculdade}>
                  {item.faculdade?.sigla ??
                    'Sem faculdade'}
                </Text>

                <Text
                  style={
                    item.ativo
                      ? styles.ativo
                      : styles.inativo
                  }
                >
                  {item.ativo
                    ? 'Ativo'
                    : 'Inativo'}
                </Text>

<AcoesRegisto>
<View style={styles.acoes}>
                  <Pressable
                    style={styles.botaoEditar}
                    onPress={() => editarCurso(item)}
                  >
                    <Text style={styles.textoEditar}>
                      Editar
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      item.ativo
                        ? styles.botaoDesativar
                        : styles.botaoAtivar
                    }
                    onPress={() => alterarEstado(item)}
                  >
                    <Text style={styles.textoAcao}>
                      {item.ativo
                        ? 'Desativar'
                        : 'Ativar'}
                    </Text>
                  </Pressable>
                </View>
</AcoesRegisto>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  cabecalho: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#003b71',
  },

  voltar: {
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 14,
  },

  titulo: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },

  loading: {
    marginTop: 50,
  },

  conteudo: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 16,
  },

  botaoNovo: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: 14, alignItems: 'center', marginBottom: 18, ...theme.shadows.sm },
  botaoNovoTexto: { color: theme.colors.textWhite, fontWeight: '800' },

  formulario: {
    width: '100%',
    maxWidth: 780,
    alignSelf: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: 20,
    borderRadius: theme.borderRadius.xl,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 4,
    borderTopColor: theme.colors.primary,
    ...theme.shadows.md,
  },

  formularioTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: theme.colors.textPrimary,
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
    fontSize: 15,
    minHeight: 54,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.textSecondary,
  },

  grupoSelecao: { gap: 9, marginBottom: 6 },

  botaoSalvar: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    alignItems: 'center',
    marginTop: 10,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoSalvarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8f0',
    borderLeftWidth: 3,
    borderLeftColor: '#003b71',
  },

  codigo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  codigoTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  informacoes: {
    flex: 1,
  },

  nome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
  },

  faculdade: {
    color: '#667085',
    marginTop: 4,
  },

  ativo: {
    color: theme.colors.status.ativo.text,
    backgroundColor: theme.colors.status.ativo.bg,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '800',
    alignSelf: 'flex-start',
  },

  inativo: {
    color: theme.colors.status.bloqueado.text,
    backgroundColor: theme.colors.status.bloqueado.bg,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '800',
    alignSelf: 'flex-start',
  },

  acoes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  botaoEditar: {
    backgroundColor: '#eef4ff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 7,
  },

  textoEditar: {
    color: '#003b71',
    fontWeight: '600',
  },

  botaoAtivar: {
    backgroundColor: '#067647',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 7,
  },

  botaoDesativar: {
    backgroundColor: '#b42318',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 7,
  },

  textoAcao: {
    color: '#ffffff',
    fontWeight: '600',
  },

  botaoCancelar: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  textoCancelar: {
    color: '#667085',
    fontWeight: '600',
  },

  vazio: {
    textAlign: 'center',
    color: '#667085',
    marginTop: 30,
  },
});
