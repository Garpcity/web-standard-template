/**
 * Nettside – ukentlig SEO-rapport
 * Henter klikk/visninger/posisjoner fra Google Search Console og Core Web Vitals fra CrUX,
 * sammenligner med forrige uke og sender rapport. Fall > 20 % gir egen varsellinje.
 *
 * Krever: Google OAuth2-credential med scope https://www.googleapis.com/auth/webmasters.readonly
 * (googleOAuth2Api, "Search Console"), og en CrUX API-nøkkel (httpQueryAuth med key=<API-nøkkel>).
 * Ikke importert automatisk – disse credentials må lages i n8n først.
 */
import { workflow, node, trigger, expr } from "@n8n/workflow-sdk";

const weekly = trigger({
  type: "n8n-nodes-base.scheduleTrigger",
  version: 1.3,
  config: {
    name: "Ukentlig mandag 07:00",
    parameters: {
      rule: { interval: [{ field: "cronExpression", expression: "0 7 * * 1" }] },
    },
  },
});

const config = node({
  type: "n8n-nodes-base.set",
  version: 3.4,
  config: {
    name: "Innstillinger",
    parameters: {
      mode: "manual",
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: "s1", name: "siteUrl", value: "https://kunde.no/", type: "string" },
          { id: "s2", name: "notifyEmail", value: "post@kunde.no", type: "string" },
          {
            id: "s3",
            name: "thisStart",
            value: expr("{{ $now.minus({ days: 10 }).toISODate() }}"),
            type: "string",
          },
          {
            id: "s4",
            name: "thisEnd",
            value: expr("{{ $now.minus({ days: 3 }).toISODate() }}"),
            type: "string",
          },
          {
            id: "s5",
            name: "prevStart",
            value: expr("{{ $now.minus({ days: 17 }).toISODate() }}"),
            type: "string",
          },
          {
            id: "s6",
            name: "prevEnd",
            value: expr("{{ $now.minus({ days: 10 }).toISODate() }}"),
            type: "string",
          },
        ],
      },
    },
  },
});

const gscThis = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.4,
  config: {
    name: "Search Console denne uken",
    parameters: {
      method: "POST",
      url: expr(
        "=https://www.googleapis.com/webmasters/v3/sites/{{ encodeURIComponent($json.siteUrl) }}/searchAnalytics/query",
      ),
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleOAuth2Api",
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr(
        '={{ JSON.stringify({ startDate: $json.thisStart, endDate: $json.thisEnd, dimensions: ["query"], rowLimit: 25 }) }}',
      ),
      options: {},
    },
  },
});

const gscPrev = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.4,
  config: {
    name: "Search Console forrige uke",
    parameters: {
      method: "POST",
      url: expr(
        '=https://www.googleapis.com/webmasters/v3/sites/{{ encodeURIComponent($("Innstillinger").item.json.siteUrl) }}/searchAnalytics/query',
      ),
      authentication: "predefinedCredentialType",
      nodeCredentialType: "googleOAuth2Api",
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr(
        '={{ JSON.stringify({ startDate: $("Innstillinger").item.json.prevStart, endDate: $("Innstillinger").item.json.prevEnd, dimensions: ["query"], rowLimit: 25 }) }}',
      ),
      options: {},
    },
  },
});

const crux = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.4,
  config: {
    name: "CrUX (Core Web Vitals i felt)",
    parameters: {
      method: "POST",
      url: "https://chromeuxreport.googleapis.com/v1/records:queryRecord",
      authentication: "genericCredentialType",
      genericAuthType: "httpQueryAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr(
        '={{ JSON.stringify({ origin: $("Innstillinger").item.json.siteUrl.replace(/\\/$/, ""), formFactor: "PHONE", metrics: ["largest_contentful_paint", "interaction_to_next_paint", "cumulative_layout_shift"] }) }}',
      ),
      options: {},
    },
  },
});

const report = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "Bygg rapport",
    parameters: {
      mode: "runOnceForAllItems",
      jsCode: `const cfg = $('Innstillinger').first().json;
const sum = (rows) => rows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
const t = $('Search Console denne uken').first().json.rows || [];
const p = $('Search Console forrige uke').first().json.rows || [];
const cur = sum(t), prev = sum(p);
const pct = (a, b) => b ? Math.round(100 * (a - b) / b) : 0;
const crux = $('CrUX (Core Web Vitals i felt)').first().json.record?.metrics || {};
const p75 = (m) => crux[m]?.percentiles?.p75;
const good = { lcp: p75('largest_contentful_paint') <= 2500, inp: p75('interaction_to_next_paint') <= 200, cls: Number(p75('cumulative_layout_shift')) <= 0.1 };
const warn = [];
if (pct(cur.clicks, prev.clicks) <= -20) warn.push('⚠️ Klikk ned ' + pct(cur.clicks, prev.clicks) + ' %');
if (!good.lcp || !good.inp || !good.cls) warn.push('⚠️ Core Web Vitals under terskel');
const top = t.slice(0, 10).map(r => '- ' + r.keys[0] + ': ' + r.clicks + ' klikk, pos ' + r.position.toFixed(1));
const text = ['SEO-rapport ' + cfg.thisStart + ' – ' + cfg.thisEnd + ' for ' + cfg.siteUrl, '',
  'Klikk: ' + cur.clicks + ' (' + pct(cur.clicks, prev.clicks) + ' %) · Visninger: ' + cur.impressions + ' (' + pct(cur.impressions, prev.impressions) + ' %)',
  'CWV mobil p75: LCP ' + p75('largest_contentful_paint') + ' ms, INP ' + p75('interaction_to_next_paint') + ' ms, CLS ' + p75('cumulative_layout_shift'),
  ...warn, '', 'Topp søk:', ...top].join('\\n');
return [{ json: { text, notifyEmail: cfg.notifyEmail, warnings: warn.length } }];`,
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
        'Ukentlig SEO-rapport{{ $json.warnings ? " – " + $json.warnings + " varsel" : "" }}',
      ),
      emailFormat: "text",
      text: expr("{{ $json.text }}"),
      options: {},
    },
  },
});

export default workflow("nettside-seo-ukentlig", "Nettside – ukentlig SEO-rapport")
  .add(weekly)
  .to(config)
  .to(gscThis)
  .to(gscPrev)
  .to(crux)
  .to(report)
  .to(email);
