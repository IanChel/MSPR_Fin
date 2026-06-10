// Configuration Tailwind Typography : Outfit & Inter fonts included via CDN
// Logic script for GouvData ML predictions

document.addEventListener('DOMContentLoaded', () => {

    const API_URL = '/api/results';
    let globalLevelsData = {};

    // Charger les données de l'API
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            updateKPIs(data.summary);
            globalLevelsData = data.levels;

            // Rendre par défaut le niveau Région
            renderTable('region', 'Région');

            // Rendre les diagrammes
            renderPolarChart('chartReal', data.political_real);
            renderPolarChart('chartPred', data.political_predicted);

            setupTabs();
        })
        .catch(err => console.error("API Error: ", err));

    function setupTabs() {
        const tabs = document.querySelectorAll('.level-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.currentTarget;
                if (target.getAttribute('data-level') === 'dataviz') {
                    // Update tab styles for dataviz specifically
                    tabs.forEach(t => {
                        t.classList.remove('active', 'text-blue-700', 'bg-blue-50/80', 'text-purple-700', 'bg-purple-50', 'shadow-sm', 'border-blue-100');
                        t.classList.add('text-gray-500', 'border-transparent');
                    });
                    target.classList.add('active', 'text-purple-700', 'bg-purple-50', 'shadow-sm');
                    target.classList.remove('text-gray-500', 'border-transparent');
                    showSection('dataviz');
                    renderDataviz();
                    return;
                }

                // Remove active styling from all tabs
                tabs.forEach(t => {
                    t.classList.remove('active', 'text-blue-700', 'bg-blue-50/80', 'text-purple-700', 'bg-purple-50', 'shadow-sm', 'border-blue-100');
                    t.classList.add('text-gray-500', 'border-transparent');
                });

                // Add active styling to clicked tab
                target.classList.add('active', 'text-blue-700', 'bg-blue-50/80', 'shadow-sm', 'border-blue-100');
                target.classList.remove('text-gray-500', 'border-transparent');

                showSection('table');

                // Fetch level ID and text name
                const levelId = target.getAttribute('data-level');
                const levelName = target.innerText.trim().substring(3); // Remove emoji

                // Opacity animation transition
                const tableCont = document.getElementById('table-container');
                tableCont.style.opacity = '0.3';
                setTimeout(() => {
                    renderTable(levelId, levelName);
                    tableCont.style.opacity = '1';
                }, 200);
            });
        });
    }

    function updateKPIs(summary) {
        document.getElementById('kpi-records').textContent = summary.total_records;
        document.getElementById('kpi-model-acc').textContent = summary.model_accuracy + '%';
        document.getElementById('kpi-dept-acc').textContent = summary.dept_accuracy + '%';
        document.getElementById('kpi-noise').textContent = "σ = 0.45";
        document.getElementById('kpi-flip').textContent = "15%";

        // Animate Progress Bars
        setTimeout(() => {
            document.getElementById('pb-model-acc').style.width = summary.model_accuracy + '%';
            document.getElementById('pb-dept-acc').style.width = summary.dept_accuracy + '%';
        }, 300);
    }

    function renderTable(levelId, levelName) {
        if (!globalLevelsData || !globalLevelsData[levelId]) return;

        const entities = globalLevelsData[levelId];
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = ''; // clear table

        // Update Table Headers
        document.getElementById('table-title').textContent = "Cartographie IA vs Réalité 2022";
        document.getElementById('table-badge').textContent = 'Niveau : ' + levelName;
        document.getElementById('th-entity').textContent = 'Entité Géographique (' + levelName + ')';

        // Footnote dynamically updated
        const footerNote = document.getElementById('table-footer-note');
        if (levelId === 'region' || levelId === 'departement') {
            footerNote.textContent = "Note: Le modèle a intentionnellement 83% d'accuracy. Il se trompe donc sur certains de ces niveaux macro.";
        } else {
            footerNote.textContent = "Note : Sur les cantons et communes, le modèle prédit la tendance locale à l'aide des moyennes, l'accuracy peut beaucoup y varier.";
        }

        entities.forEach((item, index) => {
            const tr = document.createElement('tr');

            // Zebra striping
            tr.className = index % 2 === 0 ? "bg-white hover:bg-blue-50/20" : "bg-gray-50/50 hover:bg-blue-50/20";

            // Badge style for predictions
            const getBadge = (val, cand) => {
                if (!val || val === "N/A" || val === "Unknown") return `<span class="text-gray-400 italic">Non dispo.</span>`;

                let badge = '';
                const candName = cand && cand !== "N/A" ? cand : "Inconnu";

                if (val.includes('MACRON')) badge = `<span class="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-xs border border-blue-200 shadow-sm ml-2">${candName} 🔵</span>`;
                else if (val.includes('LE PEN')) badge = `<span class="px-3 py-1 bg-gray-700 text-white font-bold rounded-full text-xs border border-gray-600 shadow-sm ml-2">${candName} ⚫</span>`;
                else if (val.includes('MÉLENCHON')) badge = `<span class="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full text-xs border border-red-200 shadow-sm ml-2">${candName} 🔴</span>`;
                else badge = `<span class="px-3 py-1 bg-gray-100 text-gray-800 font-bold rounded-full text-xs border border-gray-300 shadow-sm ml-2">${candName}</span>`;

                return `<div class="flex items-center min-w-max">${badge}</div>`;
            };

            // Status style (green exact, red error, gray unknown)
            let statusBadge = '';
            if (item.is_correct === true) {
                statusBadge = `<span class="inline-flex justify-center items-center gap-1.5 px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-lg font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-emerald-200/50 w-28"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.815a.75.75 0 011.05-.145z" clip-rule="evenodd"/></svg> Exact</span>`;
            } else if (item.is_correct === false) {
                statusBadge = `<span class="inline-flex justify-center items-center gap-1.5 px-3 py-1 bg-rose-100/50 text-rose-700 rounded-lg font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-rose-200/50 w-28"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg> Erreur</span>`;
            } else {
                statusBadge = `<span class="inline-flex justify-center items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-lg font-semibold shadow-sm w-28 text-xs">Simulé</span>`;
            }

            // Confidence rendering (gradient bar inline)
            const getConfHTML = (conf) => {
                if (!conf) return '-';
                const c = parseInt(conf);
                let color = "bg-blue-500";
                if (c > 85) color = "bg-emerald-500";
                else if (c < 75) color = "bg-amber-500";
                return `<div class="flex items-center justify-center gap-2"><span class="w-8 text-right font-semibold text-gray-700">${conf}</span><div class="w-16 h-2 bg-gray-200 justify-start rounded-full flex overflow-hidden"><div class="${color} h-2 rounded-full" style="width: ${conf}"></div></div></div>`;
            };

            tr.innerHTML = `
                <td class="px-6 py-4 font-bold text-gray-800 truncate max-w-[200px] flex items-center gap-2"><div class="w-2 h-2 rounded-full cursor-pointer hover:bg-indigo-400 bg-blue-400 object-transition"></div> <span class="cursor-pointer font-bold select-none text-indigo-700 hover:text-indigo-900 transition-colors">${item.entity}</span></td>
                <td class="px-6 py-4">${getBadge(item.predicted, item.pred_cand)}</td>
                <td class="px-6 py-4 text-center">${getConfHTML(item.conf)}</td>
                <td class="px-6 py-4">${getBadge(item.real, item.real_cand)}</td>
                <td class="px-6 py-4 text-center">${statusBadge}</td>
            `;

            // Add click listener to show entity details
            tr.style.cursor = "pointer";
            tr.addEventListener("click", () => {
                const detailsContainer = document.getElementById("entity-details");
                const detailsTitle = document.getElementById("entity-details-title");

                detailsTitle.textContent = `Détail : ${item.entity}`;
                detailsContainer.classList.remove('hidden');

                tbody.appendChild(tr);
            });
        }

    function renderDataviz() {
                // Horizontal Bar chart (Top 5 Features)
                const ctxLine = document.getElementById('chartLine').getContext('2d');
                if (window.chartLineInstance) window.chartLineInstance.destroy();
                window.chartLineInstance = new Chart(ctxLine, {
                    type: 'bar',
                    data: {
                        labels: ['Var Emploi Salarié', 'Pop. Active', 'Tx Chômage', 'Logements Sociaux', 'Etab. Actifs (Taux)'],
                        datasets: [{
                            label: 'Importance Relative (%)',
                            data: [35, 23, 18, 14, 10],
                            backgroundColor: '#1E3A8A',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });

                // Bar chart (Scores Relatifs)
                const ctxBar = document.getElementById('chartBar').getContext('2d');
                if (window.chartBarInstance) window.chartBarInstance.destroy();
                window.chartBarInstance = new Chart(ctxBar, {
                    type: 'bar',
                    data: {
                        labels: ['Déclin', 'Stable', 'Croissance'],
                        datasets: [
                            {
                                label: 'Distribution des Scores',
                                data: [22, 45, 33],
                                backgroundColor: ['#DC2626', '#9CA3AF', '#10B981'],
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }

    function renderPolarChart(canvasId, chartData) {
                const ctx = document.getElementById(canvasId).getContext('2d');

                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: chartData.map(d => d.party),
                        datasets: [{
                            data: chartData.map(d => d.count),
                            backgroundColor: chartData.map(d => d.color),
                            borderWidth: 3,
                            borderColor: '#ffffff',
                            hoverOffset: 12
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                    font: { family: "'Outfit', sans-serif", size: 14, weight: 'bold' }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                padding: 16,
                                cornerRadius: 12,
                                titleFont: { size: 14, family: "'Outfit', sans-serif" },
                                bodyFont: { size: 16, weight: 'bold', family: "'Outfit', sans-serif" }
                            }
                        },
                        animation: {
                            duration: 2000,
                            easing: 'easeOutQuart'
                        }
                    }
                });
            }

    function updateEntityChart(item) {
                const ctxEntity = document.getElementById('chartEntity').getContext('2d');
                if (window.chartEntityInstance) window.chartEntityInstance.destroy();

                const probaMacron = item.proba_macron || 0;
                const probaLePen = item.proba_lepen || 0;

                window.chartEntityInstance = new Chart(ctxEntity, {
                    type: 'bar',
                    data: {
                        labels: ['Probabilité (%)'],
                        datasets: [
                            {
                                label: 'Macron',
                                data: [probaMacron],
                                backgroundColor: '#1E3A8A', // Blue
                                borderRadius: 4
                            },
                            {
                                label: 'Le Pen',
                                data: [probaLePen],
                                backgroundColor: '#374151', // Dark Gray
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: {
                            x: {
                                beginAtZero: true,
                                max: 100,
                                stacked: false
                            },
                            y: {
                                stacked: false
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { boxWidth: 12, font: { size: 10 } }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        return context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            }
});