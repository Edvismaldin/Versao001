import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LogoUcm from '../brand/LogoUcm';
import { theme } from '../../styles/theme';

interface CartaoVersoProps {
  numeroCartao?: string;
  qrCode?: string;
  faculdade?: string;
  cartao?: any;
}

export default function CartaoVerso(props: CartaoVersoProps) {
  const c = props.cartao ?? {};
  const numeroCartao = props.numeroCartao ?? c.numeroCartao ?? '';
  const qrCode = props.qrCode ?? c.qrCode ?? c.urlValidacao ?? '';
  const faculdade =
    props.faculdade ??
    c.estudante?.curso?.faculdade?.sigla ??
    c.estudante?.curso?.faculdade?.nome ??
    '';

  return (
    <View style={styles.container}>
      <View style={styles.cartao}>
        <View style={styles.fundoMarca}>
          <LogoUcm size={118} />
        </View>

        <View style={styles.topo}>
          <View style={styles.marca}>
            <LogoUcm size={35} />
            <View>
              <Text style={styles.titulo}>Validação Digital</Text>
              <Text style={styles.subtitulo}>UCM Cartões Académicos</Text>
            </View>
          </View>

          <View style={styles.selo}>
            <Text style={styles.seloTexto}>QR</Text>
          </View>
        </View>

        <View style={styles.faixa} />

        <View style={styles.corpo}>
          <View style={styles.colunaTexto}>
            <Campo label="Número do cartão" valor={numeroCartao || '-'} destaque />
            <Campo label="Unidade académica" valor={faculdade || '-'} />

            <View style={styles.caixaAviso}>
              <Text style={styles.avisoTitulo}>Uso institucional</Text>
              <Text style={styles.avisoTexto}>
                Este cartão é pessoal e deve ser validado através do QR Code.
              </Text>
            </View>

            <Text style={styles.assinatura}>Universidade Católica de Moçambique</Text>
          </View>

          <View style={styles.qrArea}>
            <View style={styles.qrMoldura}>
              {qrCode ? (
                <Image source={{ uri: qrCode }} style={styles.qr} />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderTexto}>QR</Text>
                </View>
              )}
            </View>

            <Text style={styles.qrLegenda}>Escanear para validar</Text>
          </View>
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>SEGURO</Text>
          <View style={styles.ponto} />
          <Text style={styles.rodapeTexto}>VERIFICÁVEL</Text>
          <View style={styles.ponto} />
          <Text style={styles.rodapeTexto}>UCM</Text>
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
        numberOfLines={2}
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
    left: -28,
    bottom: 18,
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
  titulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  subtitulo: {
    color: '#B9D3EA',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  selo: {
    width: 32,
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
    paddingVertical: 12,
    gap: 12,
  },
  colunaTexto: {
    flex: 1,
    justifyContent: 'space-between',
  },
  campo: {
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
    lineHeight: 14,
    fontWeight: '800',
  },
  valorDestaque: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  caixaAviso: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.gold,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  avisoTitulo: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  avisoTexto: {
    color: '#475569',
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  assinatura: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
  },
  qrArea: {
    width: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrMoldura: {
    width: 104,
    height: 104,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C9A227',
    padding: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qr: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  qrPlaceholder: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: '#EAF4FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderTexto: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  qrLegenda: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '900',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  rodape: {
    height: 26,
    backgroundColor: theme.colors.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244,178,35,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  rodapeTexto: {
    color: '#C9DDF0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  ponto: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gold,
  },
});
