import {
  ImageBackground,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { theme } from '../styles/theme';
import LogoUcm from '../components/brand/LogoUcm';

const imagemHero = require('../assets/hero-ucm-card.png');
const imagemHeroDesktop = require('../assets/hero-ucm-card-desktop.png');

type LandingProps = {
  aoEntrar: () => void;
  aoAtivarConta: () => void;
};

export default function Landing({
  aoEntrar,
  aoAtivarConta,
}: LandingProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const imagemSelecionada = desktop ? imagemHeroDesktop : imagemHero;
  const imagemHeroWeb =
    Platform.OS === 'web'
      ? (imagemSelecionada as { uri?: string }).uri
      : undefined;

  return (
    <View style={styles.pagina}>
      <ImageBackground
        source={imagemSelecionada}
        style={[
          styles.fundo,
          Platform.OS === 'web' && imagemHeroWeb &&
            ({
              backgroundImage: `url(${imagemHeroWeb})`,
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
            } as never),
        ]}
        imageStyle={[
          styles.imagemFundo,
          Platform.OS === 'web' && imagemHeroWeb && styles.imagemFundoWeb,
        ]}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" />
        <View style={[styles.overlay, desktop && styles.overlayDesktop]}>
        <View style={[styles.topo, desktop && styles.larguraDesktop]}>
          <LogoUcm size={desktop ? 62 : 50} />
          <View>
            <Text style={styles.nomeProduto}>UCM CARD</Text>
            <Text style={styles.nomeUniversidade}>
              Universidade Católica de Moçambique
            </Text>
          </View>
        </View>

        <View style={[styles.conteudo, desktop && styles.conteudoDesktop]}>
          <View style={styles.selo}>
            <View style={styles.pontoSelo} />
            <Text style={styles.textoSelo}>PORTAL ACADÉMICO DIGITAL</Text>
          </View>

          <Text style={[styles.titulo, desktop && styles.tituloDesktop]}>
            A sua identidade{`\n`}académica, sempre{`\n`}consigo.
          </Text>

          <Text style={[styles.descricao, desktop && styles.descricaoDesktop]}>
            Gestão segura de cartões académicos, validação por QR Code e serviços digitais num só lugar.
          </Text>

          <View style={[styles.acoes, desktop && styles.acoesDesktop]}>
            <Pressable
              style={({ pressed }) => [
                styles.ctaPrincipal,
                desktop && styles.ctaDesktop,
                pressed && styles.pressionado,
              ]}
              onPress={aoEntrar}
            >
              <Text style={styles.textoCtaPrincipal}>
                Entrar no portal
              </Text>
              <Text style={styles.seta}>→</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.ctaSecundario,
                desktop && styles.ctaDesktop,
                pressed && styles.pressionado,
              ]}
              onPress={aoAtivarConta}
            >
              <Text style={styles.textoCtaSecundario}>
                Ativar primeira conta
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.rodape, desktop && styles.larguraDesktop]}>
          <Text style={styles.rodapeNumero}>01</Text>
          <View style={styles.linha} />
          <Text style={styles.rodapeTexto}>
            CARTÕES ACADÉMICOS · UCM
          </Text>
        </View>
        </View>
      </ImageBackground>

    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: '#071A30' },
  fundo: { flex: 1 },
  imagemFundo: { resizeMode: 'cover' },
  // No navegador, o elemento interno do ImageBackground pode preservar o
  // tamanho original da fotografia. A camada CSS abaixo ocupa sempre toda a tela.
  imagemFundoWeb: { opacity: 0 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 13, 29, 0.74)',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  overlayDesktop: {
    paddingHorizontal: 64,
    paddingTop: 38,
    paddingBottom: 28,
    backgroundColor: 'rgba(3, 14, 31, 0.78)',
  },
  larguraDesktop: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  topo: { flexDirection: 'row', alignItems: 'center' },
  marca: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  marcaTexto: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  nomeProduto: {
    color: theme.colors.textWhite,
    fontSize: 14,
    letterSpacing: 2.1,
    fontWeight: '900',
  },
  nomeUniversidade: {
    color: '#cbd5e1',
    fontSize: 10,
    marginTop: 3,
  },
  conteudo: { marginTop: 'auto', marginBottom: 'auto' },
  conteudoDesktop: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    marginBottom: 19,
  },
  pontoSelo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.gold,
    marginRight: 7,
  },
  textoSelo: {
    color: '#e2e8f0',
    fontSize: 10,
    letterSpacing: 1.05,
    fontWeight: '800',
  },
  titulo: {
    color: theme.colors.textWhite,
    fontSize: 39,
    lineHeight: 45,
    fontWeight: '800',
    letterSpacing: -1.35,
  },
  tituloDesktop: {
    fontSize: 66,
    lineHeight: 72,
    letterSpacing: -2.2,
    maxWidth: 760,
  },
  descricao: {
    color: '#dbe4f0',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 330,
    marginTop: 17,
  },
  descricaoDesktop: {
    maxWidth: 610,
    fontSize: 18,
    lineHeight: 29,
    marginTop: 23,
  },
  acoes: { marginTop: 31, gap: 11 },
  acoesDesktop: {
    flexDirection: 'row',
    width: 570,
    marginTop: 38,
    gap: 14,
  },
  ctaDesktop: { flex: 1 },
  ctaPrincipal: {
    height: 56,
    backgroundColor: theme.colors.gold,
    borderRadius: 14,
    paddingHorizontal: 19,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textoCtaPrincipal: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  seta: { color: theme.colors.primary, fontSize: 24, fontWeight: '400' },
  ctaSecundario: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCtaSecundario: { color: theme.colors.textWhite, fontSize: 14, fontWeight: '800' },
  pressionado: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  rodape: { flexDirection: 'row', alignItems: 'center' },
  rodapeNumero: { color: theme.colors.gold, fontSize: 11, fontWeight: '900' },
  linha: { height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.28)', marginHorizontal: 10 },
  rodapeTexto: { color: '#cbd5e1', fontSize: 9, letterSpacing: 0.8, fontWeight: '700' },
});
