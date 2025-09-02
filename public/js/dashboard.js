document.addEventListener('DOMContentLoaded', () => {
    const inputMes = document.getElementById('kpi-month');
    const btnAtualizar = document.getElementById('kpi-refresh');

    const elTotalCargas = document.getElementById('kpi-total-cargas');
    const elCargasFinalizadas = document.getElementById('kpi-cargas-finalizadas');
    const elAReceber = document.getElementById('kpi-cargas-areceber');
    const elTotalGanhos = document.getElementById('kpi-total-ganhos');
    const elMediaGanho = document.getElementById('kpi-media-ganho');

    const cargasRef = db.collection('cargas');

    function formatarReal(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function calcularGanho(pesoKg, vale) {
        let ganho = (Number(pesoKg) || 0) * 120 * 0.00011;
        if (vale) ganho -= 80;
        return ganho > 0 ? ganho : 0;
    }

    function getRangeDoMes(valorMonth) {
        let ano, mes;
        if (valorMonth && /^\d{4}-\d{2}$/.test(valorMonth)) {
            [ano, mes] = valorMonth.split('-').map(Number);
        } else {
            const agora = new Date();
            ano = agora.getFullYear();
            mes = agora.getMonth() + 1;
        }
        const inicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
        const fim = new Date(ano, mes, 0, 23, 59, 59, 999);
        return { inicio, fim };
    }

    // Nova função de animação com decimais e passo proporcional
    function animarNumero(elemento, valorFinal, isCurrency = false, duration = 800) {
        let start = 0;
        const steps = 60; // 60 frames
        const increment = valorFinal / steps;
        let currentStep = 0;

        const stepFunc = () => {
            currentStep++;
            start += increment;
            if (currentStep >= steps) start = valorFinal;

            elemento.textContent = isCurrency ? formatarReal(start) : Math.floor(start);

            if (currentStep < steps) {
                requestAnimationFrame(stepFunc);
            }
        };
        requestAnimationFrame(stepFunc);
    }

    async function carregarKPIs() {
        if (!inputMes.value) {
            const now = new Date();
            inputMes.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        const { inicio, fim } = getRangeDoMes(inputMes.value);

        let query = cargasRef.where('dataCadastro', '>=', inicio).where('dataCadastro', '<=', fim);

        try {
            const snap = await query.get();

            let total = 0;
            let finalizadas = 0;
            let aReceber = 0;
            let totalGanhos = 0;

            snap.forEach(doc => {
                total++;
                const c = doc.data();
                const status = (c.statusCarga || '').trim();
                const pagamento = (c.statusPagamento || '').trim();
                const peso = Number(c.pesoKg) || 0;
                const vale = !!c.vale;

                if (status === 'Finalizada') finalizadas++;
                if (pagamento.toLowerCase() !== 'pago') aReceber++;

                totalGanhos += calcularGanho(peso, vale);
            });

            const mediaGanho = total > 0 ? totalGanhos / total : 0;

            // Animação
            animarNumero(elTotalCargas, total);
            animarNumero(elCargasFinalizadas, finalizadas);
            animarNumero(elAReceber, aReceber);
            animarNumero(elTotalGanhos, totalGanhos, true);
            animarNumero(elMediaGanho, mediaGanho, true);

        } catch (err) {
            console.error('Erro ao carregar KPIs:', err);
            alert('Erro ao carregar KPIs. Veja o console.');
        }
    }

    btnAtualizar.addEventListener('click', () => carregarKPIs());

    carregarKPIs();
});
