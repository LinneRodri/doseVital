const USERS_STORAGE_KEY = 'doseCertaUsers';


function saveAndRegister() {
    
    const usernameInput = document.getElementById('residenceUsername');
    const nameInput = document.getElementById('residenceName');
    const passwordInput = document.getElementById('residencePassword');
    const phoneInput = document.getElementById('residencePhone');
    const emailInput = document.getElementById('residenceEmail');
    const responsibleInput = document.getElementById('responsibleName');
    const typeInput = document.getElementById('residenceType');
    const errorElement = document.getElementById('configError');
    
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const responsible = responsibleInput.value.trim();
    const type = typeInput.value;

    errorElement.textContent = ''; 

    
    if (!username || !password || !name || !email) {
        errorElement.textContent = 'Por favor, preencha todos os campos obrigatórios.';
        return;
    }
    
    if (/\s/.test(username)) {
        errorElement.textContent = 'O nome de usuário não pode conter espaços.';
        return;
    }
    const allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    const userExists = allUsers.some(user => user.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
        errorElement.textContent = 'Este nome de usuário já está em uso. Tente outro.';
        return;
    }

    const newUserObject = {
        username: username,      
        password: password,      
        residenceConfig: {       
            name: name,
            phone: phone,
            email: email,
            responsible: responsible,
            type: type
        },
        patients: []             
    };

    
    allUsers.push(newUserObject);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));

    alert("Conta criada com sucesso! Você será redirecionado para o painel.");
    
    localStorage.setItem('loggedInUser', username); 
    window.location.href = 'index.html'; 
}