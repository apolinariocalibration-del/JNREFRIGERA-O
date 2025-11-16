import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord, ComponentType } from './types';
import { COMPONENT_LIST } from './constants';
import * as db from './db';
import { GITHUB_CONFIG } from './config';
import { formatDateForInput, parseDateFromInput, normalizeTechnicianName } from './utils';

// --- GITHUB CONFIG TYPES AND CONSTANTS ---
const GITHUB_TOKEN_KEY = 'jnRefrigeracaoGithubToken';
const GITHUB_FILE_PATH = 'public/data.json';

interface GitHubTokenConfig {
    token: string;
}

// --- HELPER FUNCTIONS ---

// Helper to convert a UTF-8 string to a Base64 string using modern, robust methods.
const utf8ToBase64 = (str: string): string => {
    const bytes = new TextEncoder().encode(str);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
};

// Helper to decode base64 content from GitHub API, moved here for use in publishing.
const decodeGitHubFileContent = (base64: string): any => {
    try {
        const binaryString = window.atob(base64.trim());
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const decodedString = new TextDecoder('utf-8').decode(bytes);
        return JSON.parse(decodedString);
    } catch (e) {
        console.error("Failed to decode or parse GitHub file content:", e);
        return null;
    }
};


const getUniqueTechnicians = (records: MaintenanceRecord[]): string[] => {
    const techSet = new Set<string>();
    records.forEach(record => {
        (record.Equipe || '').split(/[\\\/]/).forEach(techName => {
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

const sortByDateDesc = <T extends { Data: Date }>(a: T, b: T) => new Date(b.Data).getTime() - new Date(a.Data).getTime();


// --- MODAL COMPONENTS ---

const GitHubConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: GitHubTokenConfig | null) => void;
    initialConfig: GitHubTokenConfig | null;
}> = ({ isOpen, onClose, onSave, initialConfig }) => {
    const [config, setConfig] = useState<GitHubTokenConfig>(initialConfig || { token: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(config);
    };

    const handleRemove = () => {
        localStorage.removeItem(GITHUB_TOKEN_KEY);
        onSave(null); // Notify parent component
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg border border-slate-700">
                <h2 className="text-2xl font-semibold mb-4 text-white">Configurar Publicação Automática</h2>
                <p className="text-slate-400 mb-4 text-sm">Insira seu Token de Acesso Pessoal (PAT) do GitHub para ativar a publicação automática. Seu registro foi salvo localmente e será publicado na próxima atualização.</p>
                
                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-sm rounded-md p-3 my-4">
                    <p className="font-bold">Aviso de Segurança</p>
                    <p>O Token de Acesso Pessoal é armazenado no seu navegador. Embora conveniente, isso apresenta um risco de segurança se seu computador for comprometido. Use um token com as permissões mínimas necessárias (escopo `repo`) e considere revogá-lo periodicamente.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Token de Acesso Pessoal (PAT)</label>
                        <input type="password" name="token" value={config.token} onChange={handleChange} placeholder="cole seu token aqui" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                        <p className="text-xs text-slate-400 mt-1">O Dono e o Repositório são configurados no arquivo `config.ts`.</p>
                        <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">Como criar um token? (Requer escopo `repo`)</a>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                         <button type="button" onClick={handleRemove} className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md">Remover Token</button>
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
        if (value) {
            setFormData(prev => ({ ...prev, [name]: parseDateFromInput(value) }));
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Create a copy to normalize before submission
        const recordToSubmit = { ...formData };

        // Normalize technician names in the 'Equipe' field
        if (recordToSubmit.Equipe) {
            const normalizedTeam = recordToSubmit.Equipe
                .split(/[\\\/]/) // Split by slash or backslash
                .map(name => normalizeTechnicianName(name.trim())) // Normalize each name
                .join(' / '); // Join back with a consistent separator
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
    onPublishSuccess: (newSha: string) => void;
}

const AddRecordPage: React.FC<AddRecordPageProps> = ({ onAddRecord, onAddComponentReplacement, componentReplacements, maintenanceData, onPublishSuccess }) => {
    const [githubTokenConfig, setGithubTokenConfig] = useState<GitHubTokenConfig | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
    const [publishMessage, setPublishMessage] = useState('');

    useEffect(() => {
        const storedConfig = localStorage.getItem(GITHUB_TOKEN_KEY);
        if (storedConfig) {
            setGithubTokenConfig(JSON.parse(storedConfig));
        }
    }, []);

    const handleSaveConfig = (config: GitHubTokenConfig | null) => {
        if (config) {
            localStorage.setItem(GITHUB_TOKEN_KEY, JSON.stringify(config));
            setGithubTokenConfig(config);
        } else {
            localStorage.removeItem(GITHUB_TOKEN_KEY);
            setGithubTokenConfig(null);
        }
        setIsConfigModalOpen(false);
    };

    const publishToGitHub = async (): Promise<string | null> => {
        const { OWNER, REPO } = GITHUB_CONFIG;
        if (OWNER === 'SEU_USUARIO_GITHUB' || REPO === 'SEU_REPOSITORIO_GITHUB') {
            setPublishStatus('error');
            setPublishMessage("Ação necessária: Configure o dono e o repositório no arquivo 'config.ts' do projeto.");
            return null;
        }

        if (!githubTokenConfig?.token) {
            setPublishStatus('error');
            setPublishMessage("Configuração do Token do GitHub não encontrada.");
            return null;
        }
    
        setPublishStatus('publishing');
        setPublishMessage('Sincronizando com o servidor...');
        
        const token = githubTokenConfig.token;
        const githubApiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${GITHUB_FILE_PATH}`;

        try {
            // --- STEP 1: READ - Fetch the latest version from GitHub to avoid overwrites ---
            let remoteSha: string | undefined;
            let remoteMaintData: MaintenanceRecord[] = [];
            let remoteCompData: ComponentReplacementRecord[] = [];

            const getFileResponse = await fetch(githubApiUrl, {
                headers: { 'Authorization': `token ${token}` },
                cache: 'no-store'
            });

            if (getFileResponse.ok) {
                const fileData = await getFileResponse.json();
                remoteSha = fileData.sha;
                const decodedContent = decodeGitHubFileContent(fileData.content);
                if (decodedContent) {
                    remoteMaintData = (decodedContent.maintenanceRecords || []).map((r: any) => ({ ...r, Data: new Date(r.Data) }));
                    remoteCompData = (decodedContent.componentReplacements || []).map((r: any) => ({ ...r, Data: new Date(r.Data) }));
                }
            } else if (getFileResponse.status !== 404) {
                 const errorBody = await getFileResponse.json().catch(() => ({}));
                 throw new Error(`Falha ao buscar dados do GitHub (Status: ${getFileResponse.status}). ${errorBody.message || ''}`);
            }

            // --- STEP 2: MERGE - Combine remote data with local data ---
            const localMaintData = await db.getMaintenanceRecords();
            const localCompData = await db.getComponentReplacements();

            // Find new records by checking IDs that exist locally but not remotely
            const remoteMaintIds = new Set(remoteMaintData.map(r => r.ID));
            const newMaintRecords = localMaintData.filter(r => !remoteMaintIds.has(r.ID));

            const remoteCompIds = new Set(remoteCompData.map(r => r.ID));
            const newCompRecords = localCompData.filter(r => !remoteCompIds.has(r.ID));

            // Combine and sort
            const mergedMaintData = [...remoteMaintData, ...newMaintRecords].sort(sortByDateDesc);
            const mergedCompData = [...remoteCompData, ...newCompRecords].sort(sortByDateDesc);

            const dataToPublish = {
                maintenanceRecords: mergedMaintData,
                componentReplacements: mergedCompData,
            };
            
            const content = JSON.stringify(dataToPublish, null, 2);

            // --- STEP 3: WRITE - Publish the merged data back to GitHub ---
            setPublishMessage('Publicando alterações...');
            
            const updateResponse = await fetch(githubApiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `[BOT] Atualiza data.json em ${new Date().toISOString()}`,
                    content: utf8ToBase64(content),
                    sha: remoteSha
                })
            });

            if (!updateResponse.ok) {
                const errorBody = await updateResponse.json().catch(() => ({}));
                if (updateResponse.status === 409) {
                     throw new Error('Conflito de versão. Outra pessoa atualizou os dados. Por favor, clique no botão "Atualizar" na página principal e tente novamente.');
                }
                throw new Error(`Erro ao publicar no GitHub (Status: ${updateResponse.status}): ${errorBody.message || 'Erro desconhecido'}`);
            }
            
            const updateResult = await updateResponse.json();
            const newSha = updateResult.content.sha;

            setPublishStatus('success');
            setPublishMessage('Publicado com sucesso! Os dados estão sincronizados.');
            return newSha;
    
        } catch (error) {
            setPublishStatus('error');
            setPublishMessage(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao publicar.');
            console.error("GitHub Publish Error:", error);
            return null;
        }
    };

    const handleAddMaintenance = async (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => {
        await onAddRecord(record);
        if (!githubTokenConfig) {
            setIsConfigModalOpen(true);
        } else {
            const newSha = await publishToGitHub();
            if (newSha) {
                onPublishSuccess(newSha);
            }
        }
    };

    const handleAddComponent = async (record: Omit<ComponentReplacementRecord, 'ID'>) => {
        await onAddComponentReplacement(record);
        if (!githubTokenConfig) {
            setIsConfigModalOpen(true);
        } else {
            const newSha = await publishToGitHub();
            if (newSha) {
                onPublishSuccess(newSha);
            }
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
                initialConfig={githubTokenConfig}
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