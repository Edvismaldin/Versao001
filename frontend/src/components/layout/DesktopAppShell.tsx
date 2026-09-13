import type { ReactNode } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { UsuarioSessao } from '../../services/autenticacao.service';
import { theme } from '../../styles/theme';
import LogoUcm from '../brand/LogoUcm';

type ItemNavegacao = {
  chave: string;
  titulo: string;
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  aoPressionar?: () => void;
};

type Props = {
  usuario: UsuarioSessao;
  telaAtiva: string;
  children: ReactNode;
  aoAbrirDashboard: () => void;
  aoAbrirEstudantes: () => void;
  aoAbrirCartoes: () => void;
  aoAbrirFaculdades: () => void;
  aoAbrirCursos: () => void;
  aoAbrirUsuarios: () => void;
  aoAbrirPedidos: () => void;
  aoAbrirMeuCartao: () => void;
  aoAbrirMeusPedidos: () => void;
  aoAbrirPresencas: () => void;
  aoSair: () => void;
};

function itensParaPerfil(props: Props): ItemNavegacao[] {
  const inicio: ItemNavegacao = {
    chave: 'dashboard',
    titulo: props.usuario.perfil === 'ESTUDANTE' ? 'Início' : 'Visão geral',
    icone: 'view-dashboard-outline',
    aoPressionar: props.aoAbrirDashboard,
  };

  if (props.usuario.perfil === 'ADMIN') {
    return [
      inicio,
      { chave: 'estudantes', titulo: 'Estudantes', icone: 'account-group-outline', aoPressionar: props.aoAbrirEstudantes },
      { chave: 'cartoes', titulo: 'Cartões', icone: 'card-account-details-outline', aoPressionar: props.aoAbrirCartoes },
      { chave: 'faculdades', titulo: 'Faculdades', icone: 'domain', aoPressionar: props.aoAbrirFaculdades },
      { chave: 'cursos', titulo: 'Cursos', icone: 'book-open-page-variant-outline', aoPressionar: props.aoAbrirCursos },
      { chave: 'usuarios', titulo: 'Acessos', icone: 'account-cog-outline', aoPressionar: props.aoAbrirUsuarios },
      { chave: 'pedidos-reemissao', titulo: 'Reemissões', icone: 'file-document-edit-outline', aoPressionar: props.aoAbrirPedidos },
    ];
  }

  if (props.usuario.perfil === 'OPERADOR_CARTAO') {
    return [
      inicio,
      { chave: 'pedidos-reemissao', titulo: 'Produção', icone: 'printer-check', aoPressionar: props.aoAbrirPedidos },
      { chave: 'cartoes', titulo: 'Cartões', icone: 'card-account-details-outline', aoPressionar: props.aoAbrirCartoes },
      { chave: 'estudantes', titulo: 'Estudantes', icone: 'account-search-outline', aoPressionar: props.aoAbrirEstudantes },
    ];
  }

  if (props.usuario.perfil === 'PROFESSOR') {
    return [inicio, { chave: 'presencas', titulo: 'Presenças', icone: 'qrcode-scan', aoPressionar: props.aoAbrirPresencas }];
  }

  if (props.usuario.perfil === 'ESTUDANTE') {
    return [
      inicio,
      { chave: 'meu-cartao', titulo: 'O meu cartão', icone: 'card-account-details-outline', aoPressionar: props.aoAbrirMeuCartao },
      { chave: 'meus-pedidos', titulo: 'Os meus pedidos', icone: 'file-document-outline', aoPressionar: props.aoAbrirMeusPedidos },
    ];
  }

  return [inicio, { chave: 'pedidos-reemissao', titulo: 'Reemissões', icone: 'file-document-edit-outline', aoPressionar: props.aoAbrirPedidos }];
}

export default function DesktopAppShell(props: Props) {
  const { width } = useWindowDimensions();
  const usarBarraLateral = Platform.OS === 'web' && width >= 980;

  if (!usarBarraLateral) {
    return <>{props.children}</>;
  }

  const itens = itensParaPerfil(props);
  const iniciais = props.usuario.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.app}>
      <View style={styles.barraLateral}>
        <View style={styles.marca}>
          <LogoUcm size={38} />
          <View>
            <Text style={styles.marcaTitulo}>UCM CARD</Text>
            <Text style={styles.marcaSubtitulo}>PORTAL INSTITUCIONAL</Text>
          </View>
        </View>

        <Text style={styles.secaoMenu}>NAVEGAÇÃO</Text>
        <View style={styles.menu}>
          {itens.map((item) => {
            const ativo = props.telaAtiva === item.chave ||
              (item.chave === 'cartoes' && ['visualizar-cartao', 'historico-cartoes'].includes(props.telaAtiva)) ||
              (item.chave === 'pedidos-reemissao' && props.telaAtiva === 'reemissao-cartao');

            return (
              <Pressable
                key={item.chave}
                onPress={item.aoPressionar}
                style={({ pressed }) => [styles.itemMenu, ativo && styles.itemMenuAtivo, pressed && styles.itemMenuPressionado]}
              >
                <MaterialCommunityIcons name={item.icone} size={20} color={ativo ? theme.colors.primary : '#94A3B8'} />
                <Text style={[styles.itemTexto, ativo && styles.itemTextoAtivo]}>{item.titulo}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.rodape}>
          <View style={styles.perfilLinha}>
            <View style={styles.avatar}><Text style={styles.avatarTexto}>{iniciais || 'U'}</Text></View>
            <View style={styles.perfilTexto}>
              <Text numberOfLines={1} style={styles.nome}>{props.usuario.nome}</Text>
              <Text style={styles.perfil}>{props.usuario.perfil.replace('_', ' ')}</Text>
            </View>
          </View>
          <Pressable style={styles.sair} onPress={props.aoSair}>
            <MaterialCommunityIcons name="logout" size={18} color="#CBD5E1" />
            <Text style={styles.sairTexto}>Terminar sessão</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.conteudo}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, flexDirection: 'row', backgroundColor: theme.colors.background },
  barraLateral: { width: 264, backgroundColor: '#082F59', paddingTop: 28, paddingHorizontal: 15, paddingBottom: 20 },
  marca: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  marcaTitulo: { color: theme.colors.textWhite, fontSize: 13, fontWeight: '900', letterSpacing: 1.2, marginLeft: 10 },
  marcaSubtitulo: { color: '#94A3B8', fontSize: 8, letterSpacing: 0.8, fontWeight: '800', marginLeft: 10, marginTop: 3 },
  secaoMenu: { color: '#7CA5CB', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginTop: 25, marginLeft: 10, marginBottom: 9 },
  menu: { gap: 5 },
  itemMenu: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, paddingHorizontal: 12 },
  itemMenuAtivo: { backgroundColor: theme.colors.gold },
  itemMenuPressionado: { opacity: 0.8 },
  itemTexto: { color: '#CBD5E1', fontSize: 14, fontWeight: '700' },
  itemTextoAtivo: { color: theme.colors.primary, fontWeight: '900' },
  rodape: { marginTop: 'auto', paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  perfilLinha: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, marginBottom: 14 },
  avatar: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#0B4B83', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(244,178,35,0.65)' },
  avatarTexto: { color: theme.colors.gold, fontSize: 11, fontWeight: '900' },
  perfilTexto: { flex: 1, marginLeft: 9 },
  nome: { color: theme.colors.textWhite, fontSize: 12, fontWeight: '800' },
  perfil: { color: '#94A3B8', fontSize: 9, fontWeight: '700', marginTop: 2 },
  sair: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, paddingVertical: 10 },
  sairTexto: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  conteudo: { flex: 1, minWidth: 0 },
});
