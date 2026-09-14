import React, { useState } from "react";

import {
  baixarBackup,
  lerArquivoBackup,
  restaurarBackup,
} from "../../services/backupService.js";

import "./BackupPage.css";

export default function BackupPage() {
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [restaurando, setRestaurando] = useState(false);

  function exportarDados() {
    try {
      setErro("");
      const backup = baixarBackup();
      setMensagem(
        `Backup criado com sucesso (${backup.totalDeChaves || Object.keys(backup.dados || {}).length} grupo(s) de dados).`
      );
    } catch (error) {
      console.error(error);
      setMensagem("");
      setErro(error?.message || "Não foi possível criar o backup.");
    }
  }

  async function importarDados(evento) {
    const arquivo = evento.currentTarget.files?.[0];
    if (!arquivo) return;

    try {
      setRestaurando(true);
      setErro("");
      setMensagem("");

      const backup = await lerArquivoBackup(arquivo);
      const total = Object.keys(backup.dados || {}).length;
      const confirmar = window.confirm(
        `Restaurar ${total} grupo(s) de dados de “${arquivo.name}”? Os dados restaurados substituirão os dados dessas mesmas partes neste dispositivo.`
      );

      if (!confirmar) return;

      const quantidade = restaurarBackup(backup);
      setMensagem(
        `Backup restaurado com sucesso (${quantidade} grupo(s)). O aplicativo será recarregado.`
      );

      window.setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      console.error(error);
      setErro(error?.message || "Não foi possível abrir este arquivo de backup.");
    } finally {
      evento.currentTarget.value = "";
      setRestaurando(false);
    }
  }

  return (
    <div className="page backup-page">
      <div>
        <h2 className="page-title">Backup e restauração</h2>
        <p className="backup-subtitulo">
          Salve seus dados em um arquivo e restaure-os em outro dispositivo ou depois de uma atualização.
        </p>
      </div>

      {mensagem ? <div className="backup-mensagem backup-sucesso">{mensagem}</div> : null}
      {erro ? <div className="backup-mensagem backup-erro">{erro}</div> : null}

      <section className="backup-card">
        <h3>⬇️ Exportar dados</h3>
        <p>Cria um arquivo JSON com os dados do seu aplicativo neste dispositivo.</p>
        <button type="button" className="backup-botao" onClick={exportarDados}>
          Baixar backup
        </button>
      </section>

      <section className="backup-card">
        <h3>⬆️ Importar dados</h3>
        <p>Escolha um arquivo JSON criado pelo Finanças Offline para recuperar seus dados.</p>

        {/* O label abre o seletor de arquivos diretamente, sem depender de input.click(). */}
        <input
          id="arquivo-de-backup"
          className="backup-arquivo"
          type="file"
          accept="application/json,.json"
          onChange={importarDados}
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clipPath: "inset(50%)",
          }}
        />

        <label
          htmlFor="arquivo-de-backup"
          className="backup-botao-secundario"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: restaurando ? "wait" : "pointer" }}
          aria-disabled={restaurando}
        >
          {restaurando ? "Abrindo backup..." : "Escolher arquivo de backup"}
        </label>
      </section>

      <section className="backup-card backup-aviso">
        <h3>Antes de atualizar</h3>
        <p>
          Baixe um backup antes de atualizar o aplicativo. Depois, abra esta página novamente e escolha o arquivo para restaurar.
        </p>
      </section>
    </div>
  );
}
