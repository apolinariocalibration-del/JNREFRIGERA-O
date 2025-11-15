import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord, ComponentType } from './types';
import { CLIENT_LIST, COMPONENT_LIST } from './constants';

declare var XLSX: any;

// Helper functions for technician list
const techNameMap = {
    'Talison': 'Thalisson',
    'Thaisson': 'Thalisson',
    'Gean': 'Jean',
    'Wellington': 'Weliton'
};
const normalizeTechName = (name: string) => {
    const trimmed = name.trim();
    return techNameMap[trimmed] || trimmed;
};

const getUniqueTechnicians = (records: MaintenanceRecord[]): string[] => {
    const techSet = new Set<string>();
    records.forEach(record => {
        (record.Equipe || '').split(/[\\\/]/).forEach(techName => {
            if (techName.trim()) {
                techSet.add(normalizeTechName(techName));
            }
        });
    });
    return Array.from(techSet).sort();
};

const AddRecordSection = ({ onAdd, allTechnicians }) => {
    const initialFormState: Omit<MaintenanceRecord, 'ID' | 'Status'> = {
        Data: new Date(),
        HoraInicio: '',
        HoraFim: '',
        Serviço: 'Corretiva',
        Cliente: '',
        Equipe: '',
        Pendencia: '',
        OBS: '',
        Gás: '',
        Local: '',
        Equipamento: '',
        'Especificação da Manutenção': '',
        'Especificação do Equipamento': '',
    };
    
    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // `value` is "YYYY-MM-DD". Append time to parse as local time.
        setFormData(prev => ({ ...prev, [name]: new Date(value + 'T00:00:00') }));
    };

    const dateToInputValue = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onAdd(formData);
        setFormData(initialFormState); // Reset form
        alert('Registro de manutenção adicionado com sucesso!');
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 h-full">
            <h2 className="text-xl font-semibold text-white mb-6">Adicionar Novo Registro de Manutenção (Manual)</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <option>Corretiva</option>
                            <option>Preventiva</option>
                            <option>Corretiva/Preventiva</option>
                            <option>Obra/Instalação</option>
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
                    <button type="submit" className="w-full px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold text-white transition-colors">Adicionar Registro</button>
                </div>
            </form>
        </div>
    );
};


const ComponentReplacementSection = ({ records, onAdd, clients, components }) => {
    const [formData, setFormData] = useState({
        Data: new Date().toISOString().substring(0, 10),
        Cliente: '',
        Componente: components[0],
        OBS: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.Cliente || !formData.Componente) {
            alert("Por favor, preencha Cliente e Componente.");
            return;
        }
        onAdd({
            ...formData,
            Data: new Date(formData.Data),
            ID: Date.now() // Simple unique ID
        });
        setFormData({ // Reset form
            Data: new Date().toISOString().substring(0, 10),
            Cliente: '',
            Componente: components[0],
            OBS: ''
        });
        alert('Substituição de componente registrada com sucesso!');
    };
    
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg h-full">
             <div className="p-6">
                <h2 className="text-xl font-semibold text-white">Registro de Substituição (Manual)</h2>
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
                    <button type="submit" className="w-full px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold text-white transition-colors">Registrar Substituição</button>
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
                                    <td className="px-4 py-3">{rec.Data.toLocaleDateString()}</td>
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

const parseExcelDate = (excelDate: number): Date => {
    // Converts Excel serial date number to a JS Date object, assuming UTC.
    return new Date(Date.UTC(0, 0, excelDate - 1));
};

const ImportSection = ({ onImport }) => {
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            
            const newMaintenanceRecords: Omit<MaintenanceRecord, 'ID' | 'Status'>[] = [];
            const newComponentRecords: Omit<ComponentReplacementRecord, 'ID'>[] = [];

            // Process Maintenance Sheet
            const maintenanceSheet = workbook.Sheets['Manutenções'];
            if (maintenanceSheet) {
                const records = XLSX.utils.sheet_to_json(maintenanceSheet);
                records.forEach((row: any) => {
                    newMaintenanceRecords.push({
                        Data: typeof row.Data === 'number' ? parseExcelDate(row.Data) : new Date(row.Data),
                        HoraInicio: row.HoraInicio || '',
                        HoraFim: row.HoraFim || '',
                        Serviço: row.Serviço || 'Corretiva',
                        'Especificação da Manutenção': row['Especificação da Manutenção'] || '',
                        Equipamento: row.Equipamento || '',
                        'Especificação do Equipamento': row['Especificação do Equipamento'] || '',
                        Equipe: row.Equipe || '',
                        Local: row.Local || '',
                        Cliente: row.Cliente || '',
                        OBS: row.OBS || '',
                        Pendencia: row.Pendencia || '',
                        Gás: row.Gás || '',
                    });
                });
            }

            // Process Components Sheet
            const componentsSheet = workbook.Sheets['Componentes'];
            if (componentsSheet) {
                const records = XLSX.utils.sheet_to_json(componentsSheet);
                records.forEach((row: any) => {
                    newComponentRecords.push({
                        Data: typeof row.Data === 'number' ? parseExcelDate(row.Data) : new Date(row.Data),
                        Cliente: row.Cliente || '',
                        Componente: row.Componente || '',
                        OBS: row.OBS || '',
                    });
                });
            }

            onImport(newMaintenanceRecords, newComponentRecords);

        } catch (error) {
            console.error("Erro ao processar a planilha:", error);
            alert("Ocorreu um erro ao processar a planilha. Verifique o formato e o console para mais detalhes.");
        } finally {
            setIsProcessing(false);
            setFileName('');
            // Reset file input to allow re-uploading the same file
            if (e.target) e.target.value = '';
        }
    };
    
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Importar Dados de Planilha</h2>
            <p className="text-slate-400 mb-4 text-sm">
                Importe registros de um arquivo Excel (.xlsx).
                O arquivo deve conter abas chamadas "Manutenções" e/ou "Componentes", com colunas correspondentes aos campos do formulário.
            </p>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        {isProcessing ? (
                            <p className="text-sm text-slate-400"><span className="font-semibold">Processando...</span></p>
                        ) : fileName ? (
                            <p className="text-sm text-slate-400"><span className="font-semibold">Arquivo:</span> {fileName}</p>
                        ) : (
                            <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Clique para carregar</span> ou arraste e solte</p>
                        )}
                        <p className="text-xs text-slate-500">XLSX, XLS, ou CSV</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFile} disabled={isProcessing} />
                </label>
            </div> 
        </div>
    );
};

interface AddRecordPageProps {
    onAddRecord: (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => void;
    onAddComponentReplacement: (record: ComponentReplacementRecord) => void;
    onImportData: (
        newMaintenanceRecords: Omit<MaintenanceRecord, 'ID' | 'Status'>[],
        newComponentRecords: Omit<ComponentReplacementRecord, 'ID'>[]
    ) => void;
    componentReplacements: ComponentReplacementRecord[];
    maintenanceData: MaintenanceRecord[];
}


const AddRecordPage: React.FC<AddRecordPageProps> = ({ onAddRecord, onAddComponentReplacement, componentReplacements, maintenanceData, onImportData }) => {
    const allTechnicians = useMemo(() => getUniqueTechnicians(maintenanceData), [maintenanceData]);
    return (
        <div className="space-y-6">
            <ImportSection onImport={onImportData} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <AddRecordSection onAdd={onAddRecord} allTechnicians={allTechnicians} />
                </div>
                <div className="lg:col-span-2">
                     <ComponentReplacementSection 
                        records={componentReplacements} 
                        onAdd={onAddComponentReplacement}
                        clients={[...new Set(maintenanceData.map(r => r.Cliente))].sort()} 
                        components={COMPONENT_LIST}
                    />
                </div>
            </div>
        </div>
    );
};

export default AddRecordPage;