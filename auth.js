// 1. NOTIFICATION SYSTEM (Toasts format)
function showNotification(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.innerText = message;
    toast.className = 'toast-notification'; 
    toast.classList.add(type === 'success' ? 'toast-success' : 'toast-error', 'show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

let authMode = 'login'; 

// 2. EVENT LISTENERS
document.getElementById('tab-login').addEventListener('click', () => switchAuthMode('login'));
document.getElementById('tab-signup').addEventListener('click', () => switchAuthMode('signup'));
document.getElementById('btn-auth-action').addEventListener('click', handleAuth);

function switchAuthMode(mode) {
    authMode = mode;
    
    // On attrape le conteneur
    const tabsContainer = document.querySelector('.auth-tabs');
    
    // On ajoute ou retire la classe pour déplacer le slider arrondi en CSS
    if (mode === 'signup') {
        tabsContainer.classList.add('signup-active');
    } else {
        tabsContainer.classList.remove('signup-active');
    }
    
    // Gère la couleur du texte (actif ou éteint)
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
    
    // Change le texte du bouton d’action
    document.getElementById('btn-auth-action').innerText = mode === 'login' ? 'Log In' : 'Sign Up';
}

// 3. API AUTH HANDLING
async function handleAuth() {
    const username = document.getElementById('auth-username').value;
    const masterPassword = document.getElementById('auth-password').value;

    if (!username || !masterPassword) {
        return showNotification("Please fill in all fields!", "error");
    }

    const endpoint = authMode === 'login' ? 'login' : 'register';

    try {
        const response = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, master_password: masterPassword })
        });
        
        const result = await response.json();

        if (response.ok) {
            if (authMode === 'login') {
                localStorage.setItem('currentUser', username);
                window.location.href = 'dashboard.html';
            } else {
                showNotification("Account created successfully! You can now log in.", "success");
                switchAuthMode('login');
                // On vide le champ password par confort
                document.getElementById('auth-password').value = '';
            }
        } else {
            showNotification(result.detail || "Authentication failed.", "error");
        }
    } catch {
        showNotification("Unable to connect to the authentication server.", "error");
    }
}

// Permet de valider en appuyant sur Entrée dans les champs Username ou Password
document.getElementById('auth-username').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuth();
});

document.getElementById('auth-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuth();
});