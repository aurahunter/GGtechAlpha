const app = document.querySelector("#app")
const CART_KEY = "gg-proposta"
const ORDERS_KEY = "gg-propostas"
const VIEW_KEY = "gg-servicos-view"

const steps = [
  ["01", "Escolha a área", "Três frentes — dados e automação, Front-End e Design e ilustração — com serviços, consultores e escopo explícitos."],
  ["02", "Selecione o serviço", "Escopo, prazo, preço e o que fica de fora já estão no catálogo."],
  ["03", "Veja quem entrega", "Todo serviço tem um consultor responsável, com nome e histórico."],
  ["04", "Envie a proposta", "A proposta vai para o e-mail e o WhatsApp da Nano Tech. Sem cobrança no site."],
]

const paySteps = [
  ["1", "Monte a proposta", "Escolha os serviços, revise o valor e indique a preferência de pagamento."],
  ["2", "Envie para nós", "Ao finalizar, a proposta abre no e-mail e no WhatsApp da empresa."],
  ["3", "Validamos o escopo", "Entramos em contato, alinhamos detalhes e confirmamos o que entra no ciclo."],
  ["4", "Pagamento por fora", "Geramos PIX ou link de pagamento fora do site e só então seguimos com o trabalho."],
]

let cart = readJson(CART_KEY, [])
let menuOpen = false
let notice = ""
let noticeTimer = 0
let lastPath = null
let servicesView = localStorage.getItem(VIEW_KEY) === "cards" ? "cards" : "list"
const checkout = {
  person: "pj",
  paymentId: "pix",
  installments: 1,
  notes: "",
  errors: {},
  form: { name: "", email: "", phone: "", company: "", document: "" },
}
const contact = {
  form: { name: "", email: "", phone: "", company: "", area: "", message: "" },
  errors: {},
  sent: null,
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "")
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]))
}

function parseRoute() {
  let raw = location.hash.replace(/^#/, "")
  if (!raw) raw = "/"
  if (!raw.startsWith("/")) raw = `/${raw}`
  const queryIndex = raw.indexOf("?")
  const pathPart = queryIndex === -1 ? raw : raw.slice(0, queryIndex)
  const query = Object.fromEntries(new URLSearchParams(queryIndex === -1 ? "" : raw.slice(queryIndex + 1)))
  const parts = pathPart.split("/").filter(Boolean)
  return { path: `/${parts.join("/")}`, parts, query }
}

function servicesHref(area, query) {
  const params = new URLSearchParams()
  if (area && area !== "todas") params.set("area", area)
  if (query) params.set("q", query)
  const text = params.toString()
  return `#/servicos${text ? `?${text}` : ""}`
}

function has(slug) {
  return cart.some((item) => item.id === slug)
}

function flash(message) {
  notice = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice = ""
    render()
  }, 2800)
}

function add(slug) {
  const service = GG.getService(slug)
  if (!service) return
  if (has(slug)) {
    flash(`${service.name} já está na proposta.`)
  } else {
    cart = [...cart, { id: slug, qty: 1 }]
    saveCart()
    flash(`${service.name} entrou na proposta.`)
  }
  render()
}

function remove(slug) {
  cart = cart.filter((item) => item.id !== slug)
  saveCart()
  render()
}

function setQty(slug, delta) {
  cart = cart.flatMap((item) => {
    if (item.id !== slug) return [item]
    const qty = item.qty + delta
    if (qty < 1) return []
    return [{ ...item, qty: Math.min(12, qty) }]
  })
  saveCart()
  render()
}

function invoiceOk(subtotal) {
  return checkout.person === "pj" && subtotal >= GG.paymentRules.invoiceMin
}

function ensurePayment() {
  const preview = GG.quote(cart, checkout.paymentId, checkout.installments)
  if (checkout.paymentId === "faturamento" && !invoiceOk(preview.subtotal)) checkout.paymentId = "pix"
}

function mark(name, tone, large = false) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
  return `<div class="mark tone-${tone}${large ? " large" : ""}" aria-hidden="true">${esc(initials)}</div>`
}

function crumbs(items) {
  return `<nav class="crumbs" aria-label="Trilha">${items.map((item, index) => {
    const sep = index ? `<span aria-hidden="true"> / </span>` : ""
    const body = item.to
      ? `<a href="${item.to}">${esc(item.label)}</a>`
      : `<span aria-current="page">${esc(item.label)}</span>`
    return `<span>${sep}${body}</span>`
  }).join("")}</nav>`
}

function personCard(consultant, showAreas = false) {
  const line = showAreas
    ? consultant.areas.map((slug) => GG.getArea(slug)?.name).filter(Boolean).join(" · ")
    : consultant.summary
  return `<a class="person" href="#/consultores/${consultant.slug}">
    ${mark(consultant.name, consultant.tone)}
    <h3>${esc(consultant.name)}</h3>
    <p class="role">${esc(consultant.role)}</p>
    <p class="fine">${esc(line)}</p>
  </a>`
}

function metaAreaClass(area) {
  if (!area?.slug) return ""
  if (area.slug === "front-end") return " is-front-end"
  if (area.slug === "dados-e-automacao") return " is-dados"
  if (area.slug === "design-e-ilustracao") return " is-design"
  return ""
}

function priceBlock(service) {
  return `<p class="price">
    <span class="price-from">a partir de :</span>
    <span class="price-value">${esc(GG.priceLabel(service))}</span>
  </p>`
}

function serviceActions(service) {
  const action = has(service.slug)
    ? `<a class="btn btn-dark btn-small" href="#/contratar">Na proposta</a>`
    : `<button type="button" class="btn btn-dark btn-small" data-action="add" data-slug="${esc(service.slug)}">Adicionar</button>`
  return `<div class="actions tight">
    <a class="btn btn-ghost btn-small" href="#/servicos/${service.slug}">Detalhes</a>
    ${action}
  </div>`
}

function serviceRow(service) {
  const area = GG.getArea(service.area)
  const lead = GG.getConsultant(service.lead)
  return `<article class="service-row">
    <div>
      <p class="meta"><span class="meta-area${metaAreaClass(area)}">${esc(area?.name || "")}</span><span>${esc(GG.billingLabel(service.billing))}</span><span>${esc(service.duration)}</span></p>
      <h3><a href="#/servicos/${service.slug}">${esc(service.name)}</a></h3>
      <p class="summary">${esc(service.summary)}</p>
      ${lead ? `<p class="fine">Consultor responsável: ${esc(lead.name)}</p>` : ""}
    </div>
    <div class="service-side">
      ${priceBlock(service)}
      ${serviceActions(service)}
    </div>
  </article>`
}

function serviceCard(service) {
  const area = GG.getArea(service.area)
  const lead = GG.getConsultant(service.lead)
  return `<article class="service-card">
    <p class="meta"><span class="meta-area${metaAreaClass(area)}">${esc(area?.name || "")}</span><span>${esc(GG.billingLabel(service.billing))}</span><span>${esc(service.duration)}</span></p>
    <h3><a href="#/servicos/${service.slug}">${esc(service.name)}</a></h3>
    <p class="summary">${esc(service.summary)}</p>
    ${lead ? `<p class="fine">Consultor responsável: ${esc(lead.name)}</p>` : ""}
    <div class="service-card-foot">
      ${priceBlock(service)}
      ${serviceActions(service)}
    </div>
  </article>`
}

function stepGrid(items) {
  return `<div class="steps">${items.map(([number, title, text]) => `<article>
    <span>${esc(number)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>
  </article>`).join("")}</div>`
}

function navClass(path) {
  const route = parseRoute()
  if (path === "/") return route.path === "/" ? "active" : ""
  return route.path === path || route.path.startsWith(`${path}/`) ? "active" : ""
}

function shell(content) {
  const route = parseRoute()
  const proposalOn = route.path === "/contratar" || route.path.startsWith("/proposta")
  const year = new Date().getFullYear()
  const links = [
    ["Áreas", "#/areas", "/areas"],
    ["Serviços", "#/servicos", "/servicos"],
    ["Consultores", "#/consultores", "/consultores"],
    ["Pagamentos", "#/pagamentos", "/pagamentos"],
    ["Contato", "#/contato", "/contato"],
  ]
  return `<a class="skip" href="#conteudo" data-action="skip">Ir para o conteúdo</a>
    <header class="site-header">
      <div class="wrap header-inner">
        <a class="logo" href="#/" aria-label="Nano Tech, início">
          <img class="logo-img" src="logo.png" alt="Nano Tech" />
        </a>
        <nav id="menu" class="nav${menuOpen ? " open" : ""}" aria-label="Principal">
          ${links.map(([label, href, path]) => `<a class="${navClass(path)}" href="${href}">${label}</a>`).join("")}
        </nav>
        <div class="header-actions">
          <a class="btn btn-primary btn-small${proposalOn ? " is-on" : ""}" href="#/contratar">
            Proposta ${cart.length ? `<span class="badge-count">${cart.length}</span>` : ""}
          </a>
          <button type="button" class="nav-toggle" aria-expanded="${menuOpen ? "true" : "false"}" aria-controls="menu" data-action="menu">${menuOpen ? "Fechar" : "Menu"}</button>
        </div>
      </div>
    </header>
    <main id="conteudo" tabindex="-1">${content}</main>
    <footer class="site-footer">
      <div class="wrap footer-grid">
        <div>
          <img class="logo-img footer" src="logo.png" alt="Nano Tech" />
          <p>Prestação de serviços por área de atuação, com consultor nomeado. A proposta vai para e-mail e WhatsApp; o pagamento é combinado por fora.</p>
        </div>
        <div class="footer-links">
          ${links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}
          <a href="#/contratar">Contratar</a>
        </div>
        <div>
          <p>${esc(GG.company.coverage)}</p>
          <p>${esc(GG.company.hours)}</p>
          <p><a href="mailto:${esc(GG.company.email)}">${esc(GG.company.email)}</a></p>
        </div>
      </div>
      <div class="wrap legal"><p>© ${year} ${esc(GG.company.legal)}. Este site não processa pagamento. A proposta chega por e-mail e WhatsApp; PIX ou link são gerados depois, fora da plataforma.</p></div>
    </footer>
    ${notice ? `<div class="toast" role="status"><p>${esc(notice)}</p><a href="#/contratar">Abrir proposta</a></div>` : ""}`
}

function home() {
  const featured = GG.services.filter((service) => service.featured).slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
  return `<section class="hero"><div class="wrap hero-grid">
      <div>
        <p class="kicker">Prestação de serviços</p>
        <h1>Contrate por área. Conheça quem entrega. Escolha como pagar.</h1>
        <p class="lede">A Nano Tech organiza a consultoria em dados e automação, Front-End e Design e ilustração. Cada serviço tem escopo, prazo, consultor e preço. Você monta a proposta aqui; o pagamento é combinado depois, fora do site.</p>
        <div class="actions">
          <a class="btn btn-dark" href="#/servicos">Ver o catálogo</a>
          <a class="btn btn-ghost" href="#/contato">Falar com o comercial</a>
        </div>
      </div>
      <aside class="hero-panel" aria-label="Áreas de atuação">
        <p class="kicker">Áreas de atuação</p>
        <div class="area-index">
          ${GG.areas.map((area) => `<a class="area-index-link${metaAreaClass(area)}" href="#/areas/${area.slug}">
            <span class="num">${esc(area.number)}</span>
            <span><strong class="area-title${metaAreaClass(area)}">${esc(area.name)}</strong><small>${esc(area.summary)}</small></span>
            <span class="area-arrow" aria-hidden="true">→</span>
          </a>`).join("")}
        </div>
        <a class="text-link panel-more" href="#/areas">Ver as áreas em detalhe</a>
      </aside>
    </div></section>
    <section class="block"><div class="wrap">
      <div class="section-head"><h2>Como a contratação anda</h2></div>
      ${stepGrid(steps)}
    </div></section>
    <section class="block"><div class="wrap">
      <div class="section-head">
        <div><p class="kicker">Catálogo</p><h2>Serviços com escopo na mesa</h2></div>
        <a class="text-link" href="#/servicos">Todos os serviços</a>
      </div>
      <div class="catalog">${featured.map(serviceRow).join("")}</div>
    </div></section>
    <section class="block"><div class="wrap">
      <div class="section-head">
        <div><p class="kicker">Quem entrega</p><h2>Consultores nomeados</h2></div>
        <a class="text-link" href="#/consultores">Ver o time</a>
      </div>
      <div class="people">${GG.consultants.map((consultant) => personCard(consultant)).join("")}</div>
    </div></section>
    <section class="band-dark"><div class="wrap block">
      <div class="section-head">
        <div><p class="kicker">Pagamento</p><h2>Proposta no site. Pagamento por fora.</h2></div>
        <a class="text-link light" href="#/pagamentos">Como funciona</a>
      </div>
      <div class="pay-grid">
        ${GG.payments.map((payment) => `<a class="pay-card" href="#/pagamentos?metodo=${payment.id}">
          <span>${esc(payment.eyebrow)}</span>
          <strong>${esc(payment.name)}</strong>
          <small>${esc(paymentBlurb(payment.id))}</small>
        </a>`).join("")}
      </div>
    </div></section>
    <section class="block"><div class="wrap closing">
      <div><p class="kicker">Próximo passo</p><h2>Monte a proposta com os serviços deste ciclo.</h2></div>
      <div class="actions">
        <a class="btn btn-dark" href="#/servicos">Escolher serviços</a>
        <a class="btn btn-ghost" href="#/contato">Pedir um recorte sob medida</a>
      </div>
    </div></section>`
}

function paymentBlurb(id) {
  const rules = GG.paymentRules
  if (id === "pix") return `Preferência à vista · ${GG.percent(rules.pixDiscount)} de desconto na proposta.`
  if (id === "cartao") return `Preferência de parcelas · até ${rules.cardFreeInstallments}x sem acréscimo.`
  if (id === "boleto") return `Preferência de boleto · emitido depois da validação.`
  return `Preferência PJ · a partir de ${GG.brl(rules.invoiceMin)}.`
}

function areasPage() {
  return `<section class="wrap page">
    <div class="intro">
      <p class="kicker">Áreas de atuação</p>
      <h1>Três frentes, com problema e jeito de atuar explícitos.</h1>
      <p class="lede">Cada área reúne os serviços daquele assunto e os consultores que respondem por eles. Dá para misturar áreas na mesma proposta.</p>
    </div>
    <div class="area-grid">
      ${GG.areas.map((area) => `<a class="area-card${metaAreaClass(area)}" href="#/areas/${area.slug}">
        <span class="num">${esc(area.number)}</span>
        <h2 class="area-title${metaAreaClass(area)}">${esc(area.name)}</h2>
        <p>${esc(area.summary)}</p>
        <span class="fine">${GG.servicesByArea(area.slug).length} serviços no catálogo</span>
        <span class="text-link area-link">Ver a área</span>
      </a>`).join("")}
    </div>
  </section>`
}

function areaPage(slug) {
  const area = GG.getArea(slug)
  if (!area) return null
  const people = GG.consultantsByArea(area.slug)
  return {
    title: area.name,
    html: `<section class="wrap page">
      ${crumbs([{ label: "Áreas", to: "#/areas" }, { label: area.name }])}
      <div class="intro">
        <p class="kicker">Área ${esc(area.number)}</p>
        <h1 class="area-title${metaAreaClass(area)}">${esc(area.name)}</h1>
        <p class="lede">${esc(area.description)}</p>
      </div>
      <div class="split-2">
        <article class="panel"><h2>Quando esta área entra</h2><ul class="clean">${area.problems.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></article>
        <article class="panel"><h2>Como o trabalho anda</h2><ul class="clean">${area.approach.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></article>
      </div>
      <div class="section-gap">
        <div class="section-head">
          <h2>Serviços desta área</h2>
          <a class="text-link" href="${servicesHref(area.slug)}">Abrir no catálogo</a>
        </div>
        <div class="catalog">${GG.servicesByArea(area.slug).map(serviceRow).join("")}</div>
      </div>
      <div class="section-gap">
        <div class="section-head"><h2>Consultores</h2></div>
        <div class="people">${people.map((consultant) => personCard(consultant)).join("")}</div>
      </div>
    </section>`,
  }
}

function servicesPage(query) {
  const requested = query.area
  const areaId = GG.areas.some((area) => area.slug === requested) ? requested : "todas"
  const text = (query.q || "").trim().toLowerCase()
  const filtered = GG.services.filter((service) => {
    if (areaId !== "todas" && service.area !== areaId) return false
    if (!text) return true
    const haystack = [service.name, service.summary, service.result, GG.getArea(service.area)?.name || ""].join(" ").toLowerCase()
    return haystack.includes(text)
  }).slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
  const listOn = servicesView === "list"
  const catalog = listOn
    ? `<div class="catalog catalog-list">${filtered.map(serviceRow).join("")}</div>`
    : `<div class="catalog catalog-cards">${filtered.map(serviceCard).join("")}</div>`
  return `<section class="wrap page">
    <div class="intro">
      <p class="kicker">Catálogo</p>
      <h1>Serviços com preço, prazo e responsável.</h1>
      <p class="lede">Filtre pela área ou busque pelo assunto. Adicione o que entra neste ciclo e feche a condição de pagamento na proposta.</p>
    </div>
    <div class="toolbar">
      <div class="chips" role="group" aria-label="Filtrar por área">
        <a class="chip${areaId === "todas" ? " on" : ""}" href="${servicesHref("todas", query.q || "")}">Todas</a>
        ${GG.areas.map((area) => `<a class="chip${areaId === area.slug ? " on" : ""}" href="${servicesHref(area.slug, query.q || "")}">${esc(area.name)}</a>`).join("")}
      </div>
      <div class="toolbar-row">
        <label class="field search"><span>Buscar</span>
          <input id="busca" data-bind="search" value="${esc(query.q || "")}" placeholder="Nome, assunto ou entrega" />
        </label>
        <div class="view-toggle" role="group" aria-label="Modo de visualização">
          <button type="button" class="view-btn${listOn ? " on" : ""}" data-action="view" data-view="list" aria-pressed="${listOn}" aria-label="Lista" title="Lista">
            <span class="material-symbols-outlined" aria-hidden="true">list</span>
          </button>
          <button type="button" class="view-btn${!listOn ? " on" : ""}" data-action="view" data-view="cards" aria-pressed="${!listOn}" aria-label="Cards" title="Cards">
            <span class="material-symbols-outlined" aria-hidden="true">window</span>
          </button>
        </div>
      </div>
    </div>
    ${filtered.length ? catalog : `<div class="empty"><h2>Nenhum serviço com esse filtro.</h2><a class="btn btn-ghost" href="#/servicos">Limpar busca</a></div>`}
  </section>`
}

function servicePage(slug) {
  const service = GG.getService(slug)
  if (!service) return null
  const area = GG.getArea(service.area)
  const lead = GG.getConsultant(service.lead)
  const related = GG.servicesByArea(service.area).filter((item) => item.slug !== service.slug).slice(0, 3)
  const action = has(service.slug)
    ? `<a class="btn btn-primary btn-block" href="#/contratar">Ver na proposta</a>`
    : `<button type="button" class="btn btn-primary btn-block" data-action="add" data-slug="${esc(service.slug)}">Adicionar à proposta</button>`
  return {
    title: service.name,
    html: `<section class="wrap page">
      ${crumbs([
        { label: "Serviços", to: "#/servicos" },
        { label: area?.name || "Área", to: area ? `#/areas/${area.slug}` : "#/areas" },
        { label: service.name },
      ])}
      <div class="layout-2">
        <div>
          <div class="intro">
            <p class="kicker">${esc(area?.name || "")}</p>
            <h1>${esc(service.name)}</h1>
            <p class="lede">${esc(service.description)}</p>
          </div>
          <div class="split-2">
            <article class="panel"><h2>O que está incluso</h2><ul class="clean">${service.includes.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></article>
            <article class="panel"><h2>O que fica de fora</h2><ul class="clean">${service.excludes.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></article>
          </div>
          <article class="callout section-gap"><p class="kicker">Você recebe</p><p>${esc(service.result)}</p></article>
          ${lead ? `<article class="section-gap"><h2>Consultor responsável</h2>
            <a class="person inline" href="#/consultores/${lead.slug}">${mark(lead.name, lead.tone)}<span><strong>${esc(lead.name)}</strong><small>${esc(lead.role)}</small></span></a>
          </article>` : ""}
          ${related.length ? `<article class="section-gap"><h2>Na mesma área</h2><ul class="related">${related.map((item) => `<li><a href="#/servicos/${item.slug}">${esc(item.name)}</a>${priceBlock(item)}</li>`).join("")}</ul></article>` : ""}
        </div>
        <aside class="buybox sticky">
          <p class="kicker">${service.billing === "mensal" ? "Mensal" : "Projeto"}</p>
          ${priceBlock(service)}
          <ul class="buy-meta">
            <li><span>Prazo</span><strong>${esc(service.duration)}</strong></li>
            <li><span>Condição</span><strong>${esc(service.commitment)}</strong></li>
            <li><span>Área</span><strong>${esc(area?.name || "")}</strong></li>
          </ul>
          ${action}
          <p class="fine">Preferências de pagamento (combinadas por fora)</p>
          <ul class="mini-pays">${GG.payments.map((payment) => `<li>${esc(payment.name)}</li>`).join("")}</ul>
          <a class="text-link" href="#/pagamentos">Como funciona o pagamento</a>
        </aside>
      </div>
    </section>`,
  }
}

function consultantsPage(query) {
  const areaId = GG.areas.some((area) => area.slug === query.area) ? query.area : "todas"
  const people = GG.consultants
    .filter((consultant) => areaId === "todas" || consultant.areas.includes(areaId))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
  return `<section class="wrap page">
    <div class="intro">
      <p class="kicker">Consultores</p>
      <h1>Quem assina o serviço também aparece na proposta.</h1>
      <p class="lede">Cada contrato de catálogo tem um consultor responsável. O nome não muda no meio do escopo sem uma conversa.</p>
    </div>
    <div class="chips" role="group" aria-label="Filtrar consultores por área">
      <a class="chip${areaId === "todas" ? " on" : ""}" href="#/consultores">Todas</a>
      ${GG.areas.map((area) => `<a class="chip${areaId === area.slug ? " on" : ""}" href="#/consultores?area=${area.slug}">${esc(area.name)}</a>`).join("")}
    </div>
    <div class="people section-gap">${people.map((consultant) => personCard(consultant, true)).join("")}</div>
  </section>`
}

function consultantPage(slug) {
  const consultant = GG.getConsultant(slug)
  if (!consultant) return null
  const led = GG.servicesByConsultant(consultant.slug)
  return {
    title: consultant.name,
    html: `<section class="wrap page">
      ${crumbs([{ label: "Consultores", to: "#/consultores" }, { label: consultant.name }])}
      <header class="profile">
        ${mark(consultant.name, consultant.tone, true)}
        <div>
          <p class="kicker">${esc(consultant.experience)} de prática</p>
          <h1>${esc(consultant.name)}</h1>
          <p class="role">${esc(consultant.role)}</p>
          <div class="tags">
            ${consultant.areas.map((areaSlug) => {
              const area = GG.getArea(areaSlug)
              return area ? `<a class="tag" href="#/areas/${area.slug}">${esc(area.name)}</a>` : ""
            }).join("")}
            ${consultant.skills.map((skill) => `<span class="tag quiet">${esc(skill)}</span>`).join("")}
          </div>
        </div>
      </header>
      <p class="lede profile-bio">${esc(consultant.bio)}</p>
      <div class="section-gap">
        <div class="section-head"><h2>Serviços sob responsabilidade</h2></div>
        ${led.length ? `<div class="catalog">${led.map(serviceRow).join("")}</div>` : `<p>Nenhum serviço de catálogo vinculado.</p>`}
      </div>
    </section>`,
  }
}

function paymentsPage() {
  const rules = GG.paymentRules
  const pix = GG.percent(rules.pixDiscount)
  return `<section class="wrap page">
    <div class="intro">
      <p class="kicker">Pagamentos</p>
      <h1>Não cobramos dentro do site.</h1>
      <p class="lede">Você monta a proposta, indica a preferência de pagamento e envia para o e-mail e o WhatsApp da Nano Tech. Nós validamos o escopo, falamos com você e só então geramos PIX ou link de pagamento por fora.</p>
    </div>
    ${stepGrid(paySteps)}
    <div class="callout section-gap">
      <h2>O que acontece ao finalizar</h2>
      <p>A proposta abre no e-mail <a class="text-link" href="mailto:${esc(GG.company.email)}">${esc(GG.company.email)}</a> e no WhatsApp comercial. Guardamos uma cópia neste navegador para você acompanhar. Nenhuma transação financeira roda nesta plataforma.</p>
    </div>
    <div class="method-grid section-gap">
      ${GG.payments.map((payment) => `<article class="method anchor" id="${payment.id}">
        <p class="kicker">${esc(payment.eyebrow)}</p>
        <h2>${esc(payment.name)}</h2>
        <p>${esc(payment.summary)}</p>
        <ul class="clean">${payment.points.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
      </article>`).join("")}
    </div>
    <div class="section-gap">
      <h2>Preferências que você pode indicar</h2>
      <div class="table-wrap">
        <table class="compare">
          <caption class="sr-only">Preferências de pagamento na proposta</caption>
          <thead><tr><th scope="col">Condição</th><th scope="col">PIX</th><th scope="col">Cartão</th><th scope="col">Boleto</th><th scope="col">Faturamento</th></tr></thead>
          <tbody>
            <tr><th scope="row">Na proposta</th><td>Preferência à vista · ${pix}</td><td>Preferência de parcelas</td><td>Preferência de boleto</td><td>Preferência PJ</td></tr>
            <tr><th scope="row">Parcelas</th><td>1 vez</td><td>Até ${rules.maxInstallments} vezes</td><td>1 vez</td><td>${rules.invoiceDays} dias</td></tr>
            <tr><th scope="row">Acréscimo</th><td>Sem acréscimo</td><td>A partir da ${rules.cardFreeInstallments + 1}ª parcela</td><td>Sem acréscimo</td><td>Sem acréscimo</td></tr>
            <tr><th scope="row">Quem usa</th><td>Pessoa física e jurídica</td><td>Pessoa física e jurídica</td><td>Pessoa física e jurídica</td><td>Pessoa jurídica</td></tr>
            <tr><th scope="row">Mínimo</th><td>Sem mínimo</td><td>Sem mínimo</td><td>Sem mínimo</td><td>${esc(GG.brl(rules.invoiceMin))}</td></tr>
            <tr><th scope="row">Como cobramos</th><td>PIX enviado por fora</td><td>Link enviado por fora</td><td>Boleto enviado por fora</td><td>Nota após análise</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="callout section-gap">
      <h2>O que este site não faz</h2>
      <p>Não processa cartão, não gera PIX automático e não guarda dados sensíveis de pagamento. A preferência e o valor entram na proposta para o time comercial. Depois do alinhamento, o pagamento segue por WhatsApp ou e-mail.</p>
    </div>
    <div class="actions section-gap">
      <a class="btn btn-dark" href="#/servicos">Escolher serviços</a>
      <a class="btn btn-ghost" href="#/contratar">Ir para a proposta</a>
    </div>
  </section>`
}

function summaryInner(preview) {
  const rules = GG.paymentRules
  return `<div class="totals">
      <div><span>Subtotal</span><strong>${esc(GG.brl(preview.subtotal))}</strong></div>
      ${preview.discount > 0 ? `<div class="savings"><span>Desconto PIX</span><strong>− ${esc(GG.brl(preview.discount))}</strong></div>` : ""}
      ${preview.interest > 0 ? `<div><span>Acréscimo do parcelamento</span><strong>${esc(GG.brl(preview.interest))}</strong></div>` : ""}
      <div class="grand"><span>Total</span><strong>${esc(GG.brl(preview.total))}</strong></div>
    </div>
    ${checkout.paymentId === "cartao" ? `<p class="fine">${preview.installments}x de ${esc(GG.brl(preview.installmentValue))}</p>` : ""}
    ${checkout.paymentId === "faturamento" ? `<p class="fine">Vencimento em ${rules.invoiceDays} dias após a nota.</p>` : ""}`
}

function field(id, label, value, extra, error, full = false) {
  return `<label class="field${full ? " full" : ""}" for="${id}"><span>${label}</span>
    <input id="${id}" data-bind="checkout" data-key="${id}" value="${esc(value)}" ${extra} class="${error ? "input-invalid" : ""}" aria-invalid="${error ? "true" : "false"}" />
    ${error ? `<span class="err" role="alert">${esc(error)}</span>` : ""}
  </label>`
}

function checkoutPage() {
  ensurePayment()
  if (!cart.length) {
    return `<section class="wrap page"><div class="empty">
      <p class="kicker">Proposta</p>
      <h1>Sua proposta ainda está vazia.</h1>
      <p class="lede">Escolha um serviço no catálogo para montar o escopo e enviar para a Nano Tech.</p>
      <a class="btn btn-dark" href="#/servicos">Ver serviços</a>
    </div></section>`
  }
  const preview = GG.quote(cart, checkout.paymentId, checkout.installments)
  const canInvoice = invoiceOk(preview.subtotal)
  const errors = checkout.errors
  const form = checkout.form
  return `<section class="wrap page">
    <div class="intro">
      <p class="kicker">Proposta</p>
      <h1>Revise o escopo e envie a proposta.</h1>
      <p class="lede">Ao finalizar, a proposta vai para o e-mail e o WhatsApp da Nano Tech. Indicamos a preferência de pagamento; a cobrança (PIX ou link) é gerada por fora, depois que validarmos o pedido.</p>
    </div>
    <div class="layout-2">
      <div>
        <div class="catalog">
          ${preview.lines.map((line) => `<article class="cart-line">
            <div>
              <p class="meta"><span>${esc(line.area)}</span><span>${esc(GG.billingLabel(line.billing))}</span></p>
              <h3><a href="#/servicos/${line.slug}">${esc(line.name)}</a></h3>
              <p class="fine">Consultor: ${esc(line.leadName)}</p>
              ${line.billing === "mensal" ? `<div class="qty-row"><span>Meses</span><div class="qty">
                <button type="button" data-action="qty" data-slug="${esc(line.slug)}" data-delta="-1" aria-label="Diminuir meses de ${esc(line.name)}">−</button>
                <span>${line.qty}</span>
                <button type="button" data-action="qty" data-slug="${esc(line.slug)}" data-delta="1" aria-label="Aumentar meses de ${esc(line.name)}">+</button>
              </div></div>` : `<p class="fine">Escopo fechado</p>`}
            </div>
            <div class="service-side">
              <p class="price">${esc(GG.brl(line.total))}</p>
              <button type="button" class="btn btn-ghost btn-small" data-action="remove" data-slug="${esc(line.slug)}">Remover</button>
            </div>
          </article>`).join("")}
        </div>
        <form id="proposta" class="form-block" novalidate>
          ${Object.keys(errors).length ? `<div class="callout err-box" role="alert">Revise os campos destacados antes de enviar.</div>` : ""}
          <div class="seg" role="group" aria-label="Tipo de pessoa">
            <button type="button" data-action="person" data-person="pf" aria-pressed="${checkout.person === "pf"}">Pessoa física</button>
            <button type="button" data-action="person" data-person="pj" aria-pressed="${checkout.person === "pj"}">Pessoa jurídica</button>
          </div>
          <div class="form-grid">
            ${field("name", "Nome de quem contrata", form.name, `autocomplete="name"`, errors.name, true)}
            ${field("email", "E-mail", form.email, `type="email" autocomplete="email"`, errors.email)}
            ${field("phone", "Telefone", form.phone, `autocomplete="tel" inputmode="tel"`, errors.phone)}
            ${checkout.person === "pj" ? field("company", "Razão social", form.company, `autocomplete="organization"`, errors.company, true) : ""}
            ${field("document", checkout.person === "pj" ? "CNPJ" : "CPF", form.document, `inputmode="numeric" autocomplete="off"`, errors.document, true)}
            <label class="field full" for="notes"><span>Observações do ciclo</span>
              <textarea id="notes" data-bind="notes" maxlength="600">${esc(checkout.notes)}</textarea>
            </label>
          </div>
          <fieldset class="pay-fieldset">
            <legend>Preferência de pagamento</legend>
            <p class="fine" style="margin-bottom:10px">Isso não cobra nada agora. Só indica como você prefere pagar depois que validarmos a proposta.</p>
            ${GG.payments.map((payment) => {
              const disabled = payment.id === "faturamento" && !canInvoice
              const extra = payment.id === "pix"
                ? ` Referência com desconto: ${esc(GG.brl(GG.quote(cart, "pix").total))}.`
                : payment.id === "faturamento" && !canInvoice
                  ? ` Disponível para PJ a partir de ${esc(GG.brl(GG.paymentRules.invoiceMin))}.`
                  : ""
              return `<label class="choice${checkout.paymentId === payment.id ? " on" : ""}${disabled ? " disabled" : ""}">
                <input type="radio" name="pagamento" value="${payment.id}" ${checkout.paymentId === payment.id ? "checked" : ""} ${disabled ? "disabled" : ""} />
                <span><strong>${esc(payment.name)}</strong><small>${esc(payment.summary)}${extra}</small></span>
              </label>`
            }).join("")}
            ${errors.payment ? `<span class="err" role="alert">${esc(errors.payment)}</span>` : ""}
            ${checkout.paymentId === "cartao" ? `<label class="field" for="installments"><span>Parcelas preferidas no cartão</span>
              <select id="installments" data-bind="installments">${Array.from({ length: GG.paymentRules.maxInstallments }, (_, index) => {
                const count = index + 1
                const option = GG.quote(cart, "cartao", count)
                const suffix = count <= GG.paymentRules.cardFreeInstallments ? " sem acréscimo" : " com acréscimo"
                return `<option value="${count}" ${count === checkout.installments ? "selected" : ""}>${count}x de ${esc(GG.brl(option.installmentValue))}${suffix}</option>`
              }).join("")}</select>
            </label>` : ""}
          </fieldset>
        </form>
      </div>
      <aside class="buybox sticky">
        <p class="kicker">Resumo</p>
        <div data-summary>${summaryInner(preview)}</div>
        <button type="submit" form="proposta" class="btn btn-primary btn-block">Enviar por e-mail e WhatsApp</button>
        <p class="fine">Abre o e-mail e o WhatsApp da empresa com a proposta. Sem cobrança neste site.</p>
      </aside>
    </div>
  </section>`
}

function orderPage(id) {
  const orders = readJson(ORDERS_KEY, [])
  const order = Array.isArray(orders) ? orders.find((item) => item.id === id) : null
  if (!order) return null
  const payment = GG.payments.find((item) => item.id === order.paymentId)
  const links = proposalChannelLinks(order)
  const follow = {
    pix: "Preferência por PIX. Depois da validação, enviamos o PIX por WhatsApp ou e-mail — fora deste site.",
    cartao: "Preferência por cartão. Depois do alinhamento, enviamos o link de pagamento por fora.",
    boleto: "Preferência por boleto. Emitimos e enviamos a linha digitável depois da confirmação do escopo.",
    faturamento: "Preferência por faturamento PJ. Após análise cadastral, seguimos com a nota e o prazo combinados.",
  }
  return {
    title: order.id,
    html: `<section class="wrap page">
      <div class="intro">
        <p class="kicker">Proposta registrada</p>
        <h1>${esc(order.id)}</h1>
        <p class="lede">A proposta foi montada para envio ao e-mail e ao WhatsApp da Nano Tech. Vamos validar o escopo, falar com você e só então gerar PIX ou link de pagamento por fora. Esta cópia fica salva neste navegador.</p>
      </div>
      <div class="layout-2">
        <div>
          <article class="panel"><h2>Serviços</h2><ul class="related">
            ${order.lines.map((line) => `<li><span><strong>${esc(line.name)}</strong><small>${esc(line.area)}${line.billing === "mensal" ? ` · ${line.qty} ${line.qty === 1 ? "mês" : "meses"}` : ""}${line.leadName ? ` · ${esc(line.leadName)}` : ""}</small></span><span>${esc(GG.brl(line.total))}</span></li>`).join("")}
          </ul></article>
          <article class="panel section-gap"><h2>Contratante</h2>
            <p>${esc(order.customer.name)}</p>
            ${order.customer.company ? `<p>${esc(order.customer.company)}</p>` : ""}
            <p>${esc(order.customer.document)}</p>
            <p>${esc(order.customer.email)}</p>
            <p>${esc(order.customer.phone)}</p>
            ${order.notes ? `<p class="fine">Observações: ${esc(order.notes)}</p>` : ""}
          </article>
        </div>
        <aside class="buybox">
          <p class="kicker">${esc(GG.formatDate(order.createdAt))}</p>
          <h2>${esc(payment?.name || "Pagamento")}</h2>
          <div class="totals">
            <div><span>Subtotal</span><strong>${esc(GG.brl(order.totals.subtotal))}</strong></div>
            ${order.totals.discount > 0 ? `<div class="savings"><span>Desconto PIX (${GG.percent(GG.paymentRules.pixDiscount)})</span><strong>− ${esc(GG.brl(order.totals.discount))}</strong></div>` : ""}
            ${order.totals.interest > 0 ? `<div><span>Acréscimo</span><strong>${esc(GG.brl(order.totals.interest))}</strong></div>` : ""}
            <div class="grand"><span>Total</span><strong>${esc(GG.brl(order.totals.total))}</strong></div>
          </div>
          ${order.paymentId === "cartao" ? `<p>Preferência: ${order.installments}x de ${esc(GG.brl(order.totals.installmentValue))}</p>` : ""}
          <p>${esc(follow[order.paymentId] || "")}</p>
          <p class="fine">O trabalho começa depois que alinharmos e o pagamento for confirmado por fora.</p>
          <div class="actions no-print" style="flex-direction:column;align-items:stretch">
            <a class="btn btn-primary btn-block" href="${esc(links.whatsapp)}" target="_blank" rel="noopener">Abrir no WhatsApp</a>
            <a class="btn btn-dark btn-block" href="${esc(links.mailto)}">Abrir no e-mail</a>
            <button type="button" class="btn btn-ghost" data-action="print">Imprimir</button>
            <a class="btn btn-ghost" href="#/servicos">Nova proposta</a>
          </div>
        </aside>
      </div>
    </section>`,
  }
}

function contactPage() {
  const form = contact.form
  const errors = contact.errors
  const sentArea = contact.sent?.area ? GG.getArea(contact.sent.area)?.name : ""
  return `<section class="wrap page"><div class="layout-2">
    <div>
      <div class="intro">
        <p class="kicker">Contato</p>
        <h1>Se o catálogo não cobre o recorte, escreva.</h1>
        <p class="lede">Use o formulário para um assunto que mistura áreas ou ainda não tem serviço fechado. Para o que já está no catálogo, a proposta é o caminho mais curto.</p>
      </div>
      ${contact.sent ? `<article class="callout" role="status">
        <p class="kicker">Mensagem registrada</p>
        <h2>Retornamos em até 1 dia útil.</h2>
        <p>${esc(contact.sent.name)}, recebemos o pedido sobre ${esc(sentArea || "um recorte ainda sem área")}.</p>
        <p class="fine">O retorno sai para ${esc(contact.sent.email)}. A mensagem fica neste navegador até você sair da página.</p>
        <button type="button" class="btn btn-ghost" data-action="contact-reset">Enviar outra</button>
      </article>` : `<form id="contato" class="form-block" novalidate>
        <div class="form-grid">
          <label class="field" for="name"><span>Nome</span><input id="name" data-bind="contact" data-key="name" autocomplete="name" value="${esc(form.name)}" class="${errors.name ? "input-invalid" : ""}" aria-invalid="${errors.name ? "true" : "false"}" />${errors.name ? `<span class="err" role="alert">${esc(errors.name)}</span>` : ""}</label>
          <label class="field" for="email"><span>E-mail</span><input id="email" type="email" data-bind="contact" data-key="email" autocomplete="email" value="${esc(form.email)}" class="${errors.email ? "input-invalid" : ""}" aria-invalid="${errors.email ? "true" : "false"}" />${errors.email ? `<span class="err" role="alert">${esc(errors.email)}</span>` : ""}</label>
          <label class="field" for="phone"><span>Telefone</span><input id="phone" data-bind="contact" data-key="phone" autocomplete="tel" inputmode="tel" value="${esc(form.phone)}" class="${errors.phone ? "input-invalid" : ""}" aria-invalid="${errors.phone ? "true" : "false"}" />${errors.phone ? `<span class="err" role="alert">${esc(errors.phone)}</span>` : ""}</label>
          <label class="field" for="company"><span>Empresa</span><input id="company" data-bind="contact" data-key="company" autocomplete="organization" value="${esc(form.company)}" /></label>
          <label class="field full" for="area"><span>Área mais próxima</span>
            <select id="area" data-bind="contact" data-key="area">
              <option value="" ${form.area ? "" : "selected"}>Ainda não sei</option>
              ${GG.areas.map((area) => `<option value="${area.slug}" ${form.area === area.slug ? "selected" : ""}>${esc(area.name)}</option>`).join("")}
            </select>
          </label>
          <label class="field full" for="message"><span>O que você precisa</span>
            <textarea id="message" data-bind="contact" data-key="message" class="${errors.message ? "input-invalid" : ""}" aria-invalid="${errors.message ? "true" : "false"}">${esc(form.message)}</textarea>
            ${errors.message ? `<span class="err" role="alert">${esc(errors.message)}</span>` : ""}
          </label>
        </div>
        <button type="submit" class="btn btn-dark">Enviar mensagem</button>
        <p class="fine">Usamos estes dados só para responder este contato.</p>
      </form>`}
    </div>
    <aside class="panel">
      <p class="kicker">Comercial</p>
      <h2>Fale no horário de atendimento</h2>
      <p>${esc(GG.company.coverage)}</p>
      <p>${esc(GG.company.hours)}</p>
      <p><a class="text-link" href="mailto:${esc(GG.company.email)}">${esc(GG.company.email)}</a></p>
      <p class="fine">Serviço de catálogo segue pela proposta, enviada por e-mail e WhatsApp. O pagamento é combinado por fora.</p>
    </aside>
  </div></section>`
}

function missingPage() {
  return `<section class="wrap page">
    <div class="intro">
      <p class="kicker">Fora do catálogo</p>
      <h1>Não encontramos esta página.</h1>
      <p class="lede">O endereço pode ter mudado. O catálogo de serviços continua disponível.</p>
    </div>
    <a class="btn btn-dark" href="#/servicos">Ver serviços</a>
  </section>`
}

function screen(route) {
  const [section, slug] = route.parts
  if (!section) return { title: "Nano Tech — Prestação de serviços", content: home() }
  if (section === "areas" && !slug) return { title: "Áreas de atuação · Nano Tech", content: areasPage() }
  if (section === "areas") {
    const page = areaPage(slug)
    return page ? { title: `${page.title} · Nano Tech`, content: page.html } : { title: "Página não encontrada · Nano Tech", content: missingPage() }
  }
  if (section === "servicos" && !slug) return { title: "Serviços · Nano Tech", content: servicesPage(route.query) }
  if (section === "servicos") {
    const page = servicePage(slug)
    return page ? { title: `${page.title} · Nano Tech`, content: page.html } : { title: "Página não encontrada · Nano Tech", content: missingPage() }
  }
  if (section === "consultores" && !slug) return { title: "Consultores · Nano Tech", content: consultantsPage(route.query) }
  if (section === "consultores") {
    const page = consultantPage(slug)
    return page ? { title: `${page.title} · Nano Tech`, content: page.html } : { title: "Página não encontrada · Nano Tech", content: missingPage() }
  }
  if (section === "pagamentos") return { title: "Pagamentos · Nano Tech", content: paymentsPage() }
  if (section === "contratar") return { title: "Proposta · Nano Tech", content: checkoutPage() }
  if (section === "proposta") {
    const page = orderPage(slug)
    return page ? { title: `${page.title} · Nano Tech`, content: page.html } : { title: "Página não encontrada · Nano Tech", content: missingPage() }
  }
  if (section === "contato") return { title: "Contato · Nano Tech", content: contactPage() }
  return { title: "Página não encontrada · Nano Tech", content: missingPage() }
}

function captureFocus() {
  const el = document.activeElement
  if (!el || !app.contains(el)) return null
  if (!("value" in el)) return null
  return { id: el.id, start: el.selectionStart, end: el.selectionEnd }
}

function restoreFocus(focus) {
  if (!focus?.id) return
  const el = document.getElementById(focus.id)
  if (!el) return
  el.focus()
  if (typeof focus.start === "number" && el.setSelectionRange) {
    try { el.setSelectionRange(focus.start, focus.end) } catch { /* inputs like email can reject a range */ }
  }
}

function render() {
  const route = parseRoute()
  const pathChanged = lastPath !== null && route.path !== lastPath
  if (lastPath !== route.path) menuOpen = false
  const focus = captureFocus()
  lastPath = route.path
  const view = screen(route)
  document.title = view.title
  app.innerHTML = shell(view.content)
  restoreFocus(focus)
  if (pathChanged) window.scrollTo(0, 0)
  if (route.path === "/pagamentos" && route.query.metodo) {
    document.getElementById(route.query.metodo)?.scrollIntoView({ block: "start" })
  }
}

function refreshSummary() {
  const box = document.querySelector("[data-summary]")
  if (!box) return
  box.innerHTML = summaryInner(GG.quote(cart, checkout.paymentId, checkout.installments))
}

function onClick(event) {
  const target = event.target.closest("[data-action]")
  if (!target) return
  const action = target.dataset.action
  if (action === "skip") {
    event.preventDefault()
    document.getElementById("conteudo")?.focus()
    return
  }
  if (action === "menu") {
    menuOpen = !menuOpen
    render()
    return
  }
  if (action === "view") {
    servicesView = target.dataset.view === "cards" ? "cards" : "list"
    localStorage.setItem(VIEW_KEY, servicesView)
    render()
    return
  }
  if (action === "add") {
    add(target.dataset.slug)
    return
  }
  if (action === "remove") {
    remove(target.dataset.slug)
    return
  }
  if (action === "qty") {
    setQty(target.dataset.slug, Number(target.dataset.delta))
    return
  }
  if (action === "person") {
    checkout.person = target.dataset.person
    checkout.form.document = GG.maskDocument(checkout.form.document, checkout.person)
    if (checkout.person === "pf") checkout.form.company = ""
    ensurePayment()
    render()
    return
  }
  if (action === "print") window.print()
  if (action === "contact-reset") {
    contact.sent = null
    render()
  }
}

function onInput(event) {
  const el = event.target
  if (el.dataset.bind === "checkout") {
    const key = el.dataset.key
    let value = el.value
    if (key === "phone") value = GG.maskPhone(value)
    if (key === "document") value = GG.maskDocument(value, checkout.person)
    checkout.form[key] = value
    if (el.value !== value) {
      const pos = value.length
      el.value = value
      el.setSelectionRange?.(pos, pos)
    }
    return
  }
  if (el.dataset.bind === "notes") {
    checkout.notes = el.value
    return
  }
  if (el.dataset.bind === "contact") {
    const key = el.dataset.key
    contact.form[key] = key === "phone" ? GG.maskPhone(el.value) : el.value
    if (key === "phone" && el.value !== contact.form.phone) el.value = contact.form.phone
    return
  }
  if (el.dataset.bind === "search") {
    const route = parseRoute()
    const next = servicesHref(route.query.area || "todas", el.value)
    history.replaceState(null, "", next)
    render()
  }
  if (el.dataset.bind === "installments") {
    checkout.installments = Number(el.value)
    refreshSummary()
  }
}

function onChange(event) {
  const el = event.target
  if (el.name === "pagamento") {
    checkout.paymentId = el.value
    checkout.errors = { ...checkout.errors, payment: "" }
    render()
    return
  }
  if (el.dataset.bind === "installments") {
    checkout.installments = Number(el.value)
    refreshSummary()
  }
}

function proposalMessage(order) {
  const payment = GG.payments.find((item) => item.id === order.paymentId)
  const lines = order.lines
    .map((line) => {
      const qty = line.billing === "mensal" ? ` · ${line.qty} ${line.qty === 1 ? "mês" : "meses"}` : ""
      return `- ${line.name}${qty} (${line.area}) · ${GG.brl(line.total)}${line.leadName ? ` · ${line.leadName}` : ""}`
    })
    .join("\n")
  const person = order.customer.person === "pj" ? "Pessoa jurídica" : "Pessoa física"
  const parcels =
    order.paymentId === "cartao" ? `\nParcelas preferidas: ${order.installments}x de ${GG.brl(order.totals.installmentValue)}` : ""
  return [
    `Nova proposta ${order.id}`,
    `Data: ${GG.formatDate(order.createdAt)}`,
    "",
    "Contratante",
    `${person}: ${order.customer.name}`,
    order.customer.company ? `Empresa: ${order.customer.company}` : null,
    `Documento: ${order.customer.document}`,
    `E-mail: ${order.customer.email}`,
    `Telefone: ${order.customer.phone}`,
    "",
    "Serviços",
    lines,
    "",
    `Subtotal: ${GG.brl(order.totals.subtotal)}`,
    order.totals.discount > 0 ? `Desconto PIX: − ${GG.brl(order.totals.discount)}` : null,
    order.totals.interest > 0 ? `Acréscimo: ${GG.brl(order.totals.interest)}` : null,
    `Total de referência: ${GG.brl(order.totals.total)}`,
    `Preferência de pagamento: ${payment?.name || order.paymentId}${parcels}`,
    order.notes ? `\nObservações:\n${order.notes}` : null,
    "",
    "Obs.: proposta gerada no site. Pagamento (PIX/link) será combinado por fora após validação.",
  ]
    .filter((line) => line !== null)
    .join("\n")
}

function proposalChannelLinks(order) {
  const body = proposalMessage(order)
  const subject = `Proposta ${order.id} — ${GG.company.name}`
  return {
    mailto: `mailto:${GG.company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    whatsapp: `https://wa.me/${String(GG.company.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(body)}`,
  }
}

function openProposalChannels(order) {
  const links = proposalChannelLinks(order)
  window.open(links.whatsapp, "_blank", "noopener,noreferrer")
  window.setTimeout(() => {
    window.location.href = links.mailto
  }, 350)
}

function submitOrder(event) {
  event.preventDefault()
  ensurePayment()
  const next = {}
  const form = checkout.form
  if (form.name.trim().length < 3) next.name = "Informe o nome de quem contrata."
  if (!GG.isEmail(form.email)) next.email = "Informe um e-mail válido."
  if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone com DDD."
  if (checkout.person === "pj" && form.company.trim().length < 2) next.company = "Informe a razão social."
  if (checkout.person === "pj" && !GG.isCnpj(form.document)) next.document = "Informe um CNPJ válido."
  if (checkout.person === "pf" && !GG.isCpf(form.document)) next.document = "Informe um CPF válido."
  const preview = GG.quote(cart, checkout.paymentId, checkout.installments)
  if (!GG.payments.some((payment) => payment.id === checkout.paymentId)) next.payment = "Escolha uma preferência de pagamento."
  if (checkout.paymentId === "faturamento" && !invoiceOk(preview.subtotal)) {
    next.payment = `Faturamento pede pessoa jurídica e total a partir de ${GG.brl(GG.paymentRules.invoiceMin)}.`
  }
  checkout.errors = next
  if (Object.keys(next).length) {
    render()
    document.getElementById(Object.keys(next)[0])?.focus()
    return
  }
  const totals = GG.quote(cart, checkout.paymentId, checkout.installments)
  const order = {
    id: `NT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    customer: {
      person: checkout.person,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: checkout.person === "pj" ? form.company.trim() : "",
      document: form.document.trim(),
    },
    paymentId: checkout.paymentId,
    installments: totals.installments,
    notes: checkout.notes.trim(),
    lines: totals.lines,
    totals,
  }
  const previous = readJson(ORDERS_KEY, [])
  localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...(Array.isArray(previous) ? previous : [])]))
  cart = []
  saveCart()
  checkout.notes = ""
  checkout.errors = {}
  openProposalChannels(order)
  location.hash = `#/proposta/${order.id}`
}

function submitContact(event) {
  event.preventDefault()
  const form = contact.form
  const next = {}
  if (form.name.trim().length < 3) next.name = "Informe seu nome."
  if (!GG.isEmail(form.email)) next.email = "Informe um e-mail válido."
  if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone com DDD."
  if (form.message.trim().length < 12) next.message = "Conte em poucas linhas o que precisa."
  contact.errors = next
  if (Object.keys(next).length) {
    render()
    document.getElementById(Object.keys(next)[0])?.focus()
    return
  }
  contact.sent = {
    name: form.name.trim(),
    email: form.email.trim(),
    area: form.area,
    message: form.message.trim(),
  }
  contact.form = { name: "", email: "", phone: "", company: "", area: "", message: "" }
  contact.errors = {}
  render()
}

function onSubmit(event) {
  if (event.target.id === "proposta") submitOrder(event)
  if (event.target.id === "contato") submitContact(event)
}

document.addEventListener("click", onClick)
document.addEventListener("input", onInput)
document.addEventListener("change", onChange)
document.addEventListener("submit", onSubmit)
window.addEventListener("hashchange", render)
if (!location.hash) location.hash = "#/"
render()
