# 2026-09-25 — "Sugerir com IA": the spreadsheet's header and a masked sample go to Claude

## Contexto

G3 (`growth-plan.md`, meeting of 2026-09-22) lets a store import the spreadsheet it already has.
Slice 1 maps the columns by synonyms and by hand, and remembers the mapping per layout; a layout
seen for the first time with unusual names ("Nº", "Cliente final", "Vlr. unit.") still needs the
person to pick every field. Claude reads a header plus a few rows and names the columns well —
but those rows are customer data (names, e-mails, phones, CPF) and the call sends them to a
third party.

## Decisão

- `POST /imports/mapping/suggest` (same multipart as the preview; 10 per 15 min per store and
  user, not per IP — every web request reaches the API from the BFF's address; the area's edit
  right; at most two `.xlsx` reads at once) sends Claude Haiku 4.5 (`claude-haiku-4-5`, chosen
  on 2026-09-23 for cost and speed) the **column names** and up to **10 rows anonymized by an
  allow list** (`sampleMask.ts`, pure, tested against every leak a security review listed):
  only a full date, an amount of up to 7 digits, an order reference (`#123`), a short code
  mixing letters and digits (SKU) and the template's option words (`pago`, `pix`,
  `marketplace`…) pass as they are; every other cell keeps only its shape — letters become
  `a`/`A`, digits `0` (`Ana Souza` → `Aaa Aaaaa`, a CPF → `000.000.000-00`, an e-mail →
  `aaa@aaaaa.aaa`). Cells are cut at the header's width and 60 characters, and the sample
  shrinks to fit 30 KB.
- Columns go to the model **by position** (`c0`, `c1`…) with their name cut at 60
  characters; the schema's enum holds only the ids. A first row that looks like data (an
  e-mail, a date, an amount, 8+ digits) is refused with 422 before any call — a file without a
  header row would otherwise ship a customer's row as "column names". Residual risk: a
  header-less file whose first row is only words (a name, a city) passes that check; it is
  bounded to one row of labels and stated here.
- The answer is **structured output** (`output_config.format`, a JSON schema whose enums are the
  template's field keys and the column ids), then validated again by
  `mappingOfSuggestion`: an unknown field, a column the file does not have or a column used
  twice is dropped. The model returns a **mapping, never data**; rows are always read by our
  code. The suggestion only fills the "Conferir colunas" selects — the person confirms, and
  the confirmed mapping is what gets remembered.
- `ANTHROPIC_API_KEY` is optional: without it the preview says `aiAvailable: false`, the button
  is hidden, the endpoint answers 503 and everything else works. A failure of the API answers
  502 "A IA não respondeu agora…"; the details go to the server log only. Every suggestion is
  recorded in the activity log (`IMPORT_MAPPING_SUGGESTED`). The screen says, next to the
  button, what is sent and that it goes anonymized to Anthropic. The SDK is built with the key
  and URL from `env.ts` only (no `ANTHROPIC_AUTH_TOKEN`, logging off), production requires an
  `https` base URL, and a failure logs only the status and request id.

## Por quê

- An allow list fails closed: a format nobody anticipated is sent as its shape, never as
  itself. The shape is still what the mapping needs; the header alone is often ambiguous
  ("Valor", "Data").
- Enum-constrained structured output plus our own validation means a wrong or hostile answer
  can at worst pre-fill a wrong select, never write a row.
- Haiku is enough for a classification of a few dozen columns and answers in about a second.

## Alternativas descartadas

- **Synonyms only (no AI).** Already the default and still the first guess; it misses the
  long tail of names each ERP and marketplace invents.
- **Send the header only.** Cheaper and no customer data at all, but columns like "Valor",
  "Data" or "Código" cannot be told apart without values.
- **Send unmasked rows.** Marginally better guesses on name columns, at the cost of shipping
  personal data to a third party for no product gain.
- **Let the model return the rows mapped.** Would put the model in the data path (hallucinated
  or dropped rows); the plan's rule is "mapping, never data".
