
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


document.getElementById('tab-login').addEventListener('click', () => switchAuthMode('login'));
document.getElementById('tab-signup').addEventListener('click', () => switchAuthMode('signup'));
document.getElementById('btn-auth-action').addEventListener('click', handleAuth);


document.getElementById('auth-username').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuth();
});
document.getElementById('auth-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuth();
});

function switchAuthMode(mode) {
    authMode = mode;
    const tabsContainer = document.querySelector('.auth-tabs');
    
    if (mode === 'signup') {
        tabsContainer.classList.add('signup-active');
    } else {
        tabsContainer.classList.remove('signup-active');
    }
    
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
    document.getElementById('btn-auth-action').innerText = mode === 'login' ? 'Log In' : 'Sign Up';
}


async function handleAuth() {
    const username = document.getElementById('auth-username').value;
    const masterPassword = document.getElementById('auth-password').value;

    if (!username || !masterPassword) {
        return showNotification("Please fill in all fields!", "error");
    }

    const endpoint = authMode === 'login' ? 'login' : 'register';

    try {
       
        const response = await fetch(`/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, master_password: masterPassword })
        });
        
        const result = await response.json();

        if (response.ok) {
            if (authMode === 'login') {
                localStorage.setItem('currentUser', username);
           
                window.location.href = '/dashboard';
            } else {
                showNotification("Account created successfully! You can now log in.", "success");
                switchAuthMode('login');
                document.getElementById('auth-password').value = '';
            }
        } else {
            showNotification(result.detail || "Authentication failed.", "error");
        }
    } catch {
        showNotification("Unable to connect to the authentication server.", "error");
    }
}
