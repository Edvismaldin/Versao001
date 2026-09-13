import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import Dashboard from './src/views/Dashboard';
import Cartoes from './src/views/Cartoes';
import Cursos from './src/views/Cursos';
import Estudantes from './src/views/Estudantes';
import Faculdades from './src/views/Faculdades';
import Login from './src/views/Login';
import VisualizarCartao from './src/views/VisualizarCartao';
import HistoricoCartoes from './src/views/HistoricoCartoes';
import ReemissaoCartao from './src/views/ReemissaoCartao';
import PedidosReemissao from './src/views/PedidosReemissao';
import AtivarConta from './src/views/AtivarConta';
import ConcluirAtivacao from './src/views/ConcluirAtivacao';
import Usuarios from './src/views/Usuarios';
import Landing from './src/views/Landing';
import MeuCartao from './src/views/MeuCartao';
import MeusPedidos from './src/views/MeusPedidos';
import Presencas from './src/views/Presencas';
import {
  definirEventoSessaoExpirada,
  obterToken,
  removerToken,
} from './src/services/sessao.service';
import {
  obterUsuarioAtual,
  type UsuarioSessao,
} from './src/services/autenticacao.service';
import type { CartaoAcademico } from './src/types/cartao';

type Tela =
  | 'dashboard'
  | 'faculdades'
  | 'cursos'
  | 'estudantes'
  | 'cartoes'
  | 'visualizar-cartao'
  | 'historico-cartoes'
  | 'reemissao-cartao'
  | 'pedidos-reemissao'
  | 'usuarios'
  | 'meu-cartao'
  | 'meus-pedidos'
  | 'presencas';

type TelaPublica =
  | 'landing'
  | 'login'
  | 'ativar-conta'
  | 'concluir-ativacao';

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioSessao | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [tela, setTela] = useState<Tela>('dashboard');
  const [telaPublica, setTelaPublica] = useState<TelaPublica>('landing');
  const [codigoEstudanteAtivacao, setCodigoEstudanteAtivacao] = useState('');
  const [cartaoSelecionado, setCartaoSelecionado] =
    useState<CartaoAcademico | null>(null);
  const [estudanteHistoricoId, setEstudanteHistoricoId] =
    useState<number | null>(null);
  const [cartaoReemissaoId, setCartaoReemissaoId] =
    useState<number | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const idEstilo = 'ucm-card-scrollbar';
    if (document.getElementById(idEstilo)) {
      return;
    }

    const estilo = document.createElement('style');
    estilo.id = idEstilo;
    estilo.textContent = `
      * { scrollbar-width: thin; scrollbar-color: #0B6EAD #EAF4FB; }
      *::-webkit-scrollbar { width: 10px; height: 10px; }
      *::-webkit-scrollbar-track { background: #EAF4FB; border-radius: 999px; }
      *::-webkit-scrollbar-thumb { background: #0B6EAD; border: 2px solid #EAF4FB; border-radius: 999px; }
      *::-webkit-scrollbar-thumb:hover { background: #003B71; }
    `;
    document.head.appendChild(estilo);

    return () => {
      estilo.remove();
    };
  }, []);

  useEffect(() => {
    verificarSessao();
  }, []);

  useEffect(() => {
    definirEventoSessaoExpirada(() => {
      setAutenticado(false);
      setUsuarioAtual(null);
      setTela('dashboard');
      setCartaoSelecionado(null);
      setEstudanteHistoricoId(null);
      setCartaoReemissaoId(null);
    });

    return () => {
      definirEventoSessaoExpirada(null);
    };
  }, []);

  async function verificarSessao() {
    try {
      const token = await obterToken();

      if (!token) {
        setAutenticado(false);
        setUsuarioAtual(null);
        return;
      }

      const resposta = await obterUsuarioAtual();

      setUsuarioAtual(resposta.usuario);
      setAutenticado(true);
    } catch {
      await removerToken();
      setAutenticado(false);
      setUsuarioAtual(null);
    } finally {
      setCarregandoSessao(false);
    }
  }

  async function entrar(usuario: UsuarioSessao) {
    setUsuarioAtual(usuario);
    setAutenticado(true);
    setTela('dashboard');
    setTelaPublica('login');
    setCartaoSelecionado(null);
    setEstudanteHistoricoId(null);
    setCartaoReemissaoId(null);
  }

  async function sair() {
    await removerToken();

    setAutenticado(false);
    setUsuarioAtual(null);
    setTela('dashboard');
    setCartaoSelecionado(null);
    setEstudanteHistoricoId(null);
    setCartaoReemissaoId(null);
  }

  function paginaAutenticada(conteudo: ReactNode) {
    return conteudo;
  }

  function abrirReemissao(cartaoId: number) {
    setCartaoReemissaoId(cartaoId);
    setTela('reemissao-cartao');
  }

  if (carregandoSessao) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" />
        <Text>Verificando sessão...</Text>
      </View>
    );
  }

  if (autenticado) {
    if (tela === 'faculdades') {
      return paginaAutenticada(<Faculdades aoVoltar={() => setTela('dashboard')} />);
    }

    if (tela === 'cursos') {
      return paginaAutenticada(<Cursos aoVoltar={() => setTela('dashboard')} />);
    }

    if (tela === 'estudantes') {
      return paginaAutenticada(<Estudantes aoVoltar={() => setTela('dashboard')} />);
    }

    if (tela === 'cartoes') {
      return paginaAutenticada(
        <Cartoes
          aoVoltar={() => setTela('dashboard')}
          aoVisualizar={(cartao) => {
            setCartaoSelecionado(cartao);
            setTela('visualizar-cartao');
          }}
          aoVerHistorico={(estudanteId) => {
            setEstudanteHistoricoId(estudanteId);
            setTela('historico-cartoes');
          }}
        />
      );
    }

    if (
      tela === 'historico-cartoes' &&
      estudanteHistoricoId
    ) {
      return paginaAutenticada(
        <HistoricoCartoes
          estudanteId={estudanteHistoricoId}
          aoVoltar={() => {
            setEstudanteHistoricoId(null);
            setTela('cartoes');
          }}
        />
      );
    }

    if (
      tela === 'visualizar-cartao' &&
      cartaoSelecionado
    ) {
      return paginaAutenticada(
        <VisualizarCartao
          cartao={cartaoSelecionado}
          aoVoltar={() => {
            setCartaoSelecionado(null);
            setTela('cartoes');
          }}
          aoHistorico={(estudanteId) => {
            setEstudanteHistoricoId(estudanteId);
            setTela('historico-cartoes');
          }}
        />
      );
    }

    if (tela === 'reemissao-cartao') {
      return paginaAutenticada(
        <ReemissaoCartao
          cartaoId={cartaoReemissaoId ?? 0}
          aoVoltar={() => {
            setTela('dashboard');
            setCartaoReemissaoId(null);
          }}
        />
      );
    }

    if (tela === 'pedidos-reemissao') {
      return paginaAutenticada(
        <PedidosReemissao
          aoVoltar={() => setTela('dashboard')}
          perfil={
            usuarioAtual?.perfil === 'OPERADOR_CARTAO'
              ? 'OPERADOR_CARTAO'
              : usuarioAtual?.perfil === 'ADMIN'
                ? 'ADMIN'
                : 'RESPONSAVEL'
          }
        />
      );
    }

    if (tela === 'usuarios') {
      return paginaAutenticada(<Usuarios aoVoltar={() => setTela('dashboard')} />);
    }

    if (tela === 'meu-cartao') {
      return paginaAutenticada(
        <MeuCartao
          onVoltar={() => setTela('dashboard')}
          onSolicitarReemissao={(cartaoId) => {
            setCartaoReemissaoId(cartaoId);
            setTela('reemissao-cartao');
          }}
        />
      );
    }

    if (tela === 'meus-pedidos') {
      return paginaAutenticada(
        <MeusPedidos
          onVoltar={() => setTela('dashboard')}
        />
      );
    }

    if (tela === 'presencas') {
      return paginaAutenticada(<Presencas aoVoltar={() => setTela('dashboard')} />);
    }

    return paginaAutenticada(
      <Dashboard
        usuario={usuarioAtual!}
        abrirFaculdades={() => setTela('faculdades')}
        abrirCursos={() => setTela('cursos')}
        abrirEstudantes={() => setTela('estudantes')}
        abrirCartoes={() => setTela('cartoes')}
        aoSolicitarReemissao={(cartaoId) => {
          setCartaoReemissaoId(cartaoId);
          setTela('reemissao-cartao');
        }}
        abrirPedidos={() => setTela('pedidos-reemissao')}
        aoAbrirUsuarios={() => setTela('usuarios')}
        abrirMeuCartao={() => setTela('meu-cartao')}
        abrirMeusPedidos={() => setTela('meus-pedidos')}
        abrirPresencas={() => setTela('presencas')}
        sair={sair}
        aoAtualizarUsuario={(usuarioAtualizado) => {
          setUsuarioAtual((anterior) => anterior
            ? { ...anterior, ...usuarioAtualizado }
            : anterior);
        }}
      />
    );
  }

  if (telaPublica === 'ativar-conta') {
    return (
      <AtivarConta
        onVoltar={() => setTelaPublica('login')}
        onCodigoEnviado={(codigo) => {
          setCodigoEstudanteAtivacao(codigo);
          setTelaPublica('concluir-ativacao');
        }}
      />
    );
  }

  if (telaPublica === 'concluir-ativacao') {
    return (
      <ConcluirAtivacao
        codigoEstudante={codigoEstudanteAtivacao}
        onVoltar={() => setTelaPublica('ativar-conta')}
        onConcluido={() => setTelaPublica('login')}
      />
    );
  }

  if (telaPublica === 'landing') {
    return (
      <Landing
        aoEntrar={() => setTelaPublica('login')}
        aoAtivarConta={() => setTelaPublica('ativar-conta')}
      />
    );
  }

  return (
    <Login
      aoEntrar={entrar}
      onAtivarConta={() => setTelaPublica('ativar-conta')}
    />
  );
}

const styles = StyleSheet.create({
  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
