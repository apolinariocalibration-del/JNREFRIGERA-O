import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord, ComponentType } from './types';
import { COMPONENT_LIST } from './constants';
import { formatDateForInput, parseDateFromInput, normalizeTechnicianName } from './utils';

declare var XLSX: any;

// --- HELPER FUNCTIONS ---
const getUniqueTechnicians = (records: MaintenanceRecord[]): string[] => {
    const techSet = new Set<string>();
    records.forEach(record => {
        (record.Equipe || '').split(/[\\\/,]/).forEach(techName => {
            if (techName.trim()) techSet.add(normalizeTechnicianName(techName));
        });
    });
    return Array.from(techSet).sort();
};

const getUniqueClients = (records: MaintenanceRecord[]): string[] => {
    const clientSet = new Set<string>();
    records.forEach(record => clientSet.add(record.Cliente));
    return Array.from(clientSet).sort();
};

// --- FORM SECTIONS ---
interface AddRecordSectionProps {
    onAdd: (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => void;
    allTechnicians: string[];
    allClients: string[];
}

const AddRecordSection: React.FC<AddRecordSectionProps> = ({ onAdd, allTechnicians, allClients }) => {
    const initialFormState: Omit<MaintenanceRecord, 'ID' | 'Status'> = {
        Data: new Date(), HoraInicio: '', HoraFim: '', Serviço: 'Corretiva', Cliente: '',
        Equipe: '', Pendencia: '', OBS: '', Gás: '', Local: '', Equipamento: '',
        'Especificação da Manutenção': '', 'Especificação do Equipamento': '',
    };
    
    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (value) {
            setFormData(prev => ({ ...prev, [name]: parseDateFromInput(value) }));
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const recordToSubmit = { ...formData };

        if (recordToSubmit.Equipe) {
            const normalizedTeam = recordToSubmit.Equipe
                .split(/[\\\/,]/)
                .map(name => normalizeTechnicianName(name.trim()))
                .filter(name => name) // Remove empty strings that might result from multiple separators
                .join(' / ');
            recordToSubmit.Equipe = normalizedTeam;
        }
        
        onAdd(recordToSubmit);
        setFormData(initialFormState);
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 h-full">
            <h2 className="text-xl font-semibold text-white mb-6">Adicionar Novo Registro de Manutenção</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Data</label>
                        <input type="date" name="Data" onChange={handleDateChange} value={formatDateForInput(formData.Data)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cliente</label>
                        <input type="text" name="Cliente" value={formData.Cliente} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required list="client-list"/>
                        <datalist id="client-list">
                            {allClients.map(c => <option key={c} value={c} />)}
                        </datalist>
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
                        <label className="block text-sm font-medium text-slate-400 mb-1">Serviço</label>
                        <select name="Serviço" value={formData.Serviço} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
                            <option>Corretiva</option> <option>Preventiva</option>
                            <option>Corretiva/Preventiva</option> <option>Obra/Instalação</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Equipe</label>
                        <input type="text" name="Equipe" value={formData.Equipe} onChange={handleChange} placeholder="Separe os nomes com /" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required list="technician-list"/>
                        <datalist id="technician-list">
                            {allTechnicians.map(tech => <option key={tech} value={tech} />)}
                        </datalist>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Especificação da Manutenção</label>
                    <input type="text" name="Especificação da Manutenção" value={formData['Especificação da Manutenção']} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Pendência</label>
                    <textarea name="Pendencia" value={formData.Pendencia} onChange={handleChange} rows={2} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" placeholder="Deixe em branco se não houver pendências"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Observações (OBS)</label>
                    <textarea name="OBS" value={formData.OBS} onChange={handleChange} rows={2} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"></textarea>
                </div>
                <div className="pt-2">
                    <button type="submit" className="w-full px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold text-white transition-colors">Adicionar e Publicar Registro</button>
                </div>
            </form>
        </div>
    );
};

interface ComponentReplacementSectionProps {
    records: ComponentReplacementRecord[];
    onAdd: (record: Omit<ComponentReplacementRecord, 'ID'>) => void;
    clients: string[];
    components: ComponentType[];
}

const ComponentReplacementSection: React.FC<ComponentReplacementSectionProps> = ({ records, onAdd, clients, components }) => {
    const initialFormState = {
        Data: formatDateForInput(new Date()),
        Cliente: '',
        Componente: components[0] as ComponentType,
        OBS: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onAdd({
            ...formData,
            Data: parseDateFromInput(formData.Data),
            Componente: formData.Componente as ComponentType,
        });
        setFormData(initialFormState);
    };
    
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg h-full">
             <div className="p-6">
                <h2 className="text-xl font-semibold text-white">Registro de Substituição de Componente</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Data</label>
                        <input type="date" name="Data" value={formData.Data} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cliente</label>
                        <input type="text" name="Cliente" value={formData.Cliente} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required list="replacement-client-list"/>
                        <datalist id="replacement-client-list">
                            {clients.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Componente</label>
                        <select name="Componente" value={formData.Componente} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
                            {components.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Observações</label>
                        <textarea name="OBS" value={formData.OBS} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"></textarea>
                    </div>
                    <button type="submit" className="w-full px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold text-white transition-colors">Registrar e Publicar</button>
                </form>
                <div className="overflow-auto max-h-96">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-700/50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Data</th>
                                <th scope="col" className="px-4 py-3">Cliente</th>
                                <th scope="col" className="px-4 py-3">Componente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length > 0 ? records.slice().reverse().map(rec => (
                                <tr key={rec.ID} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="px-4 py-3">{new Date(rec.Data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td className="px-4 py-3">{rec.Cliente}</td>
                                    <td className="px-4 py-3 font-medium text-white">{rec.Componente}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="text-center py-4">Nenhuma substituição registrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

interface ImportSectionProps {
    onImport: (maintenanceData: any[], componentData: any[]) => void;
}

const ImportSection: React.FC<ImportSectionProps> = ({ onImport }) => {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            
            // Assuming 1st sheet is Maintenance
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            const data = XLSX.utils.sheet_to_json(ws);
            
            // Try to find a Components sheet
            let componentsData: any[] = [];
            const compSheetName = wb.SheetNames.find((n: string) => n.toLowerCase().includes('component'));
            if (compSheetName) {
                const wsComp = wb.Sheets[compSheetName];
                componentsData = XLSX.utils.sheet_to_json(wsComp);
            }

            onImport(data, componentsData);
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 h-full flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-slate-700/50 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.414l5 5a1 1 0 01.414 1.414V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Importar Planilha</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">Carregue um arquivo Excel (.xlsx) ou CSV para adicionar múltiplos registros de uma vez.</p>
            
            <label className="cursor-pointer bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-md transition-colors">
                <span>Selecionar Arquivo</span>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            </label>
            <p className="mt-2 text-xs text-slate-500">Certifique-se que as colunas correspondem (Data, Cliente, Serviço...)</p>
        </div>
    );
}

// --- MAIN PAGE COMPONENT ---
interface AddRecordPageProps {
    onAddRecord: (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => Promise<void>;
    onAddComponentReplacement: (record: Omit<ComponentReplacementRecord, 'ID'>) => Promise<void>;
    onImportData: (maintenance: any[], components: any[]) => Promise<void>;
    componentReplacements: ComponentReplacementRecord[];
    maintenanceData: MaintenanceRecord[];
}

const AddRecordPage: React.FC<AddRecordPageProps> = ({ onAddRecord, onAddComponentReplacement, onImportData, componentReplacements, maintenanceData }) => {
    const allTechnicians = useMemo(() => getUniqueTechnicians(maintenanceData), [maintenanceData]);
    const allClients = useMemo(() => getUniqueClients(maintenanceData), [maintenanceData]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <AddRecordSection onAdd={onAddRecord} allTechnicians={allTechnicians} allClients={allClients} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6">
                     <div className="flex-grow">
                        <ImportSection onImport={onImportData} />
                     </div>
                     <div className="flex-grow">
                        <ComponentReplacementSection 
                            records={componentReplacements} 
                            onAdd={onAddComponentReplacement}
                            clients={allClients} 
                            components={COMPONENT_LIST}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddRecordPage;