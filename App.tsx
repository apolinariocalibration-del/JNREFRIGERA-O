import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord, GitHubConfig } from './types';
import DashboardPage from './DashboardPage';
import AddRecordPage from './AddRecordPage';
import ChartsPage from './ChartsPage';
import LoginPage from './LoginPage';
import * as db from './db';
import { GITHUB_DEFAULTS, GITHUB_CONSTANTS } from './config';
import { normalizeTechnicianName } from './utils';
import { INITIAL_MAINTENANCE_DATA, INITIAL_COMPONENT_REPLACEMENTS } from './constants';

// --- HELPER FUNCTIONS ---

const decodeGitHubFileContent = async (base64: string): Promise<any> => {
    try {
        // Clean formatting (newlines) from base64 string
        const cleanBase64 = base64.replace(/\s/g, '');
        // Try native decoding first
        try {
            const decodedString = atob(cleanBase64);
            // Handle UTF-8 characters correctly
            const bytes = Uint8Array.from(decodedString, c => c.charCodeAt(0));
            const decoder = new TextDecoder('utf-8');
            return JSON.parse(decoder.decode(bytes));
        } catch (e) {
             // Fallback to fetch data uri if native fails (rare/large files)
             const response = await fetch(`data:application/json;base64,${cleanBase64}`);
             if (!response.ok) throw new Error('Failed to decode base64 content via fetch.');
             return await response.json();
        }
    } catch (e) {
        console.error("Failed to decode or parse GitHub file content:", e);
        return null;
    }
};

const utf8ToBase64 = (str: string): string => {
    const bytes = new TextEncoder().encode(str);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
};

const sortByDateDesc = <T extends { Data: Date }>(a: T, b: T) => {
    const dateA = new Date(a.Data).getTime();
    const dateB = new Date(b.Data).getTime();
    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
};


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
                        <input type="password" name="token" value={config.token} onChange={handleChange} placeholder="github_pat_..." className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                    </div>
                    <div className="flex justify-between items-center pt-4">
                         <button type="button" onClick={handleRemove} className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md">Remover</button>
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


    const syncWithRemote = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
            setRefreshMessage("Sincronizando com o servidor...");
        } else if (maintenanceData.length === 0) {
            setIsLoading(true);
        }
    
        let dataFromSource: { maintenanceRecords: any[], componentReplacements: any[] } | null = null;
        let source = "Cache Local";
        let gitHubSyncError: Error | null = null;
    
        const config = githubConfig;
        const canFetchFromGitHub = !!(config?.token && config?.owner && config?.repo);
    
        // 1. TENTATIVA GITHUB
        if (canFetchFromGitHub) {
            try {
                const headers: HeadersInit = { 'Authorization': `token ${config.token}` };
                // Important: Add timestamp to prevent caching
                const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${GITHUB_CONSTANTS.FILE_PATH}?t=${new Date().getTime()}`;
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
                console.error("Failed to fetch from GitHub, will use local data:", error);
                gitHubSyncError = error as Error;
            }
        }
    
        // 2. TENTATIVA LOCAL (FALLBACK)
        if (!dataFromSource) {
            try {
                // Try multiple paths to ensure we find the file regardless of deployment structure
                const pathsToTry = [
                    'data.json', 
                    '/data.json',
                    GITHUB_CONSTANTS.FILE_PATH, 
                    `/${GITHUB_CONSTANTS.FILE_PATH}`
                ];

                let response = null;
                for (const path of pathsToTry) {
                    try {
                        const res = await fetch(path);
                        const contentType = res.headers.get("content-type");
                        // Check if it is actually JSON and not an HTML 404 page
                        if (res.ok && contentType && contentType.includes("application/json")) {
                            response = res;
                            break;
                        }
                    } catch (e) { /* Continue */ }
                }

                if (response) {
                    dataFromSource = await response.json();
                    source = "Arquivo Local (Base)";
                } else {
                    throw new Error("Local data unavailable in all paths.");
                }

            } catch (localError) {
                console.warn("Failed to fetch local data file, checking cache and defaults...", localError);
                
                // 3. TENTATIVA CACHE OU CONSTANTES
                try {
                    const cachedM = await db.getMaintenanceRecords();
                    if (cachedM.length > 0) {
                         source = "Cache Offline";
                         dataFromSource = {
                            maintenanceRecords: cachedM,
                            componentReplacements: await db.getComponentReplacements()
                         };
                    } else {
                         // Se não houver cache, lança erro para cair no catch abaixo e usar constantes
                         throw new Error("Cache vazio.");
                    }
                } catch (e) {
                    // 4. FALLBACK FINAL: DADOS PADRÃO (CONSTANTS)
                    // Isso previne a Tela Branca e o erro "Failed to fetch"
                    console.warn("Usando dados padrão (constantes) como fallback.");
                    dataFromSource = { 
                         maintenanceRecords: INITIAL_MAINTENANCE_DATA, 
                         componentReplacements: INITIAL_COMPONENT_REPLACEMENTS 
                    };
                    source = "Dados Padrão";
                    setFetchError(null); // Limpa erro pois recuperamos com sucesso
                }
            }
        }
    
        if (dataFromSource) {
            setFetchError(null);
            try {
                // --- CRITICAL SANITIZATION STEP ---
                // This prevents "Failed to load" / White Screen of Death due to bad data
                const sanitizeRecords = (records: any[]) => {
                    if (!Array.isArray(records)) return [];
                    return records.map((r: any) => {
                        let d: Date;
                        try {
                            d = new Date(r.Data);
                            // Check if date is invalid
                            if (isNaN(d.getTime())) {
                                d = new Date(); 
                            }
                        } catch {
                            d = new Date();
                        }

                        return { 
                            ...r, 
                            ID: Number(r.ID) || 0, 
                            Data: d,
                            Status: r.Status || 'Concluído',
                            Cliente: r.Cliente || 'Desconhecido',
                            Serviço: r.Serviço || 'Geral'
                        };
                    });
                };

                const maintenance = sanitizeRecords(dataFromSource.maintenanceRecords).sort(sortByDateDesc);
                const components = sanitizeRecords(dataFromSource.componentReplacements).sort(sortByDateDesc);

                setMaintenanceData(maintenance);
                setComponentReplacements(components);
                
                // Update local storage backup
                await db.saveAllMaintenanceRecords(maintenance);
                await db.saveAllComponentReplacements(components);
                
                if (isRefreshing || isManualRefresh) {
                    setRefreshMessage(`Dados sincronizados: ${source}`);
                }
            } catch (processError) {
                console.error("Error processing data structure:", processError);
                setFetchError("Dados corrompidos recebidos.");
            }
        }
    
        if (isRefreshing || isManualRefresh) {
            setTimeout(() => {
                setIsRefreshing(false);
                setRefreshMessage(null);
            }, 3000);
        }
    
        setIsLoading(false);
    }, [githubConfig, maintenanceData.length, isRefreshing]);


    const publishData = async (
        updatedMaintenance: MaintenanceRecord[],
        updatedComponents: ComponentReplacementRecord[]
    ): Promise<boolean> => {
        const isConfigInvalid = 
            !githubConfig?.token || 
            !githubConfig.owner || 
            !githubConfig.repo;
    
        if (isConfigInvalid) {
            console.warn("GitHub configuration incomplete.");
            setPublishStatus('error');
            setPublishMessage('Configuração incompleta. Adicione o token nas configurações.');
            setIsConfigModalOpen(true);
            return false;
        }

        setPublishStatus('publishing');
        setPublishMessage('Publicando alterações...');

        try {
            const fileUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${GITHUB_CONSTANTS.FILE_PATH}`;
            
            // 1. Fetch current SHA to allow update (Prevent 409 Conflict)
            let currentSha = dataFileShaRef.current;
            
            try {
                const checkResponse = await fetch(fileUrl, {
                    headers: { 'Authorization': `token ${githubConfig.token}` },
                    cache: 'no-store'
                });
                if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    currentSha = checkData.sha;
                } else if (checkResponse.status === 404) {
                    // File doesn't exist, we will create it, so sha is undefined
                    currentSha = undefined;
                } else if (checkResponse.status === 401 || checkResponse.status === 403) {
                    throw new Error("Permissão negada. Verifique seu Token.");
                }
            } catch (e) {
                // If checking fails (e.g. network error), we might still try to PUT if we have a cached SHA, 
                // but usually safer to fail or assume creation if we are sure.
                // For now, let's proceed but if e is Auth error, rethrow.
                if (e instanceof Error && e.message.includes("Permissão")) throw e;
                console.log("Could not fetch latest SHA, proceeding with cached if available", e);
            }

            const content = {
                maintenanceRecords: updatedMaintenance,
                componentReplacements: updatedComponents
            };
            
            // Safe encoding for UTF-8 characters
            const encodedContent = utf8ToBase64(JSON.stringify(content, null, 2));

            const requestBody: { message: string; content: string; sha?: string } = {
                message: `[APP] Atualização ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                content: encodedContent,
            };

            if (currentSha) {
                requestBody.sha = currentSha;
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
                const errorData = await putResponse.json().catch(() => ({}));
                throw new Error(errorData.message || `Status ${putResponse.status}`);
            }

            const result = await putResponse.json();
            dataFileShaRef.current = result.content.sha;

            setPublishStatus('success');
            setPublishMessage('Dados salvos e publicados com sucesso!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setPublishStatus('idle'), 3000);
            
            return true;

        } catch (error) {
            console.error('Failed to publish data:', error);
            let detailedMessage = `Erro: ${error.message}`;

            if (error.message.includes('409')) {
                detailedMessage = "Conflito de edição. Tente sincronizar e salvar novamente.";
            } else if (error.message.includes('401') || error.message.includes('Bad credentials')) {
                 detailedMessage = "Token inválido. Verifique suas configurações.";
            } else if (error.message.includes('404')) {
                 detailedMessage = "Repositório não encontrado. Verifique o nome do repositório.";
            }
            
            setPublishStatus('error');
            setPublishMessage(detailedMessage);
            return false;
        }
    };
    
    useEffect(() => {
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
        const loadAndSync = async () => {
            // Load local cache first for instant UI
            try {
                const cachedMaintenance = await db.getMaintenanceRecords();
                const cachedComponents = await db.getComponentReplacements();
                
                if (cachedMaintenance.length > 0) {
                    setMaintenanceData(cachedMaintenance.sort(sortByDateDesc));
                    setComponentReplacements(cachedComponents.sort(sortByDateDesc));
                    setIsLoading(false);
                }
            } catch (e) {
                console.error("Error loading local cache:", e);
            }

            // Then try to sync
            syncWithRemote(false);
        };
        
        loadAndSync();

        const intervalId = setInterval(() => syncWithRemote(false), 5 * 60 * 1000); // 5 min auto-refresh
        return () => clearInterval(intervalId);
    }, [syncWithRemote]);

    
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
        if (config) {
            setTimeout(() => syncWithRemote(true), 500);
        }
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
    
    const handleImportData = async (importedMaintenance: any[], importedComponents: any[]) => {
        // Sanitiza e converte dados importados
        const processRecord = (rec: any) => {
             // Handle weird Excel dates or string dates
             let date = new Date(rec.Data);
             if (isNaN(date.getTime())) date = new Date();

             return {
                 ...rec,
                 Data: date,
                 Status: rec.Status || (rec.Pendencia ? 'Pendente' : 'Concluído'),
             };
        };

        const processedMaintenance = importedMaintenance.map(processRecord);
        
        // Find max ID currently to avoid conflicts
        let maxId = maintenanceData.length > 0 ? Math.max(...maintenanceData.map(r => r.ID)) : 0;
        
        const newMaintenanceRecords = processedMaintenance.map((r, idx) => ({
            ...r,
            ID: maxId + idx + 1, // Generate new IDs
            Cliente: r.Cliente || 'Importado',
            Serviço: r.Serviço || 'Geral'
        }));
        
        const combinedMaintenance = [...newMaintenanceRecords, ...maintenanceData].sort(sortByDateDesc);
        
        setMaintenanceData(combinedMaintenance);
        await db.saveAllMaintenanceRecords(combinedMaintenance);
        
        const success = await publishData(combinedMaintenance, componentReplacements);
        if (success) {
             alert(`${newMaintenanceRecords.length} registros importados com sucesso!`);
             setCurrentPage('dashboard');
        } else {
            // Even if publish fails, we keep local state, but warn
            alert("Dados importados localmente, mas houve erro ao publicar no GitHub.");
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
        if (updatedRecord.Equipe) {
            const normalizedTeam = updatedRecord.Equipe
                .split(/[\\\/,]/)
                .map(name => normalizeTechnicianName(name.trim()))
                .filter(name => name)
                .join(' / ');
            updatedRecord.Equipe = normalizedTeam;
        }

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
                const d = new Date(record.Data);
                return !isNaN(d.getTime()) && d.getUTCFullYear().toString() === yearFilter;
            })
            .filter(record => {
                if (monthFilter === 'all') return true;
                const d = new Date(record.Data);
                return !isNaN(d.getTime()) && (d.getUTCMonth() + 1).toString() === monthFilter;
            });
    }, [maintenanceData, clientFilter, statusFilter, monthFilter, yearFilter]);

    const filteredComponentReplacements = useMemo(() => {
        const filteredClients = new Set(filteredData.map(r => r.Cliente));
        return componentReplacements.filter(comp => {
            const recordDate = new Date(comp.Data);
            if (isNaN(recordDate.getTime())) return false;

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
                                {userRole === 'admin' && <NavButton page="add" label="Adicionar" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110 2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>} />}
                                <NavButton page="charts" label="Gráficos" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>} />
                            </nav>
                            <div className="flex items-center gap-4">
                                <button onClick={() => syncWithRemote(true)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" title="Sincronizar dados">
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
                         {isRefreshing && refreshMessage && (
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full bg-slate-700 text-white text-xs px-3 py-1 rounded-b-md shadow-lg z-50">
                                 {refreshMessage}
                             </div>
                         )}
                    </div>
                </header>

                {fetchError && (
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-red-900/50 border border-red-700 text-red-200 text-sm rounded-md p-4 my-4 flex items-center gap-4">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-grow">
                                <strong className="font-semibold">Aviso:</strong>
                                <p>{fetchError}</p>
                            </div>
                             <div>
                                <button
                                    onClick={() => setIsConfigModalOpen(true)}
                                    className="bg-red-500/30 hover:bg-red-500/50 text-white font-semibold py-2 px-4 rounded-md transition-colors whitespace-nowrap"
                                >
                                    Configurar GitHub
                                </button>
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
                            onImportData={handleImportData}
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