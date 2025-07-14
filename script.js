// Verificar se Chart.js foi carregado
function
if (typeof Chart === "undefined") {
  console.error(
    "Chart.js não foi carregado. Verifique a conexão com a internet."
  );
}

// Configurações do Google Sheets
let config = {
  scriptUrl: "",
  sheetId: "",
};

// Dados globais
let categorias = [
  { id: "1", nome: "Moradia", tipo: "despesa" },
  { id: "2", nome: "Lazer", tipo: "despesa" },
  { id: "3", nome: "Transporte", tipo: "despesa" },
  { id: "4", nome: "Alimentação", tipo: "despesa" },
  { id: "5", nome: "Saúde", tipo: "despesa" },
  { id: "6", nome: "Outros", tipo: "despesa" },
  { id: "7", nome: "Salário", tipo: "receita" },
  { id: "8", nome: "Freelance", tipo: "receita" },
];

let itensOrcamento = [
  {
    id: "1",
    categoria: "Salário",
    valor: 5000,
    tipo: "receita",
    status: "realizado",
    descricao: "Salário mensal",
  },
  {
    id: "2",
    categoria: "Freelance",
    valor: 1500,
    tipo: "receita",
    status: "previsto",
    dataVencimento: "2025-01-15",
    descricao: "Projeto freelance",
  },
  {
    id: "3",
    categoria: "Moradia",
    valor: 1200,
    tipo: "despesa",
    status: "realizado",
    dataVencimento: "2025-01-10",
    descricao: "Aluguel",
  },
  {
    id: "4",
    categoria: "Alimentação",
    valor: 800,
    tipo: "despesa",
    status: "realizado",
    descricao: "Supermercado",
  },
  {
    id: "5",
    categoria: "Transporte",
    valor: 400,
    tipo: "despesa",
    status: "previsto",
    dataVencimento: "2025-01-12",
    descricao: "Combustível",
  },
  {
    id: "6",
    categoria: "Lazer",
    valor: 300,
    tipo: "despesa",
    status: "previsto",
    dataVencimento: "2025-01-20",
    descricao: "Cinema e restaurantes",
  },
  {
    id: "7",
    categoria: "Saúde",
    valor: 250,
    tipo: "despesa",
    status: "previsto",
    dataVencimento: "2025-01-11",
    descricao: "Plano de saúde",
  },
];

let graficoPizza = null;
let graficoBarras = null;
let contaEditando = null;
let contaParaExcluir = null;

// Funções de Google Sheets
function mostrarStatus(mensagem, tipo = "loading") {
  const statusElement = document.getElementById("sync-status");
  statusElement.style.display = "block";
  statusElement.className = `sync-status ${tipo}`;

  if (tipo === "loading") {
    statusElement.innerHTML = `<span class="loading-spinner"></span> ${mensagem}`;
  } else {
    statusElement.textContent = mensagem;
  }

  if (tipo !== "loading") {
    setTimeout(() => {
      statusElement.style.display = "none";
    }, 3000);
  }
}

function salvarConfiguracao() {
  const scriptUrl = document.getElementById("config-script-url").value.trim();
  const sheetId = document.getElementById("config-sheet-id").value.trim();

  if (scriptUrl && sheetId) {
    config.scriptUrl = scriptUrl;
    config.sheetId = sheetId;

    localStorage.setItem("orcamento-config", JSON.stringify(config));
    closeModal("modal-configuracao");
    mostrarStatus("Configuração salva com sucesso!", "success");
  } else {
    alert("Por favor, preencha todos os campos de configuração.");
  }
}

function carregarConfiguracao() {
  try {
    const configStorage = localStorage.getItem("orcamento-config");
    if (configStorage) {
      config = JSON.parse(configStorage);
      document.getElementById("config-script-url").value =
        config.scriptUrl || "";
      document.getElementById("config-sheet-id").value = config.sheetId || "";
    }
  } catch (e) {
    console.error("Erro ao carregar configuração:", e);
  }
}

async function testarConexao() {
  const scriptUrl = document.getElementById("config-script-url").value.trim();

  if (!scriptUrl) {
    alert("Por favor, configure a URL do Google Apps Script primeiro.");
    return;
  }

  mostrarStatus("Testando conexão...", "loading");

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "test",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        mostrarStatus("Conexão estabelecida com sucesso!", "success");
      } else {
        mostrarStatus("Erro na conexão: " + result.error, "error");
      }
    } else {
      mostrarStatus("Erro na conexão com o servidor", "error");
    }
  } catch (error) {
    console.error("Erro ao testar conexão:", error);
    mostrarStatus("Erro ao conectar com Google Sheets", "error");
  }
}

async function sincronizarDados() {
  if (!config.scriptUrl || !config.sheetId) {
    alert("Por favor, configure o Google Sheets primeiro.");
    openModal("modal-configuracao");
    return;
  }

  mostrarStatus("Sincronizando dados...", "loading");

  try {
    const dadosParaEnviar = {
      action: "sync",
      sheetId: config.sheetId,
      categorias: categorias,
      itens: itensOrcamento,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(config.scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosParaEnviar),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        mostrarStatus("Dados sincronizados com sucesso!", "success");

        // Se houver dados retornados do servidor, atualizar localmente
        if (result.data) {
          if (result.data.categorias) {
            categorias = result.data.categorias;
          }
          if (result.data.itens) {
            itensOrcamento = result.data.itens;
          }
          atualizarInterface();
          salvarDados();
        }
      } else {
        mostrarStatus("Erro na sincronização: " + result.error, "error");
      }
    } else {
      mostrarStatus("Erro na sincronização", "error");
    }
  } catch (error) {
    console.error("Erro ao sincronizar:", error);
    mostrarStatus("Erro ao sincronizar com Google Sheets", "error");
  }
}

// Funções utilitárias
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(dataString) {
  if (!dataString) return "";
  const data = new Date(dataString);
  return data.toLocaleDateString("pt-BR");
}

function diferencaEmDias(dataString) {
  if (!dataString) return 999;
  const data = new Date(dataString);
  const hoje = new Date();
  const diffTime = data.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Funções de navegação
function showTab(tabName) {
  // Esconder todas as abas
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Remover classe active de todos os botões
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Mostrar aba selecionada
  const tabElement = document.getElementById(tabName);
  if (tabElement) {
    tabElement.classList.add("active");
  }

  // Adicionar classe active ao botão clicado
  event.target.classList.add("active");

  // Atualizar gráficos se for a aba extrato
  if (tabName === "extrato") {
    setTimeout(() => {
      atualizarGraficos();
    }, 100);
  }
}

// Funções de modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    if (modalId === "modal-conta") {
      atualizarSelectCategorias();
    } else if (modalId === "modal-configuracao") {
      carregarConfiguracao();
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    // Limpar campos
    if (modalId === "modal-categoria") {
      document.getElementById("categoria-nome").value = "";
      document.getElementById("categoria-tipo").value = "despesa";
    } else if (modalId === "modal-conta") {
      limparFormularioConta();
    }
  }
}

function limparFormularioConta() {
  document.getElementById("conta-categoria").value = "";
  document.getElementById("conta-valor").value = "";
  document.getElementById("conta-tipo").value = "despesa";
  document.getElementById("conta-descricao").value = "";
  document.getElementById("conta-vencimento").value = "";
  contaEditando = null;

  // Resetar título e botão
  document.getElementById("modal-conta-titulo").textContent =
    "➕ Adicionar Nova Conta";
  document.getElementById("btn-salvar-conta").textContent = "Adicionar";
}

// Funções de dados
async function adicionarCategoria() {
  const nome = document.getElementById("categoria-nome").value.trim();
  const tipo = document.getElementById("categoria-tipo").value;

  if (nome) {
    const nova = {
      id: Date.now().toString(),
      nome: nome,
      tipo: tipo,
    };
    categorias.push(nova);
    closeModal("modal-categoria");
    atualizarInterface();
    salvarDados();

    // Sincronizar automaticamente se configurado
    if (config.scriptUrl && config.sheetId) {
      await sincronizarDados();
    }
  } else {
    alert("Por favor, digite o nome da categoria.");
  }
}

async function salvarConta() {
  const categoria = document.getElementById("conta-categoria").value;
  const valor = parseFloat(document.getElementById("conta-valor").value);
  const tipo = document.getElementById("conta-tipo").value;
  const descricao = document.getElementById("conta-descricao").value;
  const vencimento = document.getElementById("conta-vencimento").value;

  if (categoria && valor > 0) {
    if (contaEditando) {
      // Editando conta existente
      const index = itensOrcamento.findIndex(
        (item) => item.id === contaEditando
      );
      if (index !== -1) {
        itensOrcamento[index] = {
          ...itensOrcamento[index],
          categoria: categoria,
          valor: valor,
          tipo: tipo,
          descricao: descricao,
          dataVencimento: vencimento,
        };
      }
    } else {
      // Adicionando nova conta
      const nova = {
        id: Date.now().toString(),
        categoria: categoria,
        valor: valor,
        tipo: tipo,
        status: "previsto",
        dataVencimento: vencimento,
        descricao: descricao,
      };
      itensOrcamento.push(nova);
    }

    closeModal("modal-conta");
    atualizarInterface();
    salvarDados();

    // Sincronizar automaticamente se configurado
    if (config.scriptUrl && config.sheetId) {
      await sincronizarDados();
    }
  } else {
    alert("Por favor, preencha a categoria e o valor.");
  }
}

function editarConta(id) {
  const conta = itensOrcamento.find((item) => item.id === id);
  if (conta) {
    contaEditando = id;

    // Preencher formulário
    document.getElementById("conta-categoria").value = conta.categoria;
    document.getElementById("conta-valor").value = conta.valor;
    document.getElementById("conta-tipo").value = conta.tipo;
    document.getElementById("conta-descricao").value = conta.descricao || "";
    document.getElementById("conta-vencimento").value =
      conta.dataVencimento || "";

    // Alterar título e botão
    document.getElementById("modal-conta-titulo").textContent =
      "✏️ Editar Conta";
    document.getElementById("btn-salvar-conta").textContent = "Salvar";

    openModal("modal-conta");
  }
}

function confirmarExclusao(id) {
  const conta = itensOrcamento.find((item) => item.id === id);
  if (conta) {
    contaParaExcluir = id;
    document.getElementById("conta-para-excluir").textContent = `${
      conta.categoria
    } - ${formatarMoeda(conta.valor)}`;

    document.getElementById("btn-confirmar-exclusao").onclick = () =>
      excluirConta(id);
    openModal("modal-confirmar-exclusao");
  }
}

async function excluirConta(id) {
  itensOrcamento = itensOrcamento.filter((item) => item.id !== id);
  closeModal("modal-confirmar-exclusao");
  atualizarInterface();
  salvarDados();

  // Sincronizar automaticamente se configurado
  if (config.scriptUrl && config.sheetId) {
    await sincronizarDados();
  }
}

async function toggleStatusConta(id) {
  const index = itensOrcamento.findIndex((item) => item.id === id);
  if (index !== -1) {
    itensOrcamento[index].status =
      itensOrcamento[index].status === "realizado" ? "previsto" : "realizado";
    atualizarInterface();
    salvarDados();

    // Sincronizar automaticamente se configurado
    if (config.scriptUrl && config.sheetId) {
      await sincronizarDados();
    }
  }
}

function atualizarSelectCategorias() {
  const select = document.getElementById("conta-categoria");
  if (select) {
    select.innerHTML = '<option value="">Selecione uma categoria</option>';

    categorias.forEach((categoria) => {
      const option = document.createElement("option");
      option.value = categoria.nome;
      option.textContent = `${categoria.nome} (${categoria.tipo})`;
      select.appendChild(option);
    });
  }
}

// Funções de cálculo
function calcularResumo() {
  const receitasRealizadas = itensOrcamento
    .filter((item) => item.tipo === "receita" && item.status === "realizado")
    .reduce((total, item) => total + item.valor, 0);

  const receitasPrevistas = itensOrcamento
    .filter((item) => item.tipo === "receita" && item.status === "previsto")
    .reduce((total, item) => total + item.valor, 0);

  const despesasRealizadas = itensOrcamento
    .filter((item) => item.tipo === "despesa" && item.status === "realizado")
    .reduce((total, item) => total + item.valor, 0);

  const despesasPrevistas = itensOrcamento
    .filter((item) => item.tipo === "despesa" && item.status === "previsto")
    .reduce((total, item) => total + item.valor, 0);

  const totalReceitas = receitasRealizadas + receitasPrevistas;
  const totalDespesas = despesasRealizadas + despesasPrevistas;
  const saldoAtual = receitasRealizadas - despesasRealizadas;
  const saldoPrevisto = totalReceitas - totalDespesas;

  return {
    receitasRealizadas,
    receitasPrevistas,
    despesasRealizadas,
    despesasPrevistas,
    totalReceitas,
    totalDespesas,
    saldoAtual,
    saldoPrevisto,
  };
}

function obterAlertasVencimento() {
  return itensOrcamento.filter((item) => {
    if (!item.dataVencimento || item.status === "realizado") return false;
    const diasParaVencimento = diferencaEmDias(item.dataVencimento);
    return diasParaVencimento <= 1 && diasParaVencimento >= 0;
  });
}

// Funções de interface
function atualizarResumo() {
  const resumo = calcularResumo();

  const elementos = {
    "total-receitas": formatarMoeda(resumo.totalReceitas),
    "receitas-realizadas": `Realizado: ${formatarMoeda(
      resumo.receitasRealizadas
    )}`,
    "total-despesas": formatarMoeda(resumo.totalDespesas),
    "despesas-realizadas": `Realizado: ${formatarMoeda(
      resumo.despesasRealizadas
    )}`,
    "saldo-previsto": `Previsto: ${formatarMoeda(resumo.saldoPrevisto)}`,
    "receitas-previsto": formatarMoeda(resumo.totalReceitas),
    "receitas-realizado": formatarMoeda(resumo.receitasRealizadas),
    "despesas-previsto": formatarMoeda(resumo.totalDespesas),
    "despesas-realizado": formatarMoeda(resumo.despesasRealizadas),
  };

  Object.entries(elementos).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    }
  });

  // Saldo atual com cor
  const saldoElement = document.getElementById("saldo-atual");
  if (saldoElement) {
    saldoElement.textContent = formatarMoeda(resumo.saldoAtual);
    saldoElement.className = `text-xl md:text-2xl font-bold mb-1 ${
      resumo.saldoAtual >= 0 ? "text-green-600" : "text-red-600"
    }`;
  }

  // Diferenças com cores
  const receitasDiff = resumo.receitasRealizadas - resumo.totalReceitas;
  const receitasDiffElement = document.getElementById("receitas-diferenca");
  if (receitasDiffElement) {
    receitasDiffElement.textContent = formatarMoeda(receitasDiff);
    receitasDiffElement.className = `font-bold ${
      receitasDiff >= 0 ? "text-green-600" : "text-red-600"
    }`;
  }

  const despesasDiff = resumo.despesasRealizadas - resumo.totalDespesas;
  const despesasDiffElement = document.getElementById("despesas-diferenca");
  if (despesasDiffElement) {
    despesasDiffElement.textContent = formatarMoeda(despesasDiff);
    despesasDiffElement.className = `font-bold ${
      despesasDiff <= 0 ? "text-green-600" : "text-red-600"
    }`;
  }
}

function atualizarCategorias() {
  const receitasContainer = document.getElementById("categorias-receitas");
  const despesasContainer = document.getElementById("categorias-despesas");

  if (receitasContainer) receitasContainer.innerHTML = "";
  if (despesasContainer) despesasContainer.innerHTML = "";

  categorias.forEach((categoria) => {
    const badge = document.createElement("span");
    badge.className =
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-gray-300 text-gray-900 bg-white";
    badge.textContent = categoria.nome;

    if (categoria.tipo === "receita" && receitasContainer) {
      receitasContainer.appendChild(badge);
    } else if (categoria.tipo === "despesa" && despesasContainer) {
      despesasContainer.appendChild(badge);
    }
  });
}

function atualizarAlertas() {
  const alertas = obterAlertasVencimento();
  const container = document.getElementById("alertas-container");
  const lista = document.getElementById("alertas-lista");

  if (container && lista) {
    if (alertas.length > 0) {
      container.classList.remove("hidden");
      lista.innerHTML = "";

      alertas.forEach((item) => {
        const div = document.createElement("div");
        div.className = "flex justify-between items-center";
        div.innerHTML = `
                            <span>${item.descricao || item.categoria}</span>
                            <span class="font-medium">${formatarData(
                              item.dataVencimento
                            )} - ${formatarMoeda(item.valor)}</span>
                        `;
        lista.appendChild(div);
      });
    } else {
      container.classList.add("hidden");
    }
  }
}

function atualizarTransacoes() {
  const container = document.getElementById("lista-transacoes");
  if (!container) return;

  container.innerHTML = "";

  itensOrcamento.forEach((item) => {
    const div = document.createElement("div");
    div.className = `flex items-center justify-between p-3 border rounded-lg ${
      item.status === "realizado" ? "item-pago" : ""
    }`;

    const statusIcon = item.status === "realizado" ? "✅" : "🎯";
    const valorColor =
      item.tipo === "receita" ? "text-green-600" : "text-red-600";
    const sinal = item.tipo === "receita" ? "+" : "-";

    let vencimentoInfo = "";
    if (item.dataVencimento) {
      vencimentoInfo = `<p class="text-xs text-gray-500 flex items-center gap-1">
                        <span>🕐</span>
                        Vence em: ${formatarData(item.dataVencimento)}
                    </p>`;
    }

    div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="checkbox-container" onclick="toggleStatusConta('${
                          item.id
                        }')">
                            <div class="checkbox-custom ${
                              item.status === "realizado" ? "checked" : ""
                            }">
                                ${item.status === "realizado" ? "✓" : ""}
                            </div>
                        </div>
                        <span class="text-lg">${statusIcon}</span>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-medium ${
                                  item.status === "realizado"
                                    ? "item-titulo"
                                    : ""
                                }">${item.categoria}</span>
                                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  item.status === "realizado"
                                    ? "border-transparent bg-green-600 text-white"
                                    : "border-transparent bg-gray-100 text-gray-900"
                                }">
                                    ${
                                      item.status === "realizado"
                                        ? "pago"
                                        : "pendente"
                                    }
                                </span>
                            </div>
                            ${
                              item.descricao
                                ? `<p class="text-sm text-gray-600 ${
                                    item.status === "realizado"
                                      ? "item-titulo"
                                      : ""
                                  }">${item.descricao}</p>`
                                : ""
                            }
                            ${vencimentoInfo}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold ${valorColor}">
                            ${sinal}${formatarMoeda(item.valor)}
                        </span>
                        <div class="action-buttons">
                            <button class="btn-small btn-edit" onclick="editarConta('${
                              item.id
                            }')" title="Editar">
                                ✏️
                            </button>
                            <button class="btn-small btn-delete" onclick="confirmarExclusao('${
                              item.id
                            }')" title="Excluir">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;

    container.appendChild(div);
  });
}

function atualizarContas() {
  const container = document.getElementById("lista-contas");
  if (!container) return;

  container.innerHTML = "";

  const contasComVencimento = itensOrcamento
    .filter((item) => item.dataVencimento)
    .sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));

  contasComVencimento.forEach((item) => {
    const diasParaVencimento = diferencaEmDias(item.dataVencimento);
    const isVencimentoProximo =
      diasParaVencimento <= 1 && diasParaVencimento >= 0;

    const div = document.createElement("div");
    div.className = `flex items-center justify-between p-3 border rounded-lg ${
      isVencimentoProximo ? "border-orange-300 bg-orange-50" : ""
    } ${item.status === "realizado" ? "item-pago" : ""}`;

    const statusIcon = item.status === "realizado" ? "✅" : "🕐";
    const valorColor =
      item.tipo === "receita" ? "text-green-600" : "text-red-600";
    const sinal = item.tipo === "receita" ? "+" : "-";

    let alertaVencimento = "";
    if (isVencimentoProximo && item.status !== "realizado") {
      const textoVencimento = diasParaVencimento === 0 ? "hoje" : "amanhã";
      alertaVencimento = `<span class="inline-flex items-center rounded-full border-transparent bg-red-600 text-white px-2.5 py-0.5 text-xs font-semibold">
                        Vence ${textoVencimento}
                    </span>`;
    }

    div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="checkbox-container" onclick="toggleStatusConta('${
                          item.id
                        }')">
                            <div class="checkbox-custom ${
                              item.status === "realizado" ? "checked" : ""
                            }">
                                ${item.status === "realizado" ? "✓" : ""}
                            </div>
                        </div>
                        ${
                          isVencimentoProximo && item.status !== "realizado"
                            ? '<span class="text-orange-600 text-lg">⚠️</span>'
                            : ""
                        }
                        <span class="text-lg">${statusIcon}</span>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-medium ${
                                  item.status === "realizado"
                                    ? "item-titulo"
                                    : ""
                                }">${item.categoria}</span>
                                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  item.status === "realizado"
                                    ? "border-transparent bg-green-600 text-white"
                                    : "border-transparent bg-gray-100 text-gray-900"
                                }">
                                    ${
                                      item.status === "realizado"
                                        ? "pago"
                                        : "pendente"
                                    }
                                </span>
                                ${alertaVencimento}
                            </div>
                            ${
                              item.descricao
                                ? `<p class="text-sm text-gray-600 ${
                                    item.status === "realizado"
                                      ? "item-titulo"
                                      : ""
                                  }">${item.descricao}</p>`
                                : ""
                            }
                            <p class="text-xs text-gray-500 flex items-center gap-1">
                                <span>📅</span>
                                ${formatarData(item.dataVencimento)}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold ${valorColor}">
                            ${sinal}${formatarMoeda(item.valor)}
                        </span>
                        <div class="action-buttons">
                            <button class="btn-small btn-edit" onclick="editarConta('${
                              item.id
                            }')" title="Editar">
                                ✏️
                            </button>
                            <button class="btn-small btn-delete" onclick="confirmarExclusao('${
                              item.id
                            }')" title="Excluir">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;

    container.appendChild(div);
  });
}

function atualizarGraficos() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js não está disponível");
    return;
  }

  // Dados para gráfico de pizza
  const dadosPizza = {};
  itensOrcamento
    .filter((item) => item.tipo === "despesa")
    .forEach((item) => {
      if (dadosPizza[item.categoria]) {
        dadosPizza[item.categoria] += item.valor;
      } else {
        dadosPizza[item.categoria] = item.valor;
      }
    });

  const labelsPizza = Object.keys(dadosPizza);
  const valuesPizza = Object.values(dadosPizza);
  const coresPizza = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#FF6384",
    "#C9CBCF",
  ];

  // Destruir gráfico anterior se existir
  if (graficoPizza) {
    graficoPizza.destroy();
  }

  // Criar gráfico de pizza
  const ctxPizza = document.getElementById("grafico-pizza");
  if (ctxPizza) {
    graficoPizza = new Chart(ctxPizza, {
      type: "pie",
      data: {
        labels: labelsPizza,
        datasets: [
          {
            data: valuesPizza,
            backgroundColor: coresPizza.slice(0, labelsPizza.length),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.raw / total) * 100).toFixed(1);
                return (
                  context.label +
                  ": " +
                  formatarMoeda(context.raw) +
                  " (" +
                  percentage +
                  "%)"
                );
              },
            },
          },
        },
      },
    });
  }

  // Dados para gráfico de barras
  const dadosBarras = {};
  categorias.forEach((categoria) => {
    const previsto = itensOrcamento
      .filter(
        (item) =>
          item.categoria === categoria.nome && item.status === "previsto"
      )
      .reduce((sum, item) => sum + item.valor, 0);

    const realizado = itensOrcamento
      .filter(
        (item) =>
          item.categoria === categoria.nome && item.status === "realizado"
      )
      .reduce((sum, item) => sum + item.valor, 0);

    if (previsto > 0 || realizado > 0) {
      dadosBarras[categoria.nome] = { previsto, realizado };
    }
  });

  const labelsBarras = Object.keys(dadosBarras);
  const previstoData = labelsBarras.map((label) => dadosBarras[label].previsto);
  const realizadoData = labelsBarras.map(
    (label) => dadosBarras[label].realizado
  );

  // Destruir gráfico anterior se existir
  if (graficoBarras) {
    graficoBarras.destroy();
  }

  // Criar gráfico de barras
  const ctxBarras = document.getElementById("grafico-barras");
  if (ctxBarras) {
    graficoBarras = new Chart(ctxBarras, {
      type: "bar",
      data: {
        labels: labelsBarras,
        datasets: [
          {
            label: "Previsto",
            data: previstoData,
            backgroundColor: "#8884d8",
            borderColor: "#8884d8",
            borderWidth: 1,
          },
          {
            label: "Realizado",
            data: realizadoData,
            backgroundColor: "#82ca9d",
            borderColor: "#82ca9d",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "R$ " + value.toLocaleString("pt-BR");
              },
            },
          },
        },
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return (
                  context.dataset.label + ": " + formatarMoeda(context.raw)
                );
              },
            },
          },
        },
      },
    });
  }
}

// Funções de persistência
function salvarDados() {
  try {
    localStorage.setItem("orcamento-categorias", JSON.stringify(categorias));
    localStorage.setItem("orcamento-itens", JSON.stringify(itensOrcamento));
  } catch (e) {
    console.error("Erro ao salvar dados:", e);
  }
}

function carregarDados() {
  try {
    const categoriasStorage = localStorage.getItem("orcamento-categorias");
    const itensStorage = localStorage.getItem("orcamento-itens");

    if (categoriasStorage) {
      categorias = JSON.parse(categoriasStorage);
    }

    if (itensStorage) {
      itensOrcamento = JSON.parse(itensStorage);
    }
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
  }
}

function atualizarInterface() {
  atualizarResumo();
  atualizarCategorias();
  atualizarAlertas();
  atualizarTransacoes();
  atualizarContas();
}

// Fechar modal ao clicar fora
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal")) {
    const modalId = event.target.id;
    closeModal(modalId);
  }
});

// Inicializar aplicação
document.addEventListener("DOMContentLoaded", function () {
  console.log("Aplicação iniciada");
  carregarDados();
  carregarConfiguracao();
  atualizarInterface();

  // Verificar se Chart.js foi carregado
  if (typeof Chart !== "undefined") {
    console.log("Chart.js carregado com sucesso");
  } else {
    console.error("Chart.js não foi carregado");
  }
});

// Atualizar alertas a cada minuto
setInterval(atualizarAlertas, 60000);
