import React, { useState, useMemo, useEffect } from 'react';
import { MaintenanceRecord, ComponentReplacementRecord } from './types';
import DashboardPage from './DashboardPage';
import AddRecordPage from './AddRecordPage';
import ChartsPage from './ChartsPage';
import LoginPage from './LoginPage';
import * as db from './db';

// Main App Component
const App = () => {
    const [maintenanceData, setMaintenanceData] = useState<MaintenanceRecord[]>([]);
    const [componentReplacements, setComponentReplacements] = useState<ComponentReplacementRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Effect to load data from the local DB on component mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            db.initializeDB(); // Seeds the database on first run
            const maintData = await db.getMaintenanceRecords();
            const compData = await db.getComponentReplacements();
            setMaintenanceData(maintData);
            setComponentReplacements(compData);
            setIsLoading(false);
        };
        loadData();
    }, []);

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
    const [userRole, setUserRole] = useState<'viewer' | 'admin' | null>(null);
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


    const handleAddRecord = async (newRecordData: Omit<MaintenanceRecord, 'ID' | 'Status'>) => {
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
        
        if (isNewClient) {
            setClientFilter(newRecordData.Cliente);
        }

        setCurrentPage('dashboard');
    };

    const handleAddComponentReplacement = async (newReplacement: ComponentReplacementRecord) => {
        const newComponentData = [...componentReplacements, newReplacement];
        await db.saveAllComponentReplacements(newComponentData);
        setComponentReplacements(newComponentData);
    };
    
    const handleImportData = async (
      newMaintenanceRecords: Omit<MaintenanceRecord, 'ID' | 'Status'>[],
      newComponentRecords: Omit<ComponentReplacementRecord, 'ID'>[]
    ) => {
        // Process Maintenance Records
        let nextMaintenanceId = maintenanceData.length > 0 ? Math.max(...maintenanceData.map(r => r.ID)) + 1 : 1;
        const processedMaintenanceRecords: MaintenanceRecord[] = newMaintenanceRecords.map(record => ({
            ...record,
            ID: nextMaintenanceId++,
            Status: record.Pendencia.trim() ? 'Pendente' : 'Concluído',
        }));
        
        // Process Component Records
        let nextComponentId = componentReplacements.length > 0 ? Math.max(...componentReplacements.map(r => r.ID)) + 1 : 1;
        const processedComponentRecords: ComponentReplacementRecord[] = newComponentRecords.map(record => ({
            ...record,
            ID: nextComponentId++,
        }));
        
        const newMaintenanceData = [...processedMaintenanceRecords, ...maintenanceData];
        const newComponentData = [...processedComponentRecords, ...componentReplacements];
        
        await db.saveAllMaintenanceRecords(newMaintenanceData);
        await db.saveAllComponentReplacements(newComponentData);

        setMaintenanceData(newMaintenanceData);
        setComponentReplacements(newComponentData);
    
        alert(`${processedMaintenanceRecords.length} registros de manutenção e ${processedComponentRecords.length} substituições de componentes foram importados com sucesso!`);
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

    const handleClearFilters = () => {
        setClientFilter('all');
        setStatusFilter('all');
        setMonthFilter('all');
        setYearFilter('all');
    };

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
                    <h1 className="text-3xl font-bold text-white mt-4">Carregando Banco de Dados...</h1>
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
                    onImportData={handleImportData}
                    componentReplacements={componentReplacements}
                    maintenanceData={maintenanceData}
                />
            )}
        </main>
      </div>
    );
};

export default App;
