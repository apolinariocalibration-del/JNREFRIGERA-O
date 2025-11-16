import { MaintenanceRecord, ComponentReplacementRecord } from './types';

const MAINTENANCE_KEY = 'jnRefrigeracaoMaintenanceData';
const COMPONENTS_KEY = 'jnRefrigeracaoComponentReplacements';

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
