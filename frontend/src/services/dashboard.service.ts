import { api } from './api';

type ReemissoesAdmin = {
  pendentes: number;
  emAnalise: number;
  emProducao: number;
  prontos: number;
  entregues: number;
  rejeitados: number;
};

export type EstatisticasDashboard =
  | {
      perfil: 'PROFESSOR';
    }
  | {
      perfil: 'ADMIN';
      estudantes: number;
      cartoesAtivos: number;
      reemissoes: ReemissoesAdmin;
    }
  | {
      perfil: 'RESPONSAVEL';
      reemissoes: Pick<ReemissoesAdmin, 'pendentes' | 'emAnalise' | 'emProducao' | 'rejeitados'>;
    }
  | {
      perfil: 'OPERADOR_CARTAO';
      cartoesAtivos: number;
      producao: { emProducao: number; prontos: number; entregues: number };
    }
  | {
      perfil: 'ESTUDANTE';
      cartao: { id: number; numeroCartao: string; estado: string; dataEmissao: string; dataValidade?: string | null } | null;
      pedidos: { emAndamento: number; total: number };
    };

export type EstatisticasDashboardAdminLegado = {
  estudantes: number;
  cartoesAtivos: number;
  reemissoes: {
    pendentes: number;
    emAnalise: number;
    emProducao: number;
    prontos: number;
    entregues: number;
    rejeitados: number;
  };
};

export async function buscarEstatisticasDashboard() {
  const resposta = await api.get<EstatisticasDashboard>(
    '/dashboard/estatisticas',
  );

  return resposta.data;
}
