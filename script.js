// --- CONSTANTES GLOBAIS ---
const USERS_STORAGE_KEY = 'doseCertaUsers';
const LOGGED_IN_USER_KEY = 'loggedInUser';

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let allUsersData = [];
let loggedInUser = null;
let patientData = [];
let intervalId;
let currentFilter = 'todos';
let firstMedicationEntryTemplate; // Guardará o modelo do campo de medicamento

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os dados dos usuários do Local Storage
    allUsersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    
    // Clona o primeiro campo de medicamento para usar como modelo ao adicionar novos
    const medicationsContainer = document.getElementById('medications-container');
    if (medicationsContainer && medicationsContainer.querySelector('.medicamento-item')) {
        firstMedicationEntryTemplate = medicationsContainer.querySelector('.medicamento-item').cloneNode(true);
    }

    // Adiciona os event listeners principais
    setupEventListeners();
    
    // Verifica se há um usuário logado
    checkLoginStatus();
});

// --- FUNÇÕES DE CONFIGURAÇÃO DE EVENTOS ---
function setupEventListeners() {
    // Botão de adicionar medicamento dentro do modal
    const addMedBtn = document.getElementById('add-med-btn');
    if (addMedBtn) addMedBtn.addEventListener('click', adicionarNovoMedicamento);

    // Botão que abre o modal de adicionar paciente (o '+' flutuante)
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) addClientBtn.addEventListener('click', abrirNovoClienteModal);

    // Botão de fechar o modal de adicionar paciente (o 'x')
    const closeClientBtn = document.querySelector('#addClientModal .close-modal-btn');
    if (closeClientBtn) closeClientBtn.addEventListener('click', fecharNovoClienteModal);

    // Botão de fechar o modal de detalhes do paciente
    const closeDetailsBtn = document.querySelector('#detailsModal .close-modal-btn');
    if(closeDetailsBtn) closeDetailsBtn.addEventListener('click', fecharModal);

    // Configura os checkboxes que já existem na página
    configurarCheckboxes();
}

// --- LÓGICA DE AUTENTICAÇÃO ---
function checkLoginStatus() {
    const loggedInUsername = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (loggedInUsername) {
        const user = allUsersData.find(u => u.username.toLowerCase() === loggedInUsername.toLowerCase());
        if (user) {
            loggedInUser = user;
            loadDashboardScreen();
        } else {
            fazerLogout();
        }
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboardScreen').style.display = 'none';
    }
}

function handleLogin() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const errorElement = document.getElementById('loginError');
    
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    errorElement.textContent = '';

    if (!username || !password) {
        errorElement.textContent = 'Por favor, preencha usuário e senha.';
        return;
    }

    const foundUser = allUsersData.find(user => 
        user.username.toLowerCase() === username && user.password === password
    );

    if (foundUser) {
        localStorage.setItem(LOGGED_IN_USER_KEY, foundUser.username); 
        loggedInUser = foundUser; 
        loadDashboardScreen();
    } else {
        errorElement.textContent = 'Usuário ou senha incorretos.';
    }
}

function fazerLogout() {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
    loggedInUser = null;
    patientData = [];
    if (intervalId) clearInterval(intervalId);
    window.location.reload();
}

// --- LÓGICA DO DASHBOARD ---
function loadDashboardScreen() {
    patientData = loggedInUser.patients || [];
    const displayName = loggedInUser.residenceConfig?.name || loggedInUser.username;
    document.getElementById('headerDisplayName').textContent = `Ritmo Vital - (${displayName})`;
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) addClientBtn.style.display = 'flex';

    startClockAndRender();
}

function startClockAndRender() {
    if (intervalId) clearInterval(intervalId);
    checkScheduleAndRender();
    intervalId = setInterval(checkScheduleAndRender, 30000); // Verifica a cada 30 segundos
}

function checkScheduleAndRender() {
    const now = new Date();
    document.getElementById('relogioAtual').textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    patientData.forEach(patient => {
        if (!patient.meds) patient.meds = [];
        patient.meds.forEach(med => {
            if (!med.given && now > new Date(med.dateTime)) {
                med.overdue = true;
            }
        });
    });
    renderPatientCards();
}

function renderPatientCards() {
    const container = document.getElementById('patientListContainer');
    container.innerHTML = '';
    let totalOverdueMeds = 0;

    const getPatientStatusKey = (patient) => {
        if (!patient.meds || patient.meds.length === 0 || patient.meds.every(med => med.given)) return 'verde';
        if (patient.meds.some(med => med.overdue && !med.given)) return 'vermelho';
        if (patient.meds.some(med => !med.given)) return 'amarelo';
        return 'verde';
    };

    let filteredPatients = patientData.filter(p => currentFilter === 'todos' || getPatientStatusKey(p) === currentFilter);
    const statusOrder = { 'vermelho': 1, 'amarelo': 2, 'verde': 3 };
    filteredPatients.sort((a, b) => statusOrder[getPatientStatusKey(a)] - statusOrder[getPatientStatusKey(b)]);

    if (filteredPatients.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #777;">Nenhum paciente para exibir.</p>`;
        return;
    }

    filteredPatients.forEach(patient => {
        const overdueMeds = patient.meds.filter(med => med.overdue && !med.given);
        totalOverdueMeds += overdueMeds.length;

        let statusText = 'Todas as Doses em Dia';
        let cardBorderColor = '#2ecc71'; // Verde

        if (overdueMeds.length > 0) {
            statusText = `${overdueMeds.length} Dose(s) Atrasada(s)`;
            cardBorderColor = '#e74c3c'; // Vermelho
        } else {
            const pendingMeds = patient.meds.filter(med => !med.given).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            if (pendingMeds.length > 0) {
                statusText = `Próxima Dose às ${new Date(pendingMeds[0].dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                cardBorderColor = '#f1c40f'; // Amarelo
            }
        }
        const initials = patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        container.innerHTML += `
            <div class="paciente-card" onclick="abrirDetalhes('${patient.id}')" style="border-left-color: ${cardBorderColor};">
                <div class="paciente-foto" style="background-color: ${cardBorderColor};">${initials}</div>
                <div class="paciente-info">
                    <div class="paciente-nome">${patient.name} - ${patient.room}</div>
                    <div class="paciente-status" style="color: ${cardBorderColor};">${statusText}</div>
                </div>
            </div>`;
    });

    const alertaGeral = document.getElementById('alertaGeral');
    alertaGeral.style.display = totalOverdueMeds > 0 ? 'block' : 'none';
    alertaGeral.innerHTML = `<strong>${totalOverdueMeds}</strong> Dose(s) Críticas Atrasadas. Priorizar!`;
}


// --- LÓGICA DO MODAL DE ADICIONAR PACIENTE ---
function abrirNovoClienteModal() {
    const modal = document.getElementById('addClientModal');
    const form = document.getElementById('newClientForm');
    const medicationsContainer = document.getElementById('medications-container');
    form.reset();
    
    while (medicationsContainer.children.length > 1) {
        medicationsContainer.removeChild(medicationsContainer.lastChild);
    }
    
    const firstEntry = medicationsContainer.querySelector('.medicamento-item');
    if (firstEntry) {
        firstEntry.querySelector('.med-name-input').value = '';
        firstEntry.querySelector('.med-time-input').value = '';
        const firstCheckbox = firstEntry.querySelector('.recorrente-checkbox');
        const firstOptions = firstEntry.querySelector('.opcoes-recorrentes');
        if(firstCheckbox) firstCheckbox.checked = false;
        if(firstOptions) firstOptions.style.display = 'none';
    }
    modal.style.display = 'flex';
}

function fecharNovoClienteModal() {
    document.getElementById('addClientModal').style.display = 'none';
}

function adicionarNovoMedicamento() {
    const medicationsContainer = document.getElementById('medications-container');
    const novoMedicamento = firstMedicationEntryTemplate.cloneNode(true);
    
    novoMedicamento.querySelector('.med-name-input').value = '';
    novoMedicamento.querySelector('.med-time-input').value = '';
    novoMedicamento.querySelector('.recorrente-checkbox').checked = false;
    novoMedicamento.querySelector('.opcoes-recorrentes').style.display = 'none';
    
    medicationsContainer.appendChild(novoMedicamento);
    configurarCheckboxes();
}

function configurarCheckboxes() {
    const todosCheckboxes = document.querySelectorAll('.recorrente-checkbox');
    todosCheckboxes.forEach(checkbox => {
        checkbox.removeEventListener('change', toggleOpcoesRecorrentes);
        checkbox.addEventListener('change', toggleOpcoesRecorrentes);
    });
}
    
function toggleOpcoesRecorrentes(event) {
    const checkbox = event.target;
    const paiMedicamento = checkbox.closest('.medicamento-item');
    const opcoesDiv = paiMedicamento.querySelector('.opcoes-recorrentes');
    if (checkbox.checked) {
        opcoesDiv.style.display = 'block';
    } else {
        opcoesDiv.style.display = 'none';
    }
}

function adicionarNovoCliente() {
    const errorSpan = document.getElementById('clientError');
    errorSpan.textContent = '';

    const nome = document.getElementById('clientName').value.trim();
    const quarto = document.getElementById('clientRoom').value.trim();
    if (!nome || !quarto) {
        errorSpan.textContent = "Preencha o nome e o quarto do paciente.";
        return;
    }

    const allMedsForPatient = [];
    const medicationEntries = document.querySelectorAll('#medications-container .medicamento-item');

    for (const entry of medicationEntries) {
        const medName = entry.querySelector('.med-name-input').value.trim();
        const medTime = entry.querySelector('.med-time-input').value;
        const isRecurring = entry.querySelector('.recorrente-checkbox').checked;
        if (!medName || !medTime) {
            errorSpan.textContent = "Preencha o nome e o horário para todos os medicamentos.";
            return;
        }

        const now = new Date();
        let firstDoseDate = new Date();
        const [startHour, startMinute] = medTime.split(':');
        firstDoseDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10), 0, 0);

        if (!isRecurring) {
            if (firstDoseDate < now) {
                firstDoseDate.setDate(firstDoseDate.getDate() + 1);
            }
            allMedsForPatient.push({
                name: medName,
                dateTime: firstDoseDate.toISOString(),
                given: false, overdue: false, givenAt: null
            });
        } else {
            const frequencyInput = entry.querySelector('.frequencia-input');
            const durationInput = entry.querySelector('.duracao-input');
            const frequency = parseInt(frequencyInput.value, 10);
            const duration = parseInt(durationInput.value, 10);

            if (isNaN(frequency) || isNaN(duration) || frequency < 1 || duration < 1) {
                errorSpan.textContent = "Preencha a frequência e a duração corretamente.";
                return;
            }

            let currentDoseDate = new Date(firstDoseDate.getTime());
             if (currentDoseDate < now) {
                currentDoseDate.setDate(currentDoseDate.getDate() + 1);
            }
            const endDate = new Date(currentDoseDate.getTime());
            endDate.setDate(endDate.getDate() + duration);

            while(currentDoseDate < endDate){
                 allMedsForPatient.push({
                    name: medName,
                    dateTime: currentDoseDate.toISOString(),
                    given: false, overdue: false, givenAt: null
                });
                currentDoseDate.setHours(currentDoseDate.getHours() + frequency);
            }
        }
    }
    if (allMedsForPatient.length === 0) {
        errorSpan.textContent = "Adicione pelo menos um medicamento.";
        return;
    }
    if (!loggedInUser.patients) loggedInUser.patients = [];
    loggedInUser.patients.push({ id: generateId(), name: nome, room: quarto, meds: allMedsForPatient });
    saveUserData();
    checkScheduleAndRender();
    fecharNovoClienteModal();
}

// --- DEMAIS FUNÇÕES E UTILITÁRIOS ---
function saveUserData() {
    if (!loggedInUser) return;
    const userIndex = allUsersData.findIndex(u => u.username.toLowerCase() === loggedInUser.username.toLowerCase());
    if (userIndex !== -1) {
        allUsersData[userIndex] = loggedInUser;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsersData));
    }
}

function generateId() {
    return 'p' + Date.now() + Math.floor(Math.random() * 1000);
}

function excluirPaciente(patientId) {
    const patientIndex = patientData.findIndex(p => p.id === patientId);
    if (patientIndex === -1) return;
    if (confirm(`Excluir "${patientData[patientIndex].name}"?`)) {
        patientData.splice(patientIndex, 1);
        saveUserData();
        fecharModal();
        renderPatientCards();
    }
}

function setFilter(filterKey) {
    currentFilter = filterKey;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active-filter'));
    document.querySelector(`[data-filter="${filterKey}"]`).classList.add('active-filter');
    renderPatientCards();
}

function abrirDetalhes(patientId) {
    const patient = patientData.find(p => p.id === patientId);
    if (!patient) return;
    const modal = document.getElementById('detailsModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    title.textContent = `Detalhes de ${patient.name} - ${patient.room}`;
    let medsHTML = (patient.meds || []).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).map((med, index) => {
        const scheduledDate = new Date(med.dateTime);
        const scheduledTimeFormatted = scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const scheduledDateFormatted = scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        let statusText, buttonHTML = '';
        if (med.given) {
            const givenTime = med.givenAt ? new Date(med.givenAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
            statusText = ` ${med.name} às ${scheduledTimeFormatted} - Administrado às ${givenTime}`;
        } else if (med.overdue) {
            statusText = ` ${med.name} às ${scheduledTimeFormatted} de ${scheduledDateFormatted} (ATRASADO)`;
            buttonHTML = `<button class="btn-administer-critical" onclick="toggleMedicationGiven('${patient.id}', ${index})">Administrar</button>`;
        } else {
            statusText = ` ${med.name} às ${scheduledTimeFormatted} de ${scheduledDateFormatted} (Pendente)`;
            buttonHTML = `<button class="btn-administer" onclick="toggleMedicationGiven('${patient.id}', ${index})">Administrar</button>`;
        }
        return `<div class="med-item"><span>${statusText}</span>${buttonHTML}</div>`;
    }).join('');
    body.innerHTML = `<h4>Status das Medicações:</h4>${medsHTML}<div class="modal-footer"><button class="btn-delete" onclick="excluirPaciente('${patient.id}')">Excluir Paciente</button></div>`;
    modal.style.display = 'flex';
}

function fecharModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

function toggleMenu() {
    document.getElementById('sidebarMenu').classList.toggle('open');
}

function toggleMedicationGiven(patientId, medIndex) {
    const patient = patientData.find(p => p.id === patientId);
    if (patient && patient.meds[medIndex]) {
        const med = patient.meds[medIndex];
        med.given = !med.given;
        med.givenAt = med.given ? new Date().toISOString() : null;
        if (med.given) {
            med.overdue = false; // Se foi administrado, não está mais atrasado
        }
        saveUserData();
        abrirDetalhes(patientId); // Reabre o modal para atualizar a visualização
        checkScheduleAndRender(); // Atualiza os cards do dashboard
    }
}