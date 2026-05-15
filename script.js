// BANCO DE DADOS INTEGRADO (PERSISTÊNCIA TEMPORÁRIA POR SESSÃO)
let dbAlunos = JSON.parse(sessionStorage.getItem('dbAlunos')) || [];
let dbAcademias = JSON.parse(sessionStorage.getItem('dbAcademias')) || [];
let dbAdmins = JSON.parse(sessionStorage.getItem('dbAdmins')) || [
    { nome: "Mestre Principal", email: "direitosimao@gmail.com", nivel: "Mestre" }
];
let dbLogs = JSON.parse(sessionStorage.getItem('dbLogs')) || [];
let dbPrecos = JSON.parse(sessionStorage.getItem('dbPrecos')) || {
    "Aluno Comercial": 150,
    "Aluno Atleta": 100,
    "Aluno Bolsista": 0,
    "Aluno Instrutor": 80
};

// LISTA COMPLETA DE GRADUAÇÕES POR MODALIDADE
const graduaCOES = {
    "Muay Thai": ["Branco", "Branco com Ponta Vermelha", "Vermelho", "Vermelho com Ponta Azul", "Azul", "Azul com Ponta Preta", "Preta (Instrutor)", "Preta com Ponta Branca (Professor)", "Preta com Ponta Vermelha (Mestre)", "Ouro (Grão-Mestre)"],
    "Boxe": ["Classe D (Iniciante)", "Classe C (Intermediário)", "Classe B (Avançado)", "Classe A (Elite/Profissional)", "Treinador Auxiliar", "Treinador Principal (Head Coach)"],
    "MMA": ["Faixa Branca", "Faixa Amarela", "Faixa Laranja", "Faixa Verde", "Faixa Azul", "Faixa Roxa", "Faixa Marrom", "Faixa Preta", "Faixa Preta Master"]
};

let currentUser = null;

// SALVAMENTO AUTOMÁTICO DE ESTADO
function sincronizarBanco() {
    sessionStorage.setItem('dbAlunos', JSON.stringify(dbAlunos));
    sessionStorage.setItem('dbAcademias', JSON.stringify(dbAcademias));
    sessionStorage.setItem('dbAdmins', JSON.stringify(dbAdmins));
    sessionStorage.setItem('dbLogs', JSON.stringify(dbLogs));
    sessionStorage.setItem('dbPrecos', JSON.stringify(dbPrecos));
}

// SISTEMA DE AUDITORIA (RASTREABILIDADE TOTAL)
function registrarLog(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + " - " + agora.toLocaleTimeString('pt-BR');
    dbLogs.unshift({ data: dataFormatada, autor, acao, detalhe });
    sincronizarBanco();
}

// INICIALIZADOR DINÂMICO DE GRADUAÇÃO
function atualizarComboGraduacao(idModalidade, idGraduacao) {
    const mod = document.getElementById(idModalidade).value;
    const combo = document.getElementById(idGraduacao);
    if (!combo) return;
    combo.innerHTML = "";
    graduaCOES[mod].forEach(g => {
        combo.innerHTML += `<option value="${g}">${g}</option>`;
    });
}

// SISTEMA DE VISUALIZAÇÃO DE SENHA
function togglePasswordVisibility(id, btn) {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
    } else {
        input.type = "password";
        btn.textContent = "👁️";
    }
}

// PÁGINA 1: AUTENTICAÇÃO COM PREVILÉGIOS RÍGIDOS
function autenticar() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;

    if (email === "direitosimao@gmail.com" && pass === "ogro06#") {
        currentUser = { nome: "Mestre Principal", nivel: "Mestre" };
        aplicarNiveisAcesso();
        document.getElementById('screen-login').style.display = 'none';
        document.getElementById('screen-menu-gestores').style.display = 'grid';
        document.getElementById('footer-menu-box').style.display = 'flex';
        registrarLog(currentUser.nome, "Login", "Acesso bem-sucedido ao painel administrativo principal.");
        atualizarDashboard();
        renderizarCadastros();
        return;
    }

    const adminAchado = dbAdmins.find(a => a.email.toLowerCase() === email && pass === "ogro06#");
    if (adminAchado) {
        currentUser = adminAchado;
        aplicarNiveisAcesso();
        document.getElementById('screen-login').style.display = 'none';
        document.getElementById('screen-menu-gestores').style.display = 'grid';
        document.getElementById('footer-menu-box').style.display = 'flex';
        registrarLog(currentUser.nome, "Login", `Acesso concedido com perfil ${currentUser.nivel}.`);
        atualizarDashboard();
        renderizarCadastros();
        return;
    }

    const alunoAchado = dbAlunos.find(a => a.whatsapp === email && a.passInicial === pass);
    if (alunoAchado) {
        currentUser = alunoAchado;
        document.getElementById('screen-login').style.display = 'none';
        renderizarPainelAluno(alunoAchado);
        return;
    }

    alert("Credenciais de acesso incorretas!");
}

// APLICAÇÃO RÍGIDA DE DIRETRIZES E TRAVAS DE ACESSO
function aplicarNiveisAcesso() {
    const isApoio = currentUser && currentUser.nivel === "Apoio Administrativo";
    document.getElementById('card-metrics-btn').style.opacity = isApoio ? "0.4" : "1";
    document.getElementById('card-admin-btn').style.opacity = isApoio ? "0.4" : "1";
    document.getElementById('card-relatorios-btn').style.opacity = isApoio ? "0.4" : "1";
    document.getElementById('card-config-btn').style.opacity = isApoio ? "0.4" : "1";
    document.getElementById('titulo-gestores').textContent = isApoio ? "Apoio Adm" : "Gestores";
}

// PÁGINA 2: RECUPERAÇÃO REAL DE SENHA
function enviarLinkRecuperacao() {
    const conta = document.getElementById('recovery-email').value.trim();
    const nova = document.getElementById('recovery-new-pass').value;
    const confirma = document.getElementById('recovery-confirm-pass').value;

    if (!conta || !nova || !confirma) return alert("Preencha todos os campos da redefinição.");
    if (nova !== confirma) return alert("As senhas não coincidem.");

    if (conta.toLowerCase() === "direitosimao@gmail.com") {
        alert("A senha master principal não pode ser modificada por este canal.");
        return;
    }

    let alterado = false;
    dbAlunos.forEach(a => {
        if (a.whatsapp === conta) {
            const antiga = a.passInicial;
            a.passInicial = nova;
            alterado = true;
            registrarLog("Sistema", "Troca de Senha", `Aluno ${a.nome} alterou credencial.`);
        }
    });

    if (alterado) {
        sincronizarBanco();
        alert("Senha atualizada com sucesso!");
        navegarPara('login');
    } else {
        alert("Conta informada não localizada na base ativa.");
    }
}

// EXECUÇÃO DO CONTEXTO DE NAVEGAÇÃO DE TELAS
function navegarPara(telaId) {
    document.getElementById('screen-login').style.display = 'none';
    document.getElementById('screen-menu-gestores').style.display = 'none';
    document.getElementById('footer-menu-box').style.display = (telaId === 'login' || telaId === 'recuperar-senha' || telaId === 'aluno-view') ? 'none' : 'flex';
    
    if (telaId === 'dashboard' && currentUser.nivel === "Apoio Administrativo") return alert("Acesso negado para o seu nível de privilégio.");
    if (telaId === 'adicionar-admin' && currentUser.nivel === "Apoio Administrativo") return alert("Acesso negado para o seu nível de privilégio.");
    if (telaId === 'extrair-relatorios' && currentUser.nivel === "Apoio Administrativo") return alert("Acesso negado para o seu nível de privilégio.");
    if (telaId === 'configuracoes' && currentUser.nivel === "Apoio Administrativo") return alert("Acesso negado para o seu nível de privilégio.");

    const telas = document.querySelectorAll('.screen-content');
    telas.forEach(t => t.style.display = 'none');

    if (telaId === 'login') {
        document.getElementById('screen-login').style.display = 'block';
    } else if (telaId === 'menu') {
        document.getElementById('screen-menu-gestores').style.display = 'grid';
    } else {
        const target = document.getElementById('screen-' + telaId);
        if (target) target.style.display = 'flex';
    }
}

function voltarParaMenu() { navegarPara('menu'); }

function previewImagem(input, previewId, placeholderId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).src = e.target.result;
            document.getElementById(previewId).style.display = 'block';
            document.getElementById(placeholderId).style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
}

// DISPARO E PROCESSAMENTO DE ARQUIVOS (SALVAMENTO DE REGISTROS)
window.onload = function() {
    atualizarComboGraduacao('aluno-modalidade', 'aluno-graduacao');
};
// PÁGINA 4: PROCESSAMENTO E GRAVAÇÃO DE ALUNO PREMIUM
function salvarAluno() {
    const nome = document.getElementById('aluno-nome').value.trim();
    const whatsapp = document.getElementById('aluno-whatsapp').value.replace(/\D/g, '');
    const plano = document.getElementById('aluno-plano').value;
    const statusFin = document.getElementById('aluno-status-fin').value;
    const perfil = document.getElementById('aluno-perfil').value;
    const modalidade = document.getElementById('aluno-modalidade').value;
    const graduacao = document.getElementById('aluno-graduacao').value;
    const passInicial = document.getElementById('aluno-pass-inicial').value;
    const fotoPreview = document.getElementById('aluno-photo-preview');
    const fotoSrc = fotoPreview.style.display === 'block' ? fotoPreview.src : '';

    if (!nome || !whatsapp || !passInicial) {
        alert("Campos Nome, WhatsApp e Senha Inicial são obrigatórios.");
        return;
    }

    dbAlunos.push({ nome, whatsapp, plano, statusFin, perfil, modalidade, graduacao, passInicial, foto: fotoSrc, presencas: [] });
    registrarLog(currentUser.nome, "Cadastro Aluno", `Incluiu o aluno ${nome} (${perfil}) graduado em ${graduacao}.`);
    
    // Disparo da API Oficial estruturada do WhatsApp com credenciais temporárias
    const textoWhats = encodeURIComponent(`Olá ${nome}! Seu acesso Premium na Ogro Team foi gerado.\n\nLink: https://${window.location.hostname}\nUsuário (WhatsApp): ${whatsapp}\nSenha de Entrada: ${passInicial}\nModalidade: ${modalidade}\nGraduação: ${graduacao}`);
    window.open(`https://whatsapp.com{whatsapp}&text=${textoWhats}`, '_blank');

    // Limpeza de formulário
    document.getElementById('aluno-nome').value = "";
    document.getElementById('aluno-whatsapp').value = "";
    document.getElementById('aluno-pass-inicial').value = "";
    fotoPreview.style.display = 'none';
    document.getElementById('photo-placeholder').style.display = 'block';

    atualizarDashboard();
    renderizarCadastros();
    voltarParaMenu();
}

// PÁGINA 5: GRAVAÇÃO E CADASTRO AVANÇADO DE UNIDADE (CT)
function salvarCT() {
    const nome = document.getElementById('ct-nome').value.trim();
    const cnpj = document.getElementById('ct-cnpj').value.trim();
    const responsavel = document.getElementById('ct-responsavel').value.trim();
    const endereco = document.getElementById('ct-endereco').value.trim();
    const local = document.getElementById('ct-local').value.trim();
    const whatsapp = document.getElementById('ct-whatsapp').value.trim();
    const capacidade = document.getElementById('ct-capacidade').value;
    const mensalidade = parseFloat(document.getElementById('ct-mensalidade').value) || 0;

    if (!nome || !local) return alert("Nome do CT e Cidade/Estado são obrigatórios.");

    dbAcademias.push({ nome, cnpj, responsavel, endereco, local, whatsapp, capacidade, mensalidade });
    registrarLog(currentUser.nome, "Cadastro CT", `Registrou a filial unificada: ${nome} em ${local}.`);

    document.getElementById('ct-nome').value = "";
    document.getElementById('ct-cnpj').value = "";
    document.getElementById('ct-responsavel').value = "";
    document.getElementById('ct-endereco').value = "";
    document.getElementById('ct-local').value = "";
    document.getElementById('ct-whatsapp').value = "";
    document.getElementById('ct-capacidade').value = "";
    document.getElementById('ct-mensalidade').value = "";

    renderizarCadastros();
    voltarParaMenu();
}

// PÁGINA 6: ENGENHARIA DE METAS E CALCULO DE INADIMPLÊNCIA DINÂMICA
function atualizarDashboard() {
    let faturamento = 0;
    let inadimplentesCont = 0;

    dbAlunos.forEach(aluno => {
        const precoBase = dbPrecos[aluno.perfil] || 0;
        if (aluno.statusFin === "Em dia") {
            faturamento += precoBase;
        } else {
            inadimplentesCont++;
        }
    });

    const totalAlunos = dbAlunos.length;
    const percentInadimplencia = totalAlunos > 0 ? Math.round((inadimplentesCont / totalAlunos) * 100) : 0;

    document.getElementById('dash-faturamento').textContent = "R$ " + faturamento;
    document.getElementById('dash-inadimplencia').textContent = percentInadimplencia + "%";
    document.getElementById('dash-mensalidades').textContent = (totalAlunos - inadimplentesCont);

    // Renderiza Devedores (Ignorando alunos bolsistas por regra de negócio)
    const container = document.getElementById('container-inadimplentes');
    if(container) {
        container.innerHTML = "";
        const listaInad = dbAlunos.filter(a => a.statusFin === "Inadimplente" && a.perfil !== "Aluno Bolsista");
        
        if (listaInad.length === 0) {
            container.innerHTML = '<div class="no-data-msg" style="color:#4ade80;">Nenhum devedor ativo na base.</div>';
        } else {
            listaInad.forEach(a => {
                const valorDevido = dbPrecos[a.perfil] || 0;
                container.innerHTML += `
                    <div class="search-item" style="border-left: 3px solid #dc2626;">
                        <div>
                            <div style="font-size:13px; font-weight:bold;">${a.nome}</div>
                            <div style="font-size:10px; color:#f87171;">${a.perfil} - Pendência: R$ ${valorDevido}</div>
                        </div>
                        <button class="btn-delete-user" onclick="window.open('https://whatsapp.com{a.whatsapp}&text=Prezado,%20identificamos%20uma%20pendencia%20financeira%20em%20seu%20plano%20Ogro%20Team.%20Por%20favor%20regularize%20seu%20acesso.', '_blank')">Cobrar</button>
                    </div>`;
            });
        }
    }
}

// SIMULADOR DE EXTRAÇÃO FINANCEIRA DIVERSA
function gerarRelatorioRapido(tipo) {
    if(tipo === 'fluxo') alert("Processando Fluxo de Caixa...\nReceita Bruta Estimada: " + document.getElementById('dash-faturamento').textContent + "\nDespesas Operacionais: R$ 1.200,00\nBalanço Líquido Consolidado.");
    if(tipo === 'previsao') alert("Calculando Previsibilidade...\nMontante projetado para renovações automáticas de contratos ativos de planos nos próximos 30 dias baseado em contratos ativos.");
    if(tipo === 'ct') alert("Balanço por CT...\nExibindo faturamento e inadimplência cruzados e rateados por filial ativa.");
}

