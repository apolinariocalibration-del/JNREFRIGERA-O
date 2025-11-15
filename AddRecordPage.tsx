import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord, ComponentType } from './types';
import { CLIENT_LIST, COMPONENT_LIST } from './constants';

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

const PublishModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    fileContent: string;
}> = ({ isOpen, onClose, fileContent }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(fileContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    // INSTRUÇÃO: Substitua pelo link do seu repositório
    const GITHUB_EDIT_URL = "https://github.com/SEU-USUARIO/SEU-REPOSITORIO/edit/main/src/constants.ts";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-3xl border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-white">Publicar Alterações no GitHub</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>
                <div className="space-y-4 text-slate-300">
                    <p>Siga os passos abaixo para atualizar os dados do site de forma segura:</p>
                    <div className="bg-slate-900/50 p-4 rounded-md space-y-3">
                        <p><strong className="text-white">Passo 1: Copie o código gerado.</strong> O código abaixo contém todos os registros atuais.</p>
                        <p><strong className="text-white">Passo 2: Abra o GitHub.</strong> Clique no link para ir diretamente à página de edição do arquivo.</p>
                        <p><strong className="text-white">Passo 3: Cole e salve.</strong> No GitHub, apague todo o conteúdo antigo, cole o novo código e clique em "Commit changes".</p>
                    </div>
                     <textarea
                        readOnly
                        className="w-full h-48 bg-slate-900 border border-slate-600 rounded-md p-2 text-xs font-mono text-slate-400 focus:ring-0 focus:outline-none"
                        value={fileContent}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <button onClick={handleCopy} className={`w-full px-5 py-3 rounded-md font-semibold text-white transition-colors flex items-center justify-center gap-2 ${copied ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                            {copied ? 'Copiado com Sucesso!' : 'Copiar Código'}
                        </button>
                        <a href={GITHUB_EDIT_URL} target="_blank" rel="noopener noreferrer" className="w-full px-5 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold text-white transition-colors flex items-center justify-center gap-2 text-center">
                           Abrir GitHub
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                     <p className="text-xs text-slate-500 text-center pt-2">Lembre-se de substituir `SEU-USUARIO` e `SEU-REPOSITORIO` no link do GitHub se necessário.</p>
                </div>
            </div>
        </div>
    );
};

interface AddRecordSectionProps {
    onAdd: (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => void;
    allTechnicians: string[];
}

const AddRecordSection: React.FC<AddRecordSectionProps> = ({ onAdd, allTechnicians }) => {
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

interface ComponentReplacementSectionProps {
    records: ComponentReplacementRecord[];
    onAdd: (record: ComponentReplacementRecord) => void;
    clients: string[];
    components: ComponentType[];
}

const ComponentReplacementSection: React.FC<ComponentReplacementSectionProps> = ({ records, onAdd, clients, components }) => {
    const [formData, setFormData] = useState({
        Data: new Date().toISOString().substring(0, 10),
        Cliente: '',
        Componente: components[0] as ComponentType,
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
            Data: new Date(formData.Data + 'T00:00:00'), // Parse as local time to avoid timezone issues
            Componente: formData.Componente as ComponentType,
            ID: Date.now() // Simple unique ID
        });
        setFormData({ // Reset form
            Data: new Date().toISOString().substring(0, 10),
            Cliente: '',
            Componente: components[0] as ComponentType,
            OBS: ''
        });
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
                                    <td className="px-4 py-3">{new Date(rec.Data).toLocaleDateString('pt-BR')}</td>
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

interface AddRecordPageProps {
    onAddRecord: (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => void;
    onAddComponentReplacement: (record: ComponentReplacementRecord) => void;
    componentReplacements: ComponentReplacementRecord[];
    maintenanceData: MaintenanceRecord[];
    publishTrigger: number;
}


const AddRecordPage: React.FC<AddRecordPageProps> = ({ 
    onAddRecord, 
    onAddComponentReplacement, 
    componentReplacements, 
    maintenanceData, 
    publishTrigger 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fileContent, setFileContent] = useState('');
    const allTechnicians = useMemo(() => getUniqueTechnicians(maintenanceData), [maintenanceData]);

    const handleGenerateDataFile = () => {
        const dataToString = (data: any[]) => {
            return JSON.stringify(data, (key, value) => {
                if (key === 'Data' && value) return `__DATE__${new Date(value).toISOString()}__DATE__`;
                if (key === 'Status') return undefined; 
                return value;
            }, 2).replace(/"__DATE__(.*?)__DATE__"/g, "new Date('$1')");
        };

        const content = `import { MaintenanceRecord, ComponentType, ComponentReplacementRecord } from './types';

// ATENÇÃO: Este arquivo é gerado automaticamente.
// Para atualizar, use a ferramenta de publicação no dashboard de administrador.

// Lista de Clientes (pode ser editada manualmente se necessário)
export const CLIENT_LIST = [
  'Imperatiz CD', 'Palineli', 'Ester de Lima', 'Snowfrut', 'Dupain',
  'Frutaria SP', 'JJL', 'Pastelaria Maria de Discel', 'Casa Carne', 'Ffood',
  'Bolinho do Porto', 'Dolma', 'Bar Pompeu', 'Faculdade Arnaldo', 'CCPR',
  'Minas Rural', 'Celia Soltto', 'Pilanar', 'Agua branca', 'BH Shopping',
];

// Lista de Componentes (pode ser editada manualmente se necessário)
export const COMPONENT_LIST: ComponentType[] = [
  'Compressor', 'Contatora', 'Disjuntor', 'Microcontrolador', 'Microventilador',
  'Pressostato de Alta Pressão', 'Relé', 'Relé de Contato de Contatora',
  'Relé Falta de Fase', 'Resistência de Degelo', 'Resistência do Evaporador',
  'Tubulação', 'Válvula de Expansão Eletrônica', 'Ventilador do Condensador',
  'Ventilador do Evaporador'
];

// DADOS DE SUBSTITUIÇÃO DE COMPONENTES ATUALIZADOS
export const MOCK_COMPONENT_REPLACEMENTS: ComponentReplacementRecord[] = ${dataToString(componentReplacements.map(({ ID, ...rest }) => rest))};

// DADOS DE MANUTENÇÃO ATUALIZADOS
export const MOCK_DATA: Omit<MaintenanceRecord, 'ID' | 'Status'>[] = ${dataToString(maintenanceData.map(({ ID, Status, ...rest }) => rest))};
`.trim();

        setFileContent(content);
        setIsModalOpen(true);
    };
    
    const didMountRef = useRef(false);

    useEffect(() => {
        if (didMountRef.current) {
            handleGenerateDataFile();
        } else {
            didMountRef.current = true;
        }
    }, [publishTrigger]);

    return (
        <div className="space-y-8">
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
            <PublishModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fileContent={fileContent}
            />
        </div>
    );
};

export default AddRecordPage;
