# Platform ROAS from the platform's own sales; dashboard ROAS is global

Date: 2026-09-25 · Status: accepted (feedback Davi relayed on 2026-09-25) · Amends
`2026-09-23-sales-from-erp-and-roas-per-channel.md`

## Contexto

The 2026-09-23 decision kept the value Meta Ads and Google Ads attribute to themselves out of
every screen: campaigns were compared only by cost per conversion, and the dashboard's headline
ROAS was the ROAS of the site (site sales ÷ investment pointed at the site). The feedback from
the consultants' side: analysing a platform without its ROAS is not how media is managed — the
Meta and Google tabs must show the ROAS those platforms report, the way the agency report and
the platforms' own managers do; and the dashboard's ROAS must be the store's global return, not
one channel's.

## Decisão

- **Platform tabs (Meta Ads, Google Ads):** "Vendas informadas" = the conversion value the
  platform reports (`attributed_revenue`), and "ROAS da plataforma" = vendas informadas ÷
  investment in that platform (fee included with "Incluir taxa"), on the tiles and on every
  campaign / ad set / ad row. Labelled as the platform's number, with its own glossary terms
  (`platformRevenue`, `platformRoas`).
- **Dashboard:** the headline "ROAS" = all sales (ERP or spreadsheet, every channel) ÷ all ad
  spend + platform fees. MER stays below it (all sales ÷ ads + marketing cost lines), and the ⓘ
  keeps the ROAS of each sales channel.
- **Unchanged:** sales on every other screen still come only from the ERP or the spreadsheet;
  the Marketing "Visão geral" keeps "ROAS do site" (glossary `siteRoas`); Vendas por canal
  keeps the ROAS per channel with the staff's channel tags.

## Por quê

The platform's ROAS is the number media buyers optimise against and the one clients compare
with the platform's own manager; hiding it made the tabs look incomplete. Its known bias (a
sale claimed by two platforms, no cancellations) stays visible because the number is always
named "da plataforma" and sits beside the ERP-based numbers elsewhere. On the dashboard the
store owner asks "how much did every real a spent in ads bring back", which is the global ratio.

## Alternativas descartadas

- Keep platform tabs without ROAS (cost per conversion only) — rejected by the consultants.
- Platform ROAS from ERP orders matched by UTM — the right long-term answer, but no order source
  brings UTM today (Bling does not); it stays on the board and can replace or sit beside the
  platform's number when a source brings UTM.
- Dashboard ROAS as the ROAS of the channel with most investment (site) — replaced by the
  global ratio; the per-channel figures stay in the tile's ⓘ.
