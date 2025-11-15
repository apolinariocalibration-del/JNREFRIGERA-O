import React, { useMemo, useState, useEffect } from 'react';
// Fix: Import ComponentReplacementRecord to properly type component props.
import { MaintenanceRecord, ComponentReplacementRecord } from './types';
import { CLIENT_LIST } from './constants';

declare var XLSX: any;

interface EditRecordModalProps {
    record: MaintenanceRecord;
    onUpdate: (id: number, updatedData: { Pendencia: string; OBS: string }) => void;
    onClose: () => void;
}

// Component for the Edit Modal
const EditRecordModal: React.FC<EditRecordModalProps> = ({ record, onUpdate, onClose }) => {
    const [formData, setFormData] = useState({
        Pendencia: record.Pendencia,
        OBS: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onUpdate(record.ID, formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg border border-slate-700">
                <h2 className="text-2xl font-semibold mb-4 text-slate-100">Concluir Pendência - ID: {record.ID}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="PendenciaModal" className="block text-sm font-medium text-slate-400 mb-1">Pendência</label>
                        <textarea
                            id="PendenciaModal"
                            name="Pendencia"
                            value={formData.Pendencia}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                            placeholder="Deixe em branco para concluir"
                        />
                    </div>
                    <div>
                        <label htmlFor="OBSModal" className="block text-sm font-medium text-slate-400 mb-1">Adicionar Observações (OBS)</label>
                        <textarea
                            id="OBSModal"
                            name="OBS"
                            value={formData.OBS}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                            placeholder="Adicione notas sobre a conclusão da pendência aqui..."
                        />
                    </div>
                    <div className="flex justify-end space-x-4 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold text-white transition-colors">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FullEditRecordModal: React.FC<{
    record: MaintenanceRecord;
    onUpdate: (updatedRecord: MaintenanceRecord) => void;
    onClose: () => void;
}> = ({ record, onUpdate, onClose }) => {
    const [formData, setFormData] = useState<MaintenanceRecord>(record);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: new Date(value + 'T00:00:00') }));
    };

    const dateToInputValue = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onUpdate(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl border border-slate-700 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold mb-6 text-slate-100">Editar Registro - ID: {record.ID}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Data</label>
                            <input type="date" name="Data" onChange={handleDateChange} value={dateToInputValue(formData.Data)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Cliente</label>
                            <input type="text" name="Cliente" value={formData.Cliente} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required list="client-list"/>
                            <datalist id="client-list">
                                {CLIENT_LIST.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Serviço</label>
                            <select name="Serviço" value={formData.Serviço} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
                                <option>Corretiva</option>
                                <option>Preventiva</option>
                                <option>Corretiva/Preventiva</option>
                                <option>Obra/Instalação</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Hora Início</label>
                            <input type="time" name="HoraInicio" value={formData.HoraInicio} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Hora Fim</label>
                            <input type="time" name="HoraFim" value={formData.HoraFim} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Equipe</label>
                            <input type="text" name="Equipe" value={formData.Equipe} onChange={handleChange} placeholder="Separe os nomes com /" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                        </div>
                        <div className="lg:col-span-3">
                           <label className="block text-sm font-medium text-slate-400 mb-1">Especificação da Manutenção</label>
                           <input type="text" name="Especificação da Manutenção" value={formData['Especificação da Manutenção']} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"/>
                        </div>
                        <div className="lg:col-span-3">
                           <label className="block text-sm font-medium text-slate-400 mb-1">Pendência</label>
                           <textarea name="Pendencia" value={formData.Pendencia} onChange={handleChange} rows={2} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" placeholder="Deixe em branco se não houver pendências"></textarea>
                       </div>
                       <div className="lg:col-span-3">
                           <label className="block text-sm font-medium text-slate-400 mb-1">Observações (OBS)</label>
                           <textarea name="OBS" value={formData.OBS} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"></textarea>
                       </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold text-white transition-colors">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{
    record: MaintenanceRecord;
    onConfirm: (id: number) => void;
    onClose: () => void;
}> = ({ record, onConfirm, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-2xl font-semibold mb-4 text-slate-100">Confirmar Exclusão</h2>
            <p className="text-slate-300 mb-6">
                Você tem certeza que deseja excluir o registro ID: <strong className="text-white">{record.ID}</strong> para o cliente <strong className="text-white">{record.Cliente}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4 pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition-colors">Cancelar</button>
                <button type="button" onClick={() => onConfirm(record.ID)} className="px-5 py-2 bg-red-600 hover:bg-red-500 rounded-md font-semibold text-white transition-colors">Excluir</button>
            </div>
        </div>
    </div>
);


interface KpiCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center gap-6 shadow-lg transition hover:bg-slate-700/50">
        <div className="bg-slate-900 p-4 rounded-full">{icon}</div>
        <div>
            <div className="text-slate-400 text-sm font-medium">{title}</div>
            <div className="text-3xl font-bold text-white">{value}</div>
        </div>
    </div>
);

interface DashboardPageProps {
    userRole: 'viewer' | 'admin';
    maintenanceData: MaintenanceRecord[];
    filteredData: MaintenanceRecord[];
    componentReplacements: ComponentReplacementRecord[];
    allComponentReplacements: ComponentReplacementRecord[];
    onOpenEditModal: (record: MaintenanceRecord) => void;
    isEditModalOpen: boolean;
    currentRecord: MaintenanceRecord | null;
    onUpdateRecord: (id: number, updatedData: { Pendencia: string, OBS: string }) => void;
    onCloseEditModal: () => void;
    clientFilter: string;
    statusFilter: string;
    monthFilter: string;
    yearFilter: string;
    onClientFilterChange: (client: string) => void;
    onStatusFilterChange: (status: string) => void;
    onMonthFilterChange: (month: string) => void;
    onYearFilterChange: (year: string) => void;
    onOpenFullEditModal: (record: MaintenanceRecord) => void;
    isFullEditModalOpen: boolean;
    recordToEdit: MaintenanceRecord | null;
    onUpdateFullRecord: (record: MaintenanceRecord) => void;
    onCloseFullEditModal: () => void;
    onDeleteRecord: (id: number) => void;
    newlyAddedRecordId: number | null;
    setNewlyAddedRecordId: (id: number | null) => void;
}


const DashboardPage: React.FC<DashboardPageProps> = ({ 
    userRole,
    maintenanceData, 
    filteredData,
    componentReplacements, 
    allComponentReplacements,
    onOpenEditModal,
    isEditModalOpen,
    currentRecord,
    onUpdateRecord,
    onCloseEditModal,
    clientFilter,
    statusFilter,
    monthFilter,
    yearFilter,
    onClientFilterChange,
    onStatusFilterChange,
    onMonthFilterChange,
    onYearFilterChange,
    onOpenFullEditModal,
    isFullEditModalOpen,
    recordToEdit,
    onUpdateFullRecord,
    onCloseFullEditModal,
    onDeleteRecord,
    newlyAddedRecordId,
    setNewlyAddedRecordId
}) => {
    const [visibleRecordsCount, setVisibleRecordsCount] = useState(20);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);

    useEffect(() => {
        if (newlyAddedRecordId) {
            const timer = setTimeout(() => {
                setNewlyAddedRecordId(null);
            }, 2500); // Highlight for 2.5 seconds
            return () => clearTimeout(timer);
        }
    }, [newlyAddedRecordId, setNewlyAddedRecordId]);

    const handleOpenDeleteModal = (record: MaintenanceRecord) => {
        setRecordToDelete(record);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setRecordToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleConfirmDelete = (id: number) => {
        onDeleteRecord(id);
        handleCloseDeleteModal();
    };


    const createFilterHandler = (filterSetter: (value: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        filterSetter(e.target.value);
        setVisibleRecordsCount(20);
    };
    
    const handleClientFilterChange = createFilterHandler(onClientFilterChange);
    const handleStatusFilterChange = createFilterHandler(onStatusFilterChange);
    const handleMonthFilterChange = createFilterHandler(onMonthFilterChange);
    const handleYearFilterChange = createFilterHandler(onYearFilterChange);

    const { uniqueClients, uniqueYears } = useMemo(() => {
        const clients = new Set(maintenanceData.map(r => r.Cliente));
        const years = new Set(maintenanceData.map(r => new Date(r.Data).getFullYear()));
        return {
            uniqueClients: Array.from(clients).sort(),
            // FIX: The `sort` function's arguments might not be inferred as numbers,
            // causing a type error. Explicitly cast to Number to ensure correct subtraction.
            uniqueYears: Array.from(years).sort((a, b) => Number(b) - Number(a))
        };
    }, [maintenanceData]);

    const kpiData = useMemo(() => {
        const pendingTasks = filteredData.filter(r => r.Status === 'Pendente').length;
        const clientsServed = new Set(filteredData.map(r => r.Cliente)).size;
        const replacedComponents = componentReplacements.length;

        return { pendingTasks, clientsServed, totalRecords: filteredData.length, replacedComponents };
    }, [filteredData, componentReplacements]);
    
    const months = [
        { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
        { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
        { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
        { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
        { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
    ];
    
    const handleExport = () => {
        const maintenanceSheetData = filteredData.map(record => ({
            'ID': record.ID,
            'Data': new Date(record.Data).toLocaleDateString('pt-BR'),
            'Status': record.Status,
            'Cliente': record.Cliente,
            'Serviço': record.Serviço,
            'Especificação da Manutenção': record['Especificação da Manutenção'],
            'Equipe': (record.Equipe || '').replace(/\\|\//g, ', '),
            'Pendência': record.Pendencia,
            'OBS': record.OBS,
            'Gás': record.Gás,
            'Local': record.Local,
            'Equipamento': record.Equipamento,
            'Especificação do Equipamento': record['Especificação do Equipamento'],
            'Hora Início': record.HoraInicio,
            'Hora Fim': record.HoraFim,
        }));
    
        const componentSheetData = componentReplacements.map(record => ({
            'ID': record.ID,
            'Data': new Date(record.Data).toLocaleDateString('pt-BR'),
            'Cliente': record.Cliente,
            'Componente': record.Componente,
            'OBS': record.OBS,
        }));
    
        const maintenanceWS = XLSX.utils.json_to_sheet(maintenanceSheetData);
        const componentWS = XLSX.utils.json_to_sheet(componentSheetData);
    
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, maintenanceWS, "Manutenções (Filtrado)");
        XLSX.utils.book_append_sheet(wb, componentWS, "Componentes (Filtrado)");
    
        XLSX.writeFile(wb, "Relatorio_Filtrado_JN_Refrigeracao.xlsx");
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KpiCard title="Total de Manutenções" value={kpiData.totalRecords} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>} />
                <KpiCard title="Pendências Ativas" value={kpiData.pendingTasks} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-amber-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>} />
                <KpiCard title="Clientes Atendidos" value={kpiData.clientsServed} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-violet-400"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.513-.96 1.257-1.763 2.132-2.386m7.5 2.962a9.095 9.095 0 01-3.742-.479m-7.5 2.962c-.513-.96-1.257-1.763-2.132-2.386m7.5 2.962L12 12.75m-2.625 6.075c-1.056.649-2.313.976-3.625.976a9.095 9.095 0 01-4.244-.976m14.375.976a9.095 9.095 0 00-4.244-.976M12 12.75L12 15m0 0l-2.625 6.075M12 15l2.625 6.075" /></svg>} />
                <KpiCard title="Componentes Substituídos" value={kpiData.replacedComponents} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.695v-2.695A8.25 8.25 0 005.68 9.348v2.695l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183" /></svg>} />
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-white">Registros de Manutenção</h2>
                    <p className="text-slate-400 mt-1">Visualize e gerencie todos os registros de manutenção.</p>
                    <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-4 items-end">
                        <div>
                            <label htmlFor="yearFilter" className="block text-sm font-medium text-slate-400 mb-1">Filtrar por Ano</label>
                            <select id="yearFilter" name="yearFilter" value={yearFilter} onChange={handleYearFilterChange} className="w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500 transition">
                                <option value="all">Todos os Anos</option>
                                {uniqueYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="monthFilter" className="block text-sm font-medium text-slate-400 mb-1">Filtrar por Mês</label>
                            <select id="monthFilter" name="monthFilter" value={monthFilter} onChange={handleMonthFilterChange} className="w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500 transition">
                                <option value="all">Todos os Meses</option>
                                {months.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="clientFilter" className="block text-sm font-medium text-slate-400 mb-1">Filtrar por Cliente</label>
                            <select
                                id="clientFilter"
                                name="clientFilter"
                                value={clientFilter}
                                onChange={handleClientFilterChange}
                                className="w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                            >
                                <option value="all">Todos os Clientes</option>
                                {uniqueClients.map(client => (
                                    <option key={client} value={client}>{client}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-400 mb-1">Filtrar por Status</label>
                            <select
                                id="statusFilter"
                                name="statusFilter"
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="w-full sm:w-auto bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Pendente">Pendente</option>
                            </select>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                            <button
                                onClick={handleExport}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L6.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                Exportar Excel
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
                        <div className="overflow-auto max-h-[600px]">
                             <table className="w-full text-sm text-left text-slate-400 min-w-[1200px]">
                                <thead className="text-xs text-slate-300 uppercase bg-slate-700 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">ID</th>
                                        <th scope="col" className="px-6 py-3">Data</th>
                                        <th scope="col" className="px-6 py-3">Status</th>
                                        <th scope="col" className="px-6 py-3">Cliente</th>
                                        <th scope="col" className="px-6 py-3">Início</th>
                                        <th scope="col" className="px-6 py-3">Fim</th>
                                        <th scope="col" className="px-6 py-3">Serviço</th>
                                        <th scope="col" className="px-6 py-3">Pendência</th>
                                        <th scope="col" className="px-6 py-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.slice(0, visibleRecordsCount).map(record => (
                                        <tr key={record.ID} className={`bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${record.ID === newlyAddedRecordId ? 'bg-cyan-900/50' : ''}`}>
                                            <td className="px-6 py-4 font-medium text-white">{record.ID}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(record.Data).toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.Status === 'Concluído' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    {record.Status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{record.Cliente}</td>
                                            <td className="px-6 py-4">{record.HoraInicio || '-'}</td>
                                            <td className="px-6 py-4">{record.HoraFim || '-'}</td>
                                            <td className="px-6 py-4">{record.Serviço}</td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={record.Pendencia}>{record.Pendencia || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {userRole === 'admin' && (
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => onOpenFullEditModal(record)} className="font-medium text-cyan-500 hover:underline">Editar</button>
                                                        {record.Status === 'Pendente' && <button onClick={() => onOpenEditModal(record)} className="font-medium text-amber-500 hover:underline">Concluir</button>}
                                                        <button onClick={() => handleOpenDeleteModal(record)} className="font-medium text-red-500 hover:underline">Excluir</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {visibleRecordsCount < filteredData.length && (
                    <div className="p-4 flex justify-center border-t border-slate-700">
                        <button onClick={() => setVisibleRecordsCount(prev => prev + 20)} className="px-5 py-2 text-sm font-semibold text-cyan-400 hover:text-white hover:bg-cyan-600/50 rounded-lg transition">
                            Ver Mais
                        </button>
                    </div>
                )}
            </div>
            
            {isDeleteModalOpen && recordToDelete && (
                <DeleteConfirmationModal 
                    record={recordToDelete} 
                    onConfirm={handleConfirmDelete} 
                    onClose={handleCloseDeleteModal} 
                />
            )}

            {isFullEditModalOpen && recordToEdit && (
                <FullEditRecordModal 
                    record={recordToEdit} 
                    onUpdate={onUpdateFullRecord} 
                    onClose={onCloseFullEditModal} 
                />
            )}

            {isEditModalOpen && currentRecord && (
                <EditRecordModal record={currentRecord} onUpdate={onUpdateRecord} onClose={onCloseEditModal} />
            )}
        </>
    );
};

export default DashboardPage;