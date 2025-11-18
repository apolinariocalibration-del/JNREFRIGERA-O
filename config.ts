/**
 * Configuração Padrão do Repositório GitHub
 * 
 * Estes são os valores padrão que a aplicação usará se nenhuma
 * configuração for salva pelo usuário na interface. O usuário
 * pode sobrescrever estes valores no modal de configuração.
 */
export const GITHUB_DEFAULTS = {
  /**
   * O seu nome de usuário ou o nome da sua organização no GitHub.
   * Exemplo: 'john-doe'
   */
  OWNER: 'seu-usuario-ou-organizacao', 

  /**
   * O nome do repositório onde o dashboard está.
   * Exemplo: 'dashboard-refrigeracao'
   */
  REPO: 'seu-repositorio-do-dashboard' 
};

/**
 * Constantes relacionadas à integração com o GitHub.
 */
export const GITHUB_CONSTANTS = {
  /**
   * A chave usada para armazenar o objeto de configuração do GitHub
   * no localStorage do navegador (inclui token, owner e repo).
   */
  CONFIG_KEY: 'jnRefrigeracaoGithubConfig',
  /**
   * O caminho completo para o arquivo de dados JSON dentro do repositório.
   */
  FILE_PATH: 'public/data.json'
};
