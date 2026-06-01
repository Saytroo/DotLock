
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
    window.location.href = '/'; 
}

document.getElementById('user-welcome').innerText = `Welcome, ${currentUser}`;


fetchPasswords();


document.getElementById('btn-enregistrer').addEventListener('click', savePassword);
document.getElementById('btn-logout').addEventListener('click', logout);

document.getElementById('btn-add-trigger').addEventListener('click', () => {
    const form = document.getElementById('add-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});


document.getElementById('site').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') savePassword();
});
document.getElementById('email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') savePassword();
});
document.getElementById('password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') savePassword();
});


async function fetchPasswords() {
    try {
       
        const response = await fetch(`/passwords/${currentUser}`);
        const passwords = await response.json();
        
        const vaultList = document.getElementById('vault-list');
        vaultList.innerHTML = ''; 
        
        if (passwords.length === 0) {
            vaultList.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No passwords stored yet.</p>';
            return;
        }

        passwords.forEach((pwd, index) => {
            const row = document.createElement('div');
            row.className = 'password-row';
            row.innerHTML = `
                <span class="site-name">${pwd.acc_name} ${pwd.email ? `<small style="display:block; font-weight:normal; color:var(--text-muted);">${pwd.email}</small>` : ''}</span>
                <span class="password-text" id="pass-${index}">••••••••</span>
                <div class="row-actions">
                    <button class="btn-action" onclick="togglePassword(${index}, '${pwd.password}')">👁️</button>
                    <button class="btn-action" onclick="copyToClipboard('${pwd.password}')">📋</button>
                </div>
            `;
            vaultList.appendChild(row);
        });
    } catch {
        showNotification("Failed to load passwords.", "error");
    }
}


async function savePassword() {
    const acc_name = document.getElementById('site').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!acc_name || !password) {
        return showNotification("Please fill in all required fields (*)", "error");
    }

    try {
    
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser,
                acc_name: acc_name,
                email: email,
                password: password
            })
        });

        if (response.ok) {
            showNotification(`Password for ${acc_name} saved!`, "success");
            
       
            document.getElementById('site').value = '';
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('add-form').style.display = 'none';
            
          
            fetchPasswords();
        } else {
            showNotification("Failed to save password.", "error");
        }
    } catch {
        showNotification("Server error.", "error");
    }
}


function togglePassword(index, clearPassword) {
    const el = document.getElementById(`pass-${index}`);
    if (el.innerText === '••••••••') {
        el.innerText = clearPassword;
        el.style.letterSpacing = 'normal';
    } else {
        el.innerText = '••••••••';
        el.style.letterSpacing = '3px';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard!", "success");
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = message;
    toast.className = 'toast-notification'; 
    toast.classList.add(type === 'success' ? 'toast-success' : 'toast-error', 'show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
