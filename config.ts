/**
 * Configuração do Repositório GitHub
 * 
 * IMPORTANTE: Para que a atualização em tempo real funcione,
 * você PRECISA preencher os valores abaixo com as informações
 * do seu repositório no GitHub onde este projeto está hospedado.
 */
export const GITHUB_CONFIG = {
  /**
   * O seu nome de usuário ou o nome da sua organização no GitHub.
   * Exemplo: 'john-doe'
   */
  OWNER: 'apolinariocalibration-del', 

  /**
   * O nome do repositório onde o dashboard está.
   * Exemplo: 'dashboard-refrigeracao'
   */
  REPO: 'JNREFRIGERA-O' 
};

/**
 * Constantes relacionadas à integração com o GitHub.
 */
export const GITHUB_CONSTANTS = {
  /**
   * A chave usada para armazenar o token do GitHub no localStorage do navegador.
   */
  TOKEN_KEY: 'jnRefrigeracaoGithubToken',
  /**
   * O caminho completo para o arquivo de dados JSON dentro do repositório.
   */
  FILE_PATH: 'public/data.json'
};