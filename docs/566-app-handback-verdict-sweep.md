# Hand-back to `alephco.io-app` — the verdict sweep that was never finished

_Prepared session 117, 2026-09-08, from the marketing-side 566 sweep. Written for an app
session to apply; nothing in `alephco.io-app` was edited to produce it._

## ⚠️ Correct this scope before planning the work

I previously reported this as **one service** (`PfasStateReportService`) and estimated half a
day. **That was wrong.** Enumerating the whole codebase instead of the file I happened to
find turns up **8 non-test source files and 55 references**, including a customer-facing PDF
and a public API query parameter.

`c302eeaf` deleted *one* compliance score and *one* verdict PDF. The guard added alongside it
was written to those exact literals. Everything spelled differently survived.

## The single highest-leverage action

**Fix the guard first.** It is a five-line change, and until it lands every item below relies
on somebody remembering. `scripts/no-compliance-score.test.ts`:

```js
const BANNED: ReadonlyArray<{ pattern: RegExp; why: string }> = [
  { pattern: /\bcompliance(Score|Rate)\b/,        why: "a compliance score or rate — a percentage IS a verdict" },
  { pattern: /\bcompliance_(score|rate)\b/,       why: "a compliance score/rate column" },
  { pattern: /generateComplianceVerdictPDF/,      why: "the compliance verdict PDF" },
  { pattern: /["'`]non[-_ ]?compliant["'`]/i,     why: "a rendered non-compliant verdict, in ANY spelling" },
  { pattern: /["'`]fully[-_ ]?compliant["'`]/i,   why: "a rendered compliant verdict" },
  { pattern: /["'`]COMPLIANCE RATE["'`]/i,        why: "a compliance rate rendered as a label" },
  { pattern: /["'`]AUDIT-READY["'`]/i,            why: "a rendered AUDIT-READY verdict" },
];
```

Two changes matter more than the rest:

- `/["'`]NON-COMPLIANT["'`]/` → `/["'`]non[-_ ]?compliant["'`]/i`. The original matched
  uppercase-hyphenated only. `PfasStateReportService` writes `"non_compliant"` — same verdict,
  lowercase and underscored, straight past the guard.
- `complianceScore` → `compliance(Score|Rate)`. `CustomerSummaryReportService` calls its
  percentage `complianceRate`, which is the same thing under a different noun.

🔴 **This guard goes RED on all 8 files the moment it lands.** Do not land it alone and accept
the red. `alephco.io-www`'s CLAUDE.md records why: *"An accepted-red gate has no signal — the
next real regression arrived as '23 of 1418' and nobody read the difference."* Migrate the
vocabulary and tighten the guard in the SAME change.

## Verified, not estimated

I ran the proposed patterns against the app source read-only before writing them down:
**1033 files scanned, 8 production files flagged** (plus 5 test/seed files). That run
corrected my own grep-based inventory in both directions, which is worth knowing before you
trust either list:

- It **found** `client/src/features/supply-chain/saved-views.ts`, which my grep missed.
- It **did not flag** `ComplianceReadinessSummaryCard.tsx` or `routes/compliance-readiness.ts`.
  The card uses `non_compliant` as an **object key and type member**, not a string literal, and
  the route's hits are in comments (which the guard strips, correctly). The card still renders
  those counts to users — so a quoted-literal guard does not see a real customer-facing surface.

⚠️ **That gap is a design choice you need to make.** Add
`{ pattern: /\bnon_compliant\b/, why: "..." }` and the guard also catches identifiers and type
members — which is what you want if the goal is removing the vocabulary rather than just
un-rendering it. The cost is that it fires on any deprecation alias you keep during migration,
so add it in the final step, not the first.

## The 8 files

| File | Hits | What it is |
|---|---|---|
| `server/services/ComplianceReadinessService.ts` | 26 | The core readiness engine — the largest surface |
| `server/services/PfasStateReportService.ts` | 7 | `status: "compliant" \| "non_compliant" \| "needs_review"` + `complianceRate` |
| `client/src/features/supply-chain/saved-views.ts` | — | Saved filter views (found by the guard, missed by grep) |
| `client/src/features/pfas/components/PfasQuestionnaire.tsx` | — | The dead component below — it carries the vocabulary too |
| `server/services/CustomerSummaryReportService.ts` | 5 | **"COMPLIANCE RATE" as a stat tile in a customer PDF** |
| `shared/compliance.ts` | 4 | `ComplianceReadinessState` — the canonical type everything else derives from |
| `server/lib/regulatory-schemas.ts` | 4 | **Public API: `GET /api/compliance-readiness?state=non_compliant`** |
| `client/src/pages/ComplianceReadinessPage.tsx` | 1 | Page-level type |

Two more carry the vocabulary but are **not** caught by the quoted-literal patterns above:
`ComplianceReadinessSummaryCard.tsx` (object keys — and it renders the counts to users) and
`routes/compliance-readiness.ts` (comments only). See the identifier-pattern note above.

Seeds and tests carry more (`cpsia_non_compliant`, `prop65_non_compliant` demo buckets); they
are not customer-facing but will need renaming with the type.

### The two worst, and why

1. **`CustomerSummaryReportService.ts:175`** —
   `{ label: "COMPLIANCE RATE", value: \`${data.complianceRate}%\` }`
   A compliance score, as a percentage, in a **document handed to customers**. This is the
   thing `c302eeaf` was opened to delete, still shipping under a different name.

2. **`regulatory-schemas.ts:113`** — `state: "urgent" | "non_compliant" | "ok"` is a **public
   API query parameter**. Renaming it is a breaking change for any consumer, so it needs a
   deprecation window rather than a rename in place.

## Suggested vocabulary

The app already has a verdict-free vocabulary in `shared/requirement-evaluation.ts`:
`"met" | "needs_confirmation" | "missing" | "not_applicable"`. It reads documents and forms no
view on them, which is exactly the positioning PRD-008 §1 requires. Reuse its shape.

| Today | Suggested | Why |
|---|---|---|
| `fully_compliant` | `all_documented` | Describes our records, not the product's legal status |
| `non_compliant` | `gaps_found` | A gap is a fact about the file; "non-compliant" is a verdict |
| `urgent_action_needed` | *(keep)* | Already verdict-free |
| `minor_warnings` | *(keep)* | Already verdict-free |
| `not_applicable` | *(keep)* | Already verdict-free |
| `PfasStateReport.status` | `"documented" \| "flagged" \| "needs_review"` | "flagged" states what we did, not what the product is |
| `complianceRate: number` | `documentedCount` + `totalProducts` | ⚠️ Render "N of M documented", never a %. A percentage is a score, and DOC-067 §5 bans implying that the absence of flags means anything |

## `PfasQuestionnaire.tsx` — decide, don't defer

1,038 lines, exported at line 120, referenced by **nothing** outside itself. The reachable
supplier flow is `PfasPage → PfasDeclarationRequestsList → RequestPfasDeclarationDialog`.

Per-state TOF threshold rendering (`reg.tofThresholdPpm`) exists **only** in this dead
component, so deleting it loses that display and wiring it up restores a feature nobody can
currently reach. Either is defensible; leaving it is not, because it is the session-108 shape
— a capability that looks present in the codebase and is absent in the product.

📌 Not a marketing defect: `server/data/pfas-regulations.ts` holds a real, reachable 15-state
dataset (CA CO CT HI IL MA MD ME MN NJ NY OR RI VT WA) served through `PfasStateReportService`,
so the site's "15 states" claims are accurate and need no change.

## Suggested sequencing

1. **Rename in `shared/compliance.ts`** and let the compiler find the callers. TypeScript makes
   this the cheap direction; grep does not.
2. **`CustomerSummaryReportService` first among the renders** — it is the only one that reaches
   a customer as a document rather than a screen.
3. **Public API param last**, with a deprecation window accepting both values.
4. **Tighten the guard in the same PR**, so it lands green.
5. Then `alephco.io-www` can correct `features/pfas-tracking.html:118`, which currently
   advertises the compliant/non-compliant indicator **accurately**. That copy fix is blocked on
   this work: changing it first would hide a live violation rather than fix one.
