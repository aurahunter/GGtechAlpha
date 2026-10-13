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
  name: "GG Tech",
  legal: "GG Tech Consultoria",
  email: "contato@ggtech.com.br",
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
    eyebrow: "À vista",
    summary: "Compensação imediata, com desconto no total da proposta.",
    points: [
      "Pessoa física e jurídica",
      "QR Code e chave enviados depois da confirmação do escopo",
      "Início liberado assim que o pagamento compensa",
    ],
  },
  {
    id: "cartao",
    name: "Cartão de crédito",
    eyebrow: "Parcelado",
    summary: "Até 6 vezes sem acréscimo. Da 7ª à 12ª, acréscimo de parcelamento.",
    points: [
      "Pessoa física e jurídica",
      "Link de pagamento enviado pelo financeiro",
      "O número de parcelas fica registrado na proposta",
    ],
  },
  {
    id: "boleto",
    name: "Boleto bancário",
    eyebrow: "À vista",
    summary: "Vencimento em 3 dias úteis após a emissão.",
    points: [
      "Pessoa física e jurídica",
      "Linha digitável enviada por e-mail",
      "Compensação em até 2 dias úteis depois do pagamento",
    ],
  },
  {
    id: "faturamento",
    name: "Faturamento",
    eyebrow: "Pessoa jurídica",
    summary: "Nota fiscal com vencimento em 30 dias, mediante análise cadastral.",
    points: [
      "Somente pessoa jurídica",
      "Proposta mínima definida nas condições",
      "A execução começa depois da aprovação do cadastro",
    ],
  },
]

const areas = [
  {
    slug: "engenharia",
    number: "01",
    name: "Engenharia de software",
    summary: "Sistemas, APIs e squads que chegam em produção.",
    description:
      "Entra quando o software precisa de direção antes de mais gente codando, ou de um time que entregue um recorte por vez. O trabalho cobre descoberta, modernização e squads dedicados, sempre com um responsável nomeado.",
    problems: [
      "O legado trava lançamento e ninguém sabe por onde cortar",
      "O time interno está cheio e a fila de produto não anda",
      "Há pressa para construir sem um desenho que sobreviva ao primeiro mês",
    ],
    approach: [
      "Leitura do sistema e das filas reais de negócio",
      "Plano em fases, com risco e dependência explícitos",
      "Entrega acompanhada pelo consultor que assinou o escopo",
    ],
  },
  {
    slug: "dados",
    number: "02",
    name: "Dados e analytics",
    summary: "Da planilha solta a uma base que a gestão consegue usar.",
    description:
      "Organiza origem, confiança e consumo dos dados. O foco é decisão: o que medir, de onde vem o número e qual recorte cabe agora — diagnóstico, plataforma ou modelo aplicado a uma pergunta concreta.",
    problems: [
      "Cada área apresenta um número diferente para a mesma pergunta",
      "O relatório existe, mas chega tarde demais para mudar a operação",
      "Há volume de dado e pouca clareza sobre o que prever",
    ],
    approach: [
      "Mapa das fontes e dos indicadores que importam",
      "Modelo de dados enxuto, com dono para cada métrica",
      "Entrega que o time de negócio consegue ler sem tradução permanente",
    ],
  },
  {
    slug: "cloud",
    number: "03",
    name: "Cloud e infraestrutura",
    summary: "Ambiente estável, custo visível e operação sem herói.",
    description:
      "Desenha a ida para cloud e, quando faz sentido, fica na operação. A conversa inclui conta, ambiente, rotina de plantão e o que fica com o time interno no fim do contrato.",
    problems: [
      "A infraestrutura depende de uma pessoa que não pode sair de férias",
      "A conta de cloud cresce sem relação clara com o uso",
      "A migração foi anunciada e o plano ainda é uma lista de desejos",
    ],
    approach: [
      "Inventário do que sobe, do que fica e do que se aposenta",
      "Ambiente com custo, acesso e rotina de recuperação descritos",
      "Passagem de bastão documentada para o time interno",
    ],
  },
  {
    slug: "seguranca",
    number: "04",
    name: "Segurança da informação",
    summary: "Risco mapeado, controle implantado e evidência para auditoria.",
    description:
      "Avalia exposição e monta um programa que a empresa consegue manter. O resultado não é um PDF genérico: é uma lista de controles, donos e provas que um auditor ou um cliente exigente consegue verificar.",
    problems: [
      "Um cliente ou uma auditoria pediu evidência e o material não existe",
      "O incidente recente mostrou que o acesso está largo demais",
      "Política há, prática não",
    ],
    approach: [
      "Leitura do risco a partir do que a operação realmente faz",
      "Controles priorizados por impacto, não por moda",
      "Evidência guardada de um jeito que o próximo ciclo de auditoria reaproveita",
    ],
  },
  {
    slug: "produto",
    number: "05",
    name: "Produto e experiência",
    summary: "Pesquisa, interface e design system alinhados ao uso real.",
    description:
      "Descobre o que o usuário tenta fazer e desenha a resposta com o time de engenharia do lado. Serve para um fluxo crítico, um protótipo de decisão ou um sistema visual que pare de ser refeito a cada tela.",
    problems: [
      "A tela foi lançada e o suporte virou o manual do produto",
      "Cada squad desenha o mesmo componente de um jeito",
      "A diretoria quer ver o fluxo antes de autorizar a construção",
    ],
    approach: [
      "Entrevista e observação do uso, não só do briefing",
      "Protótipo que o negócio consegue aprovar",
      "Peças reutilizáveis, com critério de quando criar algo novo",
    ],
  },
  {
    slug: "negocios",
    number: "06",
    name: "Consultoria de negócios",
    summary: "Prioridade, governança e um plano que a operação aguenta.",
    description:
      "Ajuda a diretoria a escolher o que fazer primeiro e a acompanhar sem transformar a reunião de status em teatro. O plano sai com dono, marco e o que fica de fora de propósito.",
    problems: [
      "Há iniciativas demais e nenhuma com data que se sustente",
      "A transformação foi anunciada e cada área executa uma versão",
      "O comitê pede status e recebe slide, não decisão",
    ],
    approach: [
      "Corte explícito do que não entra neste ciclo",
      "Ritos curtos, com decisão registrada",
      "Um consultor acompanha o plano até a operação assumir",
    ],
  },
]

const consultants = [
  {
    slug: "helena-vasconcelos",
    name: "Helena Vasconcelos",
    role: "Diretora de engenharia",
    tone: 1,
    experience: "14 anos",
    areas: ["engenharia"],
    skills: ["Arquitetura", "Descoberta", "Squads"],
    summary: "Entra quando o sistema precisa de um plano antes de mais gente codando.",
    bio: "Helena conduz descobertas e squads de produto. Ela separa o que o software faz hoje do que a operação precisa em seguida, e deixa o plano com fases que um time consegue cumprir. O trabalho dela termina com um responsável, um recorte e um critério de pronto.",
  },
  {
    slug: "marcos-tavares",
    name: "Marcos Tavares",
    role: "Líder de dados",
    tone: 2,
    experience: "12 anos",
    areas: ["dados"],
    skills: ["Métricas", "Modelagem", "Previsão"],
    summary: "Transforma discussão de número em fonte, dono e indicador.",
    bio: "Marcos atua em diagnóstico, plataforma e modelo preditivo. Ele começa pela pergunta que a gestão repete e só então mexe na base. O combinado é que cada indicador tenha origem e alguém que responda por ele quando o número mudar.",
  },
  {
    slug: "livia-okamoto",
    name: "Lívia Okamoto",
    role: "Arquiteta de cloud",
    tone: 3,
    experience: "11 anos",
    areas: ["cloud"],
    skills: ["Migração", "Custo", "Ambientes"],
    summary: "Desenha a ida para cloud com a conta e o plano de corte visíveis.",
    bio: "Lívia conduz jornadas de migração. Ela lista o que sobe, o que fica e o que se aposenta, e deixa o ambiente com acesso, custo e rotina de recuperação descritos. A passagem para o time interno faz parte do escopo, não de um extra no fim.",
  },
  {
    slug: "rafael-mendonca",
    name: "Rafael Mendonça",
    role: "Consultor de segurança",
    tone: 4,
    experience: "13 anos",
    areas: ["seguranca"],
    skills: ["Risco", "Controles", "Auditoria"],
    summary: "Monta evidência que auditor e cliente conseguem verificar.",
    bio: "Rafael faz assessment e programa de conformidade. Ele prioriza controle pelo que a operação realmente executa e deixa dono, prova e periodicidade. O material serve ao próximo ciclo de auditoria, não só à reunião de entrega.",
  },
  {
    slug: "camila-duarte",
    name: "Camila Duarte",
    role: "Estrategista de produto",
    tone: 5,
    experience: "10 anos",
    areas: ["produto", "negocios"],
    skills: ["Pesquisa", "Fluxos", "Prioridade"],
    summary: "Descobre o que o usuário tenta fazer antes de desenhar a tela.",
    bio: "Camila conduz pesquisa e protótipo de fluxos críticos. Ela observa o uso, recorta o problema e entrega um protótipo que negócio e engenharia conseguem aprovar juntos. O que fica de fora do fluxo também fica escrito.",
  },
  {
    slug: "andre-pacheco",
    name: "André Pacheco",
    role: "Consultor de negócios",
    tone: 6,
    experience: "16 anos",
    areas: ["negocios"],
    skills: ["Governança", "PMO", "Planejamento"],
    summary: "Corta iniciativa demais e acompanha o que ficou de pé.",
    bio: "André monta planos de transformação e conduz PMO de iniciativas. Ele trabalha com a diretoria para escolher o ciclo, nomear donos e registrar decisão. A reunião de status existe para destravar, não para repetir o slide anterior.",
  },
  {
    slug: "sofia-klein",
    name: "Sofia Klein",
    role: "Designer de produto",
    tone: 7,
    experience: "9 anos",
    areas: ["produto"],
    skills: ["Interface", "Design system", "Conteúdo"],
    summary: "Organiza a interface para o produto parar de ser refeito a cada tela.",
    bio: "Sofia desenha sistemas visuais enxutos e os conecta ao que a engenharia já tem. Ela define quando um componente novo se justifica e entrega critério, não só um arquivo de tela. O suporte deixa de ser o manual do produto.",
  },
  {
    slug: "diego-nascimento",
    name: "Diego Nascimento",
    role: "Engenheiro de operação",
    tone: 8,
    experience: "12 anos",
    areas: ["cloud", "engenharia"],
    skills: ["Operação", "Legado", "Confiabilidade"],
    summary: "Tira a operação do modo herói e moderniza o que ainda segura a empresa.",
    bio: "Diego conduz operação gerenciada e modernização de legado. Ele documenta a rotina, reduz dependência de uma única pessoa e corta o sistema antigo em fatias que cabem num trimestre. O time interno sai sabendo o que assumiu.",
  },
]

const services = [
  {
    slug: "discovery-tecnico",
    name: "Discovery técnico",
    area: "engenharia",
    lead: "helena-vasconcelos",
    billing: "projeto",
    price: 18000,
    duration: "10 dias úteis",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Mapeia o sistema atual, os riscos e o caminho de entrega antes de comprometer um squad.",
    description:
      "Duas semanas com negócio e engenharia para separar o que o software faz hoje do que a operação precisa em seguida. O plano sai com arquitetura-alvo, recortes e estimativa — o bastante para contratar a construção sem surpresa de escopo.",
    result: "Relatório com arquitetura-alvo, riscos, dependências e fases de entrega.",
    includes: [
      "Entrevistas com negócio e engenharia",
      "Leitura dos fluxos críticos do sistema",
      "Mapa de riscos e dependências",
      "Plano em fases com estimativa",
    ],
    excludes: ["Implementação de código", "Licenças e infraestrutura"],
  },
  {
    slug: "squad-produto",
    name: "Squad de produto dedicado",
    area: "engenharia",
    lead: "helena-vasconcelos",
    billing: "mensal",
    price: 46000,
    duration: "Contrato mensal",
    commitment: "Aviso prévio de 30 dias",
    featured: false,
    summary: "Time nomeado para entregar um fluxo de produto por ciclo, com consultor responsável.",
    description:
      "Um squad acompanhado pela Helena para tirar da fila o que já tem prioridade. Cada mês tem um recorte combinado, demonstração e o que ficou de fora. Não é alocação avulsa: o escopo do ciclo é fechado na entrada do mês.",
    result: "Entrega mensal em produção, com nota do que entrou e do que ficou para o ciclo seguinte.",
    includes: [
      "Planejamento do ciclo com o patrocinador",
      "Construção e publicação do recorte",
      "Rito semanal de decisão",
      "Registro do que ficou para depois",
    ],
    excludes: ["Demandas fora do recorte do mês", "Sustentação de sistemas que não estão no ciclo"],
  },
  {
    slug: "modernizacao-legado",
    name: "Modernização de legado",
    area: "engenharia",
    lead: "diego-nascimento",
    billing: "projeto",
    price: 72000,
    duration: "8 a 12 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Corta um sistema antigo em fatias que o negócio consegue estrear sem parar a operação.",
    description:
      "Escolhe um fluxo que o legado ainda segura e o reescreve ao lado, com convivência entre o antigo e o novo. O projeto termina quando esse fluxo roda no sistema novo e o antigo deixa de ser caminho obrigatório para ele.",
    result: "Fluxo crítico no sistema novo, com plano do que ainda permanece no legado.",
    includes: [
      "Escolha do fluxo e da estratégia de convivência",
      "Construção da fatia nova",
      "Migração assistida desse recorte",
      "Roteiro do que fica para o ciclo seguinte",
    ],
    excludes: ["Reescrita integral da plataforma", "Operação contínua depois da entrega"],
  },
  {
    slug: "diagnostico-dados",
    name: "Diagnóstico de dados",
    area: "dados",
    lead: "marcos-tavares",
    billing: "projeto",
    price: 22000,
    duration: "15 dias úteis",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Descobre por que a mesma pergunta gera números diferentes e o que corrigir primeiro.",
    description:
      "Percorre as fontes que alimentam a decisão da diretoria e aponta onde o número nasce, onde ele se perde e qual indicador merece dono. O relatório prioriza três correções, não uma lista infinita de ferramentas.",
    result: "Mapa das fontes, conflitos de indicador e três correções em ordem.",
    includes: [
      "Entrevistas com quem produz e quem consome o número",
      "Leitura das planilhas e bases atuais",
      "Lista priorizada de correções",
      "Critério de dono para cada indicador principal",
    ],
    excludes: ["Construção da plataforma", "Compra de ferramenta"],
  },
  {
    slug: "plataforma-analitica",
    name: "Plataforma analítica",
    area: "dados",
    lead: "marcos-tavares",
    billing: "projeto",
    price: 58000,
    duration: "6 a 10 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Monta a base e os painéis dos indicadores que já têm dono e pergunta clara.",
    description:
      "Constrói o caminho dos dados até um conjunto pequeno de painéis. Cada indicador entra com definição, origem e responsável. O projeto não abre um lago de dados à espera de pergunta.",
    result: "Painéis no ar, com dicionário dos indicadores e rotina de atualização.",
    includes: [
      "Modelo do recorte combinado",
      "Carga das fontes acordadas",
      "Painéis e dicionário",
      "Passagem para o time que vai manter",
    ],
    excludes: ["Indicadores novos fora da lista inicial", "Ciência de dados exploratória"],
  },
  {
    slug: "modelo-preditivo",
    name: "Modelo preditivo aplicado",
    area: "dados",
    lead: "marcos-tavares",
    billing: "projeto",
    price: 36000,
    duration: "4 a 6 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Responde uma pergunta de previsão com dado que a empresa já tem.",
    description:
      "Escolhe uma decisão recorrente — demanda, inadimplência, fila, perda — e testa se o histórico sustenta um modelo útil. Se não sustentar, o resultado é esse diagnóstico, não um modelo enfeitado.",
    result: "Modelo em uso num fluxo combinado, ou laudo de que o dado ainda não sustenta a previsão.",
    includes: [
      "Definição da decisão e da métrica de acerto",
      "Preparação do histórico disponível",
      "Modelo e leitura do erro",
      "Roteiro de uso pelo time de negócio",
    ],
    excludes: ["Coleta nova de dados em campo", "Operação permanente do modelo"],
  },
  {
    slug: "jornada-cloud",
    name: "Jornada para cloud",
    area: "cloud",
    lead: "livia-okamoto",
    billing: "projeto",
    price: 32000,
    duration: "4 semanas",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Planeja o que migra, o que fica e quanto a conta deve parecer no fim.",
    description:
      "Quatro semanas para sair de uma intenção de cloud com um plano executável. Inclui inventário, ordem de migração, custo-alvo e o que o time interno precisa saber antes da primeira carga.",
    result: "Plano de migração com ondas, custo-alvo e responsáveis.",
    includes: [
      "Inventário dos ambientes atuais",
      "Desenho das ondas de migração",
      "Estimativa de custo do cenário escolhido",
      "Lista de preparação do time interno",
    ],
    excludes: ["Execução da migração completa", "Operação do ambiente depois da entrada"],
  },
  {
    slug: "operacao-gerenciada",
    name: "Operação gerenciada",
    area: "cloud",
    lead: "diego-nascimento",
    billing: "mensal",
    price: 15000,
    duration: "Contrato mensal",
    commitment: "Aviso prévio de 30 dias",
    featured: false,
    summary: "Rotina de ambiente, custo e incidente com passagem clara para o time interno.",
    description:
      "A GG Tech assume a rotina combinada do ambiente: acompanhamento, ajuste de custo visível e resposta a incidente dentro da janela acordada. Todo mês fecha com o que mudou e o que o time interno já consegue fazer sozinho.",
    result: "Ambiente acompanhado, relatório mensal e runbook atualizado.",
    includes: [
      "Rotina de verificação do ambiente em escopo",
      "Resposta a incidente na janela combinada",
      "Leitura mensal de custo",
      "Atualização do runbook",
    ],
    excludes: ["Ambientes fora da lista inicial", "Desenvolvimento de produto"],
  },
  {
    slug: "assessment-seguranca",
    name: "Assessment de segurança",
    area: "seguranca",
    lead: "rafael-mendonca",
    billing: "projeto",
    price: 24000,
    duration: "12 dias úteis",
    commitment: "Escopo fechado neste valor",
    featured: true,
    summary: "Mostra onde o acesso e o processo estão largos, em ordem de impacto.",
    description:
      "Lê a exposição a partir da operação real: acessos, fornecedores, rotina de mudança e o que um incidente recente já revelou. A entrega é uma fila curta de correções, com dono sugerido para cada uma.",
    result: "Relatório de risco com correções priorizadas e donos sugeridos.",
    includes: [
      "Entrevistas e leitura de acessos",
      "Revisão dos fluxos mais expostos",
      "Fila priorizada de correções",
      "Reunião de leitura com a diretoria",
    ],
    excludes: ["Correção técnica das falhas", "Teste de invasão em larga escala"],
  },
  {
    slug: "programa-conformidade",
    name: "Programa de conformidade",
    area: "seguranca",
    lead: "rafael-mendonca",
    billing: "projeto",
    price: 41000,
    duration: "6 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Implanta controles e evidências para um marco de auditoria ou de contrato.",
    description:
      "Parte de um marco concreto — auditoria marcada, cláusula de cliente, exigência de seguradora — e monta os controles que esse marco pede. Cada controle sai com dono, prova e periodicidade.",
    result: "Conjunto de controles em prática, com pasta de evidências do marco combinado.",
    includes: [
      "Leitura do marco e do que já existe",
      "Desenho dos controles que faltam",
      "Apoio na primeira coleta de evidência",
      "Rito de manutenção para o time interno",
    ],
    excludes: ["Certificação formal por organismo terceiro", "Assessoria jurídica"],
  },
  {
    slug: "pesquisa-prototipo",
    name: "Pesquisa e protótipo",
    area: "produto",
    lead: "camila-duarte",
    billing: "projeto",
    price: 16000,
    duration: "3 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Testa um fluxo crítico com quem usa, antes de autorizar a construção.",
    description:
      "Três semanas para observar o uso, recortar o problema e entregar um protótipo navegável. Serve para a diretoria decidir com o fluxo na frente, não com uma descrição abstrata.",
    result: "Protótipo do fluxo e nota do que a pesquisa mudou no pedido inicial.",
    includes: [
      "Roteiro e sessões com usuários",
      "Síntese do que trava o fluxo",
      "Protótipo navegável",
      "Lista do que não entra na primeira versão",
    ],
    excludes: ["Interface final de todo o produto", "Implementação em código"],
  },
  {
    slug: "design-system",
    name: "Design system enxuto",
    area: "produto",
    lead: "sofia-klein",
    billing: "projeto",
    price: 28000,
    duration: "5 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Um conjunto pequeno de componentes, com regra de quando criar algo novo.",
    description:
      "Organiza as telas que mais se repetem e entrega componentes, conteúdo padrão e critério de expansão. O sistema nasce ligado ao que a engenharia já consegue publicar, não a uma biblioteca imaginária.",
    result: "Biblioteca inicial publicada e guia de uso para design e engenharia.",
    includes: [
      "Inventário das telas repetidas",
      "Componentes do recorte combinado",
      "Guia de conteúdo e de uso",
      "Passagem para os squads",
    ],
    excludes: ["Redesenho de todo o produto", "Ilustração de campanha"],
  },
  {
    slug: "plano-transformacao",
    name: "Plano de transformação",
    area: "negocios",
    lead: "andre-pacheco",
    billing: "projeto",
    price: 26000,
    duration: "4 semanas",
    commitment: "Escopo fechado neste valor",
    featured: false,
    summary: "Escolhe o que entra neste ciclo e deixa o resto registrado como fora.",
    description:
      "Quatro semanas com a diretoria para nomear o objetivo do ciclo, cortar iniciativa e sair com donos e marcos. O plano cabe numa operação real: tem data, tem responsável e tem o que não será feito agora.",
    result: "Plano do ciclo com objetivo, donos, marcos e lista do que ficou de fora.",
    includes: [
      "Entrevistas com as áreas envolvidas",
      "Oficina de corte de prioridade",
      "Plano do ciclo",
      "Rito sugerido de acompanhamento",
    ],
    excludes: ["Execução das iniciativas", "Assessoria jurídica ou financeira"],
  },
  {
    slug: "pmo-iniciativas",
    name: "PMO de iniciativas",
    area: "negocios",
    lead: "andre-pacheco",
    billing: "mensal",
    price: 18000,
    duration: "Contrato mensal",
    commitment: "Aviso prévio de 30 dias",
    featured: false,
    summary: "Acompanha o plano que já existe para a reunião virar decisão, não slide.",
    description:
      "O André conduz o rito das iniciativas em curso: pauta curta, impedimento explícito e registro do que foi decidido. O mês fecha com o que andou, o que parou e o que precisa de um patrocinador.",
    result: "Rito funcionando e registro mensal de decisão, avanço e impedimento.",
    includes: [
      "Preparação e condução do rito",
      "Registro de decisão",
      "Leitura mensal do plano",
      "Alerta quando uma iniciativa perde dono ou data",
    ],
    excludes: ["Execução técnica das iniciativas", "Redesenho completo da estratégia"],
  },
]

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
  return services.filter((service) => service.area === slug)
}

function consultantsByArea(slug) {
  return consultants.filter((consultant) => consultant.areas.includes(slug))
}

function servicesByConsultant(slug) {
  return services.filter((service) => service.lead === slug)
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