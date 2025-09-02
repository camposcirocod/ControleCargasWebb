document.addEventListener('DOMContentLoaded', () => {
    fetch('menu.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('menu-container').innerHTML = html;

            // Toggle do menu
            const toggle = document.getElementById('menu-toggle');
            const menu = document.querySelector('.menu');

            if (toggle && menu) {
                toggle.addEventListener('click', () => {
                    menu.classList.toggle('active');
                });
            }

            // Logout
            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', () => {
                    // Se usar Firebase Auth, substitua essa parte pelo seu logout
                    console.log('Logout clicado');
                    // Exemplo logout firebase:
                    // firebase.auth().signOut().then(() => { window.location.href = 'login.html'; });
                    window.location.href = 'login.html';
                });
            }
        })
        .catch(err => console.error('Erro ao carregar menu:', err));
});
