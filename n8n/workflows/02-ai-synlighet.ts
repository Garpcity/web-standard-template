/**
 * Nettside – månedlig AI-synlighet (GEO-måling)
 * Loopen går gjennom Studio:
 *   1. GET  {studio}/api/sites/{slug}/visibility → kjernespørsmål, domene, merke, e-post
 *   2. hvert spørsmål mot en AI-motor med websøk; sitert/nevnt vurderes
 *   3. POST {studio}/api/sites/{slug}/visibility → Studio skriver ai_cited_rate og lager
 *      én content-oppgave per spørsmål uten sitering
 *   4. rapport på e-post
 *
 * Per kunde: bare studioUrl + siteSlug i «Studio»-noden. Spørsmål vedlikeholdes i Studio.
 * Credentials: httpHeaderAuth med header x-studio-key (Studio), openAiApi, smtp.
 * Utvidelse: Perplexity (sonar) og Gemini som parallelle grener; send engine-feltet til Studio.
 * Importert i n8n Cloud 2026-11-10 som «AD.Moment – nettside: månedlig AI-synlighet (via Studio)» (1sdcYcKDHJ2XE1Xt).
 */
import { workflow, node, trigger, expr } from "@n8n/workflow-sdk";

const monthly = trigger({
  type: "n8n-nodes-base.scheduleTrigger",
  version: 1.3,
  config: {
    name: "Månedlig",
    parameters: {
      rule: { interval: [{ field: "cronExpression", expression: "0 7 1 * *" }] },
    },
  },
});

const studio = node({
  type: "n8n-nodes-base.set",
  version: 3.4,
  config: {
    name: "Studio",
    parameters: {
      mode: "manual",
      includeOtherFields: false,
      assignments: {
        assignments: [
          {
            id: "s1",
            name: "studioUrl",
            value: "https://studio.admoment.no",
            type: "string",
          },
          { id: "s2", name: "siteSlug", value: "admoment", type: "string" },
        ],
      },
    },
  },
});

const fetchConfig = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.4,
  config: {
    name: "Hent kjernespørsmål fra Studio",
    parameters: {
      method: "GET",
      url: expr("={{ $json.studioUrl }}/api/sites/{{ $json.siteSlug }}/visibility"),
      authentication: "genericCredentialType",
      genericAuthType: "httpTemplatedCustomAuth", // credential: header x-studio-key = STUDIO_API_KEY
      options: { timeout: 15000 },
    },
    // credentials: { httpHeaderAuth: { id: '<studio-key-credential-id>', name: 'Studio x-studio-key' } },
  },
});

const split = node({
  type: "n8n-nodes-base.splitOut",
  version: 1,
  config: {
    name: "Ett spørsmål per rad",
    parameters: {
      fieldToSplitOut: "questions",
      include: "allOtherFields",
      options: { destinationFieldName: "question" },
    },
  },
});

const ask = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.4,
  config: {
    name: "Spør OpenAI (med websøk)",
    parameters: {
      method: "POST",
      url: "https://api.openai.com/v1/responses",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "openAiApi",
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr(
        '={{ JSON.stringify({ model: "gpt-4.1", tools: [{ type: "web_search_preview", user_location: { type: "approximate", country: "NO" } }], input: $json.question }) }}',
      ),
      options: { timeout: 60000 },
    },
    // credentials: { openAiApi: { id: '<openai-credential-id>', name: 'OpenAI' } },
  },
});

const evaluate = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "Vurder sitering",
    parameters: {
      mode: "runOnceForEachItem",
      jsCode: `const cfg = $('Ett spørsmål per rad').item.json;
const res = $input.item.json;
const texts = []; const urls = [];
for (const out of res.output || []) for (const c of out.content || []) { if (c.text) texts.push(c.text); for (const a of c.annotations || []) if (a.url) urls.push(a.url); }
const text = texts.join('\\n');
const domain = (cfg.domain || '').toLowerCase(); const brand = (cfg.brand || '').toLowerCase();
const cited = domain !== '' && urls.some(u => u.toLowerCase().includes(domain));
const mentioned = (brand !== '' && text.toLowerCase().includes(brand)) || (domain !== '' && text.toLowerCase().includes(domain));
return { json: { question: cfg.question, mentioned, cited, citedUrls: urls.filter(u => domain && u.toLowerCase().includes(domain)), allSources: urls.slice(0, 8), answerPreview: text.slice(0, 300), domain, brand, notifyEmail: cfg.notifyEmail, engine: 'openai' } };`,
    },
  },
});

const aggregate = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "Bygg rapport",
    parameters: {
      mode: "runOnceForAllItems",
      jsCode: `const rows = $input.all().map(i => i.json);
const total = rows.length; const cited = rows.filter(r => r.cited).length; const mentioned = rows.filter(r => r.mentioned).length;
const month = new Date().toISOString().slice(0, 7);
const lines = rows.map(r => \`\${r.cited ? '✅' : r.mentioned ? '🟡' : '❌'} \${r.question}\${r.cited ? ' → ' + r.citedUrls.join(', ') : ''}\`);
const missing = rows.filter(r => !r.cited).map(r => '- ' + r.question);
const text = [\`AI-synlighet \${month} for \${rows[0]?.brand}\`, \`Sitert: \${cited}/\${total} (\${Math.round(100*cited/Math.max(total,1))} %) · Nevnt: \${mentioned}/\${total}\`, '', ...lines, '', 'Neste måneds innholdsoppgaver (spørsmål uten sitering):', ...missing].join('\\n');
const studio = $('Studio').first().json;
return [{ json: { month, total, cited, mentioned, rate: cited / Math.max(total, 1), text, notifyEmail: rows[0]?.notifyEmail || studio.notifyEmail, brand: rows[0]?.brand, studioUrl: studio.studioUrl, siteSlug: studio.siteSlug, report: { period: month, engine: rows[0]?.engine || 'openai', rows: rows.map(r => ({ question: r.question, cited: r.cited, mentioned: r.mentioned, citedUrls: r.citedUrls, allSources: r.allSources })) } } }];`,
    },
  },
});

const deliver = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.4,
  config: {
    name: "Lever til Studio (metrikker + innholdsoppgaver)",
    parameters: {
      method: "POST",
      url: expr("={{ $json.studioUrl }}/api/sites/{{ $json.siteSlug }}/visibility"),
      authentication: "genericCredentialType",
      genericAuthType: "httpTemplatedCustomAuth", // credential: header x-studio-key = STUDIO_API_KEY
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr("={{ JSON.stringify($json.report) }}"),
      options: { timeout: 30000 },
    },
    // credentials: { httpHeaderAuth: { id: '<studio-key-credential-id>', name: 'Studio x-studio-key' } },
  },
});

const email = node({
  type: "n8n-nodes-base.emailSend",
  version: 2.1,
  config: {
    name: "Send rapport",
    parameters: {
      fromEmail: "noreply@kunde.no",
      toEmail: expr("{{ $('Bygg rapport').first().json.notifyEmail }}"),
      subject: expr(
        "AI-synlighet {{ $('Bygg rapport').first().json.month }}: {{ $('Bygg rapport').first().json.cited }}/{{ $('Bygg rapport').first().json.total }} spørsmål sitert – {{ $('Bygg rapport').first().json.brand }}",
      ),
      emailFormat: "text",
      text: expr(
        "{{ $('Bygg rapport').first().json.text }}\n\nStudio opprettet {{ $json.tasksCreated }} nye innholdsoppgaver.",
      ),
      options: {},
    },
    // credentials: { smtp: { id: '<smtp-credential-id>', name: 'SMTP' } },
  },
});

export default workflow("nettside-ai-synlighet", "Nettside – månedlig AI-synlighet")
  .add(monthly)
  .to(studio)
  .to(fetchConfig)
  .to(split)
  .to(ask)
  .to(evaluate)
  .to(aggregate)
  .to(deliver)
  .to(email);
