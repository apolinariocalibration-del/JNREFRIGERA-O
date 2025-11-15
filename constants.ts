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

const parseDate = (dateStr: string) => {
    const [day, month] = dateStr.split('\\');
    // Assuming a recent year, e.g., 2023, as the year is not specified.
    return new Date(`2023-${month}-${day}T00:00:00`);
};

export const MOCK_COMPONENT_REPLACEMENTS: ComponentReplacementRecord[] = [
  { ID: 1, Data: new Date('2023-11-04T00:00:00'), Cliente: 'Snowfrut', Componente: 'Resistência de Degelo', OBS: 'Substituição da resistência do dreno' },
  { ID: 2, Data: new Date('2023-11-05T00:00:00'), Cliente: 'Ester de Lima', Componente: 'Compressor', OBS: 'Troca de compressor' },
  { ID: 3, Data: new Date('2023-11-10T00:00:00'), Cliente: 'JJL', Componente: 'Resistência de Degelo', OBS: 'Troca da resistência de dreno' },
  { ID: 4, Data: new Date('2023-11-10T00:00:00'), Cliente: 'Casa Carne', Componente: 'Disjuntor', OBS: 'Substituição de disjuntor do balcão' },
  { ID: 5, Data: new Date('2023-11-11T00:00:00'), Cliente: 'JJL', Componente: 'Ventilador do Condensador', OBS: 'Substituição do ventilador do condensador' },
  { ID: 6, Data: new Date('2023-11-11T00:00:00'), Cliente: 'Ester de Lima', Componente: 'Compressor', OBS: 'Troca de compressor' },
];

export const MOCK_DATA: MaintenanceRecord[] = [
    { ID: 1, Data: parseDate('01\\11'), HoraInicio: '08:00', HoraFim: '10:30', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Elétrica', Equipamento: 'Câmara de resfriados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel\\Fabio\\Bruno', Local: 'Sabará', Cliente: 'Imperatiz CD', OBS: 'Retirada do temporizador e carga de gás', Pendencia: '', Gás: 'R404' },
    { ID: 2, Data: parseDate('02\\11'), HoraInicio: '09:15', HoraFim: '11:00', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Mecânica', Equipamento: 'Câmara de congelados 01', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel\\Fabio\\Bruno', Local: 'Sagrada Família', Cliente: 'Palineli', OBS: 'Desbloqueio do evaporador', Pendencia: 'Resistências dos evaporadores estão pequenas', Gás: '' },
    { ID: 3, Data: parseDate('03\\11'), HoraInicio: '13:00', HoraFim: '16:00', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: 'Todos os equipamentos', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel\\Fabio\\Bruno', Local: 'Prado', Cliente: 'Ester de Lima', OBS: 'Manutenção preventiva', Pendencia: '', Gás: '' },
    { ID: 4, Data: parseDate('03\\11'), HoraInicio: '10:00', HoraFim: '12:00', Serviço: 'Corretiva/Preventiva', 'Especificação da Manutenção': 'Elétrica', Equipamento: 'Câmara de congelados 01 / Equipamento 02', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel\\Fabio\\Bruno', Local: 'Santa Helena', Cliente: 'Snowfrut', OBS: 'Substituição da resistência do dreno e desbloqueio do evaporador', Pendencia: '', Gás: '' },
    { ID: 5, Data: parseDate('04\\11'), HoraInicio: '14:30', HoraFim: '15:30', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Mecânica', Equipamento: 'Balcão de congelados de carnes', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel\\Fabio\\Bruno', Local: 'Santa Cruz', Cliente: 'Ester de Lima', OBS: 'Desbloqueio do evaporador', Pendencia: '', Gás: 'R404' },
    { ID: 6, Data: parseDate('05\\11'), HoraInicio: '08:30', HoraFim: '17:00', Serviço: 'Obra/Instalação', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: 'Obra/Instalação', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel\\Fabio\\Bruno', Local: 'Savassi', Cliente: 'Ester de Lima', OBS: 'Montagem de balcão e troca de compressor', Pendencia: 'Válvula de R404 em R22', Gás: 'R22' },
    { ID: 7, Data: parseDate('06\\11'), HoraInicio: '09:00', HoraFim: '16:30', Serviço: 'Obra/Instalação', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: 'Balcão de açougue', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel\\Fabio\\Bruno', Local: 'Jaraguá', Cliente: 'Ester de Lima', OBS: 'Montagem de balcão de carne', Pendencia: '', Gás: '' },
    { ID: 8, Data: parseDate('07\\11'), HoraInicio: '11:00', HoraFim: '13:00', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Mecânica', Equipamento: 'Ultracongelador', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel\\Fabio', Local: 'Padre Eustáquio', Cliente: 'Dupain', OBS: 'Vazamento de gás no condensador', Pendencia: '', Gás: 'R404' },
    { ID: 9, Data: parseDate('07\\11'), HoraInicio: '09:00', HoraFim: '18:00', Serviço: 'Obra/Instalação', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '01 Câmara de resfriados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Weliton\\Davi', Local: 'BH Shopping', Cliente: 'Frutaria SP', OBS: 'Montagem de câmara de resfriados', Pendencia: '', Gás: 'R404' },
    { ID: 10, Data: parseDate('10\\11'), HoraInicio: '10:30', HoraFim: '12:00', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Elétrica', Equipamento: 'Câmara de congelados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel', Local: 'Kennedy, Contagem', Cliente: 'JJL', OBS: 'Troca da resistência de dreno', Pendencia: '', Gás: 'R404' },
    { ID: 11, Data: parseDate('10\\11'), HoraInicio: '14:00', HoraFim: '16:00', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Mecânica', Equipamento: 'Ar condicionado/Balcão de resfriados da produção', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel\\Bruno', Local: 'Lourdes', Cliente: 'Pastelaria Maria de Discel', OBS: 'Lavagem de condensador e carga de gás no ar condicionado', Pendencia: '', Gás: '' },
    { ID: 12, Data: parseDate('10\\11'), HoraInicio: '16:30', HoraFim: '17:30', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Elétrica', Equipamento: 'Balcão de congelados', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel', Local: 'Grajaú', Cliente: 'Casa Carne', OBS: 'Substituição de disjuntor do balcão', Pendencia: '', Gás: '' },
    { ID: 13, Data: parseDate('10\\11'), HoraInicio: '09:00', HoraFim: '10:00', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Elétrica', Equipamento: 'Túnel de congelamento 02', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel', Local: 'Sagrada Família', Cliente: 'Palineli', OBS: 'Substituição da resistência da bandeja', Pendencia: '', Gás: 'R404' },
    { ID: 14, Data: parseDate('11\\11'), HoraInicio: '13:30', HoraFim: '15:00', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Elétrica', Equipamento: 'Câmara de congelados', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel', Local: 'Kennedy, Contagem', Cliente: 'JJL', OBS: 'Substituição do ventilador do condensador', Pendencia: '', Gás: 'R404' },
    { ID: 15, Data: parseDate('11\\11'), HoraInicio: '08:00', HoraFim: '12:00', Serviço: 'Obra/Instalação', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: 'Balcão', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel', Local: 'Jaraguá', Cliente: 'Ester de Lima', OBS: 'Montagem de balcão e troca de compressor', Pendencia: '', Gás: 'R22' },
    { ID: 16, Data: parseDate('11\\11'), HoraInicio: '15:30', HoraFim: '16:00', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Mecânica', Equipamento: 'Balcão de resfriados de carne', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel', Local: 'Savassi', Cliente: 'Ester de Lima', OBS: 'Adição de gás R22', Pendencia: '', Gás: 'R22' },
    { ID: 17, Data: parseDate('11\\11'), HoraInicio: '16:00', HoraFim: '16:30', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Mecânica', Equipamento: 'Expositor de bebidas', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thalisson\\Gabriel', Local: 'Savassi', Cliente: 'Ester de Lima', OBS: 'Adição de gás R134a', Pendencia: '', Gás: 'R134A' },
    { ID: 18, Data: parseDate('11\\11'), HoraInicio: '09:00', HoraFim: '12:00', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '02 Câmaras de congelados / 02 Unidades condensadoras M', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel', Local: 'Betim', Cliente: 'Ffood', OBS: 'Manutenção preventiva e limpeza técnica em 02 unidades condensadoras', Pendencia: 'Substituição do sensor do túnel de congelamento EVK', Gás: 'R404' },
    { ID: 19, Data: parseDate('11\\11'), HoraInicio: '13:00', HoraFim: '17:00', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '02 Câmaras de congelados / 01 Túnel de congelamento', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel', Local: 'Arvoredo', Cliente: 'Bolinho do Porto', OBS: 'Manutenção preventiva e limpeza técnica em 03 unidades condensadoras', Pendencia: '', Gás: '' },
    { ID: 20, Data: parseDate('11\\11'), HoraInicio: '08:30', HoraFim: '12:30', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '02 Câmaras de congelados / 01 Câmara de resfriados / 01 Ultracongelador', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Weliton\\Fabio', Local: 'Pedro Leopoldo', Cliente: 'Dolma', OBS: 'Manutenção preventiva e limpeza técnica em 04 unidades condensadoras', Pendencia: '', Gás: '' },
    { ID: 21, Data: parseDate('11\\11'), HoraInicio: '13:30', HoraFim: '15:30', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '01 Câmara de resfriados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Weliton\\Fabio', Local: 'Itapuã', Cliente: 'Bar Pompeu', OBS: 'Manutenção preventiva e limpeza técnica em 01 unidade condensadora', Pendencia: '', Gás: '' },
    { ID: 22, Data: parseDate('11\\11'), HoraInicio: '09:00', HoraFim: '10:00', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '01 Câmara de resfriados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Weliton\\Fabio', Local: 'Pilar', Cliente: 'Faculdade Arnaldo', OBS: 'Manutenção preventiva e limpeza técnica em 01 unidade condensadora', Pendencia: '', Gás: '' },
    { ID: 23, Data: parseDate('11\\11'), HoraInicio: '10:30', HoraFim: '11:30', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '01 Câmara de resfriados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Weliton\\Fabio', Local: 'Camargos', Cliente: 'CCPR', OBS: 'Manutenção preventiva e limpeza técnica em 01 unidade condensadora', Pendencia: '', Gás: '' },
    { ID: 24, Data: parseDate('11\\11'), HoraInicio: '13:00', HoraFim: '14:00', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '01 Câmara de resfriados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Weliton\\Fabio', Local: 'Água Branca', Cliente: 'Minas Rural', OBS: 'Manutenção preventiva e limpeza técnica em 01 unidade condensadora', Pendencia: '', Gás: '' },
    { ID: 25, Data: parseDate('11\\11'), HoraInicio: '14:30', HoraFim: '15:30', Serviço: 'Preventiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '01 Câmara de resfriados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Weliton\\Fabio', Local: 'Planalto', Cliente: 'Bar Pompeu', OBS: 'Manutenção preventiva e limpeza técnica em 01 unidade condensadora', Pendencia: '', Gás: '' },
    { ID: 26, Data: parseDate('12\\11'), HoraInicio: '08:00', HoraFim: '17:00', Serviço: 'Obra/Instalação', 'Especificação da Manutenção': 'Mecânica', Equipamento: 'Esteira de resfriamento de doce', 'Especificação do Equipamento': 'Unidade condensadora P', Equipe: 'Thaisson\\Gabriel\\Davi', Local: 'Santo Antônio', Cliente: 'Celia Soltto', OBS: 'Montagem de tubulação', Pendencia: '', Gás: 'R22' },
    { ID: 27, Data: parseDate('12\\11'), HoraInicio: '08:00', HoraFim: '18:00', Serviço: 'Obra/Instalação', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: '01 Câmara de resfriados', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Weliton\\Fabio\\Jean', Local: 'BH Shopping', Cliente: 'Frutaria SP', OBS: 'Montagem de câmara de resfriados', Pendencia: '', Gás: 'R22' },
    { ID: 28, Data: parseDate('12\\11'), HoraInicio: '09:00', HoraFim: '12:00', Serviço: 'Corretiva', 'Especificação da Manutenção': 'Mecânica e Elétrica', Equipamento: 'Balcão', 'Especificação do Equipamento': 'Unidade condensadora M', Equipe: 'Thalisson\\Gabriel\\Davi\\Jean', Local: 'Santa Cruz', Cliente: 'Ester de Lima', OBS: 'Montagem de balcão', Pendencia: '', Gás: '' },
].map(record => ({
    ...record,
    Status: record.Pendencia.trim() ? 'Pendente' : 'Concluído',
}));