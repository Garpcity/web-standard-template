# n8n-flyter

Nettsiden eier innhold, visning og skjemainnsending. n8n eier alt som skjer *etter* at data er sendt, og all overvåking. Flytene her er kilden; de importeres til kundens n8n (selvhostet for persondata, Cloud for prototyper) via n8n Workflow SDK eller bygges manuelt etter beskrivelsen.

| Fil | Flyt | Trigger | Krever |
| --- | --- | --- | --- |
| `01-skjemainnsending.ts` | Skjema → e-postvarsel | Webhook fra `/api/forms` | SMTP-credential, `FORMS_WEBHOOK_SECRET` |
| `02-ai-synlighet.ts` | GEO-måling: siteres domenet av AI-søk? | Månedlig | OpenAI-credential (websøk), SMTP |
| `03-ukentlig-seo-rapport.ts` | Search Console + CrUX, uke mot uke | Ukentlig | Google OAuth (webmasters.readonly), CrUX API-nøkkel, SMTP |

## Kobling til nettsiden
I `.env.local`:
```
FORMS_WEBHOOK_URL=https://<n8n>/webhook/<path>
FORMS_WEBHOOK_SECRET=<samme som webhookSecret i flyten>
```

## Per kunde
Bytt verdiene i «Innstillinger»-noden i hver flyt (e-post, domene, kjernespørsmål) og credentials. Ikke endre strukturen uten å oppdatere filen her og teste i staging.

## Status 2026-11-10
- 01 og 02 er importert i n8n Cloud for AD.Moment (ikke aktivert; sett webhookSecret og bekreft credentials først).
- 03 venter på Search Console-credential og CrUX-nøkkel.
