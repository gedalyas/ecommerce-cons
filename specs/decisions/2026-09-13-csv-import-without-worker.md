# 2026-09-13 — CSV import parsed in-process, no worker thread yet

## Contexto

The first ingestion door is a CSV upload on Conexões (`specs/ingestion-plan.md`). The Arko
file rules say the parser must be contained (worker, memory and time cap). Our API is a single
Express process bundled with esbuild; a worker thread means a second entry point in dev
(`tsx`) and in the bundle.

## Decisão

Parse the CSV in the request process with three hard bounds: the 10 MB byte ceiling (enforced
by multer before the body reaches us), a row cap of 50 000 and a time budget of 20 s checked
every 500 rows. The parser is a streaming state machine over the decoded string; it allocates
one row at a time. `.xlsx` is not accepted.

## Por quê

- Memory is bounded by the input: a 10 MB string plus one row of fields at a time.
- CPU is bounded by the budget: the request fails with 422 instead of hanging the process.
- The upload is synchronous and small (a month of orders ≈ 1 MB); a worker would add an entry
  point, IPC and error plumbing for a bound the ceiling already gives.

## Alternativas descartadas

- **`worker_threads` with `resourceLimits`.** The right answer for `.xlsx` (zip + XML, memory
  amplification) or for files an order of magnitude bigger. Revisit the day either arrives;
  the parser and mappers are pure, so moving them behind a worker is plumbing only.
- **Streaming multipart to disk and parsing the file.** Same bounds, more moving parts, and a
  temp-file lifecycle to get wrong.
