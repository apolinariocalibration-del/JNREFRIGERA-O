import { MaintenanceRecord, ComponentType, ComponentReplacementRecord } from './types';

export const CLIENT_LIST = [
  'Imperatiz CD',
  'Palineli',
  'Ester de Lima',
  'Snowfrut',
  'Dupain',
  'Frutaria SP',
  'JJL',
  'Pastelaria Maria de Discel',
  'Casa Carne',
  'Ffood',
  'Bolinho do Porto',
  'Dolma',
  'Bar Pompeu',
  'Faculdade Arnaldo',
  'CCPR',
  'Minas Rural',
  'Celia Soltto',
  'Pilanar',
  'Agua branca',
  'BH Shopping',
];

export const COMPONENT_LIST: ComponentType[] = [
  'Compressor',
  'Contatora',
  'Disjuntor',
  'Microcontrolador',
  'Microventilador',
  'Pressostato de Alta Pressão',
  'Relé',
  'Relé de Contato de Contatora',
  'Relé Falta de Fase',
  'Resistência de Degelo',
  'Resistência do Evaporador',
  'Tubulação',
  'Válvula de Expansão Eletrônica',
  'Ventilador do Condensador',
  'Ventilador do Evaporador'
];

export const MOCK_COMPONENT_REPLACEMENTS: Omit<ComponentReplacementRecord, 'ID'>[] = [];

export const MOCK_DATA: Omit<MaintenanceRecord, 'ID' | 'Status'>[] = [];