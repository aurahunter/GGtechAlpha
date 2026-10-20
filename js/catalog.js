window.GG = (function () {
function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function percent(value) {
  return `${Math.round(value * 100)}%`
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (!digits) return ""
  if (digits.length < 3) return `(${digits}`
  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)
  if (digits.length <= 6) return `(${ddd}) ${rest}`
  if (digits.length <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

function maskDocument(value, kind) {
  const digits = value.replace(/\D/g, "").slice(0, kind === "pj" ? 14 : 11)
  if (kind === "pj") {
    let out = digits.slice(0, 2)
    if (digits.length > 2) out += `.${digits.slice(2, 5)}`
    if (digits.length > 5) out += `.${digits.slice(5, 8)}`
    if (digits.length > 8) out += `/${digits.slice(8, 12)}`
    if (digits.length > 12) out += `-${digits.slice(12, 14)}`
    return out
  }
  let out = digits.slice(0, 3)
  if (digits.length > 3) out += `.${digits.slice(3, 6)}`
  if (digits.length > 6) out += `.${digits.slice(6, 9)}`
  if (digits.length > 9) out += `-${digits.slice(9, 11)}`
  return out
}

function checkDigit(nums, weights) {
  const sum = weights.reduce((acc, weight, index) => acc + nums[index] * weight, 0)
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

function isCpf(value) {
  const digits = value.replace(/\D/g, "").split("").map(Number)
  if (digits.length !== 11 || digits.every((num) => num === digits[0])) return false
  const first = checkDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = checkDigit(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return first === digits[9] && second === digits[10]
}

function isCnpj(value) {
  const digits = value.replace(/\D/g, "").split("").map(Number)
  if (digits.length !== 14 || digits.every((num) => num === digits[0])) return false
  const first = checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = checkDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return first === digits[12] && second === digits[13]
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

const company = {
  name: "Nano Tech",
  legal: "Nano Tech Consultoria",
  email: "contato@nanotech.com.br",
  whatsapp: "5511999999999",
  hours: "Dias úteis, das 9h às 18h (horário de Brasília)",
  coverage: "Atendimento remoto em todo o Brasil",
}

const paymentRules = {
  pixDiscount: 0.05,
  cardFreeInstallments: 6,
  cardMonthlyRate: 0.0199,
  maxInstallments: 12,
  invoiceMin: 15000,
  invoiceDays: 30,
  boletoDays: 3,
}

const payments = [
  {
    id: "pix",
    name: "PIX",
    eyebrow: "Preferência à vista",
    summary: "Preferência de pagamento à vista. O PIX é gerado fora do site, depois da validação.",
    points: [
      "Registrado só como preferência na proposta",
      "Após validarmos o escopo, enviamos o PIX por WhatsApp ou e-mail",
      "Nenhuma cobrança acontece dentro deste site",
    ],
  },
  {
    id: "cartao",
    name: "Cartão de crédito",
    eyebrow: "Preferência parcelada",
    summary: "Preferência de parcelamento. O link de pagamento é gerado fora do site.",
    points: [
      "Você indica a preferência e, se quiser, a quantidade de parcelas",
      "Depois do contato comercial, enviamos o link de pagamento",
      "O site não captura nem processa cartão",
    ],
  },
  {
    id: "boleto",
    name: "Boleto bancário",
    eyebrow: "Preferência à vista",
    summary: "Preferência de boleto. A linha digitável é emitida fora do site.",
    points: [
      "Registrado como preferência na proposta",
      "Emitimos e enviamos o boleto depois da confirmação",
      "Sem pagamento automático neste site",
    ],
  },
  {
    id: "faturamento",
    name: "Faturamento",
    eyebrow: "Preferência PJ",
    summary: "Preferência de faturamento para pessoa jurídica, sujeita a análise.",
    points: [
      "Somente pessoa jurídica, com proposta a partir do mínimo",
      "Validamos cadastro e escopo antes de emitir a cobrança",
      "Nota e condições seguem no contato comercial, fora do site",
    ],
  },
]

const areas = [
  {
    slug: "dados-e-automacao",
    number: "01",
    name: "Dados e automação",
    summary: "Bancos, BI, APIs, ETL, automação, soluções de dados e suporte técnico.",
    description:
      "Reúne o trabalho com dados e automação: bancos, dashboards, integrações, pipelines, scripts, data warehouse e consultoria técnica. Cada serviço tem escopo, prazo, consultor e preço — o filtro desta área mostra o catálogo completo da frente.",
    problems: [
      "O dado está espalhado e a operação ainda depende de planilha",
      "Sistemas não conversam e o relatório chega tarde demais",
      "Falta dono técnico para banco, API, pipeline ou painel",
    ],
    approach: [
      "Escolha do serviço certo para o problema do ciclo",
      "Entrega com responsável nomeado e rotina de manutenção",
      "Passagem documentada para o time interno",
    ],
  },
  {
    slug: "front-end",
    number: "02",
    name: "Front-End",
    summary: "Sites, interfaces, performance, portais e squads de front.",
    description:
      "Cobre a camada de interface em código: site institucional, desenvolvimento de produto, painéis, e-commerce, performance, acessibilidade e modernização de front legado. Cada serviço tem escopo, prazo, consultor e preço.",
    problems: [
      "O site ou o produto parece datado e a conversão sofre",
      "Cada tela é reinventada e o front legado trava entrega",
      "Mobile, performance ou acessibilidade ficaram para depois",
    ],
    approach: [
      "Recorte do fluxo ou superfície que mais impacta o negócio",
      "Entrega navegável ou em produção, com critério de pronto",
      "Passagem para o time interno manter o que foi publicado",
    ],
  },
  {
    slug: "design-e-ilustracao",
    number: "03",
    name: "Design e ilustração",
    summary: "Identidade, UI, ilustração, peças gráficas, motion e modelagem 3D.",
    description:
      "Reúne design visual e produção artística: identidade, peças de comunicação, ilustração, redesign de interface, design system, motion e modelagem 3D com render. Cada serviço tem escopo, prazo, consultor e preço.",
    problems: [
      "A marca e as peças não conversam entre si",
      "Falta ilustração ou 3D com qualidade para campanha e produto",
      "A interface e o material de divulgação parecem improvisados",
    ],
    approach: [
      "Briefing do uso real da peça ou da interface",
      "Entrega em formatos prontos para publicar ou implementar",
      "Arquivos organizados e critérios de uso para o time interno",
    ],
  },
]

const consultants = [
  {
    slug: "filipe-ferreira",
    name: "Filipe Ferreira",
    role: "Consultor de back-end e dados",
    tone: 1,
    experience: "10 anos",
    areas: ["dados-e-automacao"],
    skills: ["Bancos", "APIs", "ETL", "Automação"],
    summary: "Cuida de back-end, dados e automações com escopo e dono claros.",
    bio: "Filipe conduz bancos, APIs, pipelines, BI, automação e soluções de dados. Ele parte do problema de negócio, fecha o recorte técnico e entrega com rotina de manutenção que o time interno consegue assumir.",
  },
  {
    slug: "yuri-s-cortes",
    name: "Yuri S. Cortes",
    role: "Consultor de Front-End",
    tone: 2,
    experience: "8 anos",
    areas: ["front-end"],
    skills: ["React", "UI em código", "Performance", "Acessibilidade"],
    summary: "Leva interface do protótipo à produção, com desempenho e acessibilidade.",
    bio: "Yuri conduz sites, produto front, portais, e-commerce, performance e modernização de legado. O ciclo fecha com fluxo em produção, estados tratados e passagem documentada para o time que vai manter.",
  },
  {
    slug: "isabelle-ruppel",
    name: "Isabelle Ruppel",
    role: "Consultora de design e ilustração",
    tone: 3,
    experience: "7 anos",
    areas: ["design-e-ilustracao"],
    skills: ["UI", "Ilustração", "3D", "Identidade"],
    summary: "Une identidade, interface, ilustração e 3D no mesmo critério visual.",
    bio: "Isabelle desenha identidade, peças, interfaces, ilustrações e modelos 3D. Ela organiza arquivos, formatos de entrega e o uso da marca para o material não se perder na próxima campanha ou no próximo squad.",
  },
]
const services = [
  {
    slug: "banco-dados",
    name: "Banco de dados",
    area: "dados-e-automacao",
    lead: "filipe-ferreira",
    billing: "projeto",
    price: 1000,
    duration: "4 a 6 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Criação, manutenção e otimização de bancos de dados.",
    description:
      "Desenvolvimento de bancos relacionais e não relacionais, com modelagem, manutenção preventiva e corretiva, otimização de consultas, migração, backup, segurança e monitoramento. Também reestrutura bases existentes que já não aguentam a operação.",
    result: "Banco modelado ou reestruturado, com rotina de backup, segurança e desempenho combinada.",
    includes: [
      "Desenvolvimento de bancos relacionais e não relacionais",
      "Modelagem e estruturação de dados",
      "Manutenção preventiva e corretiva",
      "Otimização de consultas e desempenho",
      "Migração e integração entre bancos de dados",
      "Backup, recuperação e segurança de dados",
      "Monitoramento e análise de desempenho",
      "Reestruturação de bancos de dados existentes",
    ],
    excludes: ["Licenças de SGBD", "Infraestrutura de hardware ou cloud fora do escopo combinado"],
  },
  {
    slug: "dashboards-bi",
    name: "Dashboards e Business Intelligence",
    area: "dados-e-automacao",
    lead: "filipe-ferreira",
    billing: "projeto",
    price: 1000,
    duration: "3 a 5 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Criação de dashboards e soluções de análise de dados.",
    description:
      "Desenvolve painéis gerenciais e executivos, KPIs e relatórios interativos. Integra fontes distintas, automatiza a atualização e implementa a solução em Power BI ou outra ferramenta de visualização combinada.",
    result: "Dashboards no ar, com KPIs definidos, fontes integradas e rotina de atualização.",
    includes: [
      "Desenvolvimento de dashboards gerenciais e executivos",
      "Criação de painéis de indicadores (KPIs)",
      "Dashboards financeiros, comerciais e operacionais",
      "Integração de dados de diferentes fontes",
      "Automação de relatórios empresariais",
      "Manutenção e atualização de dashboards",
      "Desenvolvimento de relatórios interativos",
      "Implementação com Power BI e outras ferramentas de visualização",
    ],
    excludes: ["Licenças de Power BI ou ferramenta de BI", "Indicadores fora da lista inicial do projeto"],
  },
  {
    slug: "apis-integracoes",
    name: "APIs e integrações",
    area: "dados-e-automacao",
    lead: "filipe-ferreira",
    billing: "projeto",
    price: 1000,
    duration: "4 a 6 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Desenvolvimento, manutenção e integração de APIs.",
    description:
      "Cria APIs REST e endpoints para sistemas empresariais, integra plataformas e APIs de terceiros, cuida de autenticação e documentação, e deixa monitoramento, testes e webhooks no mesmo pacote.",
    result: "APIs e integrações em produção, com documentação, acesso controlado e monitoramento.",
    includes: [
      "Criação de APIs REST",
      "Desenvolvimento de endpoints para sistemas empresariais",
      "Integração entre plataformas e aplicações",
      "Integração com APIs de terceiros",
      "Manutenção corretiva e evolutiva de APIs",
      "Autenticação, autorização e controle de acesso",
      "Documentação técnica de APIs",
      "Monitoramento, testes e otimização de desempenho",
      "Desenvolvimento de webhooks e integrações automatizadas",
    ],
    excludes: ["Custos de APIs de terceiros", "Mudanças de produto fora do contrato de integração"],
  },
  {
    slug: "etl-engenharia-dados",
    name: "ETL e engenharia de dados",
    area: "dados-e-automacao",
    lead: "filipe-ferreira",
    billing: "projeto",
    price: 1000,
    duration: "5 a 8 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Extração, transformação e carregamento de dados (ETL).",
    description:
      "Desenvolve pipelines que extraem dados de bancos, APIs, planilhas e sistemas, limpam e padronizam, carregam no destino e ficam agendados com monitoramento. Também cobre ELT e manutenção de pipelines existentes.",
    result: "Pipelines em rotina, com carga confiável e alerta quando a integração falha.",
    includes: [
      "Desenvolvimento de pipelines de dados",
      "Extração de dados de bancos, APIs, planilhas e sistemas",
      "Limpeza, padronização e transformação de dados",
      "Carga de dados em bancos e data warehouses",
      "Automação de processos de integração de dados",
      "Identificação e correção de inconsistências",
      "Agendamento e monitoramento de rotinas ETL",
      "Manutenção e otimização de pipelines existentes",
      "Processos ELT e integração de múltiplas fontes",
    ],
    excludes: ["Aquisição de ferramenta ETL", "Fontes novas fora da lista do projeto"],
  },
  {
    slug: "automacao-processos",
    name: "Automação de processos empresariais",
    area: "dados-e-automacao",
    lead: "filipe-ferreira",
    billing: "projeto",
    price: 1000,
    duration: "3 a 5 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Automação de tarefas repetitivas e integração entre sistemas.",
    description:
      "Automatiza tarefas com Python, processa dados, atualiza planilhas e relatórios, integra sistemas e agenda rotinas de banco e dashboard. Também cria ferramentas internas e monitoramento dos processos automatizados.",
    result: "Rotinas automatizadas em operação, com agendamento e monitoramento.",
    includes: [
      "Automação de tarefas repetitivas com Python",
      "Desenvolvimento de scripts para processamento de dados",
      "Automação de relatórios e planilhas",
      "Integração automatizada entre sistemas",
      "Rotinas de atualização de bancos e dashboards",
      "Automatização de coleta e consolidação de informações",
      "Desenvolvimento de ferramentas internas para empresas",
      "Agendamento de tarefas e monitoramento de processos",
    ],
    excludes: ["Automação de processos jurídicos ou fiscais sem especialista da área", "Licenças de RPA empresarial"],
  },
  {
    slug: "solucoes-dados",
    name: "Desenvolvimento de soluções de dados",
    area: "dados-e-automacao",
    lead: "filipe-ferreira",
    billing: "projeto",
    price: 1000,
    duration: "6 a 10 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Coleta, data warehouse e bases prontas para análise e IA.",
    description:
      "Desenvolve sistemas de coleta e processamento, cria data warehouses, estrutura bases para análise, consolida departamentos, implementa qualidade de dados e prepara a informação para projetos de inteligência artificial.",
    result: "Base centralizada, com qualidade definida e pronta para análise ou o próximo passo de IA.",
    includes: [
      "Sistemas de coleta e processamento de dados",
      "Criação de data warehouses",
      "Estruturação de bases para análise empresarial",
      "Consolidação de informações de diferentes departamentos",
      "Desenvolvimento de indicadores e métricas de negócio",
      "Processos de qualidade de dados",
      "Soluções para centralização de informações",
      "Preparação de dados para projetos de inteligência artificial",
    ],
    excludes: ["Treinamento de modelos de IA", "Infraestrutura cloud fora do desenho combinado"],
  },
  {
    slug: "consultoria-suporte",
    name: "Consultoria e suporte técnico",
    area: "dados-e-automacao",
    lead: "filipe-ferreira",
    billing: "projeto",
    price: 1000,
    duration: "2 a 4 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Diagnóstico, auditoria técnica e plano de modernização.",
    description:
      "Diagnostica a infraestrutura de dados, orienta modelagem e arquitetura, analisa processos, audita APIs e pipelines, identifica gargalos, documenta sistemas e planeja melhorias. O suporte recorrente pode seguir em contrato mensal depois do diagnóstico.",
    result: "Diagnóstico priorizado, documentação e plano de melhoria com responsáveis.",
    includes: [
      "Diagnóstico de infraestrutura de dados",
      "Consultoria para modelagem e arquitetura de bancos de dados",
      "Análise e melhoria de processos empresariais",
      "Auditoria técnica de APIs e pipelines",
      "Identificação de gargalos de desempenho",
      "Documentação de sistemas e processos",
      "Suporte técnico no período do projeto",
      "Planejamento de melhorias e modernização tecnológica",
    ],
    excludes: ["Execução completa das melhorias listadas", "Plantão 24x7 sem contrato mensal à parte"],
  },
  {
    slug: "sites-landing",
    name: "Sites institucionais e landing pages",
    area: "front-end",
    lead: "yuri-s-cortes",
    billing: "projeto",
    price: 1000,
    duration: "3 a 5 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Criação e evolução de sites comerciais e páginas de campanha.",
    description:
      "Desenvolve site institucional multi-página ou landing de produto, com formulários, integração com CRM ou e-mail marketing, SEO técnico inicial e publicação com passagem para o time interno.",
    result: "Site ou landing no ar, com formulários integrados e handoff documentado.",
    includes: [
      "Site institucional multi-página",
      "Landing page de campanha ou produto",
      "Páginas de captura e formulários",
      "Integração com CRM / e-mail marketing",
      "SEO técnico básico (títulos, meta, performance inicial)",
      "Publicação e handoff para o time interno",
    ],
    excludes: ["Produção de conteúdo e foto", "Mídia paga e operação de campanha"],
  },
  {
    slug: "redesign-ui",
    name: "Redesign de interface",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "4 a 6 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Modernização da cara do produto sem reescrever tudo de uma vez.",
    description:
      "Audita a interface atual, redesenha fluxos críticos, organiza componentes, tipografia e hierarquia, e entrega protótipo navegável alinhado ao front que já existe.",
    result: "Fluxos críticos redesenhados, com protótipo aprovável e critérios para implementação.",
    includes: [
      "Auditoria da interface atual",
      "Novo layout de fluxos críticos",
      "Biblioteca de componentes usados no produto",
      "Ajuste de tipografia, cor e hierarquia",
      "Prototipação navegável antes do código",
      "Entrega alinhada com o front que já existe",
    ],
    excludes: ["Implementação completa em código", "Identidade de marca do zero"],
  },
  {
    slug: "design-system",
    name: "Design system enxuto",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "5 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Base visual reutilizável para produto e marketing.",
    description:
      "Inventaria telas e peças repetidas, define tokens e componentes essenciais, documenta o uso e passa o sistema para design e engenharia com critério de expansão.",
    result: "Biblioteca inicial publicada e guia de uso para o time.",
    includes: [
      "Inventário das telas e componentes repetidos",
      "Tokens (cor, tipo, espaço, borda)",
      "Componentes essenciais documentados",
      "Critério de quando criar peça nova",
      "Guia de uso para design e engenharia",
      "Passagem para os squads",
    ],
    excludes: ["Ilustração de campanha", "Redesenho de todo o produto"],
  },
  {
    slug: "desenvolvimento-front",
    name: "Desenvolvimento front-end de produto",
    area: "front-end",
    lead: "yuri-s-cortes",
    billing: "projeto",
    price: 1000,
    duration: "4 a 8 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Telas e fluxos em produção, integrados às APIs existentes.",
    description:
      "Implementa interfaces em React, Vue ou HTML moderno: cadastro, checkout, painel, onboarding, estados de loading/erro/vazio, integração com APIs e documentação do que entrou no ciclo.",
    result: "Fluxos combinados em produção, com estados tratados e handoff do ciclo.",
    includes: [
      "Implementação de interfaces em React / Vue / HTML moderno",
      "Fluxos de cadastro, checkout, painel e onboarding",
      "Estados de loading, erro e vazio",
      "Integração com APIs existentes",
      "Testes de regressão visual dos fluxos entregues",
      "Documentação do que entrou no ciclo",
    ],
    excludes: ["Backend e regras de negócio novas", "Design system completo fora do recorte"],
  },
  {
    slug: "paineis-portais",
    name: "Painéis administrativos e portais",
    area: "front-end",
    lead: "yuri-s-cortes",
    billing: "projeto",
    price: 1000,
    duration: "4 a 7 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Área logada para operação, cliente ou parceiro.",
    description:
      "Monta admin interno ou portal do cliente com CRUD, filtros, permissões de tela, tabelas, busca, exportação, upload e responsividade, integrado à autenticação já existente.",
    result: "Painel ou portal em uso, com os fluxos do recorte publicados.",
    includes: [
      "Admin interno (CRUD, filtros, permissões de tela)",
      "Portal do cliente / área logada",
      "Tabelas, busca e exportação",
      "Upload e gestão de arquivos na UI",
      "Responsividade para uso diário",
      "Integração com autenticação já existente",
    ],
    excludes: ["Provedor de identidade novo", "Regras de negócio fora da API disponível"],
  },
  {
    slug: "ecommerce-checkout",
    name: "E-commerce e checkout",
    area: "front-end",
    lead: "yuri-s-cortes",
    billing: "projeto",
    price: 1000,
    duration: "6 a 10 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Frente de loja e funil de compra focados em conversão.",
    description:
      "Entrega catálogo, detalhe, carrinho, checkout e confirmação, com UI de gateway, cupons, frete, mobile-first e ajustes nos pontos de atrito do funil.",
    result: "Funil de compra no ar, com os passos combinados funcionando no mobile.",
    includes: [
      "Catálogo, detalhe de produto e carrinho",
      "Checkout e páginas de confirmação",
      "Integração visual com gateway / meios de pagamento",
      "Cupons, frete e regras visíveis no fluxo",
      "Mobile-first no funil de compra",
      "Ajustes de conversão nos pontos de atrito",
    ],
    excludes: ["Contrato e homologação do gateway", "Operação de estoque e logística"],
  },
  {
    slug: "performance-mobile",
    name: "Performance e experiência mobile",
    area: "front-end",
    lead: "yuri-s-cortes",
    billing: "projeto",
    price: 1000,
    duration: "2 a 4 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Site ou app web mais rápido e usável no celular.",
    description:
      "Diagnostica Core Web Vitals, otimiza assets e critical path, ajusta layout responsivo, corrige bugs de viewport/touch e entrega relatório antes/depois com checklist de publicação.",
    result: "Métricas melhoradas nos fluxos medidos e lista do que ainda falta.",
    includes: [
      "Diagnóstico de Core Web Vitals",
      "Otimização de assets, lazy load e critical CSS",
      "Ajustes de layout responsivo",
      "Correção de bugs de viewport / touch",
      "Relatório antes/depois com métricas",
      "Checklist de publicação",
    ],
    excludes: ["Reescrita completa do front", "Infraestrutura de CDN fora do escopo"],
  },
  {
    slug: "acessibilidade-front",
    name: "Acessibilidade e qualidade de front",
    area: "front-end",
    lead: "yuri-s-cortes",
    billing: "projeto",
    price: 1000,
    duration: "2 a 3 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Interface usável por mais gente e mais estável nos fluxos críticos.",
    description:
      "Audita WCAG nos fluxos críticos, corrige contraste, foco e semântica, valida teclado e leitores de tela, revisa formulários e deixa guia rápido para o time, com reteste dos pontos corrigidos.",
    result: "Fluxos críticos corrigidos e guia de manutenção de acessibilidade.",
    includes: [
      "Auditoria WCAG dos fluxos críticos",
      "Correção de contraste, foco e semântica",
      "Navegação por teclado e leitores de tela",
      "Revisão de formulários e mensagens de erro",
      "Guia rápido de boas práticas para o time",
      "Reteste dos pontos corrigidos",
    ],
    excludes: ["Certificação formal de acessibilidade", "Redesenho completo fora dos fluxos auditados"],
  },
  {
    slug: "migracao-front-legado",
    name: "Migração de front legado",
    area: "front-end",
    lead: "yuri-s-cortes",
    billing: "projeto",
    price: 1000,
    duration: "8 a 12 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Sair do front antigo sem parar o produto.",
    description:
      "Mapeia legado (jQuery, templates, CSS solto), define convivência entre antigo e novo, reescreve por fluxo crítico, harmoniza rotas e assets e entrega o fluxo novo em produção com plano do próximo ciclo.",
    result: "Fluxo crítico no front novo, com plano do que ainda permanece no legado.",
    includes: [
      "Mapeamento do legado (jQuery, templates, CSS solto)",
      "Estratégia de convivência (legado + novo)",
      "Reescrita por fluxo crítico",
      "Harmonização de rotas e assets",
      "Plano do que fica e do que sobe no próximo ciclo",
      "Entrega com o fluxo novo em produção",
    ],
    excludes: ["Reescrita integral da plataforma", "Backend paralelo fora do escopo"],
  },
  {
    slug: "squad-front",
    name: "Squad de front dedicado",
    area: "front-end",
    lead: "yuri-s-cortes",
    billing: "mensal",
    price: 1000,
    duration: "Contrato mensal",
    commitment: "Aviso prévio de 30 dias",
    featured: false,
    summary: "Time nomeado para a fila de interface, com ciclo mensal.",
    description:
      "Squad acompanhado pelo Yuri para tirar da fila telas e ajustes de front. Cada mês tem recorte combinado, rito semanal, evolução do design system e registro do que entrou e do que ficou de fora.",
    result: "Entrega mensal em produção, com nota do ciclo e backlog atualizado.",
    includes: [
      "Ciclo mensal com recorte combinado",
      "Implementação contínua de telas e ajustes",
      "Rito semanal de prioridade",
      "Manutenção evolutiva do design system",
      "Registro do que entrou e do que ficou de fora",
      "Aviso prévio para encerrar o contrato",
    ],
    excludes: ["Demandas fora do recorte do mês", "Backend e infraestrutura fora do acordo"],
  },
  {
    slug: "identidade-visual",
    name: "Identidade visual",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "3 a 5 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Marca, sistema visual e aplicações básicas para o negócio.",
    description:
      "Define ou atualiza identidade visual: conceito, logo, paleta, tipografia, aplicações essenciais e guia de uso para o time aplicar com consistência.",
    result: "Kit de identidade com arquivos editáveis e manual de uso.",
    includes: [
      "Diagnóstico da marca atual ou briefing da marca nova",
      "Conceito e direção visual",
      "Logo e variações principais",
      "Paleta, tipografia e elementos de apoio",
      "Aplicações essenciais (cartão, assinatura, capa)",
      "Manual de uso e arquivos finais",
    ],
    excludes: ["Registro de marca no INPI", "Campanha publicitária completa"],
  },
  {
    slug: "design-grafico",
    name: "Design gráfico e comunicação",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "2 a 4 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Peças gráficas para digital e impressão, no padrão da marca.",
    description:
      "Produz peças de comunicação: posts, banners, apresentações, materiais comerciais e layouts para campanha, alinhados à identidade existente.",
    result: "Pacote de peças no formato combinado, prontas para publicar ou imprimir.",
    includes: [
      "Briefing e lista de peças do ciclo",
      "Layouts para redes e mídia digital",
      "Materiais comerciais e apresentações",
      "Adaptações de formato",
      "Arquivos finais e versões editáveis",
      "Ajustes em duas rodadas de revisão",
    ],
    excludes: ["Mídia paga e veiculação", "Fotografia ou vídeo de produção"],
  },
  {
    slug: "ilustracao-digital",
    name: "Ilustração digital",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "2 a 5 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Ilustrações autorais para produto, campanha e conteúdo.",
    description:
      "Cria ilustrações digitais sob medida: personagens, cenas, ícones avançados e séries visuais para site, app, apresentação ou campanha.",
    result: "Ilustrações finais em alta resolução, com fontes editáveis quando combinado.",
    includes: [
      "Briefing de estilo e uso",
      "Estudos e direção visual",
      "Ilustrações do recorte combinado",
      "Variações e formatos de entrega",
      "Arquivos PNG/SVG/PDF conforme o uso",
      "Duas rodadas de revisão",
    ],
    excludes: ["Stock art genérico como entrega principal", "Animação complexa fora do escopo de motion"],
  },
  {
    slug: "modelagem-3d",
    name: "Modelagem 3D",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "3 a 6 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Modelos 3D de produto, cena ou personagem para uso comercial.",
    description:
      "Modela objetos, produtos, cenários ou personagens em 3D, com topologia adequada ao uso (render, mockup, apresentação ou base para animação leve).",
    result: "Modelo 3D entregue nos formatos combinados, pronto para render ou integração.",
    includes: [
      "Briefing e referências do objeto ou cena",
      "Modelagem 3D do recorte",
      "Materiais e UVs básicos",
      "Organização de cena e arquivos",
      "Entrega em formatos combinados (ex.: FBX, OBJ, Blend)",
      "Ajustes em duas rodadas de revisão",
    ],
    excludes: ["Simulação física avançada", "Impressão 3D e ferramentaria"],
  },
  {
    slug: "render-visualizacao-3d",
    name: "Renderização e visualização 3D",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "2 a 4 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Imagens e visuais 3D de alto acabamento para venda e apresentação.",
    description:
      "Produz renders e visualizações a partir de modelo existente ou modelagem inclusa no recorte: luz, material, composição e entregáveis para site, catálogo ou pitch.",
    result: "Renders finais em alta resolução e variações de ângulo combinadas.",
    includes: [
      "Setup de cena, luz e câmera",
      "Materiais e acabamento visual",
      "Renders still do recorte",
      "Variações de fundo ou ângulo",
      "Arquivos para web e impressão",
      "Duas rodadas de revisão",
    ],
    excludes: ["Filme/CGI longo", "Motor de jogo em tempo real"],
  },
  {
    slug: "motion-design",
    name: "Motion design",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "2 a 4 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Animação curta para marca, produto e redes.",
    description:
      "Anima logos, explicadores curtos, pieces para redes e microinterações visuais, com storyboard e entrega em formatos prontos para publicar.",
    result: "Peças animadas nos formatos e durações combinados.",
    includes: [
      "Briefing e storyboard curto",
      "Animação do recorte combinado",
      "Versões para feed e stories quando pedido",
      "Exportação em MP4/GIF conforme uso",
      "Arquivo de projeto editável",
      "Duas rodadas de revisão",
    ],
    excludes: ["Produção audiovisual com filmagem", "Série longa de episódios"],
  },
  {
    slug: "direcao-arte",
    name: "Direção de arte",
    area: "design-e-ilustracao",
    lead: "isabelle-ruppel",
    billing: "projeto",
    price: 1000,
    duration: "3 a 5 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Direção visual para campanha, lançamento ou conjunto de peças.",
    description:
      "Define a direção de arte de um pacote: moodboard, critérios visuais, supervisão das peças e coerência entre design, ilustração e 3D do ciclo.",
    result: "Direção aprovada e peças do pacote alinhadas ao mesmo critério.",
    includes: [
      "Moodboard e critérios de direção",
      "Hierarquia visual da campanha ou lançamento",
      "Supervisão das peças do pacote",
      "Ajustes de coerência entre formatos",
      "Guia rápido de aplicação no ciclo",
      "Revisão final do conjunto",
    ],
    excludes: ["Mídia e veiculação", "Produção fotográfica completa sem escopo à parte"],
  },
]

function byName(a, b) {
  return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
}

areas.sort((a, b) => String(a.number).localeCompare(String(b.number), "pt-BR", { numeric: true }))
services.sort(byName)
consultants.sort(byName)

function getArea(slug) {
  return areas.find((area) => area.slug === slug) || null
}

function getService(slug) {
  return services.find((service) => service.slug === slug) || null
}

function getConsultant(slug) {
  return consultants.find((consultant) => consultant.slug === slug) || null
}

function servicesByArea(slug) {
  return services.filter((service) => service.area === slug).sort(byName)
}

function consultantsByArea(slug) {
  return consultants.filter((consultant) => consultant.areas.includes(slug)).sort(byName)
}

function servicesByConsultant(slug) {
  return services.filter((service) => service.lead === slug).sort(byName)
}

function billingLabel(billing) {
  return billing === "mensal" ? "Mensal" : "Projeto"
}

function priceLabel(service) {
  const value = service.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  return service.billing === "mensal" ? `${value} / mês` : value
}


function money(value) {
  return Math.round(value * 100) / 100
}

function quote(items, paymentId = "pix", installments = 1) {
  const lines = []
  for (const item of items) {
    const service = services.find((entry) => entry.slug === item.id)
    if (!service) continue
    const qty = service.billing === "mensal" ? Math.min(12, Math.max(1, Number(item.qty) || 1)) : 1
    lines.push({
      slug: service.slug,
      name: service.name,
      area: getArea(service.area)?.name || "",
      billing: service.billing,
      qty,
      unit: service.price,
      total: money(service.price * qty),
      lead: service.lead,
      leadName: getConsultant(service.lead)?.name || "",
    })
  }

  const subtotal = money(lines.reduce((sum, line) => sum + line.total, 0))
  const discount = paymentId === "pix" ? money(subtotal * paymentRules.pixDiscount) : 0
  const base = money(subtotal - discount)
  const portions = paymentId === "cartao"
    ? Math.min(paymentRules.maxInstallments, Math.max(1, Number(installments) || 1))
    : 1
  const extraMonths = Math.max(0, portions - paymentRules.cardFreeInstallments)
  const interest = paymentId === "cartao" && extraMonths > 0
    ? money(base * paymentRules.cardMonthlyRate * extraMonths)
    : 0
  const total = money(base + interest)

  return {
    lines,
    subtotal,
    discount,
    interest,
    total,
    installments: portions,
    installmentValue: money(total / portions),
    paymentId,
  }
}

  return {
    company, paymentRules, payments, areas, consultants, services,
    getArea, getService, getConsultant, servicesByArea, consultantsByArea, servicesByConsultant,
    billingLabel, priceLabel, brl, percent, formatDate, maskPhone, maskDocument, isCpf, isCnpj, isEmail, quote,
  }
})()