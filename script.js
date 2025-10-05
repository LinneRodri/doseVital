// --- CONSTANTES ---
const USERS_STORAGE_KEY = 'doseCertaUsers';
const LOGGED_IN_USER_KEY = 'loggedInUser';

// --- ESTADO GLOBAL ---
let allUsersData = [];
let loggedInUser = null;
let patientData = [];
let intervalId;
let currentFilter = 'todos';

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-med-btn').addEventListener('click', addMedicationField);
    allUsersData = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    checkLoginStatus();
});

// --- AUTENTICAÇÃO ---
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

 // Substitua novamente a sua função handleLogin por esta versão MAIS SEGURA
function handleLogin() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const errorElement = document.getElementById('loginError');
    
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    errorElement.textContent = '';

    if (!email || !password) {
        errorElement.textContent = 'Por favor, preencha e-mail e senha.';
        return;
    }

    // A lógica de busca agora tem uma verificação de segurança
    const foundUser = allUsersData.find(user => {
        // CORREÇÃO AQUI: Verificamos se 'user.residenceConfig' e 'user.residenceConfig.email' existem antes de usá-los
        const userEmail = user.residenceConfig && user.residenceConfig.email 
                          ? user.residenceConfig.email.toLowerCase() 
                          : null;
        
        return userEmail === email && user.password === password;
    });

    if (foundUser) {
        localStorage.setItem(LOGGED_IN_USER_KEY, foundUser.username); 
        loggedInUser = foundUser; 
        loadDashboardScreen();
    } else {
        errorElement.textContent = 'E-mail ou senha incorretos.';
    }
}

function fazerLogout() {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
    loggedInUser = null;
    patientData = [];
    if (intervalId) clearInterval(intervalId);
    window.location.reload();
}

// --- LÓGICA DA INTERFACE ---
function loadDashboardScreen() {
    patientData = loggedInUser.patients || [];
    const displayName = loggedInUser.residenceConfig?.name || loggedInUser.username;
    document.getElementById('headerDisplayName').textContent = `Ritmo Vital - (${displayName})`;
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    
    // LINHA ADICIONADA: Mostra o botão '+'
    document.getElementById('addClientBtn').style.display = 'flex';

    startClockAndRender();
}

function startClockAndRender() {
    if (intervalId) clearInterval(intervalId);
    checkScheduleAndRender();
    intervalId = setInterval(checkScheduleAndRender, 30000);
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
        if (!patient.meds || patient.meds.length === 0) return 'verde';
        if (patient.meds.some(med => med.overdue && !med.given)) return 'vermelho';
        if (patient.meds.some(med => !med.given)) return 'amarelo';
        return 'verde';
    };

    let filteredPatients = patientData.filter(p => currentFilter === 'todos' || getPatientStatusKey(p) === currentFilter);
    const statusOrder = { 'vermelho': 1, 'amarelo': 2, 'verde': 3 };
    filteredPatients.sort((a, b) => statusOrder[getPatientStatusKey(a)] - statusOrder[getPatientStatusKey(b)]);

    if (filteredPatients.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #777;">Nenhum paciente para exibir.</p>`;
        document.getElementById('addClientBtn').style.display = 'block';
        return;
    }

    filteredPatients.forEach(patient => {
        const overdueMeds = patient.meds.filter(med => med.overdue && !med.given);
        totalOverdueMeds += overdueMeds.length;

        let statusText = 'Todas as Doses em Dia';
        let cardBorderColor = '#2ecc71';

        if (overdueMeds.length > 0) {
            statusText = `${overdueMeds.length} Dose(s) Atrasada(s)`;
            cardBorderColor = '#e74c3c';
        } else {
            const pendingMeds = patient.meds.filter(med => !med.given).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            if (pendingMeds.length > 0) {
                statusText = `Próxima Dose às ${pendingMeds[0].time}`;
                cardBorderColor = '#f1c40f';
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
    document.getElementById('addClientBtn').style.display = 'block';
}

// --- DADOS DO PACIENTE ---
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

function toggleRecurringFields(checkbox) {
    const parentEntry = checkbox.closest('.medication-entry');
    const recurringFieldsDiv = parentEntry.querySelector('.recurringFields');
    const frequencyInput = parentEntry.querySelector('.med-frequency-input');
    const durationInput = parentEntry.querySelector('.med-duration-input');

    if (checkbox.checked) {
        recurringFieldsDiv.style.display = 'block';
        frequencyInput.required = true;
        durationInput.required = true;
    } else {
        recurringFieldsDiv.style.display = 'none';
        frequencyInput.required = false;
        durationInput.required = false;
    }
}

function setFilter(filterKey) {
    currentFilter = filterKey;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active-filter');
    });
    document.querySelector(`[data-filter="${filterKey}"]`).classList.add('active-filter');
    renderPatientCards();
}

// --- MODAIS ---
function abrirDetalhes(patientId) {
    const patient = patientData.find(p => p.id === patientId);
    if (!patient) return;

    const modal = document.getElementById('detailsModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    title.textContent = `Detalhes de ${patient.name} - ${patient.room}`;

    let medsHTML = patient.meds.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).map((med, index) => {
        const scheduledDate = new Date(med.dateTime);
        let scheduledTimeFormatted = 'Data Inválida';
        let scheduledDateFormatted = '';

        if (!isNaN(scheduledDate.getTime())) {
            scheduledTimeFormatted = scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            scheduledDateFormatted = scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }

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

function fecharNovoClienteModal() {
    document.getElementById('addClientModal').style.display = 'none';
}

function toggleMenu() {
    document.getElementById('sidebarMenu').classList.toggle('open');
}

// --- LÓGICA DE ADICIONAR PACIENTEa (NOVA) ---

/**
 * Mostra ou esconde os campos de agendamento recorrente com base no checkbox.
 */
function toggleRecurringFields() {
    const isRecurringCheckbox = document.getElementById('isRecurring');
    const recurringFieldsDiv = document.getElementById('recurringFields');
    const frequencyInput = document.getElementById('medFrequency');
    const durationInput = document.getElementById('medDuration');

    if (isRecurringCheckbox.checked) {
        recurringFieldsDiv.style.display = 'block';
        frequencyInput.required = true;
        durationInput.required = true;
    } else {
        recurringFieldsDiv.style.display = 'none';
        frequencyInput.required = false;
        durationInput.required = false;
    }
}

/**
 * Abre o modal para adicionar um novo paciente e reseta o formulário.
 */
function abrirNovoClienteModal() {
    document.getElementById('addClientModal').style.display = 'flex';
    document.getElementById('newClientForm').reset();

    const container = document.getElementById('medications-container');
    const allEntries = container.querySelectorAll('.medication-entry');
    allEntries.forEach((entry, index) => {
        if (index > 0) {
            entry.remove();
        }
    });
    
    toggleRecurringFields(document.querySelector('.is-recurring-checkbox'));
}

/**
 * Adiciona um novo paciente, tratando tanto doses únicas quanto recorrentes.
 */
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
    const medicationEntries = document.querySelectorAll('#medications-container .medication-entry');

    for (const entry of medicationEntries) {
        const medName = entry.querySelector('.med-name-input').value.trim();
        const medTime = entry.querySelector('.med-time-input').value;
        const isRecurring = entry.querySelector('.is-recurring-checkbox').checked;

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
                time: firstDoseDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                given: false, overdue: false, givenAt: null
            });
        } else {
            const frequencyInput = entry.querySelector('.med-frequency-input');
            const durationInput = entry.querySelector('.med-duration-input');
            const frequency = parseInt(frequencyInput.value, 10);
            const duration = parseInt(durationInput.value, 10);

            if (isNaN(frequency) || isNaN(duration) || frequency < 1 || duration < 1) {
                errorSpan.textContent = "Preencha a frequência e a duração corretamente para medicamentos recorrentes.";
                return;
            }

            while (firstDoseDate < now) {
                firstDoseDate.setHours(firstDoseDate.getHours() + frequency);
            }

            let currentDoseDate = new Date(firstDoseDate.getTime());
            const totalDoses = Math.floor((duration * 24) / frequency);

            for (let i = 0; i < totalDoses; i++) {
                if (i > 0) {
                    currentDoseDate.setHours(currentDoseDate.getHours() + frequency);
                }
                const doseDate = new Date(currentDoseDate.getTime());
                allMedsForPatient.push({
                    name: medName,
                    dateTime: doseDate.toISOString(),
                    time: doseDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    given: false, overdue: false, givenAt: null
                });
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
function addMedicationField() {
    const container = document.getElementById('medications-container');
    const firstEntry = container.querySelector('.medication-entry');
    const newEntry = firstEntry.cloneNode(true); // Clona o primeiro bloco

    // Limpa os valores dos inputs clonados
    newEntry.querySelectorAll('input').forEach(input => {
        if(input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });

    // Garante que os campos recorrentes do clone comecem escondidos
    const recurringFields = newEntry.querySelector('.recurringFields');
    recurringFields.style.display = 'none';
    
    // Adiciona um botão de remover ao novo bloco
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-med-btn';
    removeBtn.onclick = () => {
        newEntry.remove();
    };
    newEntry.appendChild(removeBtn);
    
    container.appendChild(newEntry);
}