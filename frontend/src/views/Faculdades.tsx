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
  atualizarFaculdade,
  criarFaculdade,
  listarFaculdades,
} from '../services/faculdades.service';
import type { Faculdade } from '../types/faculdade';
import AppHeader from '../components/layout/AppHeader';
import { theme } from '../styles/theme';

interface FaculdadesProps {
  aoVoltar: () => void;
}

export default function Faculdades({
  aoVoltar,
}: FaculdadesProps) {
  const [faculdades, setFaculdades] =
    useState<Faculdade[]>([]);

  const [carregando, setCarregando] =
    useState(true);
  const [nome, setNome] = useState('');
  const [sigla, setSigla] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [idEditar, setIdEditar] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    carregarFaculdades();
  }, []);

  async function carregarFaculdades() {
    try {
      setCarregando(true);

      const dados = await listarFaculdades();

      setFaculdades(dados);
    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível carregar as faculdades.',
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarFaculdade() {
    if (!nome.trim() || !sigla.trim()) {
      Alert.alert('Atenção', 'Preencha o nome e a sigla.');
      return;
    }

    try {
      setSalvando(true);

      if (idEditar !== null) {
        await atualizarFaculdade(idEditar, {
          nome: nome.trim(),
          sigla: sigla.trim().toUpperCase(),
        });

        Alert.alert('Sucesso', 'Faculdade atualizada com sucesso.');
      } else {
        await criarFaculdade({
          nome: nome.trim(),
          sigla: sigla.trim().toUpperCase(),
        });

        Alert.alert('Sucesso', 'Faculdade cadastrada com sucesso.');
      }

      setNome('');
      setSigla('');
      setIdEditar(null);
      await carregarFaculdades();
      setMostrarFormulario(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a faculdade.');
    } finally {
      setSalvando(false);
    }
  }

  function editarFaculdade(faculdade: Faculdade) {
    setIdEditar(faculdade.id);
    setNome(faculdade.nome);
    setSigla(faculdade.sigla);
    setMostrarFormulario(true);
  }

  function abrirCadastro() {
    setIdEditar(null);
    setNome('');
    setSigla('');
    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    setIdEditar(null);
    setNome('');
    setSigla('');
    setMostrarFormulario(false);
  }

  async function alterarEstado(faculdade: Faculdade) {
    try {
      await atualizarFaculdade(faculdade.id, {
        ativo: !faculdade.ativo,
      });

      await carregarFaculdades();
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o estado.');
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader
        titulo="Faculdades"
        descricao="Organize as unidades académicas da universidade."
        aoVoltar={aoVoltar}
      />

      {!mostrarFormulario ? (
        <View style={styles.areaNova}>
          <Pressable style={styles.botaoNovo} onPress={abrirCadastro}>
            <Text style={styles.botaoNovoTexto}>+ Nova Faculdade</Text>
          </Pressable>
        </View>
      ) : (
      <View style={styles.formulario}>
        <Text style={styles.formularioTitulo}>
          {idEditar !== null
            ? 'Editar Faculdade'
            : 'Nova Faculdade'}
        </Text>

        <Text style={styles.formularioDescricao}>
          Registe a unidade académica que fará parte da estrutura UCM.
        </Text>

        <Text style={styles.campoRotulo}>
          Designação da faculdade <Text style={styles.obrigatorio}>*</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Designação oficial da faculdade"
          placeholderTextColor={theme.colors.textMuted}
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.campoRotulo}>
          Sigla institucional <Text style={styles.obrigatorio}>*</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Sigla institucional da faculdade"
          placeholderTextColor={theme.colors.textMuted}
          value={sigla}
          onChangeText={setSigla}
          autoCapitalize="characters"
          maxLength={10}
        />

        <Pressable
          style={[
            styles.botaoSalvar,
            salvando && styles.botaoDesabilitado,
          ]}
          onPress={salvarFaculdade}
          disabled={salvando}
        >
          <Text style={styles.botaoSalvarTexto}>
            {salvando
              ? 'Salvando...'
              : idEditar !== null
                ? 'Atualizar Faculdade'
                : 'Cadastrar Faculdade'}
          </Text>
        </Pressable>
        <Pressable style={styles.botaoCancelar} onPress={fecharFormulario}>
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </Pressable>
      </View>
      )}

      {!mostrarFormulario && (carregando ? (
        <ActivityIndicator
          size="large"
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={faculdades}
          keyExtractor={(item) =>
            item.id.toString()
          }
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Nenhuma faculdade cadastrada.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.sigla}>
                <Text style={styles.siglaTexto}>
                  {item.sigla}
                </Text>
              </View>

              <View style={styles.informacoes}>
                <Text style={styles.nome}>
                  {item.nome}
                </Text>

                <Text
                  style={
                    item.ativo
                      ? styles.ativo
                      : styles.inativo
                  }
                >
                  {item.ativo
                    ? 'Ativa'
                    : 'Inativa'}
                </Text>

<AcoesRegisto>
<View style={styles.acoes}>
                  <Pressable
                    style={styles.botaoEditar}
                    onPress={() => editarFaculdade(item)}
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
      ))}
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
    marginBottom: 14,
    fontSize: 15,
  },

  titulo: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },

  loading: {
    marginTop: 50,
  },

  areaNova: { padding: 16, paddingBottom: 0 },
  botaoNovo: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  botaoNovoTexto: { color: theme.colors.textWhite, fontWeight: '800' },
  botaoCancelar: { alignItems: 'center', paddingVertical: 13, marginTop: 4 },
  textoCancelar: { color: theme.colors.textSecondary, fontWeight: '700' },

  formulario: {
    width: '92%',
    maxWidth: 748,
    alignSelf: 'center',
    margin: 16,
    marginBottom: 4,
    padding: 20,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 4,
    borderTopColor: theme.colors.primary,
    ...theme.shadows.md,
  },

  formularioTitulo: {
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
    fontSize: 15,
    minHeight: 54,
  },

  botaoSalvar: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    alignItems: 'center',
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoSalvarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  lista: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 16,
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

  sigla: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  siglaTexto: {
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
    marginBottom: 5,
  },

  ativo: {
    color: theme.colors.status.ativo.text,
    backgroundColor: theme.colors.status.ativo.bg,
    overflow: 'hidden',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    alignSelf: 'flex-start',
    fontWeight: '800',
  },

  inativo: {
    color: theme.colors.status.bloqueado.text,
    backgroundColor: theme.colors.status.bloqueado.bg,
    overflow: 'hidden',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    alignSelf: 'flex-start',
    fontWeight: '800',
  },

  acoes: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },

  botaoEditar: {
    backgroundColor: theme.colors.accentLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 7,
  },

  textoEditar: {
    color: theme.colors.accentHover,
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

  vazio: {
    textAlign: 'center',
    marginTop: 50,
    color: '#667085',
  },
});
