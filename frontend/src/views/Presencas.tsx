import { useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import AppHeader from '../components/layout/AppHeader';
import {
  abrirSessaoPresenca,
  buscarSessaoPresenca,
  fecharSessaoPresenca,
  listarSessoesPresenca,
  registarPresenca,
  type Presenca,
  type SessaoPresenca,
} from '../services/presencas.service';
import { theme } from '../styles/theme';

const HORARIOS_DISPONIVEIS = Array.from({ length: 56 }, (_, indice) => {
  const totalMinutos = (7 * 60) + (indice * 15);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
});

function horarioAtualArredondado() {
  const agora = new Date();
  const minutos = Math.ceil(agora.getMinutes() / 15) * 15;
  agora.setMinutes(minutos, 0, 0);
  return agora.toTimeString().slice(0, 5);
}

export default function Presencas({ aoVoltar }: { aoVoltar: () => void }) {
  const { width } = useWindowDimensions();
  const camposEmLinha = width >= 720;
  const [disciplina, setDisciplina] = useState('');
  const [turma, setTurma] = useState('');
  const [tipoSessao, setTipoSessao] = useState<'AULA' | 'TESTE'>('AULA');
  const [horaInicio, setHoraInicio] = useState(horarioAtualArredondado);
  const [toleranciaMinutos, setToleranciaMinutos] = useState(15);
  const [limiteEntradaMinutos, setLimiteEntradaMinutos] = useState(30);
  const [duracaoMinutos, setDuracaoMinutos] = useState(90);
  const [mostrarSeletorHora, setMostrarSeletorHora] = useState(false);
  const [sessao, setSessao] = useState<SessaoPresenca | null>(null);
  const [sessaoEmCurso, setSessaoEmCurso] = useState<SessaoPresenca | null>(null);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [processando, setProcessando] = useState(false);
  const [codigoLeitor, setCodigoLeitor] = useState('');
  const [aLerQr, setALerQr] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [mensagemInicio, setMensagemInicio] = useState<string | null>(null);
  const [confirmarFecho, setConfirmarFecho] = useState(false);
  const [erroFecho, setErroFecho] = useState<string | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<{
    tipo: 'sucesso' | 'erro';
    titulo: string;
    descricao: string;
  } | null>(null);
  const [permissao, pedirPermissao] = useCameraPermissions();
  const campoLeitorRef = useRef<TextInput>(null);

  useEffect(() => {
    void carregarSessaoEmCurso();
  }, []);

  useEffect(() => {
    if (!sessao) return;

    const focarLeitor = setTimeout(() => campoLeitorRef.current?.focus(), 250);
    const atualizacao = setInterval(() => {
      void sincronizarPresencas(sessao.id);
    }, 4000);

    return () => {
      clearTimeout(focarLeitor);
      clearInterval(atualizacao);
    };
  }, [sessao?.id]);

  async function sincronizarPresencas(sessaoId: number) {
    try {
      const atualizada = await buscarSessaoPresenca(sessaoId);
      setPresencas(atualizada.presencas ?? []);
    } catch {
      // Mantém o posto operacional mesmo se uma atualização automática falhar.
    }
  }

  async function carregarSessaoEmCurso() {
    try {
      const sessoes = await listarSessoesPresenca();
      setSessaoEmCurso(
        sessoes.find((item) => !item.fechadaEm) ?? null,
      );
    } catch {
      // O formulário continua disponível se a consulta inicial falhar.
    }
  }

  async function retomarSessao() {
    if (!sessaoEmCurso) return;

    try {
      setProcessando(true);
      const detalhes = await buscarSessaoPresenca(sessaoEmCurso.id);
      setSessao(detalhes);
      setPresencas(detalhes.presencas ?? []);
      setALerQr(true);
      setMensagemInicio(null);
    } catch (erro: any) {
      setMensagemInicio(
        erro?.response?.data?.message ?? 'Não foi possível retomar a sessão em curso.',
      );
    } finally {
      setProcessando(false);
    }
  }

  async function iniciarAula() {
    if (!disciplina.trim()) {
      setMensagemInicio('Informe a disciplina antes de iniciar a aula.');
      return;
    }

    const tolerancia = toleranciaMinutos;
    const limite = limiteEntradaMinutos;
    const duracao = duracaoMinutos;

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horaInicio)) {
      setMensagemInicio('Informe a hora de início no formato HH:mm.');
      return;
    }

    if (!Number.isInteger(tolerancia) || tolerancia < 0 || tolerancia > 120) {
      setMensagemInicio('A tolerância deve ser um número entre 0 e 120 minutos.');
      return;
    }

    if (!Number.isInteger(limite) || limite < 1 || limite > 240 || limite < tolerancia) {
      setMensagemInicio('O limite de entrada deve ser superior ou igual à tolerância.');
      return;
    }

    if (tipoSessao === 'TESTE' && (!Number.isInteger(duracao) || duracao < 1 || duracao > 600)) {
      setMensagemInicio('Informe a duração do teste entre 1 e 600 minutos.');
      return;
    }
    try {
      setMensagemInicio(null);
      setProcessando(true);
      const novaSessao = await abrirSessaoPresenca(
        disciplina.trim(),
        turma.trim() || undefined,
        {
          tipo: tipoSessao,
          horaInicio,
          toleranciaMinutos: tolerancia,
          limiteEntradaMinutos: limite,
          ...(tipoSessao === 'TESTE' ? { duracaoMinutos: duracao } : {}),
        },
      );
      setSessao(novaSessao);
      setSessaoEmCurso(novaSessao);
      setPresencas(novaSessao.presencas ?? []);
      setALerQr(true);
    } catch (erro: any) {
      if (!erro?.response) {
        setMensagemInicio(
          'Não foi possível comunicar com o servidor. Confirme se o backend está ligado.',
        );
        return;
      }

      setMensagemInicio(
        erro.response.data?.message ?? 'Não foi possível iniciar esta aula. Tente novamente.',
      );
    } finally {
      setProcessando(false);
    }
  }

  async function lerQr(valor: string) {
    const codigo = valor.trim();
    if (!sessao || bloqueado || !codigo) return;
    try {
      setBloqueado(true);
      setCodigoLeitor('');
      const resposta = await registarPresenca(sessao.id, codigo);
      setPresencas((atuais) => {
        if (atuais.some((item) => item.id === resposta.presenca.id)) return atuais;
        return [...atuais, resposta.presenca];
      });
      setUltimoResultado({
        tipo: 'sucesso',
        titulo: 'PRESENÇA REGISTADA',
        descricao: `${resposta.presenca.estudante.nomeCompleto} — ${resposta.presenca.estudante.codigo}`,
      });
    } catch (erro: any) {
      setUltimoResultado({
        tipo: 'erro',
        titulo: 'LEITURA NÃO REGISTADA',
        descricao: erro?.response?.data?.message ?? 'Não foi possível validar este cartão.',
      });
    } finally {
      setTimeout(() => {
        setBloqueado(false);
        campoLeitorRef.current?.focus();
      }, 1200);
    }
  }

  async function encerrarAula() {
    if (!sessao) return;
    try {
      setErroFecho(null);
      setProcessando(true);
      await fecharSessaoPresenca(sessao.id);
      Alert.alert('Aula encerrada', `${presencas.length} presença(s) foram registadas.`);
      setSessao(null);
      setSessaoEmCurso(null);
      setPresencas([]);
      setALerQr(false);
      setUltimoResultado(null);
      setDisciplina('');
      setTurma('');
      setTipoSessao('AULA');
      setHoraInicio(horarioAtualArredondado());
      setToleranciaMinutos(15);
      setLimiteEntradaMinutos(30);
      setDuracaoMinutos(90);
    } catch (erro: any) {
      setErroFecho(
        erro?.response?.data?.message
          ?? 'Não foi possível encerrar a aula. Confirme a ligação ao servidor e tente novamente.',
      );
    } finally { setProcessando(false); }
  }

  function confirmarEncerramento() {
    setErroFecho(null);
    setConfirmarFecho(true);
  }

  return (
    <View style={styles.container}>
      <AppHeader titulo="Presenças" descricao="Abra uma aula e valide os cartões académicos." aoVoltar={aoVoltar} />
      <ScrollView contentContainerStyle={styles.conteudo}>
        {!sessao ? (
          <View style={styles.card}>
            <Text style={styles.seccaoEtiqueta}>NOVA SESSÃO</Text>
            <Text style={styles.titulo}>Iniciar aula</Text>
            <Text style={styles.ajuda}>Defina a disciplina e a turma. A sessão fica disponível no posto de entrada até ser encerrada.</Text>
            {sessaoEmCurso && (
              <View style={styles.sessaoPendente}>
                <View style={styles.sessaoPendenteTexto}>
                  <Text style={styles.sessaoPendenteEtiqueta}>SESSÃO EM CURSO</Text>
                  <Text style={styles.sessaoPendenteTitulo}>{sessaoEmCurso.disciplina}</Text>
                  <Text style={styles.sessaoPendenteDescricao}>
                    {sessaoEmCurso.turma ? `${sessaoEmCurso.turma} · ` : ''}
                    {sessaoEmCurso._count?.presencas ?? 0} presença(s) registada(s)
                  </Text>
                </View>
                <Pressable style={styles.botaoRetomar} onPress={() => void retomarSessao()} disabled={processando}>
                  <Text style={styles.textoRetomar}>Retomar</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.separadorFormulario} />
            <Text style={styles.seccaoFormulario}>Dados da sessão</Text>
            <Text style={styles.label}>Tipo de sessão <Text style={styles.obrigatorio}>*</Text></Text>
            <View style={styles.seletorTipo}>
              <Pressable
                style={[styles.opcaoTipo, tipoSessao === 'AULA' && styles.opcaoTipoAtiva]}
                onPress={() => setTipoSessao('AULA')}
              >
                <Text style={[styles.opcaoTipoTitulo, tipoSessao === 'AULA' && styles.opcaoTipoTituloAtiva]}>Aula</Text>
                <Text style={[styles.opcaoTipoDescricao, tipoSessao === 'AULA' && styles.opcaoTipoDescricaoAtiva]}>Entrada regular</Text>
              </Pressable>
              <Pressable
                style={[styles.opcaoTipo, tipoSessao === 'TESTE' && styles.opcaoTipoAtiva]}
                onPress={() => setTipoSessao('TESTE')}
              >
                <Text style={[styles.opcaoTipoTitulo, tipoSessao === 'TESTE' && styles.opcaoTipoTituloAtiva]}>Teste</Text>
                <Text style={[styles.opcaoTipoDescricao, tipoSessao === 'TESTE' && styles.opcaoTipoDescricaoAtiva]}>Avaliação controlada</Text>
              </Pressable>
            </View>
            <View style={camposEmLinha ? styles.camposLinha : undefined}>
              <View style={camposEmLinha ? styles.campoPrincipal : undefined}>
                <Text style={styles.label}>Disciplina <Text style={styles.obrigatorio}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={disciplina}
                  onChangeText={(valor) => {
                    setDisciplina(valor);
                    setMensagemInicio(null);
                  }}
                  placeholder="Ex.: Programação Mobile"
                  placeholderTextColor={theme.colors.textMuted}
                  accessibilityLabel="Disciplina da aula"
                />
                <Text style={styles.ajudaCampo}>Utilize o nome oficial ou reconhecível da unidade curricular.</Text>
              </View>
              <View style={camposEmLinha ? styles.campoTurma : undefined}>
                <Text style={styles.label}>Turma <Text style={styles.opcional}>(opcional)</Text></Text>
                <TextInput
                  style={styles.input}
                  value={turma}
                  onChangeText={setTurma}
                  placeholder="Ex.: TI-2026"
                  placeholderTextColor={theme.colors.textMuted}
                  accessibilityLabel="Turma da aula"
                />
                <Text style={styles.ajudaCampo}>Indique a turma apenas quando for necessário distinguir grupos.</Text>
              </View>
            </View>
            <Text style={styles.seccaoFormulario}>Regras de entrada</Text>
            <View style={camposEmLinha ? styles.camposLinha : undefined}>
              <View style={camposEmLinha ? styles.campoTurma : undefined}>
                <Text style={styles.label}>Hora de início <Text style={styles.obrigatorio}>*</Text></Text>
                <Pressable style={styles.seletorValor} onPress={() => setMostrarSeletorHora(true)}>
                  <Text style={styles.seletorValorTexto}>{horaInicio}</Text>
                  <Text style={styles.seletorValorAcao}>Selecionar</Text>
                </Pressable>
              </View>
              <View style={camposEmLinha ? styles.campoTurma : undefined}>
                <Text style={styles.label}>Tolerância (min.) <Text style={styles.obrigatorio}>*</Text></Text>
                <View style={styles.opcoesNumericas}>
                  {[0, 5, 10, 15, 20, 30].map((minutos) => (
                    <OpcaoNumerica
                      key={minutos}
                      texto={`${minutos}`}
                      ativa={toleranciaMinutos === minutos}
                      onPress={() => setToleranciaMinutos(minutos)}
                    />
                  ))}
                </View>
              </View>
              <View style={camposEmLinha ? styles.campoTurma : undefined}>
                <Text style={styles.label}>Limite de entrada (min.) <Text style={styles.obrigatorio}>*</Text></Text>
                <View style={styles.opcoesNumericas}>
                  {[15, 30, 45, 60, 90, 120].map((minutos) => (
                    <OpcaoNumerica
                      key={minutos}
                      texto={`${minutos}`}
                      ativa={limiteEntradaMinutos === minutos}
                      onPress={() => setLimiteEntradaMinutos(minutos)}
                    />
                  ))}
                </View>
              </View>
              {tipoSessao === 'TESTE' && (
                <View style={camposEmLinha ? styles.campoTurma : undefined}>
                  <Text style={styles.label}>Duração do teste (min.) <Text style={styles.obrigatorio}>*</Text></Text>
                  <View style={styles.opcoesNumericas}>
                    {[30, 45, 60, 90, 120, 180].map((minutos) => (
                      <OpcaoNumerica
                        key={minutos}
                        texto={`${minutos}`}
                        ativa={duracaoMinutos === minutos}
                        onPress={() => setDuracaoMinutos(minutos)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
            <View style={styles.resumoRegra}>
              <Text style={styles.resumoRegraTitulo}>Política aplicada</Text>
              <Text style={styles.resumoRegraTexto}>
                Até {toleranciaMinutos} min.: Presente · até {limiteEntradaMinutos} min.: Atrasado · após o limite: entrada não admitida.
              </Text>
            </View>
            {mensagemInicio && (
              <View style={styles.erroInicio} accessibilityRole="alert">
                <Text style={styles.erroInicioTitulo}>Não foi possível iniciar</Text>
                <Text style={styles.erroInicioTexto}>{mensagemInicio}</Text>
              </View>
            )}
            <Pressable
              style={[styles.botao, (processando || !!sessaoEmCurso) && styles.botaoDesativado]}
              onPress={iniciarAula}
              disabled={processando || !!sessaoEmCurso}
            >
              {processando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textoBotao}>
                  {sessaoEmCurso
                    ? 'Retome ou encerre a sessão em curso'
                    : 'Iniciar sessão de presença'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.sessaoAtiva}>
              <Text style={styles.estado}>● {sessao.tipo === 'TESTE' ? 'TESTE · CONTROLO DE ENTRADA ATIVO' : 'AULA · MODO ENTRADA ATIVO'}</Text>
              <Text style={styles.disciplina}>{sessao.disciplina}</Text>
              {!!sessao.turma && <Text style={styles.turma}>{sessao.turma}</Text>}
              <Text style={styles.regraAtiva}>Tolerância: {sessao.toleranciaMinutos} min · Limite: {sessao.limiteEntradaMinutos} min{sessao.tipo === 'TESTE' && sessao.duracaoMinutos ? ` · Duração: ${sessao.duracaoMinutos} min` : ''}</Text>
              <Text style={styles.total}>{presencas.length} presença(s) registada(s)</Text>
            </View>
            <View style={styles.leitorFixo}>
              <View style={styles.leitorTopo}>
                <View style={styles.iconeLeitor}><Text style={styles.iconeLeitorTexto}>QR</Text></View>
                <View style={styles.leitorCabecalho}>
                  <Text style={styles.leitorEtiqueta}>POSTO DE ENTRADA</Text>
                  <Text style={styles.leitorTitulo}>Leitor fixo ativo</Text>
                </View>
                <View style={styles.indicadorOnline}><Text style={styles.indicadorOnlineTexto}>ONLINE</Text></View>
              </View>
              <Text style={styles.leitorDescricao}>
                Ligue um leitor QR USB ou Bluetooth ao tablet. A presença é registada automaticamente quando o equipamento envia o código.
              </Text>
              <TextInput
                ref={campoLeitorRef}
                style={styles.inputLeitor}
                value={codigoLeitor}
                onChangeText={setCodigoLeitor}
                onSubmitEditing={({ nativeEvent }) => void lerQr(nativeEvent.text)}
                placeholder="Aguardando cartão académico..."
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                showSoftInputOnFocus={false}
                blurOnSubmit={false}
              />
              <Pressable
                style={[styles.botaoLeitura, (!codigoLeitor.trim() || bloqueado) && styles.botaoDesativado]}
                onPress={() => void lerQr(codigoLeitor)}
                disabled={!codigoLeitor.trim() || bloqueado}
              >
                {bloqueado ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Registar leitura</Text>}
              </Pressable>
            </View>
            {ultimoResultado && (
              <View style={[styles.resultado, ultimoResultado.tipo === 'sucesso' ? styles.resultadoSucesso : styles.resultadoErro]}>
                <Text style={styles.resultadoTitulo}>{ultimoResultado.titulo}</Text>
                <Text style={styles.resultadoDescricao}>{ultimoResultado.descricao}</Text>
              </View>
            )}
            {aLerQr ? (
              <View style={styles.cameraArea}>
                {!permissao ? <ActivityIndicator /> : !permissao.granted ? (
                  <Pressable style={styles.botao} onPress={pedirPermissao}><Text style={styles.textoBotao}>Permitir acesso à câmara</Text></Pressable>
                ) : (
                  <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={bloqueado ? undefined : ({ data }) => lerQr(data)} />
                )}
                <Text style={styles.instrucaoCamera}>Aproxime o QR Code do cartão à câmara</Text>
                <Pressable style={styles.botaoSecundario} onPress={() => setALerQr(false)}><Text style={styles.textoSecundario}>Pausar leitor</Text></Pressable>
              </View>
            ) : (
              <Pressable style={styles.botao} onPress={() => setALerQr(true)}><Text style={styles.textoBotao}>Retomar leitor QR</Text></Pressable>
            )}
            <Text style={styles.subtitulo}>Registos desta aula</Text>
            {presencas.length === 0 ? <Text style={styles.vazio}>Ainda não há presenças registadas.</Text> : presencas.map((item) => (
              <View key={item.id} style={styles.item}>
                <View>
                  <Text style={styles.nome}>{item.estudante.nomeCompleto}</Text>
                  <Text style={styles.codigo}>{item.estudante.codigo}</Text>
                </View>
                <View style={styles.itemDireita}>
                  <Text style={styles.hora}>{new Date(item.registadaEm).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={[styles.estadoPresenca, item.estado === 'ATRASADO' && styles.estadoAtrasado]}>
                    {item.estado === 'ATRASADO' ? `Atrasado ${item.minutosAtraso} min` : 'Presente'}
                  </Text>
                </View>
              </View>
            ))}
            {confirmarFecho && (
              <View style={styles.confirmacaoFecho}>
                <Text style={styles.confirmacaoTitulo}>Encerrar esta aula?</Text>
                <Text style={styles.confirmacaoDescricao}>
                  Serão mantidas {presencas.length} presença(s). Depois do encerramento, não será possível registar novas leituras.
                </Text>
                <View style={styles.acoesConfirmacao}>
                  <Pressable
                    style={styles.botaoCancelar}
                    onPress={() => setConfirmarFecho(false)}
                    disabled={processando}
                  >
                    <Text style={styles.textoCancelar}>Continuar aula</Text>
                  </Pressable>
                  <Pressable
                    style={styles.botaoConfirmarFecho}
                    onPress={() => void encerrarAula()}
                    disabled={processando}
                  >
                    {processando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Confirmar encerramento</Text>}
                  </Pressable>
                </View>
              </View>
            )}
            {erroFecho && (
              <View style={styles.erroFecho}>
                <Text style={styles.erroFechoTitulo}>Não foi possível encerrar</Text>
                <Text style={styles.erroFechoDescricao}>{erroFecho}</Text>
              </View>
            )}
            <Pressable style={styles.encerrar} onPress={confirmarEncerramento} disabled={processando}>
              {processando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotao}>Encerrar aula</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
      <Modal
        visible={mostrarSeletorHora}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarSeletorHora(false)}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalHora}>
            <Text style={styles.modalEtiqueta}>HORÁRIO DA SESSÃO</Text>
            <Text style={styles.modalTitulo}>Selecione a hora de início</Text>
            <Text style={styles.modalDescricao}>Escolha um horário de 15 em 15 minutos.</Text>
            <ScrollView contentContainerStyle={styles.gradeHorarios} showsVerticalScrollIndicator={false}>
              {HORARIOS_DISPONIVEIS.map((horario) => (
                <Pressable
                  key={horario}
                  style={[styles.horarioOpcao, horaInicio === horario && styles.horarioOpcaoAtiva]}
                  onPress={() => {
                    setHoraInicio(horario);
                    setMostrarSeletorHora(false);
                  }}
                >
                  <Text style={[styles.horarioTexto, horaInicio === horario && styles.horarioTextoAtivo]}>{horario}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalCancelar} onPress={() => setMostrarSeletorHora(false)}>
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OpcaoNumerica({
  texto,
  ativa,
  onPress,
}: {
  texto: string;
  ativa: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.opcaoNumerica, ativa && styles.opcaoNumericaAtiva]}
      onPress={onPress}
    >
      <Text style={[styles.opcaoNumericaTexto, ativa && styles.opcaoNumericaTextoAtiva]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background }, conteudo: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 20, paddingBottom: 42 },
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 20, ...theme.shadows.md },
  seccaoEtiqueta: { color: theme.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 7 },
  titulo: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary }, ajuda: { color: theme.colors.textSecondary, marginTop: 5, marginBottom: 22, lineHeight: 20 },
  separadorFormulario: { height: 1, backgroundColor: theme.colors.border, marginBottom: 18 },
  seccaoFormulario: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 14 },
  label: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 7 }, opcional: { color: theme.colors.textMuted, fontWeight: '500' }, obrigatorio: { color: theme.colors.danger },
  seletorTipo: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  opcaoTipo: { flex: 1, borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: 14, padding: 14, backgroundColor: '#fff' },
  opcaoTipoAtiva: { borderColor: theme.colors.primary, backgroundColor: '#EFF6FF' },
  opcaoTipoTitulo: { color: theme.colors.textPrimary, fontWeight: '900', fontSize: 14 },
  opcaoTipoTituloAtiva: { color: theme.colors.primary },
  opcaoTipoDescricao: { color: theme.colors.textMuted, fontSize: 11, marginTop: 3 },
  opcaoTipoDescricaoAtiva: { color: theme.colors.primary },
  seletorValor: { minHeight: 54, borderWidth: 1, borderColor: theme.colors.borderDark, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  seletorValorTexto: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '800' },
  seletorValorAcao: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
  opcoesNumericas: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 17 },
  opcaoNumerica: { minWidth: 42, minHeight: 42, paddingHorizontal: 10, borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  opcaoNumericaAtiva: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  opcaoNumericaTexto: { color: theme.colors.textSecondary, fontWeight: '800', fontSize: 12 },
  opcaoNumericaTextoAtiva: { color: '#fff' },
  input: { borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, backgroundColor: '#fff', color: theme.colors.textPrimary, marginBottom: 17 },
  ajudaCampo: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: -11, marginBottom: 17 },
  resumoRegra: { backgroundColor: '#F0F8FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 13, padding: 13, marginTop: -2, marginBottom: 18 },
  resumoRegraTitulo: { color: theme.colors.primary, fontSize: 12, fontWeight: '900' },
  resumoRegraTexto: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  camposLinha: { flexDirection: 'row', gap: 14 },
  campoPrincipal: { flex: 2 },
  campoTurma: { flex: 1 },
  sessaoPendente: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', padding: 14, marginBottom: 20 },
  sessaoPendenteTexto: { flex: 1 },
  sessaoPendenteEtiqueta: { color: '#1D4ED8', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sessaoPendenteTitulo: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '900', marginTop: 3 },
  sessaoPendenteDescricao: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 },
  botaoRetomar: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, marginLeft: 12 },
  textoRetomar: { color: '#fff', fontSize: 13, fontWeight: '900' },
  erroInicio: { backgroundColor: theme.colors.dangerLight, borderColor: theme.colors.status.rejeitado.border, borderWidth: 1, borderRadius: 13, padding: 13, marginTop: -4, marginBottom: 17 },
  erroInicioTitulo: { color: theme.colors.danger, fontSize: 13, fontWeight: '900', marginBottom: 3 },
  erroInicioTexto: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 },
  botao: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 52, ...theme.shadows.sm }, textoBotao: { color: '#fff', fontWeight: '800' },
  sessaoAtiva: { backgroundColor: theme.colors.primary, borderRadius: 20, padding: 20, marginBottom: 16 }, estado: { color: theme.colors.gold, fontWeight: '900', fontSize: 12, letterSpacing: 1 }, disciplina: { color: '#fff', fontSize: 23, fontWeight: '800', marginTop: 8 }, turma: { color: '#D8EAFE', marginTop: 3 }, regraAtiva: { color: '#D8EAFE', marginTop: 12, fontSize: 12, lineHeight: 18 }, total: { color: '#fff', marginTop: 12, fontWeight: '700' },
  leitorFixo: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 17, marginBottom: 14, ...theme.shadows.sm },
  leitorTopo: { flexDirection: 'row', alignItems: 'center' },
  iconeLeitor: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  iconeLeitorTexto: { color: theme.colors.gold, fontSize: 13, fontWeight: '900' },
  leitorCabecalho: { flex: 1, marginLeft: 12 },
  leitorEtiqueta: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  leitorTitulo: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 2 },
  indicadorOnline: { backgroundColor: theme.colors.status.ativo.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  indicadorOnlineTexto: { color: theme.colors.status.ativo.text, fontSize: 9, fontWeight: '900', letterSpacing: .7 },
  leitorDescricao: { color: theme.colors.textSecondary, lineHeight: 19, fontSize: 13, marginTop: 14, marginBottom: 12 },
  inputLeitor: { borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, color: theme.colors.textPrimary, backgroundColor: '#F8FAFC' },
  botaoLeitura: { backgroundColor: theme.colors.primary, minHeight: 48, borderRadius: 13, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  botaoDesativado: { opacity: .45 },
  cameraArea: { overflow: 'hidden', borderRadius: 20, backgroundColor: '#0F172A', marginBottom: 8 }, camera: { height: 310 }, botaoSecundario: { alignItems: 'center', padding: 15, backgroundColor: '#EAF4FB' }, textoSecundario: { color: theme.colors.primary, fontWeight: '800' },
  instrucaoCamera: { color: '#fff', textAlign: 'center', paddingVertical: 12, fontWeight: '700', fontSize: 13 },
  resultado: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 }, resultadoSucesso: { backgroundColor: theme.colors.status.ativo.bg, borderColor: theme.colors.status.ativo.border }, resultadoErro: { backgroundColor: theme.colors.dangerLight, borderColor: theme.colors.status.rejeitado.border }, resultadoTitulo: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '900', letterSpacing: .5 }, resultadoDescricao: { color: theme.colors.textSecondary, marginTop: 3, fontWeight: '600' },
  subtitulo: { fontSize: 18, color: theme.colors.textPrimary, fontWeight: '800', marginTop: 24, marginBottom: 10 }, vazio: { color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 15, marginBottom: 9 }, nome: { color: theme.colors.textPrimary, fontWeight: '800' }, codigo: { color: theme.colors.textSecondary, marginTop: 3, fontSize: 12 }, itemDireita: { alignItems: 'flex-end', marginLeft: 10 }, hora: { color: theme.colors.primary, fontWeight: '800' }, estadoPresenca: { color: theme.colors.status.ativo.text, backgroundColor: theme.colors.status.ativo.bg, fontSize: 10, fontWeight: '900', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginTop: 5 }, estadoAtrasado: { color: '#9A6500', backgroundColor: '#FFF3D6' },
  confirmacaoFecho: { backgroundColor: '#FFF8EB', borderWidth: 1, borderColor: '#F6C65B', borderRadius: 15, padding: 16, marginTop: 18 },
  confirmacaoTitulo: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '900' },
  confirmacaoDescricao: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  acoesConfirmacao: { flexDirection: 'row', gap: 10, marginTop: 15 },
  botaoCancelar: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderDark, borderRadius: 12, backgroundColor: '#fff' },
  textoCancelar: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 13 },
  botaoConfirmarFecho: { flex: 1.4, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.danger },
  erroFecho: { backgroundColor: theme.colors.dangerLight, borderWidth: 1, borderColor: theme.colors.status.rejeitado.border, borderRadius: 14, padding: 14, marginTop: 14 },
  erroFechoTitulo: { color: theme.colors.danger, fontWeight: '900', fontSize: 13 },
  erroFechoDescricao: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  encerrar: { backgroundColor: theme.colors.danger, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.58)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalHora: { width: '100%', maxWidth: 520, maxHeight: '82%', backgroundColor: '#fff', borderRadius: 20, padding: 20, ...theme.shadows.lg },
  modalEtiqueta: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  modalTitulo: { color: theme.colors.textPrimary, fontWeight: '900', fontSize: 20, marginTop: 5 },
  modalDescricao: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 5, marginBottom: 16 },
  gradeHorarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
  horarioOpcao: { width: 74, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: theme.colors.borderDark },
  horarioOpcaoAtiva: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  horarioTexto: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '800' },
  horarioTextoAtivo: { color: '#fff' },
  modalCancelar: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
});
