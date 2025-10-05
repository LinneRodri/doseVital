// --- CONSTANTES E VARIÁVEIS GLOBAIS ---
const USERS_STORAGE_KEY = 'doseCertaUsers';
const LOGGED_IN_USER_KEY = 'loggedInUser';

// CORREÇÃO: Dados iniciais agora incluem 'dateTime' e 'time' para evitar o bug "Data Inválida".
const createInitialMed = (name, hour) => {
    const date = new Date();
    const [h, m] = hour.split(':');
    date.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    
    // Se o horário já passou hoje, agenda para amanhã.
    if (new Date() > date) {
        date.setDate(date.getDate() + 1);
    }

    return {
        name: name,
        dateTime: date.toISOString(),
        time: hour,
        given: false,
        overdue: false
    };
};

const initialPatientData = [
    { 
        id: 'p' + Date.now(), 
        name: 'João Silva (Exemplo)', 
        room: 'Quarto 101', 
        meds: [createInitialMed('Insulina', '08:00')] 
    },
    { 
        id: 'p' + (Date.now() + 1), 
        name: 'Maria Oliveira (Exemplo)', 
        room: 'Quarto 105', 
        meds: [createInitialMed('Dipirona', '14:00')] 
    }
];

/**
 * Função principal de cadastro.
 */
function saveAndRegister() {
    const errorElement = document.getElementById('configError');
    errorElement.textContent = "";

    const username = document.getElementById('residenceUsername').value.trim();
    const residenceName = document.getElementById('residenceName').value.trim();
    const password = document.getElementById('residencePassword').value.trim();
    const phone = document.getElementById('residencePhone').value.trim();
    const email = document.getElementById('residenceEmail').value.trim();
    const responsible = document.getElementById('responsibleName').value.trim();
    const type = document.getElementById('residenceType').value;

    if (!username || !residenceName || !password || !phone || !email || !responsible || !type) {
        errorElement.textContent = "Por favor, preencha todos os campos.";
        return;
    }

    if (username.includes(' ')) {
        errorElement.textContent = "O Nome de Usuário não pode conter espaços.";
        return;
    }

    const allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];

    const userExists = allUsers.some(user => user.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
        errorElement.textContent = "Este Nome de Usuário já está em uso.";
        return;
    }

    const newUser = {
        username: username,
        password: password,
        residenceConfig: { 
            name: residenceName, 
            phone, email, responsible, type, 
            configured: true 
        },
        patients: initialPatientData // Usaa os dados corrigidos
    };

    allUsers.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    
    localStorage.setItem(LOGGED_IN_USER_KEY, username);

    window.location.href = 'index.html';
}