// 1. NOTIFICATION SYSTEM (Toasts style)
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

// 2. SESSION SECURITY CHECK
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
    window.location.href = 'auth.html';
}

// 3. INITIALIZATION
document.getElementById('user-welcome').innerText = `Welcome, ${currentUser}`;
fetchPasswords();

// 4. EVENT LISTENERS
document.getElementById('btn-enregistrer').addEventListener('click', savePassword);
document.getElementById('btn-logout').addEventListener('click', logout);

document.getElementById('btn-add-trigger').addEventListener('click', () => {
    const form = document.getElementById('add-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

// 5. FETCH & DISPLAY PASSWORDS
async function fetchPasswords() {
    try {
        const response = await fetch(`http://127.0.0.1:8000/passwords/${currentUser}`);
        const passwords = await response.json();
        
        const displayContainer = document.getElementById('passwords-display');
        displayContainer.innerHTML = ''; 

        if (passwords.length === 0) {
            displayContainer.innerHTML = `<p style="text-align:center;color:#64748b;margin-top:20px;">No stored passwords yet.</p>`;
            return;
        }

        passwords.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'password-row';
            
            // RENDU : Si un email existe, on l'affiche proprement en dessous du nom
            const identityDisplay = item.email 
                ? `<div><strong>${item.acc_name}</strong><br><small style="color:#64748b; font-size:0.85em;">${item.email}</small></div>`
                : `<div><strong>${item.acc_name}</strong></div>`;

            row.innerHTML = `
                <div class="site-name">${identityDisplay}</div>
                <div class="password-text" id="pwd-${index}">••••••••</div>
                <div class="row-actions">
                    <button class="btn-action btn-reveal" data-index="${index}" data-password="${item.password}">👁️ Reveal</button>
                    <button class="btn-action btn-copy" data-password="${item.password}">📋 Copy</button>
                </div>
            `;
            displayContainer.appendChild(row);
        });

        // Attribution dynamique des Events pour éviter le bug des onclick globaux
        document.querySelectorAll('.btn-reveal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                const pwd = e.currentTarget.getAttribute('data-password');
                togglePasswordVisibility(idx, pwd);
            });
        });

        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pwd = e.currentTarget.getAttribute('data-password');
                copyToClipboard(pwd);
            });
        });

    } catch { 
        showNotification("Failed to fetch passwords.", "error"); 
    }
}

// 6. PASSWORD ACTIONS
function togglePasswordVisibility(id, clearPassword) {
    const element = document.getElementById(`pwd-${id}`);
    if (element.innerText === '••••••••') {
        element.innerText = clearPassword;
    } else {
        element.innerText = '••••••••';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard!", "success");
}

// 7. SAVE PASSWORD (Acc name & Optional Email)
async function savePassword() {
    const acc_name = document.getElementById('site').value;
    const email = document.getElementById('email').value; // Récupère le champ optionnel
    const password = document.getElementById('password').value;

    if (!acc_name || !password) {
        return showNotification("Please fill in all required fields (*)", "error");
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser, acc_name: acc_name, email: email, password: password })
        });
        
        const result = await response.json();
        showNotification(result.status, "success");

        // Reset
        document.getElementById('site').value = '';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('add-form').style.display = 'none';
        fetchPasswords(); 
    } catch { 
        showNotification("Failed to save password.", "error"); 
    }
}

// 8. LOGOUT SYSTEM
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}

// Permet de sauvegarder le mot de passe en faisant Entrée dans n'importe quel champ du formulaire d'ajout
document.getElementById('site').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') savePassword();
});

document.getElementById('email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') savePassword();
});

document.getElementById('password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') savePassword();
});