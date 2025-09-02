// js/listar_cargas.js

// NÃO declare const db = ... aqui se já declarou no firebase-config.js

const cargasTableBody = document.querySelector('#cargasTable tbody');
const btnEditar = document.getElementById('btnEditar');
const btnExcluir = document.getElementById('btnExcluir');

const modalEdit = document.getElementById('modalEdit');
const editForm = document.getElementById('editForm');

let cargas = [];
let cargaSelecionadaIndex = null;

function carregarCargas() {
    db.collection('cargas').orderBy('dataCadastro', 'desc').get()
        .then(snapshot => {
            cargas = [];
            cargasTableBody.innerHTML = '';

            snapshot.forEach(doc => {
                const carga = { id: doc.id, ...doc.data() };
                cargas.push(carga);

                const tr = document.createElement('tr');
                tr.dataset.index = cargas.length - 1;

                tr.innerHTML = `
  <td data-label="Nº Nota">${carga.numeroNota || ''}</td>
  <td data-label="Nº CTE">${carga.numeroCTE || ''}</td>
  <td data-label="Peso (Kg)">${typeof carga.pesoKg === 'number' ? carga.pesoKg.toFixed(2) : ''}</td>
  <td data-label="Status Carga">${carga.statusCarga || ''}</td>
  <td data-label="Status Pagamento">${carga.statusPagamento || ''}</td>
  <td data-label="Vale">${carga.vale ? 'Sim' : 'Não'}</td>
  <td data-label="Data/Hora Cadastro">${carga.dataCadastro ? carga.dataCadastro.toDate().toLocaleString() : ''}</td>
`;


                tr.addEventListener('click', () => selecionarLinha(tr.dataset.index));
                cargasTableBody.appendChild(tr);
            });

            atualizarBotoes();
        })
        .catch(error => {
            console.error("Erro ao carregar cargas: ", error);
            alert("Erro ao carregar cargas, veja o console.");
        });
}

function selecionarLinha(index) {
    cargaSelecionadaIndex = index;

    [...cargasTableBody.children].forEach((tr, i) => {
        tr.classList.toggle('selecionado', i == index);
    });

    atualizarBotoes();
}

function atualizarBotoes() {
    const habilitar = cargaSelecionadaIndex !== null;
    btnEditar.disabled = !habilitar;
    btnExcluir.disabled = !habilitar;
    btnEditar.setAttribute('aria-disabled', !habilitar);
    btnExcluir.setAttribute('aria-disabled', !habilitar);
}

btnEditar.addEventListener('click', () => {
    if (cargaSelecionadaIndex === null) return;

    const carga = cargas[cargaSelecionadaIndex];

    // Preenche o formulário do modal
    document.getElementById('editId').value = carga.id;
    document.getElementById('editNumeroNota').value = carga.numeroNota || '';
    document.getElementById('editNumeroCTE').value = carga.numeroCTE || '';
    document.getElementById('editPesoKg').value = typeof carga.pesoKg === 'number' ? carga.pesoKg : '';
    document.getElementById('editStatusCarga').value = carga.statusCarga || '';
    document.getElementById('editStatusPagamento').value = carga.statusPagamento || '';
    document.getElementById('editVale').checked = carga.vale || false;

    // Exibe o modal
    modalEdit.style.display = 'flex';
    modalEdit.setAttribute('aria-hidden', 'false');
});

document.getElementById('cancelEdit').addEventListener('click', () => {
    modalEdit.style.display = 'none';
    modalEdit.setAttribute('aria-hidden', 'true');
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const updatedData = {
        numeroNota: document.getElementById('editNumeroNota').value.trim(),
        numeroCTE: document.getElementById('editNumeroCTE').value.trim(),
        pesoKg: parseFloat(document.getElementById('editPesoKg').value),
        statusCarga: document.getElementById('editStatusCarga').value,
        statusPagamento: document.getElementById('editStatusPagamento').value,
        vale: document.getElementById('editVale').checked,
    };

    if (!updatedData.numeroNota || !updatedData.numeroCTE || isNaN(updatedData.pesoKg) ||
        !updatedData.statusCarga || !updatedData.statusPagamento) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    try {
        await db.collection('cargas').doc(id).update(updatedData);
        alert('Carga atualizada com sucesso!');
        modalEdit.style.display = 'none';
        modalEdit.setAttribute('aria-hidden', 'true');
        carregarCargas();
        cargaSelecionadaIndex = null;
        atualizarBotoes();
    } catch (error) {
        console.error('Erro ao atualizar carga:', error);
        alert('Erro ao atualizar carga, veja o console.');
    }
});

btnExcluir.addEventListener('click', () => {
    if (cargaSelecionadaIndex === null) return;
    const carga = cargas[cargaSelecionadaIndex];
    if (confirm(`Deseja realmente excluir a carga Nº Nota ${carga.numeroNota}?`)) {
        db.collection('cargas').doc(carga.id).delete()
            .then(() => {
                alert('Carga excluída com sucesso!');
                cargaSelecionadaIndex = null;
                carregarCargas();
                atualizarBotoes();
            })
            .catch(error => {
                console.error("Erro ao excluir carga: ", error);
                alert("Erro ao excluir a carga, veja o console.");
            });
    }
});

// Garantir que o modal esteja fechado ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    modalEdit.style.display = 'none';
    modalEdit.setAttribute('aria-hidden', 'true');
    carregarCargas();
});
