// --- CONSTANTE (deve ser a mesma do seu script.js principal) ---
const USERS_STORAGE_KEY = 'doseCertaUsers';

/**
 * Função chamada quando o formulário de cadastro é enviado.
 * Ela salva a nova conta e redireciona para o login.
 */
function saveAndRegister() {
    // 1. PEGA OS DADOS DE TODOS OS CAMPOS DO SEU FORMULÁRIO HTML
    const usernameInput = document.getElementById('residenceUsername');
    const nameInput = document.getElementById('residenceName');
    const passwordInput = document.getElementById('residencePassword');
    const phoneInput = document.getElementById('residencePhone');
    const emailInput = document.getElementById('residenceEmail');
    const responsibleInput = document.getElementById('responsibleName');
    const typeInput = document.getElementById('residenceType');
    const errorElement = document.getElementById('configError');
    
    // Limpa os valores de espaços em branco
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const responsible = responsibleInput.value.trim();
    const type = typeInput.value;

    errorElement.textContent = ''; // Limpa a mensagem de erro

    // 2. FAZ AS VALIDAÇÕES
    if (!username || !password || !name || !email) {
        errorElement.textContent = 'Por favor, preencha todos os campos obrigatórios.';
        return;
    }
    // Verifica se o username contém espaços
    if (/\s/.test(username)) {
        errorElement.textContent = 'O nome de usuário não pode conter espaços.';
        return;
    }

    // 3. CARREGA OS USUÁRIOS EXISTENTES
    const allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];

    // 4. VERIFICA SE O USUÁRIO JÁ EXISTE
    const userExists = allUsers.some(user => user.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
        errorElement.textContent = 'Este nome de usuário já está em uso. Tente outro.';
        return;
    }

    // 5. CRIA O NOVO USUÁRIO COM A ESTRUTURA CORRETA
    const newUserObject = {
        username: username,      // Usado para o login
        password: password,      // Usado para o login
        residenceConfig: {       // Objeto com todas as outras informações
            name: name,
            phone: phone,
            email: email,
            responsible: responsible,
            type: type
        },
        patients: []             // Lista de pacientes começa vazia
    };

    // 6. ADICIONA O NOVO USUÁRIO À LISTA E SALVA
    allUsers.push(newUserObject);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));

    alert("Conta criada com sucesso! Você será redirecionado para o painel.");
    
    // LOGA AUTOMATICAMENTE O USUÁRIO E REDIRECIONA
    localStorage.setItem('loggedInUser', username); // Marca o novo usuário como logado
    window.location.href = 'index.html'; // Redireciona para a página principal
}