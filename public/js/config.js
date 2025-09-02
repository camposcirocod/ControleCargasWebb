// js/config.js

const btnExportarCSV = document.getElementById('btnExportarCSV');
const btnExportarPDF = document.getElementById('btnExportarPDF');
const btnImportar = document.getElementById('btnImportar');
const importFileInput = document.getElementById('importFile');
const btnLogout = document.getElementById('btn-logout');

const modalExport = document.getElementById('modalExport'); // O modal no HTML
const btnCancelarModal = document.getElementById('btnCancelarModal');
const filtroFormExport = document.getElementById('filtroFormExport');
const tituloModalExport = document.getElementById('tituloModalExport');

let tipoExportacaoAtual = null; // 'csv' ou 'pdf'

document.addEventListener('DOMContentLoaded', () => {
    // --- Carregar menu dinamicamente ---
    fetch('menu.html')
        .then(response => response.text())
        .then(html => {
            const menuContainer = document.getElementById('menu-container');
            if (menuContainer) {
                menuContainer.innerHTML = html;

                const btnMenu = document.getElementById('btn-menu');
                const menuLista = document.getElementById('menu-lista');
                if (btnMenu && menuLista) {
                    btnMenu.addEventListener('click', () => {
                        menuLista.style.display = menuLista.style.display === 'block' ? 'none' : 'block';
                    });
                }

                const btnLogoutMenu = document.getElementById('btn-logout');
                if (btnLogoutMenu) {
                    btnLogoutMenu.addEventListener('click', e => {
                        e.preventDefault();
                        firebase.auth().signOut()
                            .then(() => window.location.href = 'login.html')
                            .catch(err => {
                                console.error('Erro ao sair:', err);
                                alert('Erro ao sair, tente novamente.');
                            });
                    });
                }
            }
        })
        .catch(err => {
            console.error('Erro ao carregar menu:', err);
        });

    // Modal começa oculto
    if (modalExport) {
        modalExport.style.display = 'none';
        modalExport.setAttribute('aria-hidden', 'true');
    }

    // Abrir modal com filtro ao clicar em Exportar CSV
    if (btnExportarCSV) {
        btnExportarCSV.addEventListener('click', () => {
            tipoExportacaoAtual = 'csv';
            tituloModalExport.textContent = 'Exportar CSV - Filtros';
            filtroFormExport.reset();
            modalExport.style.display = 'flex';
            modalExport.setAttribute('aria-hidden', 'false');
        });
    }

    // Abrir modal com filtro ao clicar em Exportar PDF
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', () => {
            tipoExportacaoAtual = 'pdf';
            tituloModalExport.textContent = 'Exportar PDF - Filtros';
            filtroFormExport.reset();
            modalExport.style.display = 'flex';
            modalExport.setAttribute('aria-hidden', 'false');
        });
    }

    // Fechar modal ao clicar em Cancelar
    if (btnCancelarModal) {
        btnCancelarModal.addEventListener('click', () => {
            modalExport.style.display = 'none';
            modalExport.setAttribute('aria-hidden', 'true');
        });
    }

    // Confirmar exportação com filtro
    if (filtroFormExport) {
        filtroFormExport.addEventListener('submit', async (e) => {
            e.preventDefault();

            const filtros = {
                dataInicio: filtroFormExport.dataInicio.value,
                dataFim: filtroFormExport.dataFim.value,
                statusCarga: filtroFormExport.statusCarga.value,
            };

            modalExport.style.display = 'none';
            modalExport.setAttribute('aria-hidden', 'true');

            if (tipoExportacaoAtual === 'csv') {
                await exportarCargasCSVComFiltro(filtros);
            } else if (tipoExportacaoAtual === 'pdf') {
                await exportarCargasPDFComFiltro(filtros);
            }
        });
    }
});

// Função para exportar CSV com filtro
async function exportarCargasCSVComFiltro(filtros) {
    try {
        let query = db.collection('cargas').orderBy('dataCadastro', 'desc');

        if (filtros.dataInicio) {
            query = query.where('dataCadastro', '>=', new Date(filtros.dataInicio));
        }
        if (filtros.dataFim) {
            const dataFim = new Date(filtros.dataFim);
            dataFim.setHours(23, 59, 59, 999);
            query = query.where('dataCadastro', '<=', dataFim);
        }
        if (filtros.statusCarga) {
            query = query.where('statusCarga', '==', filtros.statusCarga);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            alert('Não há cargas para exportar com esses filtros.');
            return;
        }

        const cargasArray = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            cargasArray.push({
                id: doc.id,
                numeroNota: data.numeroNota || '',
                numeroCTE: data.numeroCTE || '',
                pesoKg: data.pesoKg || '',
                statusCarga: data.statusCarga || '',
                statusPagamento: data.statusPagamento || '',
                vale: data.vale ? 'Sim' : 'Não',
                dataCadastro: data.dataCadastro ? data.dataCadastro.toDate().toLocaleString() : ''
            });
        });

        exportToCSV(cargasArray, 'export_cargas_filtrado.csv');
    } catch (error) {
        console.error('Erro ao exportar cargas filtradas:', error);
        alert('Erro ao exportar cargas, veja o console.');
    }
}

// Função para exportar PDF com filtro
async function exportarCargasPDFComFiltro(filtros) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let query = db.collection('cargas').orderBy('dataCadastro', 'desc');

        if (filtros.dataInicio) {
            query = query.where('dataCadastro', '>=', new Date(filtros.dataInicio));
        }
        if (filtros.dataFim) {
            const dataFim = new Date(filtros.dataFim);
            dataFim.setHours(23, 59, 59, 999);
            query = query.where('dataCadastro', '<=', dataFim);
        }
        if (filtros.statusCarga) {
            query = query.where('statusCarga', '==', filtros.statusCarga);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            alert('Não há cargas para exportar com esses filtros.');
            return;
        }

        function calcularGanho(pesoKg, vale) {
            let ganho = pesoKg * 120 * 0.00011;
            if (vale) ganho -= 80;
            return ganho > 0 ? ganho : 0;
        }

        const cargasArray = [];
        let totalGanho = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const pesoKg = data.pesoKg || 0;
            const vale = data.vale || false;
            const ganho = calcularGanho(pesoKg, vale);
            totalGanho += ganho;

            cargasArray.push([
                data.numeroNota || '',
                data.numeroCTE || '',
                typeof pesoKg === 'number' ? pesoKg.toFixed(2) : '',
                data.statusCarga || '',
                data.statusPagamento || '',
                vale ? 'Sim' : 'Não',
                data.dataCadastro ? data.dataCadastro.toDate().toLocaleString() : '',
                ganho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            ]);
        });

        const columns = [
            'Nº Nota',
            'Nº CTE',
            'Peso (Kg)',
            'Status Carga',
            'Status Pagamento',
            'Vale',
            'Data/Hora Cadastro',
            'Valor da Carga'
        ];

        // Título
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text('Relatório de Cargas', 14, 22);

        // Informações fixas abaixo do título, menor e cinza escuro
        doc.setFontSize(10);
        doc.setTextColor(100);
        const infoYStart = 30;
        doc.text('Douglas Ciro de Campos', 14, infoYStart);
        doc.text('Telefone: (17) 99207-7312', 14, infoYStart + 6);
        doc.text('Email: camposciro3@outlook.com', 14, infoYStart + 12);

        // Tabela começa um pouco mais abaixo para não sobrepor o texto fixo
        doc.autoTable({
            startY: infoYStart + 20,
            head: [columns],
            body: cargasArray,
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [30, 60, 114],
                textColor: 255,
                halign: 'center',
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [240, 244, 251],
            },
            margin: { left: 14, right: 14 },
            tableLineColor: [30, 60, 114],
            tableLineWidth: 0.2,
        });

        // Total abaixo da tabela
        const finalY = doc.lastAutoTable.finalY || infoYStart + 40;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total: ${totalGanho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, finalY + 10);

        doc.save('relatorio_cargas_filtrado.pdf');
    } catch (error) {
        console.error('Erro ao exportar PDF filtrado:', error);
        alert('Erro ao exportar PDF, veja o console.');
    }
}


// Função auxiliar para exportar array de objetos para CSV (seu código original)
function exportToCSV(dataArray, fileName) {
    if (!dataArray.length) {
        alert('Não há dados para exportar.');
        return;
    }
    const headers = Object.keys(dataArray[0]);
    const csvRows = [];
    csvRows.push(headers.join(';'));
    for (const row of dataArray) {
        const values = headers.map(header => {
            let val = row[header];
            if (val === null || val === undefined) val = '';
            return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(';'));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Seu código de exportar CSV e PDF sem filtro (mantido só por segurança, pode remover se não usar mais)
async function exportarCargasCSV() {
    try {
        const snapshot = await db.collection('cargas').get();
        if (snapshot.empty) {
            alert('Não há cargas para exportar.');
            return;
        }
        const cargasArray = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            cargasArray.push({
                id: doc.id,
                numeroNota: data.numeroNota || '',
                numeroCTE: data.numeroCTE || '',
                pesoKg: data.pesoKg || '',
                statusCarga: data.statusCarga || '',
                statusPagamento: data.statusPagamento || '',
                vale: data.vale ? 'Sim' : 'Não',
                dataCadastro: data.dataCadastro ? data.dataCadastro.toDate().toLocaleString() : ''
            });
        });
        exportToCSV(cargasArray, 'export_cargas.csv');
    } catch (error) {
        console.error('Erro ao exportar cargas:', error);
        alert('Erro ao exportar cargas, veja o console.');
    }
}

async function exportarCargasPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const snapshot = await db.collection('cargas').get();
        if (snapshot.empty) {
            alert('Não há cargas para exportar.');
            return;
        }

        const cargasArray = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            cargasArray.push([
                data.numeroNota || '',
                data.numeroCTE || '',
                typeof data.pesoKg === 'number' ? data.pesoKg.toFixed(2) : '',
                data.statusCarga || '',
                data.statusPagamento || '',
                data.vale ? 'Sim' : 'Não',
                data.dataCadastro ? data.dataCadastro.toDate().toLocaleString() : ''
            ]);
        });

        const columns = [
            'Nº Nota',
            'Nº CTE',
            'Peso (Kg)',
            'Status Carga',
            'Status Pagamento',
            'Vale',
            'Data/Hora Cadastro',
        ];

        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text('Relatório de Cargas', 14, 22);

        doc.autoTable({
            startY: 30,
            head: [columns],
            body: cargasArray,
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [30, 60, 114],
                textColor: 255,
                halign: 'center',
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [240, 244, 251],
            },
            margin: { left: 14, right: 14 },
            tableLineColor: [30, 60, 114],
            tableLineWidth: 0.2,
        });

        doc.save('relatorio_cargas.pdf');
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        alert('Erro ao exportar PDF, veja o console.');
    }
}

// Importar CSV para Firestore (igual seu código)
function importarCSVparaFirestore(file) {
    const reader = new FileReader();
    reader.onload = async e => {
        const text = e.target.result;
        const linhas = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (linhas.length < 2) {
            alert('Arquivo CSV inválido ou sem dados.');
            return;
        }
        const headers = linhas[0].split(';').map(h => h.trim());
        try {
            for (let i = 1; i < linhas.length; i++) {
                const valores = linhas[i].split(';').map(v => v.replace(/(^"|"$)/g, '').trim());
                if (valores.length !== headers.length) continue;
                const docData = {};
                headers.forEach((h, idx) => {
                    docData[h] = valores[idx] || '';
                });

                if (docData.pesoKg) {
                    docData.pesoKg = parseFloat(docData.pesoKg.replace(',', '.')) || 0;
                }

                await db.collection('cargas').add(docData);
            }
            alert('Importação concluída com sucesso!');
        } catch (err) {
            console.error('Erro na importação:', err);
            alert('Erro durante importação, veja o console.');
        }
    };
    reader.readAsText(file);
}

// Eventos logout, exportar, importar

if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        firebase.auth().signOut()
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch(error => {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao sair, tente novamente.');
            });
    });
}

// Agora só adicionamos exportação sem filtro **se quiser** manter também

if (btnExportarCSV) {
    btnExportarCSV.addEventListener('click', (e) => {
        // Não chama exportar direto, pois abrimos modal
        e.preventDefault();
        // Modal abrirá pelo listener acima no DOMContentLoaded
    });
}

if (btnExportarPDF) {
    btnExportarPDF.addEventListener('click', (e) => {
        // Não chama exportar direto, pois abrimos modal
        e.preventDefault();
        // Modal abrirá pelo listener acima no DOMContentLoaded
    });
}

if (btnImportar && importFileInput) {
    btnImportar.addEventListener('click', () => importFileInput.click());

    importFileInput.addEventListener('change', () => {
        if (importFileInput.files.length === 0) return;
        const file = importFileInput.files[0];
        importarCSVparaFirestore(file);
    });
}
