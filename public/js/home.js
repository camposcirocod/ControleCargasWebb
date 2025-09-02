document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.querySelector('.menu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            firebase.auth().signOut()
                .then(() => window.location.href = 'login.html')
                .catch(() => alert('Erro ao sair, tente novamente.'));
        });
    }
});
