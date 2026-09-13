import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  enviarFotoUsuario,
  type UsuarioSessao,
} from '../services/autenticacao.service';
import { obterMeuCartao } from '../services/cartoes.service';
import { montarUrlArquivo } from '../services/api';
import type { CartaoAcademico } from '../types/cartao';
import { theme } from '../styles/theme';
import LogoUcm from '../components/brand/LogoUcm';
import CardEstatistica from '../components/dashboard/CardEstatistica';
import {
  buscarEstatisticasDashboard,
  type EstatisticasDashboard,
} from '../services/dashboard.service';

type Props = {
  usuario: UsuarioSessao;
  abrirEstudantes?: () => void;
  abrirCartoes?: () => void;
  abrirFaculdades?: () => void;
  abrirCursos?: () => void;
  abrirPedidos?: () => void;
  abrirMeuCartao?: () => void;
  abrirMeusPedidos?: () => void;
  abrirPresencas?: () => void;
  abrirAuditoria?: () => void;
  sair?: () => void;
  aoAbrirFaculdades?: () => void;
  aoAbrirCursos?: () => void;
  aoAbrirEstudantes?: () => void;
  aoAbrirCartoes?: () => void;
  aoAbrirUsuarios?: () => void;
  aoSolicitarReemissao?: (cartaoId: number) => void;
  aoVerMeusPedidos?: () => void;
  aoAbrirPedidosReemissao?: () => void;
  onPedidosReemissao?: () => void;
  onMeuCartao?: () => void;
  aoSair?: () => void;
  aoAtualizarUsuario?: (usuario: UsuarioSessao) => void;
};

type ModuloProps = {
  codigo: string;
  titulo: string;
  descricao: string;
  aoPressionar?: () => void;
  destaque?: boolean;
  emGrelhaDesktop?: boolean;
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
};

function Modulo({
  codigo,
  titulo,
  descricao,
  aoPressionar,
  destaque = false,
  emGrelhaDesktop = false,
  icone,
}: ModuloProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.modulo,
        destaque && styles.moduloDestaque,
        emGrelhaDesktop && styles.moduloDesktop,
        pressed && styles.moduloPressionado,
      ]}
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${titulo}`}
    >
      <View style={styles.moduloTopo}>
        <View style={[styles.codigoModulo, destaque && styles.codigoDestaque]}>
          <MaterialCommunityIcons
            name={icone}
            size={18}
            color={destaque ? theme.colors.primary : theme.colors.accent}
          />
        </View>
        <MaterialCommunityIcons
          name="arrow-top-right"
          size={20}
          color={destaque ? theme.colors.gold : theme.colors.textMuted}
        />
      </View>
      <Text style={[styles.moduloTitulo, destaque && styles.moduloTituloDestaque]}>
        {titulo}
      </Text>
      <Text style={[styles.moduloDescricao, destaque && styles.moduloDescricaoDestaque]}>
        {descricao}
      </Text>
    </Pressable>
  );
}

function nomePerfil(perfil: string) {
  const nomes: Record<string, string> = {
    ADMIN: 'ADMINISTRAÇÃO',
    PROFESSOR: 'DOCÊNCIA',
    OPERADOR_CARTAO: 'OPERAÇÕES',
    RESPONSAVEL: 'RESPONSÁVEL',
    ESTUDANTE: 'ESTUDANTE',
  };

  return nomes[perfil] ?? perfil;
}

export default function Dashboard({
  usuario,
  abrirEstudantes,
  abrirCartoes,
  abrirFaculdades,
  abrirCursos,
  abrirPedidos,
  abrirMeuCartao,
  abrirMeusPedidos,
  abrirPresencas,
  sair,
  aoAbrirFaculdades,
  aoAbrirCursos,
  aoAbrirEstudantes,
  aoAbrirCartoes,
  aoAbrirUsuarios,
  aoSolicitarReemissao,
  aoVerMeusPedidos,
  aoAbrirPedidosReemissao,
  onPedidosReemissao,
  onMeuCartao,
  aoSair,
  aoAtualizarUsuario,
}: Props) {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const [meuCartao, setMeuCartao] = useState<CartaoAcademico | null>(null);
  const [carregandoCartao, setCarregandoCartao] = useState(false);
  const [estatisticas, setEstatisticas] =
    useState<EstatisticasDashboard | null>(null);
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(
    usuario.foto ?? null,
  );
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [versaoFoto, setVersaoFoto] = useState(0);

  useEffect(() => {
    if (usuario.perfil === 'ESTUDANTE') {
      carregarMeuCartao();
    }
  }, [usuario.perfil]);

  useEffect(() => {
    setFotoPerfil(usuario.foto ?? null);
  }, [usuario.foto]);

  useEffect(() => {
    if (usuario.perfil !== 'ESTUDANTE') {
      carregarEstatisticas();
    }
  }, [usuario.perfil]);

  async function carregarEstatisticas() {
    try {
      setCarregandoEstatisticas(true);
      setEstatisticas(await buscarEstatisticasDashboard());
    } catch (erro) {
      console.log('Erro ao carregar estatísticas:', erro);
    } finally {
      setCarregandoEstatisticas(false);
    }
  }

  async function carregarMeuCartao() {
    try {
      setCarregandoCartao(true);
      setMeuCartao(await obterMeuCartao());
    } catch (erro: any) {
      if (erro?.response?.status === 404) {
        setMeuCartao(null);
        return;
      }

      Alert.alert('Erro', 'Não foi possível carregar o seu cartão académico.');
    } finally {
      setCarregandoCartao(false);
    }
  }

  async function selecionarFotoPerfil() {
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

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (resultado.canceled) {
        return;
      }

      setEnviandoFoto(true);
      const ativo = resultado.assets[0];
      const origem = Platform.OS === 'web' && ativo.file
        ? ativo.file
        : ativo.uri;
      const atualizado = await enviarFotoUsuario(origem);
      setFotoPerfil(atualizado.foto ?? null);
      setVersaoFoto(Date.now());
      aoAtualizarUsuario?.(atualizado);
      Alert.alert('Sucesso', 'Fotografia de perfil atualizada.');
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a fotografia.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  const acaoEstudantes = abrirEstudantes ?? aoAbrirEstudantes;
  const acaoCartoes = abrirCartoes ?? aoAbrirCartoes;
  const acaoFaculdades = abrirFaculdades ?? aoAbrirFaculdades;
  const acaoCursos = abrirCursos ?? aoAbrirCursos;
  const acaoPedidos = abrirPedidos ?? onPedidosReemissao ?? aoAbrirPedidosReemissao;
  const acaoMeuCartao = abrirMeuCartao ?? onMeuCartao;
  const acaoMeusPedidos = abrirMeusPedidos ?? aoVerMeusPedidos;
  const acaoSair = sair ?? aoSair;
  const caminhoFoto = montarUrlArquivo(
    fotoPerfil ?? meuCartao?.estudante?.foto,
  );
  const foto = caminhoFoto
    ? `${caminhoFoto}${caminhoFoto.includes('?') ? '&' : '?'}v=${versaoFoto}`
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        <View style={styles.hero}>
          <View style={[styles.heroConteudo, desktop && styles.heroConteudoDesktop]}>
            <View style={styles.heroTopo}>
              <View style={styles.marcaLinha}>
                <LogoUcm size={desktop ? 46 : 38} />
                <View>
                  <Text style={styles.marcaNome}>UCM CARD</Text>
                  {desktop && <Text style={styles.marcaDescricao}>PORTAL INSTITUCIONAL</Text>}
                </View>
              </View>
              <View style={styles.heroAcoes}>
                {desktop && <View style={styles.sessaoSegura}>
                  <MaterialCommunityIcons name="shield-check-outline" size={15} color="#A7F3D0" />
                  <Text style={styles.sessaoSeguraTexto}>Sessão segura</Text>
                </View>}
                <Pressable style={styles.botaoSair} onPress={acaoSair} accessibilityRole="button">
                  <MaterialCommunityIcons name="logout-variant" size={15} color="#E2E8F0" />
                  <Text style={styles.textoSair}>Sair</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.perfilLinha, desktop && styles.perfilLinhaDesktop]}>
              <Pressable
                style={[styles.avatar, desktop && styles.avatarDesktop]}
                onPress={selecionarFotoPerfil}
                disabled={enviandoFoto}
              >
                {foto ? (
                  <Image source={{ uri: foto }} style={styles.avatarImagem} />
                ) : (
                  <Text style={styles.avatarTexto}>
                    {enviandoFoto ? '...' : usuario.nome.charAt(0).toUpperCase()}
                  </Text>
                )}
              </Pressable>
              <View style={styles.perfilDados}>
                <Text style={styles.saudacao}>BEM-VINDO DE VOLTA</Text>
                <Text style={[styles.nome, desktop && styles.nomeDesktop]}>{usuario.nome}</Text>
                <Text style={styles.perfil}>{nomePerfil(usuario.perfil)}</Text>
                <Pressable
                  style={styles.botaoFotoPerfil}
                  onPress={selecionarFotoPerfil}
                  disabled={enviandoFoto}
                >
                  <Text style={styles.botaoFotoPerfilTexto}>
                    {enviandoFoto
                      ? 'A enviar...'
                      : foto
                        ? 'Alterar fotografia'
                        : 'Adicionar fotografia'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {usuario.perfil !== 'ESTUDANTE' && (
          <View style={[styles.secao, desktop && styles.secaoDesktop]}>
            <View style={styles.cabecalhoIndicadores}>
              <View>
                <Text style={styles.indice}>VISÃO GERAL</Text>
                <Text style={styles.tituloSecao}>Indicadores em tempo real</Text>
              </View>
              <View style={styles.atualizacao}>
                <View style={styles.pontoAtualizacao} />
                <Text style={styles.atualizacaoTexto}>Dados atualizados</Text>
              </View>
            </View>
            {carregandoEstatisticas && (
              <Text style={styles.carregando}>A carregar estatísticas...</Text>
            )}
            {estatisticas && (
              <View style={styles.painelIndicadores}>
              <View style={styles.gridEstatisticas}>
                {estatisticas.perfil === 'ADMIN' && <>
                  <CardEstatistica titulo="Estudantes" valor={estatisticas.estudantes} />
                  <CardEstatistica titulo="Cartões ativos" valor={estatisticas.cartoesAtivos} />
                  <CardEstatistica titulo="Pendentes" valor={estatisticas.reemissoes.pendentes} />
                  <CardEstatistica titulo="Em análise" valor={estatisticas.reemissoes.emAnalise} />
                  <CardEstatistica titulo="Em produção" valor={estatisticas.reemissoes.emProducao} />
                  <CardEstatistica titulo="Prontos" valor={estatisticas.reemissoes.prontos} />
                </>}
                {estatisticas.perfil === 'RESPONSAVEL' && <>
                  <CardEstatistica titulo="Pendentes" valor={estatisticas.reemissoes.pendentes} />
                  <CardEstatistica titulo="Em análise" valor={estatisticas.reemissoes.emAnalise} />
                  <CardEstatistica titulo="Em produção" valor={estatisticas.reemissoes.emProducao} />
                  <CardEstatistica titulo="Rejeitados" valor={estatisticas.reemissoes.rejeitados} />
                </>}
                {estatisticas.perfil === 'OPERADOR_CARTAO' && <>
                  <CardEstatistica titulo="Cartões ativos" valor={estatisticas.cartoesAtivos} />
                  <CardEstatistica titulo="Em produção" valor={estatisticas.producao.emProducao} />
                  <CardEstatistica titulo="Prontos" valor={estatisticas.producao.prontos} />
                  <CardEstatistica titulo="Entregues" valor={estatisticas.producao.entregues} />
                </>}
              </View>
              </View>
            )}
          </View>
        )}

        {usuario.perfil === 'ADMIN' && (
          <View style={[styles.secao, desktop && styles.secaoDesktop]}>
            <Text style={styles.indice}>01 · OPERAÇÕES</Text>
            <Text style={styles.tituloSecao}>Centro de controlo</Text>
            <Text style={styles.subtituloSecao}>
              Gestão académica, emissão de cartões e acessos.
            </Text>

            <View style={styles.grelha}>
              <Modulo codigo="ED" icone="account-group-outline" titulo="Estudantes" descricao="Registos académicos" aoPressionar={acaoEstudantes} emGrelhaDesktop={desktop} />
              <Modulo codigo="ID" icone="card-account-details-outline" titulo="Cartões" descricao="Emissão e validação" aoPressionar={acaoCartoes} emGrelhaDesktop={desktop} />
              <Modulo codigo="FC" icone="domain" titulo="Faculdades" descricao="Unidades UCM" aoPressionar={acaoFaculdades} emGrelhaDesktop={desktop} />
              <Modulo codigo="CR" icone="book-open-page-variant-outline" titulo="Cursos" descricao="Oferta formativa" aoPressionar={acaoCursos} emGrelhaDesktop={desktop} />
              <Modulo codigo="AC" icone="account-cog-outline" titulo="Acessos" descricao="Equipa operacional" aoPressionar={aoAbrirUsuarios} emGrelhaDesktop={desktop} />
            </View>
          </View>
        )}

        {usuario.perfil === 'ESTUDANTE' && (
          <View style={[styles.secao, desktop && styles.secaoDesktop]}>
            <Text style={styles.indice}>01 · ÁREA DO ESTUDANTE</Text>
            <Text style={styles.tituloSecao}>O meu cartão</Text>

            {carregandoCartao ? (
              <View style={styles.estado}><ActivityIndicator color={theme.colors.primary} /></View>
            ) : meuCartao ? (
              <View style={styles.cartaoEstudante}>
                <View style={styles.cartaoEstudanteTopo}>
                  {foto ? <Image source={{ uri: foto }} style={styles.foto} /> : <View style={styles.fotoVazia}><Text style={styles.fotoVaziaTexto}>UCM</Text></View>}
                  <View style={styles.cartaoDados}>
                    <Text style={styles.cartaoNumero}>CARTÃO ACADÉMICO</Text>
                    <Text style={styles.cartaoNome}>{meuCartao.estudante.nomeCompleto}</Text>
                    <Text style={styles.cartaoCurso}>{meuCartao.estudante.curso.nome}</Text>
                  </View>
                </View>
                <View style={styles.cartaoRodape}>
                  <Text style={styles.numeroReal}>{meuCartao.numeroCartao}</Text>
                  <View style={styles.estadoAtivo}><Text style={styles.estadoAtivoTexto}>{meuCartao.estado}</Text></View>
                </View>
                <Pressable style={styles.botaoCartao} onPress={acaoMeuCartao}>
                  <Text style={styles.botaoCartaoTexto}>Ver cartão completo</Text>
                  <Text style={styles.botaoCartaoSeta}>→</Text>
                </Pressable>
                <Pressable style={styles.linkCartao} onPress={() => aoSolicitarReemissao?.(meuCartao.id)}>
                  <Text style={styles.linkCartaoTexto}>Solicitar reemissão</Text>
                </Pressable>
                <Pressable style={styles.linkCartao} onPress={acaoMeusPedidos}>
                  <Text style={styles.linkCartaoTexto}>Consultar pedidos</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.semCartao}>
                <Text style={styles.semCartaoCodigo}>ID</Text>
                <Text style={styles.semCartaoTitulo}>Cartão em preparação</Text>
                <Text style={styles.semCartaoDescricao}>Ainda não existe um cartão ativo associado à sua conta.</Text>
              </View>
            )}
          </View>
        )}

        {usuario.perfil === 'PROFESSOR' && (
          <View style={[styles.secao, desktop && styles.secaoDesktop]}>
            <Text style={styles.indice}>01 · DOCÊNCIA</Text>
            <Text style={styles.tituloSecao}>Presenças académicas</Text>
            <Text style={styles.subtituloSecao}>
              Abra uma aula e valide os cartões académicos dos estudantes.
            </Text>
            <Modulo
              codigo="PR"
              icone="qrcode-scan"
              titulo="Registar presenças"
              descricao="Abrir aula, ler QR Code e consultar os registos."
              aoPressionar={abrirPresencas}
              destaque
            />
          </View>
        )}

        {(usuario.perfil === 'RESPONSAVEL' || usuario.perfil === 'ADMIN') && (
          <View style={[styles.secao, desktop && styles.secaoDesktop]}>
            <Text style={styles.indice}>02 · SERVIÇOS</Text>
            <Text style={styles.tituloSecao}>Reemissões</Text>
            <Text style={styles.subtituloSecao}>
              Acompanhe o ciclo completo de segunda via e entrega.
            </Text>
            <Modulo codigo="RM" icone="file-document-edit-outline" titulo="Pedidos de reemissão" descricao="Analisar, aprovar e preparar cartões" aoPressionar={acaoPedidos} destaque />
          </View>
        )}

        {usuario.perfil === 'OPERADOR_CARTAO' && (
          <View style={[styles.secao, desktop && styles.secaoDesktop]}>
            <Text style={styles.indice}>01 · PRODUÇÃO</Text>
            <Text style={styles.tituloSecao}>Painel operacional</Text>
            <Text style={styles.subtituloSecao}>
              Produza cartões aprovados, marque cartões prontos e confirme a entrega ao estudante.
            </Text>

            <View style={styles.operadorResumo}>
              <View style={styles.operadorResumoItem}>
                <Text style={styles.operadorResumoNumero}>
                  {estatisticas?.perfil === 'OPERADOR_CARTAO'
                    ? estatisticas.producao.emProducao
                    : '--'}
                </Text>
                <Text style={styles.operadorResumoTexto}>Em produção</Text>
              </View>

              <View style={styles.operadorResumoDivisor} />

              <View style={styles.operadorResumoItem}>
                <Text style={styles.operadorResumoNumero}>
                  {estatisticas?.perfil === 'OPERADOR_CARTAO'
                    ? estatisticas.producao.prontos
                    : '--'}
                </Text>
                <Text style={styles.operadorResumoTexto}>Prontos</Text>
              </View>
            </View>

            <Modulo
              codigo="PR"
              icone="printer-check"
              titulo="Fila de produção"
              descricao="Ver pedidos aprovados e marcar cartões como prontos."
              aoPressionar={acaoPedidos}
              destaque
            />

            <View style={styles.grelhaOperador}>
              <Modulo
                codigo="ID"
                icone="card-account-details-outline"
                titulo="Cartões"
                descricao="Consultar cartões emitidos e validar estados."
                aoPressionar={acaoCartoes}
              />

              <Modulo
                codigo="ED"
                icone="account-search-outline"
                titulo="Estudantes"
                descricao="Consultar dados do estudante antes da entrega."
                aoPressionar={acaoEstudantes}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  scroll: { paddingBottom: 42 },
  hero: {
    backgroundColor: theme.colors.primary,
    paddingTop: 34,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroConteudo: { width: '100%', maxWidth: 1240, alignSelf: 'center' },
  heroConteudoDesktop: { paddingHorizontal: 20 },
  heroTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marcaLinha: { flexDirection: 'row', alignItems: 'center' },
  marca: { width: 36, height: 36, borderRadius: 11, backgroundColor: theme.colors.gold, justifyContent: 'center', alignItems: 'center' },
  marcaTexto: { color: theme.colors.primary, fontSize: 11, fontWeight: '900' },
  marcaNome: { color: theme.colors.textWhite, fontSize: 12, letterSpacing: 1.7, marginLeft: 10, fontWeight: '900' },
  marcaDescricao: { color: '#93C5FD', fontSize: 9, letterSpacing: 1.1, fontWeight: '800', marginLeft: 10, marginTop: 3 },
  heroAcoes: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessaoSegura: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.12)' },
  sessaoSeguraTexto: { color: '#A7F3D0', fontSize: 11, fontWeight: '800' },
  botaoSair: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  textoSair: { color: '#e2e8f0', fontSize: 11, fontWeight: '800' },
  perfilLinha: { flexDirection: 'row', alignItems: 'center', marginTop: 28 },
  perfilLinhaDesktop: { marginTop: 34 },
  avatar: { width: 58, height: 58, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(244,178,35,0.8)', backgroundColor: '#0B4B83', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImagem: { width: '100%', height: '100%' },
  avatarTexto: { color: theme.colors.gold, fontSize: 24, fontWeight: '900' },
  avatarDesktop: { width: 72, height: 72, borderRadius: 22 },
  perfilDados: { marginLeft: 14, flex: 1 },
  botaoFotoPerfil: { alignSelf: 'flex-start', marginTop: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  botaoFotoPerfilTexto: { color: '#E0F2FE', fontSize: 11, fontWeight: '800' },
  saudacao: { color: '#93c5fd', fontSize: 10, letterSpacing: 1, fontWeight: '900' },
  nome: { color: theme.colors.textWhite, fontSize: 23, fontWeight: '800', marginTop: 3, letterSpacing: -0.5 },
  nomeDesktop: { fontSize: 30 },
  perfil: { color: '#cbd5e1', fontSize: 11, fontWeight: '800', letterSpacing: 0.7, marginTop: 5 },
  secao: { width: '100%', marginTop: 30, paddingHorizontal: 20 },
  secaoDesktop: { maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 30 },
  indice: { color: theme.colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  cabecalhoIndicadores: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  atualizacao: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#ECFDF3', marginBottom: 1 },
  pontoAtualizacao: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#12B76A' },
  atualizacaoTexto: { color: '#067647', fontSize: 11, fontWeight: '800' },
  tituloSecao: { color: theme.colors.textPrimary, fontSize: 25, letterSpacing: -0.6, fontWeight: '800', marginTop: 6 },
  subtituloSecao: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 17 },
  painelIndicadores: { marginTop: 16, backgroundColor: '#EAF1F8', borderRadius: theme.borderRadius.xl, borderWidth: 1, borderColor: '#D9E5F1', padding: 12 },
  gridEstatisticas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  carregando: { color: theme.colors.textMuted, fontSize: 13, marginTop: 12, marginBottom: 8 },
  grelha: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 17 },
  grelhaOperador: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 },
  operadorResumo: {
    backgroundColor: theme.colors.primary,
    borderColor: 'rgba(244,178,35,0.5)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    marginTop: 16,
    paddingVertical: 16,
  },
  operadorResumoItem: { alignItems: 'center', flex: 1 },
  operadorResumoNumero: {
    color: theme.colors.gold,
    fontSize: 28,
    fontWeight: '900',
  },
  operadorResumoTexto: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  operadorResumoDivisor: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    width: 1,
  },
  modulo: { width: '48%', minHeight: 154, borderRadius: 16, padding: 16, backgroundColor: theme.colors.cardBackground, borderWidth: 1, borderColor: '#E2E8F0', ...theme.shadows.sm },
  moduloDesktop: { width: '31.9%', minHeight: 166 },
  moduloDestaque: { width: '100%', minHeight: 142, backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, marginTop: 4, ...theme.shadows.md },
  moduloPressionado: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  moduloTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  codigoModulo: { backgroundColor: '#eaf4fb', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6 },
  codigoDestaque: { backgroundColor: theme.colors.gold },
  moduloTitulo: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 21 },
  moduloTituloDestaque: { color: theme.colors.textWhite, marginTop: 18 },
  moduloDescricao: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  moduloDescricaoDestaque: { color: '#cbd5e1' },
  estado: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  cartaoEstudante: { marginTop: 16, backgroundColor: theme.colors.primary, borderRadius: 21, padding: 18, ...theme.shadows.lg },
  cartaoEstudanteTopo: { flexDirection: 'row', alignItems: 'center' },
  foto: { width: 66, height: 78, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  fotoVazia: { width: 66, height: 78, borderRadius: 13, backgroundColor: '#0b4b83', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  fotoVaziaTexto: { color: theme.colors.gold, fontWeight: '900', fontSize: 13 },
  cartaoDados: { marginLeft: 14, flex: 1 },
  cartaoNumero: { color: '#93c5fd', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  cartaoNome: { color: theme.colors.textWhite, fontSize: 17, fontWeight: '800', marginTop: 5 },
  cartaoCurso: { color: '#cbd5e1', fontSize: 12, marginTop: 4 },
  cartaoRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  numeroReal: { color: theme.colors.textWhite, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  estadoAtivo: { backgroundColor: 'rgba(244,178,35,0.18)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(244,178,35,0.42)' },
  estadoAtivoTexto: { color: theme.colors.gold, fontSize: 10, fontWeight: '900' },
  botaoCartao: { height: 50, borderRadius: 12, backgroundColor: theme.colors.gold, paddingHorizontal: 15, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  botaoCartaoTexto: { color: theme.colors.primary, fontSize: 14, fontWeight: '900' },
  botaoCartaoSeta: { color: theme.colors.primary, fontSize: 20 },
  linkCartao: { alignItems: 'center', paddingTop: 14 },
  linkCartaoTexto: { color: '#dbeafe', fontSize: 13, fontWeight: '700' },
  semCartao: { marginTop: 16, borderRadius: 18, backgroundColor: theme.colors.cardBackground, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  semCartaoCodigo: { color: theme.colors.gold, fontWeight: '900', fontSize: 13 },
  semCartaoTitulo: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 12 },
  semCartaoDescricao: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
});
