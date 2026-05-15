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

function sincronizarBanco() {
    sessionStorage.setItem('dbAlunos', JSON.stringify(dbAlunos));
    sessionStorage.setItem('dbAcademias', JSON.stringify(dbAcademias));
    sessionStorage.setItem('dbAdmins', JSON.stringify(dbAdmins));
    sessionStorage.setItem('dbLogs', JSON.stringify(dbLogs));
    sessionStorage.setItem('dbPrecos', JSON.stringify(dbPrecos));
}

function registrarLog(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + " - " + agora.toLocaleTimeString('pt-BR');
    dbLogs.unshift({ data: dataFormatada, autor, acao, detalhe });
    sincronizarBanco();
}

function atualizarComboGraduacao(idModalidade, idGraduacao) {
    const mod = document.getElementById(idModalidade).value;
    const combo = document.getElementById(idGraduacao);
    if (!combo) return;
    combo.innerHTML = "";
    graduaCOES[mod].forEach(g => {
        combo.innerHTML += `<option value="${g}">${g}</option>`;
    });
}

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

function autenticar() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;

    if (email === "direitosimao@gmail.com" && pass === "ogro06#") {
        currentUser = { nome: "Mestre Principal", nivel: "Mestre" };
        aplicarNiveisAcesso();
        document.getElementById('screen-login').style.display = 'none';
        document.getElementById('screen-menu-gestores').style.display = 'grid';
        registrarLog(currentUser.nome, "Login", "Acesso ao painel administrativo master.");
        atualizarDashboard();
        return;
    }

    const adminAchado = dbAdmins.find(a => a.email.toLowerCase() === email && pass === "ogro06#");
    if (adminAchado) {
        currentUser = adminAchado;
        aplicarNiveisAcesso();
        document.getElementById('screen-login').style.display = 'none';
        document.getElementById('screen-menu-gestores').style.display = 'grid';
        registrarLog(currentUser.nome, "Login", `Acesso com perfil ${currentUser.nivel}.`);
        atualizarDashboard();
        return;
    }

    alert("Credenciais de acesso incorretas!");
}

function aplicarNiveisAcesso() {
    const isApoio = currentUser && currentUser.nivel === "Apoio Administrativo";
    document.getElementById('card-metrics-btn').style.opacity = isApoio ? "0.4" : "1";
    document.getElementById('card-admin-btn').style.opacity = isApoio ? "0.4" : "1";
    document.getElementById('card-relatorios-btn').style.opacity = isApoio ? "0.4" : "1";
    document.getElementById('card-config-btn').style.opacity = isApoio ? "0.4" : "1";
    document.getElementById('titulo-gestores').textContent = isApoio ? "Apoio Adm" : "Gestores";
}

function navegarPara(telaId) {
    document.getElementById('screen-login').style.display = 'none';
    document.getElementById('screen-menu-gestores').style.display = 'none';
    
    if (currentUser && currentUser.nivel === "Apoio Administrativo" && ['dashboard', 'adicionar-admin', 'extrair-relatorios', 'configuracoes'].includes(telaId)) {
        return alert("Acesso negado para o seu nível de privilégio.");
    }

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

function salvarAluno() {
    const nome = document.getElementById('aluno-nome').value.trim();
    const whatsapp = document.getElementById('aluno-whatsapp').value.replace(/\D/g, '');
    const plano = document.getElementById('aluno-plano').value;
    const statusFin = document.getElementById('aluno-status-fin').value;
    const perfil = document.getElementById('aluno-perfil').value;
    const modalidade = document.getElementById('aluno-modalidade').value;
    const graduacao = document.getElementById('aluno-graduacao').value;
    const passInicial = document.getElementById('aluno-pass-inicial').value;

    if (!nome || !whatsapp || !passInicial) return alert("Campos obrigatórios ausentes.");

    dbAlunos.push({ nome, whatsapp, plano, statusFin, perfil, modalidade, graduacao, passInicial, presencas: [] });
    registrarLog(currentUser.nome, "Cadastro Aluno", `Incluiu ${nome}.`);
    alert("Aluno cadastrado com sucesso!");
    atualizarDashboard();
    voltarParaMenu();
}

function salvarCT() {
    const nome = document.getElementById('ct-nome').value.trim();
    const local = document.getElementById('ct-local').value.trim();
    if (!nome || !local) return alert("Nome e Cidade são obrigatórios.");

    dbAcademias.push({ nome, local });
    registrarLog(currentUser.nome, "Cadastro CT", `Registrou o CT ${nome}.`);
    alert("CT registrado com sucesso!");
    voltarParaMenu();
}

function atualizarDashboard() {
    let faturamento = 0;
    let inadimplentesCont = 0;

    dbAlunos.forEach(aluno => {
        const precoBase = dbPrecos[aluno.perfil] || 0;
        if (aluno.statusFin === "Em dia") faturamento += precoBase;
        else inadimplentesCont++;
    });

    document.getElementById('dash-faturamento').textContent = "R$ " + faturamento;
    document.getElementById('dash-inadimplencia').textContent = inadimplentesCont;
    document.getElementById('dash-mensalidades').textContent = dbAlunos.length - inadimplentesCont;
}

window.onload = function() {
    atualizarComboGraduacao('aluno-modalidade', 'aluno-graduacao');
};
