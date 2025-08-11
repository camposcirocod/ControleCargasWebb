// js/auth.js
const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('error-msg');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const email = document.getElementById('emailLogin').value;
    const senha = document.getElementById('senhaLogin').value;

    try {
        await auth.signInWithEmailAndPassword(email, senha);
        window.location.href = 'dashboard.html';
    } catch (error) {
        errorMsg.textContent = 'Erro: ' + error.message;
    }
});
