/**
 * Nettside – månedlig AI-synlighet (GEO-måling)
 * Kjører kundens kjernespørsmål mot en AI-motor med websøk, sjekker om domenet siteres
 * eller nevnes, og sender rapport + liste over spørsmål uten sitering (= innholdsoppgaver).
 *
 * Bytt per kunde: domain, brand, notifyEmail, questions (20–50 spørsmål), credentials.
 * Utvidelse: legg til Perplexity (HTTP, sonar-modell) og Gemini som parallelle grener og slå sammen.
 * Importert i n8n Cloud 2026-11-10 som «AD.Moment – nettside: månedlig AI-synlighet».
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

const config = node({
  type: "n8n-nodes-base.set",
  version: 3.4,
  config: {
    name: "Kjernespørsmål og domene",
    parameters: {
      mode: "manual",
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: "c1", name: "domain", value: "kunde.no", type: "string" },
          { id: "c2", name: "brand", value: "Kundenavn", type: "string" },
          { id: "c3", name: "notifyEmail", value: "post@kunde.no", type: "string" },
          {
            id: "c4",
            name: "questions",
            value: '["Spørsmål 1","Spørsmål 2"]',
            type: "array",
          },
        ],
      },
    },
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
const cited = urls.some(u => u.toLowerCase().includes(domain));
const mentioned = text.toLowerCase().includes(brand) || text.toLowerCase().includes(domain);
return { json: { question: cfg.question, mentioned, cited, citedUrls: urls.filter(u => u.toLowerCase().includes(domain)), allSources: urls.slice(0, 8), answerPreview: text.slice(0, 300), domain, brand, notifyEmail: cfg.notifyEmail, engine: 'openai' } };`,
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
return [{ json: { month, total, cited, mentioned, rate: cited / Math.max(total, 1), text, notifyEmail: rows[0]?.notifyEmail, brand: rows[0]?.brand, rows } }];`,
    },
  },
});

const email = node({
  type: "n8n-nodes-base.emailSend",
  version: 2.1,
  config: {
    name: "Send rapport",
    parameters: {
      fromEmail: "noreply@kunde.no",
      toEmail: expr("{{ $json.notifyEmail }}"),
      subject: expr(
        "AI-synlighet {{ $json.month }}: {{ $json.cited }}/{{ $json.total }} spørsmål sitert – {{ $json.brand }}",
      ),
      emailFormat: "text",
      text: expr("{{ $json.text }}"),
      options: {},
    },
    // credentials: { smtp: { id: '<smtp-credential-id>', name: 'SMTP' } },
  },
});

export default workflow("nettside-ai-synlighet", "Nettside – månedlig AI-synlighet")
  .add(monthly)
  .to(config)
  .to(split)
  .to(ask)
  .to(evaluate)
  .to(aggregate)
  .to(email);
