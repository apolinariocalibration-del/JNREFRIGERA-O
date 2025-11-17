export type ComponentType = 
  | 'Compressor'
  | 'Contatora'
  | 'Disjuntor'
  | 'Microcontrolador'
  | 'Microventilador'
  | 'Pressostato de Alta Pressão'
  | 'Relé'
  | 'Relé de Contato de Contatora'
  | 'Relé Falta de Fase'
  | 'Resistência de Degelo'
  | 'Resistência do Evaporador'
  | 'Tubulação'
  | 'Válvula de Expansão Eletrônica'
  | 'Ventilador do Condensador'
  | 'Ventilador do Evaporador';

export interface MaintenanceRecord {
  ID: number;
  Data: Date;
  HoraInicio: string;
  HoraFim: string;
  Serviço: string;
  'Especificação da Manutenção': string;
  Equipamento: string;
  'Especificação do Equipamento': string;
  Equipe: string;
  Local: string;
  Cliente: string;
  OBS: string;
  Pendencia: string;
  Gás: string;
  Status: 'Concluído' | 'Pendente';
}

export interface ComponentReplacementRecord {
    ID: number;
    Data: Date;
    Cliente: string;
    Componente: ComponentType;
    OBS: string;
}

export interface GitHubTokenConfig {
    token: string;
}