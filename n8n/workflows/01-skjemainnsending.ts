/**
 * Nettside – skjemainnsending
 * Tar imot POST fra nettsidens /api/forms (FORMS_WEBHOOK_URL), varsler på e-post og svarer 200.
 * Hemmelig header: X-Webhook-Secret må matche verdien i "Innstillinger"-noden (= FORMS_WEBHOOK_SECRET).
 *
 * Importeres med n8n Workflow SDK (MCP: create_workflow_from_code) eller bygges manuelt etter denne.
 * Bytt: notifyEmail, webhookSecret, siteName, fromEmail og SMTP-credential per kunde.
 */
import { workflow, node, trigger, expr } from "@n8n/workflow-sdk";

const webhook = trigger({
  type: "n8n-nodes-base.webhook",
  version: 2.1,
  config: {
    name: "Skjema inn",
    parameters: {
      httpMethod: "POST",
      path: "nettside-skjema",
      responseMode: "responseNode",
      options: {},
    },
  },
});

const settings = node({
  type: "n8n-nodes-base.set",
  version: 3.4,
  config: {
    name: "Innstillinger",
    parameters: {
      mode: "manual",
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: "notify", name: "notifyEmail", value: "post@kunde.no", type: "string" },
          { id: "secret", name: "webhookSecret", value: "bytt-meg", type: "string" },
          { id: "site", name: "siteName", value: "Kundenavn", type: "string" },
        ],
      },
    },
  },
});

const authorized = node({
  type: "n8n-nodes-base.if",
  version: 2.2,
  config: {
    name: "Riktig hemmelighet?",
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
        conditions: [
          {
            leftValue: expr('{{ $json.headers["x-webhook-secret"] }}'),
            operator: { type: "string", operation: "equals" },
            rightValue: expr("{{ $json.webhookSecret }}"),
          },
        ],
        combinator: "and",
      },
    },
  },
});

const normalize = node({
  type: "n8n-nodes-base.set",
  version: 3.4,
  config: {
    name: "Normaliser",
    parameters: {
      mode: "manual",
      includeOtherFields: false,
      assignments: {
        assignments: [
          {
            id: "f1",
            name: "formId",
            value: expr("{{ $json.body.formId }}"),
            type: "string",
          },
          {
            id: "f2",
            name: "submittedAt",
            value: expr("{{ $json.body.submittedAt }}"),
            type: "string",
          },
          {
            id: "f3",
            name: "pageUrl",
            value: expr("{{ $json.body.pageUrl }}"),
            type: "string",
          },
          {
            id: "f4",
            name: "fields",
            value: expr("{{ $json.body.fields }}"),
            type: "object",
          },
          {
            id: "f5",
            name: "notifyEmail",
            value: expr("{{ $json.notifyEmail }}"),
            type: "string",
          },
          {
            id: "f6",
            name: "siteName",
            value: expr("{{ $json.siteName }}"),
            type: "string",
          },
          {
            id: "f7",
            name: "fieldsText",
            value: expr(
              '{{ Object.entries($json.body.fields || {}).map(([k, v]) => k + ": " + v).join("\\n") }}',
            ),
            type: "string",
          },
        ],
      },
    },
  },
});

const email = node({
  type: "n8n-nodes-base.emailSend",
  version: 2.1,
  config: {
    name: "Varsle på e-post",
    parameters: {
      fromEmail: "noreply@kunde.no",
      toEmail: expr("{{ $json.notifyEmail }}"),
      subject: expr("{{ $json.siteName }}: ny skjemainnsending ({{ $json.formId }})"),
      emailFormat: "text",
      text: expr(
        "Ny innsending fra {{ $json.pageUrl }}\n{{ $json.submittedAt }}\n\n{{ $json.fieldsText }}",
      ),
      options: {},
    },
    // credentials: { smtp: { id: '<smtp-credential-id>', name: 'SMTP' } },
  },
});

const ok = node({
  type: "n8n-nodes-base.respondToWebhook",
  version: 1.4,
  config: {
    name: "Svar 200",
    parameters: { respondWith: "json", responseBody: '{ "ok": true }' },
  },
});
const denied = node({
  type: "n8n-nodes-base.respondToWebhook",
  version: 1.4,
  config: {
    name: "Svar 401",
    parameters: {
      respondWith: "json",
      responseBody: '{ "error": "unauthorized" }',
      options: { responseCode: 401 },
    },
  },
});

export default workflow("nettside-skjema", "Nettside – skjemainnsending")
  .add(webhook)
  .to(settings)
  .to(authorized.onTrue(normalize.to(email.to(ok))).onFalse(denied));
