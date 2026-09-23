# Sales only from the ERP or the spreadsheet; ROAS per sales channel

Date: 2026-09-23 · Status: accepted (meeting of 2026-09-22, Davi's answers of 2026-09-23)

## Contexto

The product read orders from every connector that had them — the storefront (Shopify,
Nuvemshop), the marketplaces (Mercado Livre, Amazon) and the ERP (Bling) — and showed the
value Meta Ads and Google Ads attribute to themselves as "receita atribuída" and a campaign
ROAS. A store that sells on its site and on marketplaces through Bling would count the same
sale twice (storefront + ERP), and the ad platforms' value has not gone through the checks an
ERP order has (cancellations, returns, refused payments, one sale claimed by two platforms).
A single store ROAS also mixes sales no ad drove: a Mercado Livre sale is not the fruit of a
Meta campaign that sends people to the site.

## Decisão

- **Sales come only from an ERP (Bling first) or the spreadsheet.** Connectors declare the
  data kinds they can provide (`provides`); storefronts and marketplaces provide products,
  stock and customers, ad platforms investment. The sync writes only what a connector
  provides (`providesKind`).
- **One owner per exclusive data kind per store** (sales, products, stock, customers, site
  traffic) in `store_data_source`; investment and social are shared. The first source claims
  a kind, a conflicting import answers 409, a blocked sync flags its connection, and every
  order records its `source`. The store picks another owner in the G2 source picker.
- **The ad platforms' attributed value is never shown as sales nor used in a ROAS**; it stays
  in `ad_spend_daily` as raw data. Campaigns are compared by cost per conversion.
- **ROAS is per sales channel**: sales of the channel (from the ERP) ÷ the investment pointed
  at it. Meta, Google and TikTok point at the site by default; a marketplace without its own
  ads shows "sem investimento". **MER** = all sales ÷ all marketing investment, shown as the
  secondary number. The dashboard highlight is "ROAS do site" with the MER below it.
- **CAC is a percentage**: marketing investment ÷ revenue (`cacPercent`); the R$ per new
  customer stays only on Clientes for LTV/CAC.

## Por quê

The ERP holds every channel and its orders are the ones that were invoiced; one owner per kind
is the only rule that makes double counting impossible by construction rather than by
reconciliation. A per-channel ROAS answers the question the consultant asks ("is the money
in ads paying back on the site?"), which a blended number hides; MER keeps the whole-store
view without calling it ROAS.

## Alternativas descartadas

- **Keep every connector writing orders and deduplicate** by number or date + total — order
  numbers differ between Shopify and Bling (`#1001` vs Bling's own), and a fuzzy match would
  silently drop or double sales.
- **Campaign ROAS from the platforms' attributed value, labelled** — Davi ruled it out: the
  value is not a confirmed sale.
- **Campaign ROAS from UTM on ERP orders** — Bling orders carry no UTM today; it returns
  when an order source brings UTM, with the coverage shown (G4).
- **One store ROAS** — rejected because stores sell in several places.
