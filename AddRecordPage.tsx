import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord, ComponentType } from './types';
import { COMPONENT_LIST } from './constants';
import * as db from './db';

// --- GITHUB CONFIG TYPES AND CONSTANTS ---
const GITHUB_CONFIG_KEY = 'jnRefrigeracaoGithubConfig';
const GITHUB_FILE_PATH = 'src/constants.ts';

interface GitHubConfig {
    owner: string;
    repo: string;
    token: string;
}

// --- HELPER FUNCTIONS ---
const getUniqueTechnicians = (records: MaintenanceRecord[]): string[] => {
    const techNameMap = { 'Talison': 'Thalisson', 'Thaisson': 'Thalisson', 'Gean': 'Jean', 'Wellington': 'Weliton' };
    const normalizeTechName = (name: string) => { const trimmed = name.trim(); return techNameMap[trimmed] || trimmed; };
    const techSet = new Set<string>();
    records.forEach(record => {
        (record.Equipe || '').split(/[\\\/]/).forEach(techName => {
            if (techName.trim()) techSet.add(normalizeTechName(techName));
        });
    });
    return Array.from(techSet).sort();
};

const getUniqueClients = (records: MaintenanceRecord[]): string[] => {
    const clientSet = new Set<string>();
    records.forEach(record => clientSet.add(record.Cliente));
    return Array.from(clientSet).sort();
};

const sortByDateDesc = <T extends { Data: Date }>(a: T, b: T) => new Date(b.Data).getTime() - new Date(a.Data).getTime();


// --- MODAL COMPONENTS ---

const GitHubConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: GitHubConfig) => void;
    initialConfig: GitHubConfig | null;
}> = ({ isOpen, onClose, onSave, initialConfig }) => {
    const [config, setConfig] = useState<GitHubConfig>(initialConfig || { owner: '', repo: '', token: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(config);
    };

    const handleRemove = () => {
        localStorage.removeItem(GITHUB_CONFIG_KEY);
        onSave(null); // Notify parent component
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg border border-slate-700">
                <h2 className="text-2xl font-semibold mb-4 text-white">Configurar Publicação Automática</h2>
                <p className="text-slate-400 mb-4 text-sm">Insira as informações do seu repositório GitHub para ativar a publicação automática. Seu registro foi salvo localmente e será publicado na próxima atualização automática.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Dono do Repositório (Usuário/Organização)</label>
                        <input type="text" name="owner" value={config.owner} onChange={handleChange} placeholder="ex: seu-usuario-github" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Repositório</label>
                        <input type="text" name="repo" value={config.repo} onChange={handleChange} placeholder="ex: jn-dashboard" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Token de Acesso Pessoal (PAT)</label>
                        <input type="password" name="token" value={config.token} onChange={handleChange} placeholder="cole seu token aqui" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                        <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline mt-1">Como criar um token? (Requer escopo `repo`)</a>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                         <button type="button" onClick={handleRemove} className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md">Remover Config.</button>
                        <div className="flex gap-2">
                             <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold">Cancelar</button>
                             <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold text-white">Salvar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PublishStatusModal: React.FC<{ status: 'idle' | 'publishing' | 'success' | 'error'; message: string; onClose: () => void }> = ({ status, message, onClose }) => {
    if (status === 'idle') return null;

    const Icon = () => {
        switch (status) {
            case 'publishing': return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>;
            case 'success': return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
            case 'error': return <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            default: return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm border border-slate-700 text-center">
                <div className="flex justify-center mb-4"><Icon /></div>
                <p className="text-white font-semibold mb-2">{message}</p>
                {(status === 'success' || status === 'error') && (
                    <button onClick={onClose} className="mt-4 px-5 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold text-sm">Fechar</button>
                )}
            </div>
        </div>
    );
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
        setFormData(prev => ({ ...prev, [name]: new Date(value + 'T00:00:00') }));
    };

    const dateToInputValue = (date: Date) => {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onAdd(formData);
        setFormData(initialFormState);
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 h-full">
            <h2 className="text-xl font-semibold text-white mb-6">Adicionar Novo Registro de Manutenção</h2>
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
                    <button type="submit" className="w-full px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold text-white transition-colors">Adicionar Registro</button>
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
        Data: new Date().toISOString().split('T')[0],
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
            Data: new Date(formData.Data + 'T00:00:00'),
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

// --- MAIN PAGE COMPONENT ---
interface AddRecordPageProps {
    onAddRecord: (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => Promise<void>;
    onAddComponentReplacement: (record: Omit<ComponentReplacementRecord, 'ID'>) => Promise<void>;
    componentReplacements: ComponentReplacementRecord[];
    maintenanceData: MaintenanceRecord[];
}

const AddRecordPage: React.FC<AddRecordPageProps> = ({ onAddRecord, onAddComponentReplacement, componentReplacements, maintenanceData }) => {
    const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
    const [publishMessage, setPublishMessage] = useState('');

    useEffect(() => {
        const storedConfig = localStorage.getItem(GITHUB_CONFIG_KEY);
        if (storedConfig) {
            setGithubConfig(JSON.parse(storedConfig));
        }
    }, []);

    const handleSaveConfig = (config: GitHubConfig | null) => {
        if (config) {
            localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
            setGithubConfig(config);
        } else {
            localStorage.removeItem(GITHUB_CONFIG_KEY);
            setGithubConfig(null);
        }
        setIsConfigModalOpen(false);
    };

    const publishToGitHub = async () => {
        if (!githubConfig) {
            setPublishStatus('error');
            setPublishMessage("Configuração do GitHub não encontrada.");
            return;
        }
    
        setPublishStatus('publishing');
        setPublishMessage('Publicando alterações...');
    
        const latestMaintenanceData = await db.getMaintenanceRecords();
        const latestComponentData = await db.getComponentReplacements();
        
        latestMaintenanceData.sort(sortByDateDesc);
        latestComponentData.sort(sortByDateDesc);
    
        const dataToString = (data: any[]) => {
            return JSON.stringify(data, (key, value) => {
                if (key === 'Data' && value) return `__DATE__${new Date(value).toISOString()}__DATE__`;
                return value;
            }, 2).replace(/"__DATE__(.*?)__DATE__"/g, "new Date('$1')").replace(/\\/g, '\\\\');
        };
        
        const dynamicClientList = getUniqueClients(latestMaintenanceData);
    
        const content = `import { MaintenanceRecord, ComponentType, ComponentReplacementRecord } from './types';

export const CLIENT_LIST = ${JSON.stringify(dynamicClientList, null, 2)};

export const COMPONENT_LIST: ComponentType[] = ${JSON.stringify(COMPONENT_LIST, null, 2)};

export const MOCK_COMPONENT_REPLACEMENTS: Omit<ComponentReplacementRecord, 'ID'>[] = ${dataToString(latestComponentData.map(({ ID, ...rest }) => rest))};

export const MOCK_DATA: Omit<MaintenanceRecord, 'ID' | 'Status'>[] = ${dataToString(latestMaintenanceData.map(({ ID, Status, ...rest }) => rest))};
`.trim();
    
        try {
            // --- STEP 1: Get current file SHA to perform an update ---
            let currentSha: string | undefined;
            try {
                const getFileResponse = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${GITHUB_FILE_PATH}`, {
                    headers: { 'Authorization': `token ${githubConfig.token}` }
                });
    
                if (getFileResponse.ok) {
                    const fileData = await getFileResponse.json();
                    currentSha = fileData.sha;
                } else if (getFileResponse.status === 404) {
                    currentSha = undefined; // File doesn't exist, this is fine. We will create it.
                } else {
                    const errorBody = await getFileResponse.json().catch(() => ({}));
                    if (getFileResponse.status === 401 || getFileResponse.status === 403) {
                        throw new Error('Token do GitHub inválido ou sem permissão de leitura. Verifique o token e as permissões do repositório.');
                    }
                    throw new Error(`Falha ao verificar arquivo no GitHub (Status: ${getFileResponse.status}). ${errorBody.message || ''}`);
                }
            } catch (networkError) {
                if (networkError instanceof Error && (networkError.message.includes('Falha ao verificar') || networkError.message.includes('Token do GitHub'))) {
                    throw networkError;
                }
                console.error("Network error while checking GitHub file:", networkError);
                throw new Error('Falha de rede ao verificar o arquivo no GitHub. Verifique sua conexão com a internet.');
            }
    
            // --- STEP 2: Create or Update the file ---
            try {
                const updateResponse = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${GITHUB_FILE_PATH}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `[BOT] Atualiza dados em ${new Date().toISOString()}`,
                        content: btoa(unescape(encodeURIComponent(content))),
                        sha: currentSha // sha is undefined if creating a new file
                    })
                });
    
                if (!updateResponse.ok) {
                    const errorBody = await updateResponse.json().catch(() => ({}));
                    if (updateResponse.status === 401 || updateResponse.status === 403) throw new Error('Token do GitHub inválido ou sem permissão de escrita.');
                    if (updateResponse.status === 404) throw new Error('Repositório ou Dono não encontrado. Verifique as configurações.');
                    if (updateResponse.status === 409) throw new Error('Conflito de versão. O arquivo no GitHub foi modificado. Tente publicar novamente.');
                    if (updateResponse.status === 422) throw new Error(`Erro de validação do GitHub: ${errorBody.message || 'Verifique se os dados estão corretos.'}`);
                    throw new Error(`Erro ao publicar no GitHub (Status: ${updateResponse.status}): ${errorBody.message || 'Erro desconhecido'}`);
                }
            } catch (networkError) {
                 if (networkError instanceof Error && networkError.message.includes('Erro ao publicar')) {
                    throw networkError;
                }
                console.error("Network error while publishing to GitHub:", networkError);
                throw new Error('Falha de rede ao publicar o arquivo. Verifique sua conexão com a internet.');
            }
    
            setPublishStatus('success');
            setPublishMessage('Publicado no GitHub! A atualização estará visível no site em alguns minutos.');
    
        } catch (error) {
            setPublishStatus('error');
            setPublishMessage(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao publicar.');
            console.error("GitHub Publish Error:", error);
        }
    };

    const handleAddMaintenance = async (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => {
        await onAddRecord(record);
        if (!githubConfig) {
            setIsConfigModalOpen(true);
        } else {
            await publishToGitHub();
        }
    };

    const handleAddComponent = async (record: Omit<ComponentReplacementRecord, 'ID'>) => {
        await onAddComponentReplacement(record);
        if (!githubConfig) {
            setIsConfigModalOpen(true);
        } else {
            await publishToGitHub();
        }
    };

    const allTechnicians = useMemo(() => getUniqueTechnicians(maintenanceData), [maintenanceData]);
    const allClients = useMemo(() => getUniqueClients(maintenanceData), [maintenanceData]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <AddRecordSection onAdd={handleAddMaintenance} allTechnicians={allTechnicians} allClients={allClients} />
                </div>
                <div className="lg:col-span-2">
                     <ComponentReplacementSection 
                        records={componentReplacements} 
                        onAdd={handleAddComponent}
                        clients={allClients} 
                        components={COMPONENT_LIST}
                    />
                </div>
            </div>

            <GitHubConfigModal 
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                onSave={handleSaveConfig}
                initialConfig={githubConfig}
            />
            <PublishStatusModal 
                status={publishStatus}
                message={publishMessage}
                onClose={() => setPublishStatus('idle')}
            />
        </div>
    );
};

export default AddRecordPage;