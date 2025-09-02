const urlParams = new URLSearchParams(window.location.search);
const cargaId = urlParams.get('id');

if (!cargaId) {
    alert('ID da carga não fornecido!');
    window.location.href = 'listar_cargas.html';
}

const db = firebase.firestore();

const form = document.getElementById('editCargaForm');
const inputId = document.getElementById('editId');
const inputNumeroNota = document.getElementById('editNumeroNota');
const inputNumeroCTE = document.getElementById('editNumeroCTE');
const inputPesoKg = document.getElementById('editPesoKg');
const selectStatusCarga = document.getElementById('editStatusCarga');
const selectStatusPagamento = document.getElementById('editStatusPagamento');
const checkboxVale = document.getElementById('editVale');

async function carregarDados() {
    try {
        const doc = await db.collection('cargas').doc(cargaId).get();
        if (!doc.exists) {
            alert('Carga não encontrada!');
            window.location.href = 'listar_cargas.html';
            return;
        }

        const c = doc.data();
        inputId.value = doc.id;
        inputNumeroNota.value = c.numeroNota || '';
        inputNumeroCTE.value = c.numeroCTE || '';
        inputPesoKg.value = c.pesoKg || '';
        selectStatusCarga.value = c.statusCarga || '';
        selectStatusPagamento.value = c.statusPagamento || '';
        checkboxVale.checked = c.vale || false;

    } catch (error) {
        console.error('Erro ao carregar dados da carga:', error);
        alert('Erro ao carregar dados, veja o console.');
    }
}

form.addEventListener('submit', async e => {
    e.preventDefault();

    const updatedData = {
        numeroNota: inputNumeroNota.value.trim(),
        numeroCTE: inputNumeroCTE.value.trim(),
        pesoKg: parseFloat(inputPesoKg.value),
        statusCarga: selectStatusCarga.value,
        statusPagamento: selectStatusPagamento.value,
        vale: checkboxVale.checked,
    };

    try {
        await db.collection('cargas').doc(cargaId).update(updatedData);
        alert('Carga atualizada com sucesso!');
        window.location.href = 'listar_cargas.html';
    } catch (error) {
        console.error('Erro ao atualizar carga:', error);
        alert('Erro ao atualizar carga, veja o console.');
    }
});

// Carrega dados ao abrir a página
carregarDados();
