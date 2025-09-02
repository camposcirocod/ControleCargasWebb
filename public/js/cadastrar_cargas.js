// js/cadastrar_cargas.js

document.getElementById('cargaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Pega valores do formulário
    const numeroNota = document.getElementById('numeroNota').value.trim();
    const numeroCTE = document.getElementById('numeroCTE').value.trim();
    const pesoKg = parseFloat(document.getElementById('pesoKg').value);
    const statusCarga = document.getElementById('statusCarga').value;
    const statusPagamento = document.getElementById('statusPagamento').value;
    const vale = document.getElementById('vale').checked;

    // Validação simples
    if (!numeroNota || !numeroCTE || isNaN(pesoKg) || !statusCarga || !statusPagamento) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    try {
        // Salvar no Firestore na coleção "cargas"
        await db.collection('cargas').add({
            numeroNota,
            numeroCTE,
            pesoKg,
            statusCarga,
            statusPagamento,
            vale,
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
        });

        alert('Carga salva com sucesso!');
        e.target.reset(); // limpa o formulário

    } catch (error) {
        console.error('Erro ao salvar carga:', error);
        alert('Erro ao salvar a carga, tente novamente.');
    }
});
