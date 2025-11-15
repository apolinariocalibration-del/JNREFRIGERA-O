import { MaintenanceRecord, ComponentReplacementRecord } from './types';
import { MOCK_DATA, MOCK_COMPONENT_REPLACEMENTS } from './constants';

const MAINTENANCE_KEY = 'jnRefrigeracaoMaintenanceData';
const COMPONENTS_KEY = 'jnRefrigeracaoComponentReplacements';

// Função para popular o banco de dados com dados iniciais se estiver vazio.
export const initializeDB = () => {
    if (!localStorage.getItem(MAINTENANCE_KEY)) {
        console.log("Initializing maintenance data from mocks...");
        // Process mock data to add IDs and Status, similar to how new records are handled.
        const processedMaintenanceData = MOCK_DATA.map((record, index) => ({
            ...record,
            ID: index + 1, // Assign a simple sequential ID
            Status: record.Pendencia.trim() ? 'Pendente' : 'Concluído',
        }));
        localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(processedMaintenanceData));
    }
    if (!localStorage.getItem(COMPONENTS_KEY)) {
        console.log("Initializing component replacement data from mocks...");
        // Add sequential IDs to component replacements as well for consistency
        const processedComponentData = MOCK_COMPONENT_REPLACEMENTS.map((record, index) => ({
            ...record,
            ID: index + 1,
        }));
        localStorage.setItem(COMPONENTS_KEY, JSON.stringify(processedComponentData));
    }
};

// Obtém todos os registros de manutenção do banco de dados local.
export const getMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
    const data = localStorage.getItem(MAINTENANCE_KEY);
    if (!data) return [];
    
    const records: any[] = JSON.parse(data);
    // Converte strings de data de volta para objetos Date para garantir consistência.
    return records.map(record => ({ ...record, Data: new Date(record.Data) }));
};

// Obtém todos os registros de substituição de componentes.
export const getComponentReplacements = async (): Promise<ComponentReplacementRecord[]> => {
    const data = localStorage.getItem(COMPONENTS_KEY);
    if (!data) return [];
    
    const records: any[] = JSON.parse(data);
    // Converte strings de data de volta para objetos Date.
    return records.map(record => ({ ...record, Data: new Date(record.Data) }));
};

// Salva o array completo de registros de manutenção no banco de dados local.
export const saveAllMaintenanceRecords = async (records: MaintenanceRecord[]): Promise<void> => {
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(records));
};

// Salva o array completo de substituições de componentes.
export const saveAllComponentReplacements = async (records: ComponentReplacementRecord[]): Promise<void> => {
    localStorage.setItem(COMPONENTS_KEY, JSON.stringify(records));
};