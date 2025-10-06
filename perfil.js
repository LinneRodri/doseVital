const USERS_STORAGE_KEY = 'doseCertaUsers';
const LOGGED_IN_USER_KEY = 'loggedInUser';
let currentUser = null;
let allUsers = [];

const formElements = {
    username: document.getElementById('profileUsername'),
    residenceName: document.getElementById('profileResidenceName'),
    password: document.getElementById('profilePassword'),
    phone: document.getElementById('profilePhone'),
    email: document.getElementById('profileEmail'),
    responsible: document.getElementById('profileResponsible'),
    type: document.getElementById('profileType'),
    editButton: document.getElementById('editButton'),
    saveButton: document.getElementById('saveButton'),
    cancelButton: document.getElementById('cancelButton'),
    error: document.getElementById('profileError')
};

const editableFields = ['residenceName', 'password', 'phone', 'email', 'responsible', 'type'];


document.addEventListener('DOMContentLoaded', () => {
    allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    const loggedInUsername = localStorage.getItem(LOGGED_IN_USER_KEY);

    if (!loggedInUsername) {
        alert('Nenhum usuário logado. Redirecionando...');
        window.location.href = 'index.html';
        return;
    }

    currentUser = allUsers.find(u => u.username.toLowerCase() === loggedInUsername.toLowerCase());
    
    if (currentUser) {
        populateForm();
    } else {
        alert('Erro ao encontrar dados do usuário. Redirecionando...');
        window.location.href = 'index.html';
    }
});

function populateForm() {
    formElements.username.value = currentUser.username;
    const config = currentUser.residenceConfig || {};
    formElements.residenceName.value = config.name || '';
    formElements.phone.value = config.phone || '';
    formElements.email.value = config.email || '';
    formElements.responsible.value = config.responsible || '';
    formElements.type.value = config.type || '';
    formElements.password.value = ''; 
}

function toggleEditMode(isEditing) {
    editableFields.forEach(fieldKey => {
        formElements[fieldKey].disabled = !isEditing;
    });

    formElements.editButton.style.display = isEditing ? 'none' : 'inline-block';
    formElements.saveButton.style.display = isEditing ? 'inline-block' : 'none';
    formElements.cancelButton.style.display = isEditing ? 'inline-block' : 'none';

    if (!isEditing) {
        populateForm();
        formElements.error.textContent = '';
    }
}

function saveChanges() {
    formElements.error.textContent = '';

    const newValues = {
        name: formElements.residenceName.value.trim(),
        password: formElements.password.value.trim(),
        phone: formElements.phone.value.trim(),
        email: formElements.email.value.trim(),
        responsible: formElements.responsible.value.trim(),
        type: formElements.type.value
    };
    
    if (!newValues.name || !newValues.phone || !newValues.email || !newValues.responsible || !newValues.type) {
        formElements.error.textContent = "Por favor, preencha todos os campos, exceto a nova senha.";
        return;
    }
    
    const config = currentUser.residenceConfig;
    config.name = newValues.name;
    config.phone = newValues.phone;
    config.email = newValues.email;
    config.responsible = newValues.responsible;
    config.type = newValues.type;
    
    if (newValues.password) {
        currentUser.password = newValues.password;
    }

    const userIndex = allUsers.findIndex(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
    if (userIndex !== -1) {
        allUsers[userIndex] = currentUser;
    } else {
         formElements.error.textContent = "Erro ao encontrar o usuário para salvar.";
         return;
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    
    alert('Dados atualizados com sucesso!');
    toggleEditMode(false);
}