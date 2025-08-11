// js/config.js

// O db já deve estar criado em firebase-config.js, não declare aqui.

const btnExportarCSV = document.getElementById('btnExportarCSV');
const btnExportarPDF = document.getElementById('btnExportarPDF');
const btnImportar = document.getElementById('btnImportar');
const importFileInput = document.getElementById('importFile');
const btnLogout = document.getElementById('btn-logout');

// Função auxiliar para exportar array de objetos para CSV
function exportToCSV(dataArray, fileName) {
    if (!dataArray.length) {
        alert('Não há dados para exportar.');
        return;
    }
    const headers = Object.keys(dataArray[0]);
    const csvRows = [];
    csvRows.push(headers.join(';')); // Cabeçalho
    for (const row of dataArray) {
        const values = headers.map(header => {
            let val = row[header];
            if (val === null || val === undefined) val = '';
            return `"${String(val).replace(/"/g, '""')}"`; // Escapa aspas
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

// Exportar cargas para CSV
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

// Exportar cargas para PDF com jsPDF + autoTable estilizado
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

        // Título
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text('Relatório de Cargas', 14, 22);

        // Gerar tabela estilizada com autoTable
        doc.autoTable({
            startY: 30,
            head: [columns],
            body: cargasArray,
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [30, 60, 114], // azul escuro
                textColor: 255,
                halign: 'center',
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [240, 244, 251], // azul clarinho
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

// Importar arquivo CSV e salvar no Firestore (atenção: substitui ou adiciona!)
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
                if (valores.length !== headers.length) continue; // evita linhas quebradas
                const docData = {};
                headers.forEach((h, idx) => {
                    docData[h] = valores[idx] || '';
                });

                // Converter pesoKg para número
                if (docData.pesoKg) {
                    docData.pesoKg = parseFloat(docData.pesoKg.replace(',', '.')) || 0;
                }

                // Ajustar booleanos e datas se quiser

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

// Eventos

// Logout - só se existir o botão para evitar erro
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        firebase.auth().signOut()
            .then(() => {
                window.location.href = 'login.html'; // ajuste o caminho conforme sua página de login
            })
            .catch((error) => {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao sair, tente novamente.');
            });
    });
}

// Exportar CSV - só se existir o botão
if (btnExportarCSV) {
    btnExportarCSV.addEventListener('click', exportarCargasCSV);
}

// Exportar PDF - só se existir o botão
if (btnExportarPDF) {
    btnExportarPDF.addEventListener('click', () => {
        // Carregar jsPDF e autoTable dinamicamente se não estiverem carregados
        if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.autoTable) {
            const script1 = document.createElement('script');
            script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script1.onload = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
                script2.onload = exportarCargasPDF;
                document.head.appendChild(script2);
            };
            document.head.appendChild(script1);
        } else {
            exportarCargasPDF();
        }
    });
}

// Importar CSV - só se os elementos existirem
if (btnImportar && importFileInput) {
    btnImportar.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', () => {
        if (importFileInput.files.length === 0) return;
        const file = importFileInput.files[0];
        importarCSVparaFirestore(file);
    });
}
