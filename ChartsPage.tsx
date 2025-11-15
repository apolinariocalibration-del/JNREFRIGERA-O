import React, { useRef, useEffect, useMemo } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord } from './types';

declare var Chart: any;
declare var ChartDataLabels: any;

// Custom hook for Chart.js
// Using 'any' for chartConfig is a pragmatic choice given its complexity.
const useChart = (chartRef: React.RefObject<HTMLCanvasElement>, chartConfig: any) => {
    useEffect(() => {
        if (!chartRef.current) return;
        
        const chartInstance = new Chart(chartRef.current.getContext('2d'), chartConfig);
        return () => chartInstance.destroy();
    }, [chartConfig, chartRef]);
};

interface ChartsPageProps {
    maintenanceData: MaintenanceRecord[];
    allMaintenanceData: MaintenanceRecord[];
    componentReplacements: ComponentReplacementRecord[];
    clientFilter: string;
    statusFilter: string;
    monthFilter: string;
    yearFilter: string;
    onClearFilters: () => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const ChartsPage: React.FC<ChartsPageProps> = ({ 
    maintenanceData, 
    allMaintenanceData,
    componentReplacements, 
    clientFilter, 
    statusFilter,
    monthFilter,
    yearFilter,
    onClearFilters 
}) => {
    const serviceTypeChartRef = useRef(null);
    const technicianActivityChartRef = useRef(null);
    const componentReplacementChartRef = useRef(null);
    const dailyServiceChartRef = useRef(null);
    const durationByClientChartRef = useRef(null);

    const chartData = useMemo(() => {
        const techNameMap = {
            'Talison': 'Thalisson',
            'Thaisson': 'Thalisson',
            'Gean': 'Jean',
            'Wellington': 'Weliton'
        };
        const normalizeTechName = (name: string) => techNameMap[name.trim()] || name.trim();

        // Service type counts should be based on filtered data
        const serviceTypeCounts = maintenanceData.reduce((acc, record) => {
            const type = record.Serviço || 'Não especificado';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        
        // Technician activity counts (from ALL data)
        const technicianActivityCounts = allMaintenanceData.reduce((acc, record) => {
            const team = (record.Equipe || '').split(/\\|\//);
            team.forEach(tech => {
                const trimmedTech = tech.trim();
                if (trimmedTech && trimmedTech.toLowerCase() !== 'bruno') {
                    const normalizedTech = normalizeTechName(trimmedTech);
                    acc[normalizedTech] = (acc[normalizedTech] || 0) + 1;
                }
            });
            return acc;
        }, {});

        // Component replacement counts are based on ALL data
        const componentReplacementCounts = componentReplacements.reduce((acc, record) => {
            const component = record.Componente || 'Não especificado';
            acc[component] = (acc[component] || 0) + 1;
            return acc;
        }, {});

        const dailyClientData = maintenanceData.reduce((acc, record) => {
            const date = new Date(record.Data).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = new Set<string>();
            }
            acc[date].add(record.Cliente);
            return acc;
        }, {} as Record<string, Set<string>>);

        const dailyServiceCounts = Object.entries(dailyClientData).reduce((acc, [date, clientsSet]) => {
            acc[date] = (clientsSet as Set<string>).size;
            return acc;
        }, {} as Record<string, number>);

        const sortedDates = Object.keys(dailyServiceCounts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        const dailyLabels = sortedDates.map(dateStr => {
            const date = new Date(dateStr);
            return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
        });
        const dailyData = sortedDates.map(date => dailyServiceCounts[date]);

        // --- Data aggregation for Duration by Client chart ---
        const calculateDuration = (start: string, end: string) => {
            if (!start || !end) return 0;
            const [startHour, startMinute] = start.split(':').map(Number);
            const [endHour, endMinute] = end.split(':').map(Number);
            // Use a consistent date for time calculation
            const startDate = new Date(1970, 0, 1, startHour, startMinute, 0);
            const endDate = new Date(1970, 0, 1, endHour, endMinute, 0);
            
            if (endDate < startDate) { // Handles overnight service
                endDate.setDate(endDate.getDate() + 1);
            }
            
            const diffMs = endDate.getTime() - startDate.getTime();
            return diffMs / (1000 * 60 * 60); // convert to hours
        };

        // FIX: Provide a type for the accumulator to avoid implicit 'any' and related errors.
        const aggregatedDurationData = maintenanceData.reduce((acc: Record<string, Record<string, number>>, record) => {
            const client = record.Cliente;
            const service = record.Serviço;
            const duration = calculateDuration(record.HoraInicio, record.HoraFim);

            if (duration > 0) {
                if (!acc[client]) {
                    acc[client] = {};
                }
                acc[client][service] = (acc[client][service] || 0) + duration;
            }
            return acc;
        }, {} as Record<string, Record<string, number>>);
        
        const sortedClients = Object.keys(aggregatedDurationData).sort((a, b) => {
            // FIX: Cast `Object.values` result to number[] to ensure correct type inference in `reduce`.
            const totalA = (Object.values(aggregatedDurationData[a]) as number[]).reduce((sum, d) => sum + d, 0);
            const totalB = (Object.values(aggregatedDurationData[b]) as number[]).reduce((sum, d) => sum + d, 0);
            return totalB - totalA;
        });

        const serviceTypes = [...new Set(maintenanceData.map(r => r.Serviço))];
        // FIX: Add an index signature to allow indexing with a generic string 'service'.
        const serviceColors: Record<string, string> = {
            'Corretiva': '#ef4444',
            'Preventiva': '#3b82f6',
            'Corretiva/Preventiva': '#f97316',
            'Obra/Instalação': '#8b5cf6',
        };

        // FIX: Explicitly type `service` as string to prevent it from being inferred
        // as `unknown`, which would cause an indexing error.
        const durationDatasets = serviceTypes.map((service: string) => ({
            label: service,
            data: sortedClients.map(client => aggregatedDurationData[client][service] || 0),
            backgroundColor: serviceColors[service] || '#64748b',
        }));

        const durationByClientData = {
            labels: sortedClients,
            datasets: durationDatasets,
        };

        return { serviceTypeCounts, technicianActivityCounts, componentReplacementCounts, dailyLabels, dailyData, durationByClientData };
    }, [maintenanceData, allMaintenanceData, componentReplacements]);

    useChart(durationByClientChartRef, {
        type: 'bar',
        data: chartData.durationByClientData,
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Duração do Atendimento por Cliente (Horas)',
                    color: '#cbd5e1',
                    font: { size: 16 },
                    padding: { bottom: 20 }
                },
                legend: {
                    position: 'top',
                    labels: { color: '#cbd5e1' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.x !== null) {
                                label += context.parsed.x.toFixed(2) + 'h';
                            }
                            return label;
                        }
                    }
                },
                 datalabels: {
                    display: false,
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' },
                    title: {
                        display: true,
                        text: 'Total de Horas',
                        color: '#94a3b8'
                    }
                },
                y: {
                    stacked: true,
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });

    useChart(dailyServiceChartRef, {
        type: 'line',
        data: {
            labels: chartData.dailyLabels,
            datasets: [{
                label: 'Clientes Atendidos',
                data: chartData.dailyData,
                fill: true,
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                borderColor: '#06b6d4',
                tension: 0.3,
                pointBackgroundColor: '#06b6d4',
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { 
                    display: true, 
                    text: 'Clientes Atendidos por Dia (Filtrado)', 
                    color: '#cbd5e1', 
                    font: { size: 16 } 
                },
                datalabels: {
                    display: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#94a3b8',
                        stepSize: 1
                    },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });

    useChart(serviceTypeChartRef, {
        type: 'bar',
        data: {
            labels: Object.keys(chartData.serviceTypeCounts),
            datasets: [{
                label: 'Número de Serviços',
                data: Object.values(chartData.serviceTypeCounts),
                backgroundColor: '#0e7490',
                borderColor: '#06b6d4',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Tipos de Serviço Realizados (Filtrado)', color: '#cbd5e1', font: { size: 16 } },
                datalabels: {
                    display: false,
                }
            },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
            }
        }
    });

    useChart(technicianActivityChartRef, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels: Object.keys(chartData.technicianActivityCounts),
            datasets: [{
                label: 'Atendimentos',
                data: Object.values(chartData.technicianActivityCounts),
                backgroundColor: 'rgba(124, 58, 237, 0.7)',
                borderColor: 'rgba(124, 58, 237, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { 
                    display: true, 
                    text: 'Atividade por Técnico (Geral)', 
                    color: '#cbd5e1', 
                    font: { size: 16 } 
                },
                datalabels: {
                    color: '#fff',
                    anchor: 'end',
                    align: 'start',
                    offset: 4,
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: { 
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', stepSize: 1 }, 
                    grid: { color: '#334155' } 
                },
                y: { 
                    ticks: { color: '#94a3b8' }, 
                    grid: { display: false } 
                }
            }
        }
    });

    useChart(componentReplacementChartRef, {
        type: 'doughnut',
        plugins: [ChartDataLabels],
        data: {
            labels: Object.keys(chartData.componentReplacementCounts),
            datasets: [{
                label: 'Substituições',
                data: Object.values(chartData.componentReplacementCounts),
                backgroundColor: [
                    '#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#ef4444', '#3b82f6',
                    '#6366f1', '#ec4899', '#f59e0b', '#84cc16', '#22d3ee', '#a78bfa'
                ],
                borderColor: '#1e293b',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#cbd5e1', boxWidth: 12, padding: 20 }
                },
                title: {
                    display: true,
                    text: 'Substituição de Componentes (Geral)',
                    color: '#cbd5e1',
                    font: { size: 16 },
                    padding: { bottom: 20 }
                },
                datalabels: {
                    display: true,
                    color: '#fff',
                    textAlign: 'center',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value) => {
                        return value > 0 ? value : null;
                    }
                }
            }
        }
    });


    return (
        <>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                 <div>
                    <h2 className="text-xl font-semibold text-white">Análise Gráfica</h2>
                    <p className="text-slate-400 mt-1">Visualização dos principais indicadores de serviço e performance da equipe.</p>
                </div>
                 {(clientFilter !== 'all' || statusFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all') && (
                    <div className="bg-slate-700/50 border border-slate-700 p-3 rounded-lg text-sm flex items-center gap-4 flex-wrap w-full sm:w-auto">
                        <div className="font-semibold text-white">Filtros Ativos:</div>
                        <div className="flex gap-2 flex-wrap">
                            {yearFilter !== 'all' && <span className="bg-indigo-600/50 text-indigo-200 px-2 py-1 rounded">Ano: {yearFilter}</span>}
                            {monthFilter !== 'all' && <span className="bg-indigo-600/50 text-indigo-200 px-2 py-1 rounded">Mês: {MONTH_NAMES[parseInt(monthFilter) - 1]}</span>}
                            {clientFilter !== 'all' && <span className="bg-cyan-600/50 text-cyan-200 px-2 py-1 rounded">Cliente: {clientFilter}</span>}
                            {statusFilter !== 'all' && <span className="bg-amber-600/50 text-amber-200 px-2 py-1 rounded">Status: {statusFilter}</span>}
                        </div>
                        <button onClick={onClearFilters} className="text-slate-300 hover:text-white font-semibold ml-auto pl-2 flex items-center gap-1">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                           </svg>
                           Limpar
                        </button>
                    </div>
                )}
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg mb-8">
                <div className="h-[500px]"><canvas ref={durationByClientChartRef}></canvas></div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <div className="h-96"><canvas ref={dailyServiceChartRef}></canvas></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <div className="h-96"><canvas ref={serviceTypeChartRef}></canvas></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <div className="h-96"><canvas ref={technicianActivityChartRef}></canvas></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <div className="h-96"><canvas ref={componentReplacementChartRef}></canvas></div>
                </div>
            </div>
        </>
    );
};

export default ChartsPage;