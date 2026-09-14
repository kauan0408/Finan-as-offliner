// src/App.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./styles/global.css";
import "./styles/bottom-nav.css";

import FinancasPage from "./pages/Financas/FinancasPage.jsx";
import TransacoesPage from "./pages/Transacoes/TransacoesPage.jsx";
import CartoesPage from "./pages/Cartoes/CartoesPage.jsx";
import HistoricoPage from "./pages/Historico/HistoricoPage.jsx";
import PerfilPage from "./pages/Perfil/PerfilPage.jsx";
import ReservaPage from "./pages/Reservas/ReservaPage.jsx";
import BackupPage from "./pages/Backup/BackupPage.jsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.jsx";
import ConfiguracoesPage from "./pages/Configuracoes/ConfiguracoesPage.jsx";
import SobrePage from "./pages/Sobre/SobrePage.jsx";

/* =====================================================
   CONTEXTO DE FINANÇAS
===================================================== */

const FinanceContext = createContext(null);

export function useFinance() {
  const contexto = useContext(FinanceContext);

  if (!contexto) {
    throw new Error(
      "useFinance deve ser usado dentro do FinanceContext.Provider"
    );
  }

  return contexto;
}

/* =====================================================
   VALORES INICIAIS
===================================================== */

const perfilInicial = {
  nome: "",
  rendaMensal: "",
  limiteGastoMensal: "",
  metaReservaMensal: "",
  reservaAcumulada: "",
  diaPagamento: "",
  avatarBase64: "",
};

const reservaInicial = {
  metaMensal: 0,
  locais: [],
  movimentos: [],
};

/* =====================================================
   LOCALSTORAGE
===================================================== */

function carregarDados(chave, valorPadrao) {
  try {
    const dadosSalvos = localStorage.getItem(chave);

    if (!dadosSalvos) {
      return valorPadrao;
    }

    return JSON.parse(dadosSalvos);
  } catch (erro) {
    console.error(`Erro ao carregar ${chave}:`, erro);
    return valorPadrao;
  }
}

function salvarDados(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error(`Erro ao salvar ${chave}:`, erro);
  }
}

function gerarId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

export default function App() {
  const [profile, setProfile] = useState(() =>
    carregarDados("financas_profile", perfilInicial)
  );

  const [transacoes, setTransacoes] = useState(() =>
    carregarDados("financas_transacoes", [])
  );

  const [cartoes, setCartoes] = useState(() =>
    carregarDados("financas_cartoes", [])
  );

  const [reserva, setReserva] = useState(() =>
    carregarDados("financas_reserva", reservaInicial)
  );


  const [abaAtiva, setAbaAtiva] = useState("financas");

  // Aviso rápido no canto superior com data e hora.
  const [notificacaoFlash, setNotificacaoFlash] = useState(null);
  const notificacaoTimerRef = useRef(null);

  function notificar(texto, tipo = "info") {
    if (!texto) return;

    if (notificacaoTimerRef.current) {
      clearTimeout(notificacaoTimerRef.current);
    }

    setNotificacaoFlash({
      id: gerarId(),
      texto: String(texto),
      tipo,
      dataHora: new Date().toISOString(),
    });

    notificacaoTimerRef.current = setTimeout(() => {
      setNotificacaoFlash(null);
      notificacaoTimerRef.current = null;
    }, 3600);
  }

  useEffect(() => {
    return () => {
      if (notificacaoTimerRef.current) clearTimeout(notificacaoTimerRef.current);
    };
  }, []);

  const hoje = new Date();

  const [mesReferencia, setMesReferencia] = useState({
    mes: hoje.getMonth(),
    ano: hoje.getFullYear(),
  });

  /* =====================================================
     SALVAMENTO AUTOMÁTICO OFFLINE
  ===================================================== */

  useEffect(() => {
    salvarDados("financas_profile", profile);
  }, [profile]);

  useEffect(() => {
    salvarDados("financas_transacoes", transacoes);
  }, [transacoes]);

  useEffect(() => {
    salvarDados("financas_cartoes", cartoes);
  }, [cartoes]);

  useEffect(() => {
    salvarDados("financas_reserva", reserva);
  }, [reserva]);

  /* =====================================================
     PERFIL
  ===================================================== */

  function atualizarProfile(novosDados) {
    setProfile((perfilAtual) => ({
      ...perfilAtual,
      ...novosDados,
    }));
  }

  /* =====================================================
     TRANSAÇÕES
  ===================================================== */

  function adicionarTransacao(dados) {
    const novaTransacao = {
      ...dados,
      id: gerarId(),
      dataHora: dados.dataHora || new Date().toISOString(),
    };

    setTransacoes((listaAtual) => [novaTransacao, ...listaAtual]);
    notificar(`${novaTransacao.descricao || "Transação"} salva.`, "sucesso");
    return novaTransacao;
  }

  function atualizarTransacao(id, dadosAtualizados) {
    setTransacoes((listaAtual) =>
      listaAtual.map((transacao) =>
        transacao.id === id
          ? { ...transacao, ...dadosAtualizados }
          : transacao
      )
    );

    notificar("Transação atualizada.", "sucesso");
  }

  function removerTransacao(id) {
    setTransacoes((listaAtual) =>
      listaAtual.filter((transacao) => transacao.id !== id)
    );

    notificar("Registro apagado.", "aviso");
  }

  /* =====================================================
     CARTÕES
  ===================================================== */

  function adicionarCartao(dados) {
    const novoCartao = {
      id: gerarId(),
      nome: dados.nome,
      limite: Number(dados.limite || 0),
      diaFechamento: Number(dados.diaFechamento || 1),
    };

    setCartoes((listaAtual) => [
      ...listaAtual,
      novoCartao,
    ]);
  }

  function atualizarCartoes(novaLista) {
    setCartoes(novaLista);
  }

  /* =====================================================
     RESERVA
  ===================================================== */

  function atualizarReserva(novosDados) {
    setReserva((reservaAtual) => ({
      ...reservaAtual,
      ...novosDados,
    }));
  }

  /* =====================================================
     MÊS DE REFERÊNCIA
  ===================================================== */

  function irParaMesAtual() {
    const dataAtual = new Date();

    setMesReferencia({
      mes: dataAtual.getMonth(),
      ano: dataAtual.getFullYear(),
    });
  }

  function mudarMesReferencia(delta) {
    setMesReferencia((referenciaAtual) => {
      let novoMes = referenciaAtual.mes + delta;
      let novoAno = referenciaAtual.ano;

      if (novoMes < 0) {
        novoMes = 11;
        novoAno -= 1;
      }

      if (novoMes > 11) {
        novoMes = 0;
        novoAno += 1;
      }

      return {
        mes: novoMes,
        ano: novoAno,
      };
    });
  }

  /* =====================================================
     LIMPAR TODOS OS DADOS
  ===================================================== */

  function limparTodosOsDados() {
    const confirmar = window.confirm(
      "Deseja realmente apagar todos os dados do aplicativo?"
    );

    if (!confirmar) {
      return;
    }

    localStorage.removeItem("financas_profile");
    localStorage.removeItem("financas_transacoes");
    localStorage.removeItem("financas_cartoes");
    localStorage.removeItem("financas_reserva");

    setProfile(perfilInicial);
    setTransacoes([]);
    setCartoes([]);
    setReserva(reservaInicial);
  }

  /* =====================================================
     DADOS COMPARTILHADOS ENTRE AS PÁGINAS
  ===================================================== */

  const contexto = useMemo(
    () => ({
      profile,
      atualizarProfile,
      notificar,

      transacoes,
      adicionarTransacao,
      atualizarTransacao,
      removerTransacao,

      cartoes,
      adicionarCartao,
      atualizarCartoes,

      reserva,
      setReserva: atualizarReserva,

      mesReferencia,
      mudarMesReferencia,
      irParaMesAtual,

      limparTodosOsDados,
    }),
    [
      profile,
      transacoes,
      cartoes,
      reserva,
      mesReferencia,
    ]
  );

  /* =====================================================
     ESCOLHA DA PÁGINA
  ===================================================== */

  function renderizarPagina() {
    switch (abaAtiva) {
      case "dashboard":
        return <DashboardPage />;
  
      case "financas":
        return <FinancasPage />;
  
      case "reserva":
        return <ReservaPage />;
  
      case "transacoes":
        return <TransacoesPage />;
  
      case "cartoes":
        return <CartoesPage />;
  
      case "historico":
        return <HistoricoPage />;
  
      case "perfil":
        return <PerfilPage />;

      case "backup":
        return <BackupPage />;
  
      case "configuracoes":
        return <ConfiguracoesPage />;
  
      case "sobre":
        return <SobrePage />;
  
      default:
        return <DashboardPage />;
    }
  }

  /* =====================================================
     INTERFACE
  ===================================================== */

  return (
    <FinanceContext.Provider value={contexto}>
      {notificacaoFlash ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 5000,
            width: "min(340px, calc(100vw - 24px))",
            padding: "11px 13px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.14)",
            background: "rgba(15,23,42,.96)",
            boxShadow: "0 16px 42px rgba(0,0,0,.34)",
            display: "grid",
            gap: 4,
          }}
        >
          <strong style={{ overflowWrap: "anywhere" }}>
            {notificacaoFlash.texto}
          </strong>
          <span style={{ fontSize: 11, opacity: 0.68 }}>
            {new Date(notificacaoFlash.dataHora).toLocaleDateString("pt-BR")} · {" "}
            {new Date(notificacaoFlash.dataHora).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ) : null}

      <div className="app-root">
        <div className="bolinhas-background">
          {Array.from({ length: 60 }).map((_, indice) => (
            <span
              key={indice}
              className="bolinha"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${4 + Math.random() * 6}s`,
                animationDelay: `${Math.random() * 8}s`,
                transform: `scale(${
                  0.5 + Math.random() * 1.2
                })`,
              }}
            />
          ))}
        </div>

        <div className="app-overlay">
          <header className="app-header">
            <h1 className="app-title">
              Finanças Offline
            </h1>
          </header>

          <main className="app-main">
            {renderizarPagina()}
          </main>

          <nav className="bottom-nav">
            <button
              type="button"
              className={`bottom-nav-item ${
                abaAtiva === "financas"
                  ? "bottom-nav-item-active"
                  : ""
              }`}
              onClick={() => setAbaAtiva("financas")}
            >
              <span className="bottom-nav-icon" aria-hidden="true">💰</span>
              <span className="bottom-nav-label">Finanças</span>
            </button>

            <button
              type="button"
              className={`bottom-nav-item ${
                abaAtiva === "reserva"
                  ? "bottom-nav-item-active"
                  : ""
              }`}
              onClick={() => setAbaAtiva("reserva")}
            >
              <span className="bottom-nav-icon" aria-hidden="true">💰</span>
              <span className="bottom-nav-label">Reserva</span>
            </button>

            <button
              type="button"
              className={`bottom-nav-item ${
                abaAtiva === "transacoes"
                  ? "bottom-nav-item-active"
                  : ""
              }`}
              onClick={() => setAbaAtiva("transacoes")}
            >
              <span className="bottom-nav-icon" aria-hidden="true">📥</span>
              <span className="bottom-nav-label">Transações</span>
            </button>

            <button
              type="button"
              className={`bottom-nav-item ${
                abaAtiva === "cartoes"
                  ? "bottom-nav-item-active"
                  : ""
              }`}
              onClick={() => setAbaAtiva("cartoes")}
            >
              <span className="bottom-nav-icon" aria-hidden="true">💳</span>
              <span className="bottom-nav-label">Cartões</span>
            </button>

            <button
              type="button"
              className={`bottom-nav-item ${
                abaAtiva === "historico"
                  ? "bottom-nav-item-active"
                  : ""
              }`}
              onClick={() => setAbaAtiva("historico")}
            >
              <span className="bottom-nav-icon" aria-hidden="true">📜</span>
              <span className="bottom-nav-label">Histórico</span>
            </button>

            <button
              type="button"
              className={`bottom-nav-item ${
                abaAtiva === "perfil"
                  ? "bottom-nav-item-active"
                  : ""
              }`}
              onClick={() => setAbaAtiva("perfil")}
            >
              <span className="bottom-nav-icon" aria-hidden="true">👤</span>
              <span className="bottom-nav-label">Perfil</span>
            </button>
          </nav>
        </div>
      </div>
    </FinanceContext.Provider>
  );
}
