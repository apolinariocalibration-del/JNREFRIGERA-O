import { MaintenanceRecord, ComponentReplacementRecord } from './types';

const MAINTENANCE_KEY = 'jnRefrigeracaoMaintenanceData';
const COMPONENTS_KEY = 'jnRefrigeracaoComponentReplacements';

// Obtém todos os registros de manutenção do banco de dados local.
export const getMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
    try {
        const data = localStorage.getItem(MAINTENANCE_KEY);
        if (!data) return [];
        
        const records: any[] = JSON.parse(data);
        // Converte strings de data de volta para objetos Date para garantir consistência.
        return records.map(record => ({ ...record, Data: new Date(record.Data) }));
    } catch (error) {
        console.error("Falha ao analisar registros de manutenção do localStorage:", error);
        // Limpa dados corrompidos e retorna um array vazio
        localStorage.removeItem(MAINTENANCE_KEY);
        return [];
    }
};

// Obtém todos os registros de substituição de componentes.
export const getComponentReplacements = async (): Promise<ComponentReplacementRecord[]> => {
    try {
        const data = localStorage.getItem(COMPONENTS_KEY);
        if (!data) return [];
        
        const records: any[] = JSON.parse(data);
        // Converte strings de data de volta para objetos Date.
        return records.map(record => ({ ...record, Data: new Date(record.Data) }));
    } catch (error) {
        console.error("Falha ao analisar substituições de componentes do localStorage:", error);
        // Limpa dados corrompidos e retorna um array vazio
        localStorage.removeItem(COMPONENTS_KEY);
        return [];
    }
};

// Salva o array completo de registros de manutenção no banco de dados local.
export const saveAllMaintenanceRecords = async (records: MaintenanceRecord[]): Promise<void> => {
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(records));
};

// Salva o array completo de substituições de componentes.
export const saveAllComponentReplacements = async (records: ComponentReplacementRecord[]): Promise<void> => {
    localStorage.setItem(COMPONENTS_KEY, JSON.stringify(records));
};