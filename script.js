/* ============================================
   APP BARBEARIA - JavaScript
   ============================================ */

// Seleciona os elementos do formulário
const form = document.getElementById("formAgendamento");
const mensagem = document.getElementById("mensagem");
const lista = document.getElementById("listaAgendamentos");
const listaVazia = document.getElementById("listaVazia");
const btnLimpar = document.getElementById("btnLimpar");

/* --------------------------------------------
   0. CONFIGURAÇÃO: número do WhatsApp da barbearia
   -------------------------------------------- */
// Coloque aqui o número da barbearia com código do país, só dígitos.
// Número da barbearia do cliente (extraído da logo):
// vira 5585984460434 (55 = Brasil)
const WHATSAPP_BARBEARIA = "5585984460434";

/* --------------------------------------------
   1. INDICADOR ABERTO/FECHADO
   -------------------------------------------- */
// Horário de funcionamento da barbearia.
// 0 = domingo, 1 = segunda, ..., 6 = sábado
const HORARIO_FUNCIONAMENTO = {
  0: { abre: "09:00", fecha: "14:00" }, // domingo
  1: { abre: "09:00", fecha: "19:00" }, // segunda
  2: { abre: "09:00", fecha: "19:00" }, // terça
  3: { abre: "09:00", fecha: "19:00" }, // quarta
  4: { abre: "09:00", fecha: "19:00" }, // quinta
  5: { abre: "09:00", fecha: "19:00" }, // sexta
  6: { abre: "09:00", fecha: "19:00" }, // sábado
};

function atualizarStatusLoja() {
  const statusEl = document.getElementById("statusLoja");
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 a 6
  const horario = HORARIO_FUNCIONAMENTO[diaSemana];

  if (!horario) {
    statusEl.textContent = "Fechado hoje";
    statusEl.className = "status-loja fechado";
    return;
  }

  // Converte "09:00" para minutos desde meia-noite e compara
  const [hAbre, mAbre] = horario.abre.split(":").map(Number);
  const [hFecha, mFecha] = horario.fecha.split(":").map(Number);
  const minutosAbre = hAbre * 60 + mAbre;
  const minutosFecha = hFecha * 60 + mFecha;
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  if (minutosAgora >= minutosAbre && minutosAgora < minutosFecha) {
    statusEl.textContent = `Aberto agora - fecha às ${horario.fecha}`;
    statusEl.className = "status-loja aberto";
  } else if (minutosAgora < minutosAbre) {
    statusEl.textContent = `Fechado agora - abre às ${horario.abre}`;
    statusEl.className = "status-loja fechado";
  } else {
    statusEl.textContent = "Fechado agora - até amanhã";
    statusEl.className = "status-loja fechado";
  }
}

/* --------------------------------------------
   2. LÊ OS AGENDAMENTOS SALVOS (localStorage)
   -------------------------------------------- */
function obterAgendamentos() {
  const dados = localStorage.getItem("agendamentos");
  return dados ? JSON.parse(dados) : [];
}

/* --------------------------------------------
   2. SALVA OS AGENDAMENTOS (localStorage)
   -------------------------------------------- */
function salvarAgendamentos(agendamentos) {
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
}

/* --------------------------------------------
   3. EXIBE A LISTA DE AGENDAMENTOS NA TELA
   -------------------------------------------- */
function exibirAgendamentos() {
  const agendamentos = obterAgendamentos();

  // Limpa a lista atual
  lista.innerHTML = "";

  if (agendamentos.length === 0) {
    listaVazia.style.display = "block";
  } else {
    listaVazia.style.display = "none";

    agendamentos.forEach((item, indice) => {
      // Cria o elemento <li>
      const li = document.createElement("li");

      // Monta o texto com nome, serviço, data e hora
      const info = document.createElement("span");
      info.className = "info";
      info.textContent = `${item.nome} - ${item.servico} em ${formatarData(
        item.data
      )} às ${item.hora}`;

      // Botão de cancelar
      const btnCancelar = document.createElement("button");
      btnCancelar.className = "btn-cancelar";
      btnCancelar.textContent = "Cancelar";
      btnCancelar.onclick = function () {
        cancelarAgendamento(indice);
      };

      // Botão de enviar pelo WhatsApp
      const btnWhats = document.createElement("button");
      btnWhats.className = "btn-whatsapp-item";
      btnWhats.textContent = "WhatsApp";
      btnWhats.onclick = function () {
        abrirWhatsapp(item);
      };

      li.appendChild(info);
      li.appendChild(btnWhats);
      li.appendChild(btnCancelar);
      lista.appendChild(li);
    });
  }
}

/* --------------------------------------------
   3B. FUNÇÕES DO WHATSAPP
   -------------------------------------------- */
let ultimoAgendamento = null;

function montarMensagemWhatsapp(agendamento) {
  // Cria o texto da mensagem em várias linhas
  const linhas = [
    "Olá! Quero confirmar meu agendamento.",
    `*Cliente:* ${agendamento.nome}`,
    `*Telefone:* ${agendamento.telefone}`,
    `*Serviço:* ${agendamento.servico}`,
    `*Data:* ${formatarData(agendamento.data)}`,
    `*Horário:* ${agendamento.hora}`,
    `*Valor:* R$ ${agendamento.preco.toFixed(2).replace(".", ",")}`,
  ];
  // %0A é o código de quebra de linha em URLs
  return linhas.join("%0A");
}

function abrirWhatsapp(agendamento) {
  const texto = montarMensagemWhatsapp(agendamento);
  const url = `https://wa.me/${WHATSAPP_BARBEARIA}?text=${texto}`;
  window.open(url, "_blank");
}

function mostrarBotaoWhatsapp(agendamento) {
  const btnWhatsapp = document.getElementById("btnWhatsapp");
  btnWhatsapp.href = `https://wa.me/${WHATSAPP_BARBEARIA}?text=${montarMensagemWhatsapp(agendamento)}`;
  btnWhatsapp.style.display = "inline-flex";
}

/* --------------------------------------------
   4. FORMATAR DATA PARA O PADRÃO BRASILEIRO
   -------------------------------------------- */
function formatarData(dataIso) {
  const partes = dataIso.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* --------------------------------------------
   5. VALIDA OS CAMPOS DO FORMULÁRIO
   -------------------------------------------- */
function validarFormulario(nome, telefone, servico, data, hora) {
  let valido = true;

  // Limpa as mensagens de erro
  limparErros();

  if (nome.trim() === "") {
    mostrarErro("erroNome", "Digite seu nome.");
    valido = false;
  }

  if (telefone.trim().length < 8) {
    mostrarErro("erroTelefone", "Digite um telefone válido.");
    valido = false;
  }

  if (servico === "") {
    mostrarErro("erroServico", "Selecione um serviço.");
    valido = false;
  }

  if (data === "") {
    mostrarErro("erroData", "Escolha uma data.");
    valido = false;
  }

  if (hora === "") {
    mostrarErro("erroHora", "Escolha um horário.");
    valido = false;
  }

  return valido;
}

function mostrarErro(id, texto) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = texto;
    // Adiciona borda vermelha no campo correspondente
    const input = elemento.previousElementSibling;
    if (input) input.classList.add("erro");
  }
}

function limparErros() {
  document.querySelectorAll(".erro").forEach((el) => (el.textContent = ""));
  document.querySelectorAll("input, select").forEach((el) =>
    el.classList.remove("erro")
  );
}

/* --------------------------------------------
   6. OBTER NOME E PREÇO DO SERVIÇO
   -------------------------------------------- */
function obterServicoSelecionado() {
  const select = document.getElementById("servico");
  const option = select.options[select.selectedIndex];
  return {
    nome: option.text.split(" - ")[0],
    preco: parseFloat(option.dataset.preco),
  };
}

/* --------------------------------------------
   7. ENVIAR O FORMULÁRIO
   -------------------------------------------- */
form.addEventListener("submit", function (evento) {
  // Impede que a página recarregue ao enviar o formulário
  evento.preventDefault();

  // Captura os valores digitados
  const nome = document.getElementById("nome").value;
  const telefone = document.getElementById("telefone").value;
  const servico = document.getElementById("servico").value;
  const data = document.getElementById("data").value;
  const hora = document.getElementById("hora").value;

  // Valida os campos
  if (!validarFormulario(nome, telefone, servico, data, hora)) {
    mostrarMensagem("Preencha todos os campos corretamente.", "erro");
    return;
  }

  const servicoDados = obterServicoSelecionado();

  // Cria o objeto do agendamento
  const agendamento = {
    nome: nome,
    telefone: telefone,
    servico: servicoDados.nome,
    preco: servicoDados.preco,
    data: data,
    hora: hora,
  };

  // Salva e exibe
  const agendamentos = obterAgendamentos();
  agendamentos.push(agendamento);
  salvarAgendamentos(agendamentos);
  exibirAgendamentos();

  // Salva o agendamento atual (para o botão do WhatsApp usar)
  ultimoAgendamento = agendamento;

  // Mostra o botão de enviar pelo WhatsApp
  mostrarBotaoWhatsapp(agendamento);

  // Limpa o formulário e mostra mensagem de sucesso
  form.reset();
  mostrarMensagem(
    `Agendamento confirmado! ${servicoDados.nome} em ${formatarData(data)} às ${hora}. Total: R$ ${servicoDados.preco.toFixed(2).replace(".", ",")}`,
    "sucesso"
  );
});

/* --------------------------------------------
   8. CANCELAR UM AGENDAMENTO
   -------------------------------------------- */
function cancelarAgendamento(indice) {
  const agendamentos = obterAgendamentos();
  agendamentos.splice(indice, 1); // remove 1 item na posição do índice
  salvarAgendamentos(agendamentos);
  exibirAgendamentos();
  mostrarMensagem("Agendamento cancelado.", "erro");
}

/* --------------------------------------------
   9. LIMPAR TODOS OS AGENDAMENTOS
   -------------------------------------------- */
btnLimpar.addEventListener("click", function () {
  salvarAgendamentos([]);
  exibirAgendamentos();
  mostrarMensagem("Todos os agendamentos foram apagados.", "erro");
});

/* --------------------------------------------
   10. MOSTRAR MENSAGEM DE FEEDBACK
   -------------------------------------------- */
function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

/* --------------------------------------------
   11. INICIALIZAÇÃO
   -------------------------------------------- */
// Define a data mínima do campo "data" para hoje
document.getElementById("data").min = new Date().toISOString().split("T")[0];

// Mostra se a barbearia está aberta ou fechada
atualizarStatusLoja();

// Exibe os agendamentos salvos ao abrir a página
exibirAgendamentos();

/* --------------------------------------------
   12. GALERIA DINÂMICA: ADICIONAR FOTOS
   -------------------------------------------- */
// Fotos adicionadas pelo admin ficam salvas no navegador
// junto com os agendamentos (usando base64 da imagem)
const CHAVE_FOTOS = "fotosGaleria";

function obterFotosDinamicas() {
  const dados = localStorage.getItem(CHAVE_FOTOS);
  return dados ? JSON.parse(dados) : [];
}

function salvarFotosDinamicas(fotos) {
  try {
    localStorage.setItem(CHAVE_FOTOS, JSON.stringify(fotos));
  } catch (e) {
    alert("A imagem é muito grande para salvar. Tente uma foto menor.");
  }
}

function exibirFotosDinamicas() {
  const container = document.getElementById("gradeFotosDinamicas");
  const fotos = obterFotosDinamicas();
  container.innerHTML = "";

  fotos.forEach(function (foto, indice) {
    const figure = document.createElement("figure");
    figure.className = "foto foto-dinamica";

    const img = document.createElement("img");
    img.src = foto.src; // a imagem em base64 salva no localStorage
    img.alt = foto.legenda;

    const caption = document.createElement("figcaption");
    caption.textContent = foto.legenda;

    const btnRemover = document.createElement("button");
    btnRemover.className = "btn-remover-foto";
    btnRemover.textContent = "✕";
    btnRemover.title = "Remover foto";
    btnRemover.onclick = function () {
      removerFoto(indice);
    };

    figure.appendChild(btnRemover);
    figure.appendChild(img);
    figure.appendChild(caption);
    container.appendChild(figure);
  });
}

function removerFoto(indice) {
  const fotos = obterFotosDinamicas();
  fotos.splice(indice, 1);
  salvarFotosDinamicas(fotos);
  exibirFotosDinamicas();
}

// Carrega as fotos adicionadas pelo admin ao abrir a página
exibirFotosDinamicas();

// Captura o envio do formulário de nova foto
const formFoto = document.getElementById("formFoto");
const inputArquivo = document.getElementById("fotoArquivo");
const inputLegenda = document.getElementById("fotoLegenda");
const erroFoto = document.getElementById("erroFoto");
const erroFotoLegenda = document.getElementById("erroFotoLegenda");

formFoto.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const arquivo = inputArquivo.files[0];
  const legenda = inputLegenda.value.trim();

  // Validação: precisa de uma foto e de uma legenda
  if (!arquivo) {
    erroFoto.textContent = "Escolha uma foto.";
    return;
  }
  erroFoto.textContent = "";

  if (!legenda) {
    erroFotoLegenda.textContent = "Digite uma legenda para a foto.";
    return;
  }
  erroFotoLegenda.textContent = "";

  // Converte a foto em base64 (texto) para poder salvar no localStorage
  const leitor = new FileReader();
  leitor.onload = function () {
    const fotos = obterFotosDinamicas();
    fotos.push({
      src: leitor.result, // imagem em base64
      legenda: legenda,
    });
    salvarFotosDinamicas(fotos);
    exibirFotosDinamicas();

    // Limpa o formulário após adicionar
    inputArquivo.value = "";
    inputLegenda.value = "";
  };
  leitor.readAsDataURL(arquivo); // inicia a leitura da imagem
});
