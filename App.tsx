import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord } from './types';
import DashboardPage from './DashboardPage';
import AddRecordPage from './AddRecordPage';
import ChartsPage from './ChartsPage';
import LoginPage from './LoginPage';
import * as db from './db';
import { GITHUB_CONFIG } from './config';

// Helper to decode base64 content from GitHub API using modern, robust methods.
const decodeGitHubFileContent = (base64: string): any => {
    try {
        // Step 1: Trim whitespace and decode Base64 to a binary string
        const binaryString = window.atob(base64.trim());
        
        // Step 2: Convert the binary string to a Uint8Array
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Step 3: Decode the Uint8Array as a UTF-8 string
        const decodedString = new TextDecoder('utf-8').decode(bytes);
        
        // Step 4: Parse the JSON string
        return JSON.parse(decodedString);
    } catch (e) {
        console.error("Failed to decode or parse GitHub file content:", e);
        if (e instanceof SyntaxError) {
             console.error("The decoded content is not valid JSON.");
        }
        return null;
    }
};

// Main App Component
const App = () => {
    const [maintenanceData, setMaintenanceData] = useState<MaintenanceRecord[]>([]);
    const [componentReplacements, setComponentReplacements] = useState<ComponentReplacementRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<'viewer' | 'admin' | null>(null);
    const dataFileShaRef = useRef<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshMessage, setRefreshMessage] = useState<string | null>(null);


    // Fetches the latest data from GitHub, compares SHAs, and updates state if necessary.
    const fetchLatestData = async (isManual: boolean = false): Promise<'success' | 'no-changes' | 'error'> => {
        const { OWNER, REPO } = GITHUB_CONFIG;
        if (OWNER === 'SEU_USUARIO_GITHUB' || REPO === 'SEU_REPOSITORIO_GITHUB') {
            if (isManual) setRefreshMessage("Erro de configuração.");
            console.error("GitHub config not set.");
            return 'error';
        }
        
        try {
            const githubApiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/public/data.json?t=${new Date().getTime()}`;
            const response = await fetch(githubApiUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json' },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`GitHub API request failed with status ${response.status}`);
            }

            const fileData = await response.json();
            const newSha = fileData.sha;

            if (newSha && newSha !== dataFileShaRef.current) {
                console.log(`New data detected (SHA: ${newSha}). Updating state.`);
                dataFileShaRef.current = newSha;

                const data = decodeGitHubFileContent(fileData.content);
                if (!data) throw new Error("Failed to decode new data from GitHub.");
            
                const newMaintData = (data.maintenanceRecords || []).map(r => ({ ...r, Data: new Date(r.Data) }));
                const newCompData = (data.componentReplacements || []).map(r => ({ ...r, Data: new Date(r.Data) }));

                setMaintenanceData(newMaintData);
                setComponentReplacements(newCompData);
                await db.saveAllMaintenanceRecords(newMaintData);
                await db.saveAllComponentReplacements(newCompData);
                return 'success';
            } else {
                console.log("No new data found.");
                return 'no-changes';
            }
        } catch (error) {
            console.error('Data fetch failed:', error);
            return 'error';
        }
    };

    // Handler for the manual refresh button
    const handleManualRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setRefreshMessage(null);

        const status = await fetchLatestData(true);

        switch (status) {
            case 'success':
                setRefreshMessage("Dados atualizados com sucesso!");
                break;
            case 'no-changes':
                setRefreshMessage("Nenhuma alteração encontrada.");
                break;
            case 'error':
                setRefreshMessage("Erro ao atualizar. Tente novamente.");
                break;
        }

        setIsRefreshing(false);
        setTimeout(() => setRefreshMessage(null), 4000);
    };

    // Effect to load data from the definitive source (GitHub) on mount, with fallbacks.
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            let data = null;
            const { OWNER, REPO } = GITHUB_CONFIG;

            // 1. Try to fetch from GitHub API (the single source of truth) if configured
            if (OWNER !== 'SEU_USUARIO_GITHUB' && REPO !== 'SEU_REPOSITORIO_GITHUB') {
                try {
                    const githubApiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/public/data.json?t=${new Date().getTime()}`;
                    const response = await fetch(githubApiUrl, {
                        headers: { 'Accept': 'application/vnd.github.v3+json' },
                        cache: 'no-store' // Force fresh data, bypassing all caches
                    });
                    if (response.ok) {
                        const fileData = await response.json();
                        dataFileShaRef.current = fileData.sha; // Store the initial SHA
                        data = decodeGitHubFileContent(fileData.content);
                        if (data) {
                            console.log("Successfully loaded data from GitHub API.");
                        }
                    } else {
                         console.warn(`GitHub API fetch failed with status ${response.status}. This may be due to an incorrect repo/owner name in config.ts, or the repository being private.`);
                    }
                } catch (e) {
                    console.error("Error fetching from GitHub API:", e);
                }
            } else {
                 console.warn("GitHub config not set in config.ts. Real-time updates are disabled. Falling back to local data.");
            }

            // 2. If GitHub fails or no config, try local data.json (from deployment)
            if (!data) {
                try {
                    const response = await fetch(`/data.json?t=${new Date().getTime()}`);
                    if (response.ok) {
                        data = await response.json();
                        console.log("Loaded data from local /data.json");
                    }
                } catch (e) {
                    console.error("Error fetching local /data.json:", e);
                }
            }
            
            // Process and save data if fetched, otherwise load from local DB
            if (data) {
                const maintData = (data.maintenanceRecords || []).map(r => ({ ...r, Data: new Date(r.Data) }));
                const compData = (data.componentReplacements || []).map(r => ({ ...r, Data: new Date(r.Data) }));
                setMaintenanceData(maintData);
                setComponentReplacements(compData);
                await db.saveAllMaintenanceRecords(maintData);
                await db.saveAllComponentReplacements(compData);
            } else {
                // 3. Fallback to local storage
                console.warn('All fetch attempts failed. Loading from local storage.');
                const maintData = await db.getMaintenanceRecords();
                const compData = await db.getComponentReplacements();
                setMaintenanceData(maintData);
                setComponentReplacements(compData);
            }

            setIsLoading(false);
        };
        loadData();
    }, []); // Run only once on mount

    // Effect for polling GitHub for new data every ~60 seconds
    useEffect(() => {
        if (!userRole) return;

        const pollData = async () => {
            await fetchLatestData();
        };

        const intervalId = setInterval(pollData, 61000);
        return () => clearInterval(intervalId);

    }, [userRole]); // Dependency array ensures polling starts on login and stops on logout.

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<MaintenanceRecord | null>(null);
    const [isFullEditModalOpen, setIsFullEditModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<MaintenanceRecord | null>(null);
    const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'charts', or 'addRecord'
    const [clientFilter, setClientFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [newlyAddedRecordId, setNewlyAddedRecordId] = useState<number | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);

    const handleLogin = (user: string, pass: string) => {
        if (user.trim() === 'JN' && pass.trim() === '123') {
            setUserRole('viewer');
            setLoginError(null);
            setCurrentPage('dashboard');
        } else if (user.trim() === 'apolinario' && pass.trim() === 'henzo2505') {
            setUserRole('admin');
            setLoginError(null);
            setCurrentPage('dashboard');
        } else {
            setLoginError('Usuário ou senha inválidos.');
        }
    };

    const handleLogout = () => {
        setUserRole(null);
    };

    const handleClearFilters = () => {
        setClientFilter('all');
        setStatusFilter('all');
        setMonthFilter('all');
        setYearFilter('all');
    };

    const handleAddRecord = async (newRecordData: Omit<MaintenanceRecord, 'ID' | 'Status'>) => {
        handleClearFilters(); // Limpa filtros antigos para garantir que o novo registro seja visível

        const isNewClient = !maintenanceData.some(record => record.Cliente === newRecordData.Cliente);

        const nextId = maintenanceData.length > 0 ? Math.max(...maintenanceData.map(r => r.ID)) + 1 : 1;
        const newRecord: MaintenanceRecord = {
            ...newRecordData,
            ID: nextId,
            Status: newRecordData.Pendencia.trim() ? 'Pendente' : 'Concluído',
        };
        
        const newMaintenanceData = [newRecord, ...maintenanceData];
        await db.saveAllMaintenanceRecords(newMaintenanceData);
        setMaintenanceData(newMaintenanceData);
        setNewlyAddedRecordId(nextId);
        setCurrentPage('dashboard');
        
        if (isNewClient) {
            setClientFilter(newRecordData.Cliente);
        }
    };

    const handleAddComponentReplacement = async (newReplacement: Omit<ComponentReplacementRecord, 'ID'>) => {
        const nextId = componentReplacements.length > 0 ? Math.max(...componentReplacements.map(r => r.ID)) + 1 : 1;
        const newRecord = { ...newReplacement, ID: nextId };

        const newComponentData = [...componentReplacements, newRecord];
        await db.saveAllComponentReplacements(newComponentData);
        setComponentReplacements(newComponentData);
    };
    
    // Callback to synchronize the local SHA ref after a successful publish.
    const handlePublishSuccess = (newSha: string) => {
        console.log(`Publication successful. Syncing new SHA: ${newSha}`);
        dataFileShaRef.current = newSha;
    };

    const handleUpdateRecord = async (id: number, updatedData: { Pendencia: string, OBS: string }) => {
        const newMaintenanceData = maintenanceData.map(record => {
            if (record.ID === id) {
                const newStatus: 'Concluído' | 'Pendente' = updatedData.Pendencia.trim() === '' ? 'Concluído' : 'Pendente';
                return {
                    ...record,
                    Pendencia: updatedData.Pendencia,
                    OBS: record.OBS ? `${record.OBS}\n${updatedData.OBS}` : updatedData.OBS,
                    Status: newStatus,
                };
            }
            return record;
        });

        await db.saveAllMaintenanceRecords(newMaintenanceData);
        setMaintenanceData(newMaintenanceData);
        setIsEditModalOpen(false);
        setCurrentRecord(null);
    };

    const handleUpdateFullRecord = async (updatedRecord: MaintenanceRecord) => {
        const newStatus: 'Concluído' | 'Pendente' = updatedRecord.Pendencia.trim() === '' ? 'Concluído' : 'Pendente';
        const finalRecord = { ...updatedRecord, Status: newStatus };
        
        const newMaintenanceData = maintenanceData.map(record =>
            record.ID === finalRecord.ID ? finalRecord : record
        );
        
        await db.saveAllMaintenanceRecords(newMaintenanceData);
        setMaintenanceData(newMaintenanceData);
        setIsFullEditModalOpen(false);
        setRecordToEdit(null);
    };
    
    const handleOpenEditModal = (record: MaintenanceRecord) => {
        setCurrentRecord(record);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentRecord(null);
    };

    const handleOpenFullEditModal = (record: MaintenanceRecord) => {
        setRecordToEdit(record);
        setIsFullEditModalOpen(true);
    };

    const handleCloseFullEditModal = () => {
        setIsFullEditModalOpen(false);
        setRecordToEdit(null);
    };

    const handleDeleteRecord = async (idToDelete: number) => {
        const newMaintenanceData = maintenanceData.filter(record => record.ID !== idToDelete);
        await db.saveAllMaintenanceRecords(newMaintenanceData);
        setMaintenanceData(newMaintenanceData);
    };

    const handleClientFilterChange = (client: string) => setClientFilter(client);
    const handleStatusFilterChange = (status: string) => setStatusFilter(status);
    const handleMonthFilterChange = (month: string) => setMonthFilter(month);
    const handleYearFilterChange = (year: string) => setYearFilter(year);

    const filteredMaintenanceData = useMemo(() => {
        return maintenanceData.filter(record => {
            const recordDate = new Date(record.Data);
            const clientMatch = clientFilter === 'all' || record.Cliente === clientFilter;
            const statusMatch = statusFilter === 'all' || record.Status === statusFilter;
            const yearMatch = yearFilter === 'all' || recordDate.getFullYear() === parseInt(yearFilter, 10);
            const monthMatch = monthFilter === 'all' || recordDate.getMonth() + 1 === parseInt(monthFilter, 10);
            return clientMatch && statusMatch && yearMatch && monthMatch;
        });
    }, [maintenanceData, clientFilter, statusFilter, yearFilter, monthFilter]);

    const filteredComponentReplacements = useMemo(() => {
        return componentReplacements.filter(record => {
            const recordDate = new Date(record.Data);
            const clientMatch = clientFilter === 'all' || record.Cliente === clientFilter;
            const yearMatch = yearFilter === 'all' || recordDate.getFullYear() === parseInt(yearFilter, 10);
            const monthMatch = monthFilter === 'all' || recordDate.getMonth() + 1 === parseInt(monthFilter, 10);
            return clientMatch && yearMatch && monthMatch;
        });
    }, [componentReplacements, clientFilter, yearFilter, monthFilter]);


    const NavButton = ({ page, label }: { page: string, label: string }) => {
        const isActive = currentPage === page;
        return (
            <button
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isActive
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
            >
                {label}
            </button>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <span className="text-6xl animate-pulse">❄️</span>
                    <h1 className="text-3xl font-bold text-white mt-4">Carregando Dados...</h1>
                </div>
            </div>
        );
    }

    if (!userRole) {
        return <LoginPage onLogin={handleLogin} error={loginError} />;
    }

    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
        <main className="p-4 sm:p-6 lg:p-8">
            <header className="flex flex-wrap justify-between items-center mb-8 gap-4 border-b border-slate-700 pb-6">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">❄️</span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">JN Refrigeração Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                      <button 
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                          className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-slate-700 hover:bg-cyan-600/50 text-slate-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                          aria-live="polite"
                          aria-busy={isRefreshing}
                          title="Atualizar dados"
                      >
                          {isRefreshing ? (
                              <>
                                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Atualizando...</span>
                              </>
                          ) : (
                              <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.393.93a5.002 5.002 0 00-8.506-1.543V5a1 1 0 01-2 0V3a1 1 0 011-1zm12 15a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.393-.93a5.002 5.002 0 008.506 1.543V15a1 1 0 012 0v2a1 1 0 01-1 1z" clipRule="evenodd" />
                                  </svg>
                                  <span>Atualizar</span>
                              </>
                          )}
                      </button>
                      {refreshMessage && (
                          <div 
                              className="absolute top-full mt-2 right-0 bg-slate-600 text-white text-xs font-semibold rounded-md py-1.5 px-3 shadow-lg whitespace-nowrap z-20"
                              role="status"
                          >
                              {refreshMessage}
                          </div>
                      )}
                  </div>
                  <nav className="flex items-center gap-2">
                      <NavButton page="dashboard" label="Dashboard" />
                      <NavButton page="charts" label="Gráficos" />
                      {userRole === 'admin' && <NavButton page="addRecord" label="Adicionar Registros" />}
                  </nav>
                  <button 
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-slate-700 hover:bg-red-600/50 text-slate-300"
                  >
                      Sair
                  </button>
                </div>
            </header>

            {currentPage === 'dashboard' && (
                <DashboardPage
                    userRole={userRole} 
                    maintenanceData={maintenanceData}
                    filteredData={filteredMaintenanceData}
                    allComponentReplacements={componentReplacements}
                    componentReplacements={filteredComponentReplacements}
                    onOpenEditModal={handleOpenEditModal}
                    isEditModalOpen={isEditModalOpen}
                    currentRecord={currentRecord}
                    onUpdateRecord={handleUpdateRecord}
                    onCloseEditModal={handleCloseEditModal}
                    clientFilter={clientFilter}
                    statusFilter={statusFilter}
                    monthFilter={monthFilter}
                    yearFilter={yearFilter}
                    onClientFilterChange={handleClientFilterChange}
                    onStatusFilterChange={handleStatusFilterChange}
                    onMonthFilterChange={handleMonthFilterChange}
                    onYearFilterChange={handleYearFilterChange}
                    onOpenFullEditModal={handleOpenFullEditModal}
                    isFullEditModalOpen={isFullEditModalOpen}
                    recordToEdit={recordToEdit}
                    onUpdateFullRecord={handleUpdateFullRecord}
                    onCloseFullEditModal={handleCloseFullEditModal}
                    onDeleteRecord={handleDeleteRecord}
                    newlyAddedRecordId={newlyAddedRecordId}
                    setNewlyAddedRecordId={setNewlyAddedRecordId}
                />
            )}
            {currentPage === 'charts' && (
                <ChartsPage 
                    maintenanceData={filteredMaintenanceData} 
                    allMaintenanceData={maintenanceData}
                    componentReplacements={componentReplacements}
                    clientFilter={clientFilter}
                    statusFilter={statusFilter}
                    monthFilter={monthFilter}
                    yearFilter={yearFilter}
                    onClearFilters={handleClearFilters}
                />
            )}
            {currentPage === 'addRecord' && userRole === 'admin' && (
                <AddRecordPage
                    onAddRecord={handleAddRecord}
                    onAddComponentReplacement={handleAddComponentReplacement}
                    componentReplacements={componentReplacements}
                    maintenanceData={maintenanceData}
                    onPublishSuccess={handlePublishSuccess}
                />
            )}
        </main>
      </div>
    );
};

export default App;
