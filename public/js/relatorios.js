document.addEventListener('DOMContentLoaded', () => {
    const relatorioTableBody = document.querySelector('#relatorioTable tbody');
    const totalGanhosSpan = document.getElementById('totalGanhos');
    const filtroForm = document.getElementById('filtroForm');

    function formatarReal(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function calcularGanho(pesoKg, vale) {
        let ganho = pesoKg * 120 * 0.00011;
        if (vale) {
            ganho -= 80;
        }
        return ganho > 0 ? ganho : 0;
    }

    async function carregarRelatorio(filtros = {}) {
        relatorioTableBody.innerHTML = '';

        let query = db.collection('cargas').orderBy('dataCadastro', 'desc');

        if (filtros.dataInicio) {
            const dataInicio = new Date(filtros.dataInicio);
            query = query.where('dataCadastro', '>=', dataInicio);
        }
        if (filtros.dataFim) {
            const dataFim = new Date(filtros.dataFim);
            dataFim.setHours(23, 59, 59, 999);
            query = query.where('dataCadastro', '<=', dataFim);
        }
        if (filtros.statusCargaFiltro) {
            query = query.where('statusCarga', '==', filtros.statusCargaFiltro);
        }
        if (filtros.statusPagamentoFiltro) {
            query = query.where('statusPagamento', '==', filtros.statusPagamentoFiltro);
        }

        try {
            const snapshot = await query.get();
            let totalGanhos = 0;

            snapshot.forEach(doc => {
                const c = doc.data();
                const ganho = calcularGanho(c.pesoKg || 0, c.vale || false);
                totalGanhos += ganho;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Nº Nota">${c.numeroNota || ''}</td>
                    <td data-label="Nº CTE">${c.numeroCTE || ''}</td>
                    <td data-label="Data/Hora Cadastro">${c.dataCadastro ? c.dataCadastro.toDate().toLocaleString() : ''}</td>
                    <td data-label="Peso (Kg)">${typeof c.pesoKg === 'number' ? c.pesoKg.toFixed(2) : ''}</td>
                    <td data-label="Status Carga">${c.statusCarga || ''}</td>
                    <td data-label="Status Pagamento">${c.statusPagamento || ''}</td>
                    <td data-label="Vale">${c.vale ? 'Sim' : 'Não'}</td>
                    <td data-label="Ganho">${formatarReal(ganho)}</td>
                `;
                relatorioTableBody.appendChild(tr);
            });

            totalGanhosSpan.textContent = formatarReal(totalGanhos);

        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
            alert('Erro ao carregar relatório, veja o console.');
        }
    }

    filtroForm.addEventListener('submit', e => {
        e.preventDefault();

        const filtros = {
            dataInicio: filtroForm.dataInicio.value,
            dataFim: filtroForm.dataFim.value,
            statusCargaFiltro: filtroForm.statusCargaFiltro.value,
            statusPagamentoFiltro: filtroForm.statusPagamentoFiltro.value
        };

        carregarRelatorio(filtros);
    });

    carregarRelatorio();
});
