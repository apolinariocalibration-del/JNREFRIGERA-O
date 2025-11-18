import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord, GitHubConfig } from './types';
import DashboardPage from './DashboardPage';
import AddRecordPage from './AddRecordPage';
import ChartsPage from './ChartsPage';
import LoginPage from './LoginPage';
import * as db from './db';
import { GITHUB_DEFAULTS, GITHUB_CONSTANTS } from './config';
import { normalizeTechnicianName } from './utils';

// --- HELPER FUNCTIONS ---

// Helper to decode base64 content from GitHub API using modern, robust methods.
const decodeGitHubFileContent = async (base64: string): Promise<any> => {
    try {
        // Use the fetch API with a data URI for robust, cross-browser Base64 decoding.
        // This handles UTF-8 characters correctly, which window.atob does not.
        const response = await fetch(`data:application/json;base64,${base64.trim()}`);
        if (!response.ok) {
            throw new Error('Failed to decode base64 content via fetch.');
        }
        return await response.json();
    } catch (e) {
        console.error("Failed to decode or parse GitHub file content:", e);
        if (e instanceof SyntaxError) {
             console.error("The decoded content is not valid JSON.");
        }
        return null;
    }
};

// Helper to convert a UTF-8 string to a Base64 string.
const utf8ToBase64 = (str: string): string => {
    const bytes = new TextEncoder().encode(str);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
};

const sortByDateDesc = <T extends { Data: Date }>(a: T, b: T) => new Date(b.Data).getTime() - new Date(a.Data).getTime();


// --- MODAL COMPONENTS ---

const GitHubConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: GitHubConfig | null) => void;
    initialConfig: GitHubConfig | null;
}> = ({ isOpen, onClose, onSave, initialConfig }) => {
    const [config, setConfig] = useState<GitHubConfig>(initialConfig || { token: '', owner: GITHUB_DEFAULTS.OWNER, repo: GITHUB_DEFAULTS.REPO });

    useEffect(() => {
        setConfig(initialConfig || { token: '', owner: GITHUB_DEFAULTS.OWNER, repo: GITHUB_DEFAULTS.REPO });
    }, [initialConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(config);
    };

    const handleRemove = () => {
        localStorage.removeItem(GITHUB_CONSTANTS.CONFIG_KEY);
        onSave(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg border border-slate-700">
                <h2 className="text-2xl font-semibold mb-4 text-white">Configurar Publicação Automática</h2>
                <p className="text-slate-400 mb-4 text-sm">Insira os detalhes do seu repositório no GitHub e um Token de Acesso Pessoal (PAT) para ativar a publicação automática.</p>
                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-sm rounded-md p-3 my-4">
                    <p className="font-bold">Aviso de Segurança</p>
                    <p>As configurações são armazenadas no seu navegador. Use um token com as permissões mínimas (`repo`) e considere revogá-lo periodicamente.</p>
                </div>
                
                <div className="my-6 text-sm text-slate-400">
                    <p className="font-semibold text-slate-300 mb-2">Solução de Problemas de Acesso:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            <strong>Permissões (Escopo):</strong> Certifique-se de que seu token tem o escopo <code className="bg-slate-700 text-cyan-300 px-1 rounded-sm text-xs">repo</code> habilitado para permitir acesso a repositórios.
                        </li>
                        <li>
                            <strong>Autorização SSO:</strong> Se o repositório pertence a uma organização que exige Single Sign-On (SSO), você <strong>precisa</strong> autorizar o token para essa organização. Após criar o token, clique em <code className="bg-slate-700 text-cyan-300 px-1 rounded-sm text-xs">Configure SSO</code> e autorize o acesso.
                        </li>
                        <li>
                            <strong>Validade:</strong> Verifique se o token não está expirado.
                        </li>
                    </ul>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Dono (Usuário ou Organização)</label>
                        <input type="text" name="owner" value={config.owner} onChange={handleChange} placeholder="ex: seu-usuario-github" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Repositório</label>
                        <input type="text" name="repo" value={config.repo} onChange={handleChange} placeholder="ex: meu-dashboard" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Token de Acesso Pessoal (PAT)</label>
                        <input type="password" name="token" value={config.token} onChange={handleChange} placeholder="cole seu token aqui" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                        <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">Como criar um token? (Requer escopo `repo`)</a>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                         <button type="button" onClick={handleRemove} className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md">Remover Configuração</button>
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
                <p className="text-white font-semibold mb-2">{status === 'error' ? 'Erro na Publicação' : 'Status da Publicação'}</p>
                <p className="text-slate-300 text-sm">{message}</p>
                {(status === 'success' || status === 'error') && (
                    <button onClick={onClose} className="mt-4 px-5 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold text-sm">Fechar</button>
                )}
            </div>
        </div>
    );
};


// Main App Component
const App = () => {
    const [maintenanceData, setMaintenanceData] = useState<MaintenanceRecord[]>([]);
    const [componentReplacements, setComponentReplacements] = useState<ComponentReplacementRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<'viewer' | 'admin' | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const dataFileShaRef = useRef<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // --- GitHub Sync State ---
    const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(() => {
        try {
            const stored = localStorage.getItem(GITHUB_CONSTANTS.CONFIG_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
    const [publishMessage, setPublishMessage] = useState('');

    // --- Filtering State ---
    const [clientFilter, setClientFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');

    // --- Edit Modal State ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<MaintenanceRecord | null>(null);
    
    // --- Full Edit Modal State ---
    const [isFullEditModalOpen, setIsFullEditModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<MaintenanceRecord | null>(null);

    // --- Navigation State ---
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [newlyAddedRecordId, setNewlyAddedRecordId] = useState<number | null>(null);


    const fetchData = useCallback(async (isManualRefresh = false) => {
        if (!isManualRefresh) setIsLoading(true);
        else {
            setIsRefreshing(true);
            setRefreshMessage("Sincronizando com o servidor...");
        }
    
        setFetchError(null);
    
        let dataFromSource: { maintenanceRecords: any[], componentReplacements: any[] } | null = null;
        let source = "Cache Local";
    
        const config = githubConfig;
        const canFetchFromGitHub = 
            config && 
            config.owner && 
            config.repo && 
            config.token &&
            config.owner !== 'seu-usuario-ou-organizacao' &&
            config.repo !== 'seu-repositorio-do-dashboard';
    
        if (canFetchFromGitHub) {
            try {
                const headers: HeadersInit = { 'Authorization': `token ${config.token}` };
                const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${GITHUB_CONSTANTS.FILE_PATH}`;
                const response = await fetch(url, { headers, cache: "no-store" });

                if (response.status === 401) throw new Error('401 Unauthorized');
                if (response.status === 403) throw new Error('403 Forbidden');
                if (response.status === 404) throw new Error('404 Not Found');
                if (!response.ok) throw new Error(`GitHub API request failed with status ${response.status}`);

                const fileData = await response.json();
                dataFileShaRef.current = fileData.sha;
                dataFromSource = await decodeGitHubFileContent(fileData.content);
                source = "GitHub";

            } catch (error) {
                console.error("Failed to fetch from GitHub, falling back to local data:", error);
                if (isManualRefresh) setRefreshMessage("Falha ao buscar do GitHub. Usando dados locais.");
                
                let errorMessage = "Não foi possível sincronizar com o GitHub. Verifique sua conexão ou a configuração do repositório.";
                if (error.message.includes('404')) {
                    errorMessage = "Repositório ou arquivo não encontrado no GitHub. Verifique se o 'Dono', 'Nome do Repositório' estão corretos e se o arquivo 'public/data.json' existe. O repositório também não pode ser privado.";
                } else if (error.message.includes('403')) {
                    errorMessage = "Acesso negado. Verifique as permissões do seu token de acesso ('repo'). Pode ser também que o limite de requisições da API do GitHub foi excedido.";
                } else if (error.message.includes('401')) {
                    errorMessage = "Token de acesso inválido ou expirado. Por favor, verifique a configuração.";
                }
                setFetchError(errorMessage);
            }
        }
        
        if (!dataFromSource) {
            try {
                const response = await fetch(`/${GITHUB_CONSTANTS.FILE_PATH}`);
                if (!response.ok) throw new Error("Local data file not found.");
                dataFromSource = await response.json();
                source = "Arquivo Local (Base)";
            } catch (error) {
                console.error("Failed to fetch local data file:", error);
                 if (isManualRefresh) setRefreshMessage("Erro ao carregar dados locais.");
            }
        }
    
        if (dataFromSource) {
            const maintenance = (dataFromSource.maintenanceRecords || [])
                .map((r: any) => ({ ...r, Data: new Date(r.Data) }))
                .sort(sortByDateDesc);
            const components = (dataFromSource.componentReplacements || [])
                .map((r: any) => ({ ...r, Data: new Date(r.Data) }))
                .sort(sortByDateDesc);
    
            setMaintenanceData(maintenance);
            setComponentReplacements(components);
            await db.saveAllMaintenanceRecords(maintenance);
            await db.saveAllComponentReplacements(components);
            if (isManualRefresh && source === 'GitHub') {
                setRefreshMessage(`Dados sincronizados via ${source}!`);
            }
        }
        
        if (isManualRefresh) {
            setTimeout(() => {
                setIsRefreshing(false);
                setRefreshMessage(null);
            }, 2000);
        }
    
        setIsLoading(false);
    }, [githubConfig]);

    const publishData = async (
        updatedMaintenance: MaintenanceRecord[],
        updatedComponents: ComponentReplacementRecord[]
    ): Promise<boolean> => {
        const isConfigInvalid = 
            !githubConfig?.token || 
            !githubConfig.owner || 
            !githubConfig.repo ||
            githubConfig.owner === GITHUB_DEFAULTS.OWNER ||
            githubConfig.repo === GITHUB_DEFAULTS.REPO;
    
        if (isConfigInvalid) {
            console.warn("GitHub configuration is incomplete or uses default placeholders. Opening config modal.");
            setPublishStatus('error');
            setPublishMessage('A publicação automática não está configurada. Por favor, adicione as informações do seu repositório GitHub para habilitar a sincronização.');
            setIsConfigModalOpen(true);
            return false;
        }

        setPublishStatus('publishing');
        setPublishMessage('Publicando alterações...');

        try {
            let latestSha: string | undefined = undefined;

            const fileUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${GITHUB_CONSTANTS.FILE_PATH}`;
            const getResponse = await fetch(fileUrl, {
                headers: { 'Authorization': `token ${githubConfig.token}` },
                cache: 'no-store'
            });

            if (getResponse.ok) {
                const fileData = await getResponse.json();
                latestSha = fileData.sha;
            } else if (getResponse.status === 404) {
                console.log("data.json not found on GitHub. A new file will be created.");
            } else {
                const errorBody = await getResponse.json().catch(() => ({ message: `GitHub API returned status ${getResponse.status}` }));
                throw new Error(`Failed to check for existing data file. Reason: ${errorBody.message || 'Unknown error'}`);
            }

            const content = {
                maintenanceRecords: updatedMaintenance,
                componentReplacements: updatedComponents
            };
            const encodedContent = utf8ToBase64(JSON.stringify(content, null, 2));

            const requestBody: { message: string; content: string; sha?: string } = {
                message: `[BOT] Atualização de dados em ${new Date().toISOString()}`,
                content: encodedContent,
            };

            if (latestSha) {
                requestBody.sha = latestSha;
            }

            const putResponse = await fetch(fileUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!putResponse.ok) {
                const errorData = await putResponse.json();
                throw new Error(`GitHub API Error: ${errorData.message || 'Unknown error during file write'}`);
            }

            const result = await putResponse.json();
            dataFileShaRef.current = result.content.sha;

            setPublishStatus('success');
            setPublishMessage('Dados publicados com sucesso!');
            return true;

        } catch (error) {
            console.error('Failed to publish data:', error);
            let detailedMessage = `Erro desconhecido: ${error.message}`;
             if (error.message.includes('Resource not accessible') || error.message.includes('Not Found')) {
                detailedMessage = "Acesso negado ou repositório não encontrado. Verifique se o Dono (OWNER) e o Repositório (REPO) estão corretos. Além disso, certifique-se de que seu token tem permissão `repo` e, se necessário, foi autorizado para a organização (SSO).";
            } else if (error.message.includes('401') || error.message.includes('Bad credentials')) {
                 detailedMessage = "Token inválido ou expirado. Por favor, verifique seu token de acesso pessoal na tela de configuração.";
            } else if (error.message.includes('API rate limit exceeded')) {
                 detailedMessage = "Limite de requisições da API do GitHub excedido. Tente novamente mais tarde.";
            }
            
            setPublishStatus('error');
            setPublishMessage(detailedMessage);
            return false;
        }
    };
    
     useEffect(() => {
        // Effect for handling config changes from other tabs/windows via localStorage
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === GITHUB_CONSTANTS.CONFIG_KEY) {
                const newConfig = event.newValue ? JSON.parse(event.newValue) : null;
                setGithubConfig(newConfig);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        // Effect for fetching data and setting up the refresh interval.
        // It runs on the initial load and whenever the githubConfig changes.
        fetchData(); 

        const intervalId = setInterval(() => {
            console.log("Refreshing data automatically...");
            fetchData(true);
        }, 5 * 60 * 1000); // every 5 minutes

        // Cleanup interval when the component unmounts or when the config changes.
        return () => clearInterval(intervalId);
    }, [fetchData]);


    // --- HANDLER FUNCTIONS ---
    
    const handleLogin = (user: string, pass: string) => {
        const normalizedUser = user.trim().toLowerCase();
        const normalizedPass = pass.trim();

        if (normalizedUser === 'apolinario' && normalizedPass === 'Enzo2523') {
            setUserRole('admin');
            setLoginError(null);
        } else if (normalizedUser === 'jn' && normalizedPass === '123') {
            setUserRole('viewer');
            setLoginError(null);
        } else {
            setLoginError("Usuário ou senha inválidos.");
        }
    };
    
    const handleLogout = () => {
        setUserRole(null);
        setLoginError(null);
    };

    const handleSaveConfig = (config: GitHubConfig | null) => {
        setGithubConfig(config);
        if (config) {
            localStorage.setItem(GITHUB_CONSTANTS.CONFIG_KEY, JSON.stringify(config));
        } else {
            localStorage.removeItem(GITHUB_CONSTANTS.CONFIG_KEY);
        }
        setIsConfigModalOpen(false);
    };

    const handleAddRecord = async (record: Omit<MaintenanceRecord, 'ID' | 'Status'>) => {
        const newId = maintenanceData.length > 0 ? Math.max(...maintenanceData.map(r => r.ID)) + 1 : 1;
        const newRecord: MaintenanceRecord = {
            ...record,
            ID: newId,
            Status: record.Pendencia ? 'Pendente' : 'Concluído'
        };
        const updatedData = [newRecord, ...maintenanceData].sort(sortByDateDesc);
        setMaintenanceData(updatedData);
        await db.saveAllMaintenanceRecords(updatedData);
        
        const success = await publishData(updatedData, componentReplacements);
        if (success) {
            setNewlyAddedRecordId(newId);
            setCurrentPage('dashboard');
        }
    };

    const handleAddComponentReplacement = async (record: Omit<ComponentReplacementRecord, 'ID'>) => {
        const newId = componentReplacements.length > 0 ? Math.max(...componentReplacements.map(r => r.ID)) + 1 : 1;
        const newRecord: ComponentReplacementRecord = { ...record, ID: newId };
        
        const updatedData = [newRecord, ...componentReplacements].sort(sortByDateDesc);
        setComponentReplacements(updatedData);
        await db.saveAllComponentReplacements(updatedData);

        await publishData(maintenanceData, updatedData);
    };

    const handleUpdateRecord = async (id: number, updatedData: { Pendencia: string; OBS: string }) => {
        const updatedRecords = maintenanceData.map(record => {
            if (record.ID === id) {
                return {
                    ...record,
                    Pendencia: updatedData.Pendencia,
                    OBS: record.OBS ? `${record.OBS}\n[CONCLUÍDO] ${updatedData.OBS}` : `[CONCLUÍDO] ${updatedData.OBS}`,
                    Status: updatedData.Pendencia ? 'Pendente' as const : 'Concluído' as const
                };
            }
            return record;
        });

        setMaintenanceData(updatedRecords);
        await db.saveAllMaintenanceRecords(updatedRecords);
        await publishData(updatedRecords, componentReplacements);
        onCloseEditModal();
    };
    
    const handleUpdateFullRecord = async (updatedRecord: MaintenanceRecord) => {
        const updatedRecords = maintenanceData.map(record =>
            record.ID === updatedRecord.ID 
                ? { 
                    ...updatedRecord, 
                    Status: updatedRecord.Pendencia ? 'Pendente' as const : 'Concluído' as const
                } 
                : record
        );

        setMaintenanceData(updatedRecords);
        await db.saveAllMaintenanceRecords(updatedRecords);
        await publishData(updatedRecords, componentReplacements);
        onCloseFullEditModal();
    };

    const handleDeleteRecord = async (id: number) => {
        const updatedRecords = maintenanceData.filter(record => record.ID !== id);
        setMaintenanceData(updatedRecords);
        await db.saveAllMaintenanceRecords(updatedRecords);
        await publishData(updatedRecords, componentReplacements);
    };

    // --- MODAL OPEN/CLOSE ---
    const onOpenEditModal = (record: MaintenanceRecord) => {
        setCurrentRecord(record);
        setIsEditModalOpen(true);
    };
    const onCloseEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentRecord(null);
    };
    
    const onOpenFullEditModal = (record: MaintenanceRecord) => {
        setRecordToEdit(record);
        setIsFullEditModalOpen(true);
    };
    const onCloseFullEditModal = () => {
        setIsFullEditModalOpen(false);
        setRecordToEdit(null);
    };

    // --- DERIVED STATE ---
    const filteredData = useMemo(() => {
        return maintenanceData
            .filter(record => clientFilter === 'all' || record.Cliente === clientFilter)
            .filter(record => statusFilter === 'all' || record.Status === statusFilter)
            .filter(record => {
                if (yearFilter === 'all') return true;
                return new Date(record.Data).getUTCFullYear().toString() === yearFilter;
            })
            .filter(record => {
                if (monthFilter === 'all') return true;
                return (new Date(record.Data).getUTCMonth() + 1).toString() === monthFilter;
            });
    }, [maintenanceData, clientFilter, statusFilter, monthFilter, yearFilter]);

    const filteredComponentReplacements = useMemo(() => {
        const filteredClients = new Set(filteredData.map(r => r.Cliente));
        return componentReplacements.filter(comp => {
            const recordDate = new Date(comp.Data);
            const yearMatch = yearFilter === 'all' || recordDate.getUTCFullYear().toString() === yearFilter;
            const monthMatch = monthFilter === 'all' || (recordDate.getUTCMonth() + 1).toString() === monthFilter;
            const clientMatch = clientFilter === 'all' || comp.Cliente === clientFilter;
            
            if(clientFilter !== 'all'){
                return clientMatch && yearMatch && monthMatch;
            }
            return filteredClients.has(comp.Cliente) && yearMatch && monthMatch;
        });
    }, [filteredData, componentReplacements, clientFilter, monthFilter, yearFilter]);
    
    const clearFilters = () => {
        setClientFilter('all');
        setStatusFilter('all');
        setMonthFilter('all');
        setYearFilter('all');
    };

    if (!userRole) return <LoginPage onLogin={handleLogin} error={loginError} />;
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <span className="text-6xl mb-4">❄️</span>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
                <p className="text-lg">Carregando dados...</p>
            </div>
        );
    }

    const NavButton: React.FC<{ page: string; label: string; icon: React.ReactNode }> = ({ page, label, icon }) => (
        <button
            onClick={() => setCurrentPage(page)}
            className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === page ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
        >
            {icon} {label}
        </button>
    );

    return (
        <>
            <div className="min-h-screen bg-slate-900 text-slate-200">
                 <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-40">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                               <span className="text-2xl">❄️</span>
                               <h1 className="text-xl font-bold text-white hidden sm:block">JN Refrigeração</h1>
                            </div>
                            <nav className="flex items-center gap-2">
                                <NavButton page="dashboard" label="Dashboard" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>} />
                                {userRole === 'admin' && <NavButton page="add" label="Adicionar" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>} />}
                                <NavButton page="charts" label="Gráficos" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>} />
                            </nav>
                            <div className="flex items-center gap-4">
                                <button onClick={() => fetchData(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" title="Sincronizar dados">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5M12 4V2M12 22v-2M4 12H2M22 12h-2" /></svg>
                                </button>
                                {userRole === 'admin' && (
                                    <button onClick={() => setIsConfigModalOpen(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" title="Configurar Publicação">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                                    </button>
                                )}
                                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-slate-700 transition-colors" title="Sair">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                         {isRefreshing && (
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full bg-slate-700 text-white text-xs px-3 py-1 rounded-b-md shadow-lg">
                                 {refreshMessage}
                             </div>
                         )}
                    </div>
                </header>

                {fetchError && (
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-red-900/50 border border-red-700 text-red-200 text-sm rounded-md p-4 my-4 flex items-start gap-4">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <strong className="font-semibold">Erro de Sincronização:</strong>
                                <p>{fetchError}</p>
                            </div>
                        </div>
                    </div>
                )}

                <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                    {currentPage === 'dashboard' && (
                        <DashboardPage
                            userRole={userRole}
                            maintenanceData={maintenanceData}
                            filteredData={filteredData}
                            componentReplacements={filteredComponentReplacements}
                            allComponentReplacements={componentReplacements}
                            onOpenEditModal={onOpenEditModal}
                            isEditModalOpen={isEditModalOpen}
                            currentRecord={currentRecord}
                            onUpdateRecord={handleUpdateRecord}
                            onCloseEditModal={onCloseEditModal}
                            clientFilter={clientFilter}
                            statusFilter={statusFilter}
                            monthFilter={monthFilter}
                            yearFilter={yearFilter}
                            onClientFilterChange={setClientFilter}
                            onStatusFilterChange={setStatusFilter}
                            onMonthFilterChange={setMonthFilter}
                            onYearFilterChange={setYearFilter}
                            onOpenFullEditModal={onOpenFullEditModal}
                            isFullEditModalOpen={isFullEditModalOpen}
                            recordToEdit={recordToEdit}
                            onUpdateFullRecord={handleUpdateFullRecord}
                            onCloseFullEditModal={onCloseFullEditModal}
                            onDeleteRecord={handleDeleteRecord}
                            newlyAddedRecordId={newlyAddedRecordId}
                            setNewlyAddedRecordId={setNewlyAddedRecordId}
                        />
                    )}
                    {currentPage === 'add' && userRole === 'admin' && (
                        <AddRecordPage
                            onAddRecord={handleAddRecord}
                            onAddComponentReplacement={handleAddComponentReplacement}
                            componentReplacements={componentReplacements}
                            maintenanceData={maintenanceData}
                        />
                    )}
                    {currentPage === 'charts' && (
                        <ChartsPage
                            maintenanceData={filteredData}
                            allMaintenanceData={maintenanceData}
                            componentReplacements={componentReplacements}
                            clientFilter={clientFilter}
                            statusFilter={statusFilter}
                            monthFilter={monthFilter}
                            yearFilter={yearFilter}
                            onClearFilters={clearFilters}
                        />
                    )}
                </main>
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
        </>
    );
};

export default App;