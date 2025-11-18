/**
 * Configuração do Repositório GitHub para Publicação
 * 
 * ATENÇÃO: Preencha estes valores no modal de configuração da aplicação,
 * e não diretamente neste arquivo. As informações inseridas na UI
 * serão salvas de forma segura no armazenamento local do seu navegador.
 */
export const GITHUB_DEFAULTS = {
  /**
   * O seu nome de usuário ou o nome da sua organização no GitHub.
   * Este campo DEVE ser preenchido na configuração da aplicação.
   * Exemplo: 'john-doe'
   */
  OWNER: '', 

  /**
   * O nome do repositório onde o dashboard e o arquivo 'data.json' estão.
   * Este campo DEVE ser preenchido na configuração da aplicação.
   * Exemplo: 'dashboard-refrigeracao'
   */
  REPO: '' 
};

/**
 * Constantes relacionadas à integração com o GitHub.
 * Não altere estes valores a menos que saiba o que está fazendo.
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

// ===================================================================
// IMPORTANTE: NÃO COLOQUE SEU TOKEN DE ACESSO PESSOAL (PAT) AQUI!
// O token deve ser inserido exclusivamente através do modal de 
// configuração na interface da aplicação. Armazenar tokens em código
// fonte é uma falha de segurança grave.
// ===================================================================