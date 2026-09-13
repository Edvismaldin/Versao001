import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LogoUcm from '../brand/LogoUcm';
import { montarUrlArquivo } from '../../services/api';
import { theme } from '../../styles/theme';

interface CartaoFrenteProps {
  nome?: string;
  codigo?: string;
  curso?: string;
  faculdade?: string;
  numeroCartao?: string;
  validade?: string;
  foto?: string | null;
  cartao?: any;
}

export default function CartaoFrente(props: CartaoFrenteProps) {
  const c = props.cartao ?? {};
  const estudante = c.estudante ?? {};
  const cursoDados = estudante.curso ?? {};
  const faculdadeDados = cursoDados.faculdade ?? {};

  const nome = props.nome ?? estudante.nomeCompleto ?? '';
  const codigo = props.codigo ?? estudante.codigo ?? '';
  const curso = props.curso ?? cursoDados.nome ?? '';
  const faculdade =
    props.faculdade ??
    faculdadeDados.sigla ??
    faculdadeDados.nome ??
    '';
  const numeroCartao = props.numeroCartao ?? c.numeroCartao ?? '';
  const validade =
    props.validade ??
    (c.dataValidade
      ? new Date(c.dataValidade).toLocaleDateString('pt-PT')
      : 'Sem validade');
  const foto = montarUrlArquivo(props.foto ?? estudante.foto);

  return (
    <View style={styles.container}>
      <View style={styles.cartao}>
        <View style={styles.fundoMarca}>
          <LogoUcm size={126} />
        </View>

        <View style={styles.topo}>
          <View style={styles.marca}>
            <LogoUcm size={38} />
            <View>
              <Text style={styles.universidade}>Universidade Católica</Text>
              <Text style={styles.pais}>de Moçambique</Text>
            </View>
          </View>

          <View style={styles.selo}>
            <Text style={styles.seloTexto}>UCM</Text>
          </View>
        </View>

        <View style={styles.faixa} />

        <View style={styles.corpo}>
          <View style={styles.fotoArea}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.foto} />
            ) : (
              <View style={styles.fotoVazia}>
                <Text style={styles.fotoVaziaTexto}>FOTO</Text>
              </View>
            )}
          </View>

          <View style={styles.dados}>
            <Text style={styles.tipo}>IDENTIFICAÇÃO ACADÉMICA</Text>

            <Text style={styles.nome} numberOfLines={2}>
              {nome || 'Nome do estudante'}
            </Text>

            <View style={styles.linhaDados}>
              <Campo label="Código académico" valor={codigo || '-'} destaque />
              <Campo label="Faculdade" valor={faculdade || '-'} />
            </View>

            <Campo label="Curso" valor={curso || '-'} />
          </View>
        </View>

        <View style={styles.rodape}>
          <View>
            <Text style={styles.rodapeLabel}>Número do cartão</Text>
            <Text style={styles.rodapeValor}>{numeroCartao || '-'}</Text>
          </View>

          <View style={styles.validadeArea}>
            <Text style={styles.rodapeLabel}>Válido até</Text>
            <Text style={styles.rodapeValor}>{validade}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Campo({
  label,
  valor,
  destaque = false,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.valor, destaque && styles.valorDestaque]}
        numberOfLines={1}
      >
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartao: {
    width: 342,
    height: 216,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7C6D8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  fundoMarca: {
    position: 'absolute',
    right: -24,
    bottom: 28,
    opacity: 0.028,
  },
  topo: {
    height: 56,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  universidade: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  pais: {
    color: '#B9D3EA',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  selo: {
    minWidth: 42,
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,178,35,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seloTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  faixa: {
    height: 4,
    backgroundColor: theme.colors.gold,
  },
  corpo: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
  },
  fotoArea: {
    width: 86,
    height: 104,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C9A227',
    padding: 3,
    marginRight: 13,
  },
  foto: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  fotoVazia: {
    flex: 1,
    borderRadius: 5,
    backgroundColor: '#EAF4FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoVaziaTexto: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  dados: {
    flex: 1,
    justifyContent: 'center',
  },
  tipo: {
    color: '#B88718',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  nome: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '900',
    marginBottom: 8,
  },
  linhaDados: {
    flexDirection: 'row',
    gap: 10,
  },
  campo: {
    flex: 1,
    marginBottom: 5,
  },
  label: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  valor: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '800',
  },
  valorDestaque: {
    color: theme.colors.primary,
  },
  rodape: {
    height: 39,
    backgroundColor: theme.colors.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244,178,35,0.6)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  validadeArea: {
    alignItems: 'flex-end',
  },
  rodapeLabel: {
    color: '#AFC9E2',
    fontSize: 7,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  rodapeValor: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 1,
  },
});
