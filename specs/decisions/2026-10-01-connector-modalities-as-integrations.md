# 2026-10-01 — Marketplace modalities are separate integrations, as in Bling

## Contexto

On 2026-09-23 the growth plan (`growth-plan.md` › _Marketplace variants_) chose **one catalog card
per marketplace with a "modalidade" choice** (Amazon MFN / FBA Classic / FBA Onsite; Mercado
Livre próprio / Full): one OAuth covers every modality, so the choice only labels the stock.
Rebuilding the integrations screen after Bling's Central de Extensões
(`integrations-plan.md`), Davi asked to copy Bling here as well, "também por trás": in Bling each
modality is its own integration, connected and configured on its own, bringing only its orders.

## Decisão

- New connector keys `mercado_livre_full`, `amazon_fba_classic` and `amazon_fba_onsite`, each a
  catalog card next to its platform. "Mercado Livre" becomes envio próprio and "Amazon" becomes
  MFN.
- Each modality is a provider registered with **the platform's app and callback URL**: the
  authorization's `redirect_uri` is the family's (`/connectors/mercado_livre/callback`), and the
  callback takes the real key from the signed `state` when it belongs to that family — no new
  redirect URI to register on Mercado Livre or Amazon.
- The provider keeps only its modality's orders before storing the raw record
  (`keepsOrderFor`: ML `logistic_type = fulfillment`, Amazon `FulfillmentChannel = AFN`; the
  platform card keeps the rest and unflagged orders). The cursor still moves over every order.
- Modalities of the same platform are one **family** for the one-source-per-kind rule
  (`sameFamily` in `conflictingOwner` and `kindOwnership`): Mercado Livre and Mercado Livre Full
  both feed the products and stock the platform holds; different platforms still conflict.
- **FBA Onsite** stays "Solicitar conexão": the Orders API only says AFN / MFN, so an Onsite
  order cannot be told apart yet.

**Known limit, closed in slice 4.** Today each modality authorizes and stores its own token for
the same seller and app. If Mercado Livre keeps only the latest grant per seller and app, one
modality's authorization or refresh may invalidate the other's; on Amazon both connections page
through the seller's orders and share one rate limit, so concurrent syncs may answer 429. Real
connections are on hold until the company's domain, and slice 4 (several accounts) separates the
**account** (credentials, one per seller) from the **integration** (modality), so the modalities
of one seller will share one token and one fetch.

## Por quê

The screen is meant to be Bling's, and Bling's model also separates what each modality owns —
Full / FBA stock belongs to the marketplace's warehouse and must never raise our stock-out
alerts. Today neither connector writes orders to the fact tables (sales come only from the ERP),
so the split changes no number of the pilot store; it lands where it matters, when products and
stock arrive (M4, task A3).

## Alternativas descartadas

- **One card with a modality choice** (2026-09-23): not Bling's screen, and a single connection
  cannot hold two accounts' worth of settings per modality.
- **Modality cards as a visual shortcut to the platform's single connection**: chosen at first,
  then dropped — Davi wants Bling's behaviour, not only its look.
- **One callback URL per modality**: would make every store owner of the app register two or
  three redirect URIs on each marketplace for nothing the signed state does not already carry.
