import AcoesRegisto from '../components/layout/AcoesRegisto';
import { createElement, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import {
  atualizarEstudante,
  criarEstudante,
  enviarFotoEstudante,
  listarEstudantes,
} from '../services/estudantes.service';

import {
  listarCursos,
} from '../services/cursos.service';

import type { Estudante } from '../types/estudante';
import type { Curso } from '../types/curso';
import AppHeader from '../components/layout/AppHeader';
import { theme } from '../styles/theme';
import { montarUrlArquivo } from '../services/api';

interface EstudantesProps {
  aoVoltar: () => void;
}

function obterMensagemErro(erro: unknown) {
  const resposta = erro as {
    response?: { data?: { message?: string | string[] } };
  };
  const mensagem = resposta.response?.data?.message;

  return Array.isArray(mensagem)
    ? mensagem.join('\n')
    : mensagem ?? 'Não foi possível salvar o estudante.';
}

export default function Estudantes({
  aoVoltar,
}: EstudantesProps) {
  const [estudantes, setEstudantes] =
    useState<Estudante[]>([]);

  const [cursos, setCursos] =
    useState<Curso[]>([]);

  const [codigo, setCodigo] = useState('');
  const [nomeCompleto, setNomeCompleto] =
    useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] =
    useState('');
  const [dataNascimento, setDataNascimento] =
    useState('');
  const [mostrarSeletorData, setMostrarSeletorData] =
    useState(false);
  const [sexo, setSexo] = useState('');

  const [cursoId, setCursoId] =
    useState<number | null>(null);

  const [idEditar, setIdEditar] =
    useState<number | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [fotoPendente, setFotoPendente] =
    useState<string | null>(null);
  const [fotoAtual, setFotoAtual] =
    useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pesquisa, setPesquisa] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        dadosEstudantes,
        dadosCursos,
      ] = await Promise.all([
        listarEstudantes(),
        listarCursos(),
      ]);

      setEstudantes(dadosEstudantes);

      setCursos(
        dadosCursos.filter(
          (curso) => curso.ativo,
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

  function limparFormulario() {
    setCodigo('');
    setNomeCompleto('');
    setEmail('');
    setTelefone('');
    setDataNascimento('');
    setSexo('');
    setCursoId(null);
    setIdEditar(null);
    setFotoPendente(null);
    setFotoAtual(null);
  }

  function dataNascimentoValida(data: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return false;
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const dataVerificada = new Date(ano, mes - 1, dia);

    return dataVerificada.getFullYear() === ano &&
      dataVerificada.getMonth() === mes - 1 &&
      dataVerificada.getDate() === dia;
  }

  function obterDataSelecionada() {
    if (dataNascimentoValida(dataNascimento)) {
      const [ano, mes, dia] = dataNascimento.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }

    return new Date(2000, 0, 1);
  }

  function selecionarDataNascimento(
    evento: DateTimePickerEvent,
    dataSelecionada?: Date,
  ) {
    if (Platform.OS === 'android') {
      setMostrarSeletorData(false);
    }

    if (evento.type !== 'set' || !dataSelecionada) {
      return;
    }

    const ano = dataSelecionada.getFullYear();
    const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
    const dia = String(dataSelecionada.getDate()).padStart(2, '0');

    setDataNascimento(`${ano}-${mes}-${dia}`);
  }

  function abrirSeletorData() {
    setMostrarSeletorData(true);
  }

  function editarEstudante(
    estudante: Estudante,
  ) {
    setIdEditar(estudante.id);
    setCodigo(estudante.codigo);
    setNomeCompleto(
      estudante.nomeCompleto,
    );
    setEmail(estudante.email ?? '');
    setTelefone(
      estudante.telefone ?? '',
    );

    setDataNascimento(
      estudante.dataNascimento
        ? estudante.dataNascimento.substring(
            0,
            10,
          )
        : '',
    );

    setSexo(estudante.sexo ?? '');
    setCursoId(estudante.cursoId);
    setFotoPendente(null);
    setFotoAtual(montarUrlArquivo(estudante.foto));
    setMostrarFormulario(true);
  }

  async function salvarEstudante() {
    if (
      (idEditar !== null && !codigo.trim()) ||
      !nomeCompleto.trim()
    ) {
      Alert.alert(
        'Atenção',
        'Informe os dados obrigatórios do estudante.',
      );
      return;
    }

    if (
      dataNascimento.trim() &&
      !dataNascimentoValida(dataNascimento.trim())
    ) {
      Alert.alert(
        'Data de nascimento inválida',
        'Utilize uma data válida no formato AAAA-MM-DD. Exemplo: 2002-08-15.',
      );
      return;
    }

    if (cursoId === null) {
      Alert.alert(
        'Atenção',
        'Selecione o curso.',
      );
      return;
    }

    try {
      setSalvando(true);

      const dados = {
        ...(idEditar !== null
          ? { codigo: codigo.trim() }
          : {}),
        nomeCompleto:
          nomeCompleto.trim(),
        email:
          email.trim() || undefined,
        telefone:
          telefone.trim() || undefined,
        dataNascimento:
          dataNascimento.trim() ||
          undefined,
        sexo:
          sexo.trim() || undefined,
        cursoId,
      };

      if (idEditar !== null) {
        await atualizarEstudante(
          idEditar,
          dados,
        );

        if (fotoPendente) {
          await enviarFotoEstudante(
            idEditar,
            fotoPendente,
          );
        }

        Alert.alert(
          'Sucesso',
          'Estudante atualizado com sucesso.',
        );
      } else {
        const estudanteCriado =
          await criarEstudante(dados);

        if (fotoPendente) {
          await enviarFotoEstudante(
            estudanteCriado.id,
            fotoPendente,
          );
        }

        Alert.alert(
          'Sucesso',
          'Estudante cadastrado com sucesso.',
        );
      }

      limparFormulario();

      await carregarDados();
      setMostrarFormulario(false);
    } catch (erro) {
      Alert.alert('Erro', obterMensagemErro(erro));
      return;

      Alert.alert(
        'Erro',
        'Não foi possível salvar o estudante.',
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alterarEstado(
    estudante: Estudante,
  ) {
    try {
      await atualizarEstudante(
        estudante.id,
        {
          ativo: !estudante.ativo,
        },
      );

      await carregarDados();
    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível alterar o estado.',
      );
    }
  }

  async function selecionarFoto(
    estudante: Estudante,
  ) {
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso às fotografias do dispositivo.',
        );

        return;
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });

      if (resultado.canceled) {
        return;
      }

      const imagem = resultado.assets[0];

      await enviarFotoEstudante(
        estudante.id,
        imagem.uri,
      );

      await carregarDados();

      Alert.alert(
        'Sucesso',
        'Fotografia atualizada com sucesso.',
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Não foi possível enviar a fotografia.',
      );
    }
  }

  async function selecionarFotoParaFormulario() {
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso às fotografias do dispositivo.',
        );

        return;
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });

      if (!resultado.canceled) {
        setFotoPendente(resultado.assets[0].uri);
      }
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Não foi possível selecionar a fotografia.',
      );
    }
  }

  async function tirarFoto(estudante: Estudante) {
    try {
      if (Platform.OS === 'web') {
        const seletor = document.createElement('input');
        seletor.type = 'file';
        seletor.accept = 'image/*';
        seletor.setAttribute('capture', 'environment');
        seletor.onchange = async () => {
          const foto = seletor.files?.[0];
          if (!foto) return;

          try {
            await enviarFotoEstudante(estudante.id, foto);
            await carregarDados();
            Alert.alert('Sucesso', 'Fotografia capturada e enviada com sucesso.');
          } catch (erro) {
            console.log(erro);
            Alert.alert('Erro', 'Não foi possível enviar a fotografia capturada.');
          }
        };
        seletor.click();
        return;
      }

      const permissao =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à câmera.',
        );

        return;
      }

      const resultado =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });

      if (resultado.canceled) {
        return;
      }

      const imagem = resultado.assets[0];

      await enviarFotoEstudante(
        estudante.id,
        imagem.uri,
      );

      await carregarDados();

      Alert.alert(
        'Sucesso',
        'Fotografia capturada e enviada com sucesso.',
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Não foi possível capturar a fotografia.',
      );
    }
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const estudantesFiltrados = estudantes.filter((item) => {
    const termo = pesquisa.trim().toLowerCase();
    return !termo ||
      item.nomeCompleto.toLowerCase().includes(termo) ||
      item.codigo.toLowerCase().includes(termo) ||
      item.email?.toLowerCase().includes(termo);
  });

  return (
    <View style={styles.container}>
      <AppHeader
        titulo="Estudantes"
        descricao="Registe, atualize e acompanhe os dados académicos."
        aoVoltar={aoVoltar}
      />

      <FlatList
        data={mostrarFormulario ? [] : estudantesFiltrados}
        keyExtractor={(item) =>
          item.id.toString()
        }
        contentContainerStyle={
          styles.conteudo
        }
        ListHeaderComponent={
          !mostrarFormulario ? (
            <View>
              <View style={styles.listaTopo}>
                <View>
                  <Text style={styles.listaTitulo}>Diretório de estudantes</Text>
                  <Text style={styles.listaResumo}>{estudantesFiltrados.length} registo(s) encontrado(s)</Text>
                </View>
                <Pressable style={styles.botaoNovoCompacto} onPress={() => setMostrarFormulario(true)}>
                  <Text style={styles.botaoNovoTexto}>+ Novo</Text>
                </Pressable>
              </View>
              <View style={styles.pesquisaBox}>
                <Text style={styles.pesquisaIcone}>⌕</Text>
                <TextInput
                  style={styles.pesquisa}
                  placeholder="Pesquisar por nome, código académico ou e-mail"
                  placeholderTextColor="#98A2B3"
                  value={pesquisa}
                  onChangeText={setPesquisa}
                  autoCapitalize="none"
                />
              </View>
            </View>
          ) : (
          <View style={styles.formulario}>
            <Text
              style={
                styles.formularioTitulo
              }
            >
              {idEditar !== null
                ? 'Editar Estudante'
                : 'Novo Estudante'}
            </Text>

            <Text style={styles.formularioDescricao}>
              Registe os dados académicos e de contacto do estudante.
            </Text>

            {idEditar !== null ? (
              <>
                <Text style={styles.campoRotulo}>
                  Código académico <Text style={styles.obrigatorio}>*</Text>
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Código académico"
                  placeholderTextColor={theme.colors.textMuted}
                  value={codigo}
                  onChangeText={setCodigo}
                />
              </>
            ) : (
              <View style={styles.codigoAutomatico}>
                <Text style={styles.codigoAutomaticoTitulo}>
                  Código académico automático
                </Text>
                <Text style={styles.codigoAutomaticoDescricao}>
                  O sistema atribuirá um código único após o cadastro.
                </Text>
              </View>
            )}

            <Text style={styles.campoRotulo}>
              Nome completo <Text style={styles.obrigatorio}>*</Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome completo do estudante"
              placeholderTextColor={theme.colors.textMuted}
              value={nomeCompleto}
              onChangeText={
                setNomeCompleto
              }
            />

            <Text style={styles.campoRotulo}>
              E-mail institucional <Text style={styles.obrigatorio}>*</Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail institucional"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.campoRotulo}>
              Contacto telefónico
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Contacto telefónico"
              placeholderTextColor={theme.colors.textMuted}
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />

            <Text style={styles.campoRotulo}>
              Data de nascimento
            </Text>

            <Text style={styles.campoAjuda}>
              Toque no campo para selecionar a data no calendário.
            </Text>

            {Platform.OS === 'web' ? (
              <View style={styles.campoDataWeb}>
                {createElement('input', {
                  type: 'date',
                  value: dataNascimento,
                  max: new Date().toISOString().slice(0, 10),
                  onChange: (evento: { target: { value: string } }) => setDataNascimento(evento.target.value),
                  style: {
                    width: '100%',
                    height: '100%',
                    minHeight: 52,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.textPrimary,
                    fontSize: 15,
                    padding: '0 16px',
                    boxSizing: 'border-box',
                  } as any,
                  'aria-label': 'Data de nascimento',
                })}
              </View>
            ) : (
              <>
                <Pressable
                  style={styles.seletorData}
                  onPress={abrirSeletorData}
                >
                  <Text
                    style={[
                      styles.seletorDataTexto,
                      !dataNascimento && styles.seletorDataPlaceholder,
                    ]}
                  >
                    {dataNascimento || 'Selecionar data de nascimento'}
                  </Text>
                  <Text style={styles.iconeCalendario}>⌄</Text>
                </Pressable>
                {mostrarSeletorData && (
              <DateTimePicker
                value={obterDataSelecionada()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={selecionarDataNascimento}
              />
                )}
              </>
            )}

            <Text style={styles.label}>
              Sexo
            </Text>

            <View style={styles.opcoes}>
              <Pressable
                style={[
                  styles.opcao,
                  sexo === 'M' &&
                    styles.opcaoSelecionada,
                ]}
                onPress={() =>
                  setSexo('M')
                }
              >
                <Text
                  style={
                    sexo === 'M'
                      ? styles.textoSelecionado
                      : styles.textoOpcao
                  }
                >
                  Masculino
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.opcao,
                  sexo === 'F' &&
                    styles.opcaoSelecionada,
                ]}
                onPress={() =>
                  setSexo('F')
                }
              >
                <Text
                  style={
                    sexo === 'F'
                      ? styles.textoSelecionado
                      : styles.textoOpcao
                  }
                >
                  Feminino
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>
              Curso
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={styles.cursos}
            >
              {cursos.map((curso) => (
                <Pressable
                  key={curso.id}
                  style={[
                    styles.cursoOpcao,
                    cursoId === curso.id &&
                      styles.opcaoSelecionada,
                  ]}
                  onPress={() =>
                    setCursoId(curso.id)
                  }
                >
                  <Text
                    style={
                      cursoId === curso.id
                        ? styles.textoSelecionado
                        : styles.textoOpcao
                    }
                  >
                    {curso.codigo}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>
              Fotografia
            </Text>

            {(fotoPendente || fotoAtual) && (
              <Image
                source={{ uri: fotoPendente ?? fotoAtual! }}
                style={[
                  styles.foto,
                  styles.fotoFormulario,
                ]}
              />
            )}

            <Pressable
              style={styles.botaoFoto}
              onPress={selecionarFotoParaFormulario}
            >
              <Text style={styles.textoFoto}>
                {fotoPendente || fotoAtual
                  ? 'Alterar fotografia'
                  : 'Escolher fotografia'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.botaoSalvar,
                salvando &&
                  styles.botaoDesabilitado,
              ]}
              onPress={salvarEstudante}
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
                    ? 'Atualizar Estudante'
                    : 'Cadastrar Estudante'}
              </Text>
            </Pressable>

            {idEditar !== null && (
              <Pressable
                style={
                  styles.botaoCancelar
                }
                onPress={
                  () => {
                    limparFormulario();
                    setMostrarFormulario(false);
                  }
                }
              >
                <Text
                  style={
                    styles.textoCancelar
                  }
                >
                  Cancelar edição
                </Text>
              </Pressable>
            )}
          </View>
          )
        }

        ListEmptyComponent={mostrarFormulario ? null : (
          <Text style={styles.vazio}>
            Nenhum estudante cadastrado.
          </Text>
        )}

        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.foto ? (
              <Image
                source={{
                  uri: montarUrlArquivo(item.foto)!,
                }}
                style={styles.foto}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>
                  {item.nomeCompleto
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            )}

            <View
              style={
                styles.informacoes
              }
            >
              <Text style={styles.nome}>
                {item.nomeCompleto}
              </Text>

              <Text style={styles.detalhe}>
                {item.codigo}
              </Text>

              <Text style={styles.detalhe}>
                {item.curso?.codigo} -{' '}
                {item.curso?.nome}
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
                  style={
                    styles.botaoEditar
                  }
                  onPress={() =>
                    editarEstudante(
                      item,
                    )
                  }
                >
                  <Text
                    style={
                      styles.textoEditar
                    }
                  >
                    Editar
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.botaoFoto}
                  onPress={() => selecionarFoto(item)}
                >
                  <Text style={styles.textoFoto}>
                    Foto
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.botaoCamera}
                  onPress={() => tirarFoto(item)}
                >
                  <Text style={styles.textoCamera}>
                    Câmera
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    item.ativo
                      ? styles.botaoDesativar
                      : styles.botaoAtivar
                  }
                  onPress={() =>
                    alterarEstado(
                      item,
                    )
                  }
                >
                  <Text
                    style={
                      styles.textoAcao
                    }
                  >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  centralizado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  conteudo: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 16,
  },

  botaoNovo: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18,
    ...theme.shadows.sm,
  },
  listaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  listaTitulo: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  listaResumo: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  botaoNovoCompacto: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...theme.shadows.sm,
  },
  pesquisaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  pesquisaIcone: {
    color: theme.colors.textMuted,
    fontSize: 23,
    marginRight: 7,
  },
  pesquisa: {
    flex: 1,
    color: theme.colors.textPrimary,
    paddingVertical: 12,
    fontSize: 14,
  },

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
    color: '#101828',
    marginBottom: 6,
  },

  formularioDescricao: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },

  campoRotulo: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },

  campoAjuda: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 7,
  },

  seletorData: {
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },

  campoDataWeb: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    overflow: 'hidden',
  },

  seletorDataTexto: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },

  seletorDataPlaceholder: {
    color: theme.colors.textMuted,
  },

  iconeCalendario: {
    color: theme.colors.primary,
    fontSize: 21,
    fontWeight: '800',
  },

  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalData: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '82%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    ...theme.shadows.lg,
  },
  modalEtiqueta: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  modalTitulo: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 5 },
  breadcrumbData: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 14 },
  breadcrumbAtivo: { color: theme.colors.primary, fontSize: 13, fontWeight: '900' },
  breadcrumbPassivo: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  breadcrumbSeparador: { color: theme.colors.textMuted, fontWeight: '800' },
  gradeData: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 },
  opcaoData: { width: 104, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: theme.colors.borderDark, backgroundColor: '#F8FAFC' },
  opcaoDia: { width: 48, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: theme.colors.borderDark, backgroundColor: '#F8FAFC' },
  opcaoDataAtiva: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  opcaoDataTexto: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '800' },
  opcaoDataTextoAtiva: { color: theme.colors.textWhite },
  modalCancelar: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },

  obrigatorio: {
    color: theme.colors.danger,
  },

  codigoAutomatico: {
    backgroundColor: theme.colors.accentLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: 16,
  },

  codigoAutomaticoTitulo: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  codigoAutomaticoDescricao: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

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
    fontWeight: '600',
    color: '#344054',
    marginBottom: 8,
  },

  opcoes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  opcao: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  opcaoSelecionada: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  textoOpcao: {
    color: '#344054',
  },

  textoSelecionado: {
    color: '#ffffff',
    fontWeight: '600',
  },

  cursos: {
    marginBottom: 16,
  },

  cursoOpcao: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },

  botaoSalvar: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoSalvarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  botaoCancelar: {
    padding: 12,
    alignItems: 'center',
  },

  textoCancelar: {
    color: '#667085',
    fontWeight: '600',
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

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  avatarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
  },

  foto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: '#e4e7ec',
  },

  fotoFormulario: {
    marginBottom: 12,
  },

  informacoes: {
    flex: 1,
  },

  nome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
  },

  detalhe: {
    color: '#667085',
    marginTop: 3,
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
    flexWrap: 'wrap',
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

  botaoFoto: {
    backgroundColor: '#f2f4f7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 7,
  },

  textoFoto: {
    color: '#344054',
    fontWeight: '600',
  },

  botaoCamera: {
    backgroundColor: '#003b71',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 7,
  },

  textoCamera: {
    color: '#ffffff',
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
    color: '#667085',
    marginTop: 30,
  },
});
