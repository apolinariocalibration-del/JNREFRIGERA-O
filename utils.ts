// utils.ts

/**
 * Converte um objeto Date para uma string no formato 'YYYY-MM-DD',
 * ajustando para o fuso horário local para que a data represente
 * o dia local correto.
 * @param date O objeto Date a ser formatado.
 * @returns A data como string 'YYYY-MM-DD'.
 */
export const formatDateForInput = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        // Retorna a data de hoje como padrão se a data for inválida
        date = new Date();
    }
    // Cria uma nova data com base nos milissegundos UTC, mas subtrai o deslocamento do fuso horário em minutos
    // para "enganar" o toISOString e fazer com que ele produza a data local.
    const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffsetMs).toISOString().split('T')[0];
};

/**
 * Converte uma string de data 'YYYY-MM-DD' de um input para um objeto Date.
 * A data resultante representará a meia-noite no fuso horário local.
 * @param dateString A string de data do input.
 * @returns Um objeto Date.
 */
export const parseDateFromInput = (dateString: string): Date => {
    // Adicionar 'T00:00:00' força o navegador a interpretar a data no fuso horário local,
    // o que é o comportamento esperado para um seletor de data.
    return new Date(`${dateString}T00:00:00`);
};
