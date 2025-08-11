document.addEventListener('DOMContentLoaded', () => {
    const relatorioTableBody = document.querySelector('#relatorioTable tbody');
    const totalGanhosSpan = document.getElementById('totalGanhos');
    const filtroForm = document.getElementById('filtroForm');

    // Função para formatar valor em reais
    function formatarReal(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Função para calcular ganho conforme fórmula
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

        // Aplicar filtro de datas
        if (filtros.dataInicio) {
            const dataInicio = new Date(filtros.dataInicio);
            query = query.where('dataCadastro', '>=', dataInicio);
        }
        if (filtros.dataFim) {
            // Para incluir o dia todo até 23:59:59
            const dataFim = new Date(filtros.dataFim);
            dataFim.setHours(23, 59, 59, 999);
            query = query.where('dataCadastro', '<=', dataFim);
        }
        // Filtrar por statusCarga se fornecido
        if (filtros.statusCargaFiltro) {
            query = query.where('statusCarga', '==', filtros.statusCargaFiltro);
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
          <td>${c.numeroNota || ''}</td>
          <td>${c.numeroCTE || ''}</td>
          <td>${c.dataCadastro ? c.dataCadastro.toDate().toLocaleString() : ''}</td>
          <td>${typeof c.pesoKg === 'number' ? c.pesoKg.toFixed(2) : ''}</td>
          <td>${c.statusCarga || ''}</td>
          <td>${c.vale ? 'Sim' : 'Não'}</td>
          <td>${formatarReal(ganho)}</td>
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
            statusCargaFiltro: filtroForm.statusCargaFiltro.value
        };

        carregarRelatorio(filtros);
    });

    // Carrega relatório inicial sem filtros
    carregarRelatorio();
});
