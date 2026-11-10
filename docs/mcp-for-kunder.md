# Koble din egen AI til nettsiden (MCP)

Nettsiden din har en MCP-server. Det betyr at AI-verktøyet du allerede bruker – Claude, ChatGPT, Copilot, n8n eller et annet – kan lese innholdet ditt, profilmanualen og designet, og lage utkast til nye sider, artikler og sosiale poster som følger profilen din. Alt lander som utkast. Du eller den du har gitt rollen *godkjenner*, publiserer.

## Slik kobler du til
- **Adresse:** `https://<din-nettside>/api/mcp`
- **Nøkkel:** du får en nøkkel per agent fra oss (header `x-agent-key` eller `Authorization: Bearer`). Nøkkelen kan trekkes tilbake når som helst.
- **Claude Desktop / claude.ai:** legg til en «Custom connector» med adressen og nøkkelen.
- **n8n:** MCP Client-node med samme adresse og header.

## Hva agenten kan
| Verktøy | Gjør |
| --- | --- |
| `get_brand_guide` | Leser profilmanualen (identitet, tone, godkjente fakta, kanalregler). Alltid første steg. |
| `get_content`, `search_content` | Leser sider, artikler og personer – også utkast |
| `get_blocks`, `get_design_tokens` | Ser hvilke byggeklosser og farger som finnes (kan ikke endre dem) |
| `check_against_guide` | Sjekker en tekst mot profilmanualen: forbudte påstander, unngå-ord, tall uten kilde, kanallengde |
| `create_draft_page` | Lager eller oppdaterer en side som utkast, av godkjente blokker. Utseende-felt er låst. |
| `create_draft_article` | Lager en artikkel som utkast med kort svar, brødtekst og kilder |
| `create_social_post` | Lager en post for én kanal som utkast; publiseres via n8n etter godkjenning |

## Hva agenten ikke kan
Publisere, slette, endre profilmanualen eller designet, eller skrive fri HTML. Innhold som bryter profilmanualen avvises før det lagres.

## Oppgavemaler
Be agenten bruke en mal, så blir resultatet likt hver gang: **ny-artikkel**, **ny-landingsside**, **some-serie**, **oppdater-side**, **kvalitetssjekk**. Hver mal starter med å lese profilmanualen og slutter med å sjekke teksten mot den. Eksempel: «Bruk malen ny-artikkel med tema "Hva koster en bedriftsnettside?"».

## Sporbarhet
Alt agenten lager er merket med hvilken agent, hvilken mal og hvilken versjon. Det ser du i CMS-et på utkastet.
