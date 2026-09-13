export const theme = {
  colors: {
    // Primary Brand Colors (UCM Navy & Royal Blue)
    primary: '#003B71',
    primaryLight: '#005AAB',
    accent: '#0B6EAD',
    accentHover: '#075985',
    accentLight: '#EAF4FB',
    gold: '#F4B223',
    goldLight: '#FEF3C7',

    // Neutrals
    background: '#F3F6FA',
    cardBackground: '#FFFFFF',
    surface: '#F1F5F9',
    border: '#E2E8F0',
    borderDark: '#CBD5E1',

    // Text Colors
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textWhite: '#FFFFFF',

    // Status Tints
    status: {
      ativo: {
        bg: '#DCFCE7',
        text: '#15803D',
        border: '#86EFAC',
      },
      pendente: {
        bg: '#FEF3C7',
        text: '#B45309',
        border: '#FDE68A',
      },
      analise: {
        bg: '#E0F2FE',
        text: '#0369A1',
        border: '#BAE6FD',
      },
      producao: {
        bg: '#F3E8FF',
        text: '#6B21A8',
        border: '#E9D5FF',
      },
      pronto: {
        bg: '#D1FAE5',
        text: '#047857',
        border: '#6EE7B7',
      },
      entregue: {
        bg: '#E2E8F0',
        text: '#334155',
        border: '#CBD5E1',
      },
      rejeitado: {
        bg: '#FEE2E2',
        text: '#B91C1C',
        border: '#FCA5A5',
      },
      bloqueado: {
        bg: '#FEE2E2',
        text: '#991B1B',
        border: '#FCA5A5',
      },
    },

    // Alert & Functional
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    success: '#10B981',
    warning: '#F59E0B',
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};
