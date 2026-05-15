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
