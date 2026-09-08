# Todo 566 — positioning sweep of the marketing site

_Session 117, 2026-09-07. Sweep of 101 customer-facing files against PRD-008 §1 and
DOC-067 (`docs/marketing/document-readiness-counsel-review-brief.md`, app repo)._

DOC-067 §2 predicted this work:

> the rule was **written but never swept**. It is not enough to state the positioning;
> somebody has to audit what already ships against it.

The app was swept in `c302eeaf`. The marketing site never was. This is that sweep.

## Method

101 files: 13 root `.html`, 8 `features/`, 3 `for/`, 2 `compare/`, 14 `blog/`,
25 `blog/posts/*.md`, 36 `learn/`. Every search ran with a control (a term known to be
present) so that a zero result meant "absent", not "search broken" — two searches during
this sweep returned a false zero and would otherwise have been reported as clean.

`/learn` is clean: 370 hits for "compliance", zero banned verdict words.

## Fixed in this PR — three false claims about the testing-lab directory

**1. `for/toy-importers.html` — "Aleph verifies your testing lab is CPSC-accepted".**
False. `cpcCertificates.labCpscAccepted` is a user-entered boolean defaulting to `false`,
beside hand-typed `labName` / `labAddress` / `labPhone`; `product-standards.ts:204` string-
matches a supplied `accreditations` array. Nothing is checked against CPSC's list, and
DOC-067 §1 says the platform "does not know whether the document is authentic, current, or
issued by an accredited body". Rewritten to describe the lab directory that does exist.

**2. `features/cpsia-cpc-generator.html` — "verify CPSC-accepted labs".**
The same false claim, in the `og:description` and `twitter:description` (lines 11 and 19).
Found only when the live copy was extracted verbatim for the counsel inventory below: the
phrase carries no "Aleph" beside the verb, so the first guard pattern did not see it.

**3. `features/cpsia-cpc-generator.html` — "25 CPSC-accepted labs" (lines 7, 63, 148).**
`shared/data/testing-labs.ts` holds **10** labs — SGS, Bureau Veritas, Intertek, UL
Solutions, Eurofins, TÜV Rheinland, QIMA, ACT Lab, Pace Analytical, Element — of which
**7** carry `"CPSC-Accepted"` in `accreditations`. So the number was wrong and so was the
characterisation. The proximity scoring the same sentences advertise IS real
(`scoreLabForProduct`, `proximityTier`) and was kept.

`tests/validate-structure.mjs` now fails the build on both claim shapes: `Aleph
verifies …accredited`, and the capability-list form `verify CPSC-accepted labs`. The second
pattern is scoped to the accredited thing as the direct object, so reader advice —
"Verify that the lab is CPSC-accepted", which is what the copy SHOULD say, and which
`blog/cpc-certificate-guide.html` and `blog/how-to-choose-testing-lab.html` both say
correctly — still passes. Both verified red-then-green against the real strings.

📌 **No guard on the lab COUNT.** It would have to hardcode 10, and this repo has no
dependency on the app repo to read it from. A count that drifts is invisible here.

## 🔴 Hand-back to the app repo — not fixable from here

### 1. `PfasStateReportService` renders a compliance verdict

`server/services/PfasStateReportService.ts:30`

    status: "compliant" | "non_compliant" | "needs_review";

Reachable via `server/routes/pfas.ts`. This is the verdict PRD-008 §1 locks out —
"Not 'compliant,' not 'non-compliant'" — and it is the same thing `c302eeaf` deleted from
the products table. That sweep missed this service.

⚠️ **The marketing copy describing it is accurate.** `features/pfas-tracking.html:118`
advertises "a clear compliant/non-compliant indicator" because one genuinely exists.
Correcting the site while the product still renders the verdict would only hide it.
**The product is the thing to change; the copy should follow.**

### 2. The regression guard misses it on spelling alone

`scripts/no-compliance-score.test.ts` bans:

    /["'`]NON-COMPLIANT["'`]/

`PfasStateReportService` writes `"non_compliant"` — lowercase, underscored. Same verdict,
walks straight past the guard. The guard was written to the exact literal the deleted badge
used, so it catches the bug already fixed and misses its twin.

Worth keeping: that file's `expect(files.length).toBeGreaterThan(500)` control is exactly
right, and is the pattern this sweep needed. The gap is in pattern coverage, not discovery.

Suggested: match the claim shape (`compliant` adjacent to `non[-_ ]?compliant` in a status
union, any case) rather than enumerating spellings.

### 3. `PfasQuestionnaire.tsx` is dead code

1,038 lines, exported at line 120, referenced by nothing outside itself. The reachable
supplier flow is `PfasPage` → `PfasDeclarationRequestsList` → `RequestPfasDeclarationDialog`.
Per-state TOF threshold rendering lives only in the dead component. Either wire it up or
delete it — this is the session-108 shape (a feature advertised but unreachable).

Not a marketing defect: the 15-state dataset is real and reachable
(`server/data/pfas-regulations.ts`, CA CO CT HI IL MA MD ME MN NJ OR NY RI VT WA, exposed
through `PfasStateReportService`), so the site's "15 states" claims are accurate.

## 🟡 For counsel — inventoried in `566-counsel-live-copy-companion.md`

📌 The companion document quotes every line below verbatim, grouped, with file and line, so
counsel can redline **sentences** rather than a feature. It also carries the finding that
matters most: `features/cpsia-cpc-generator.html:125` already publishes "**No incomplete
certificates**" — which is DOC-067 §3 option C, the register the brief calls "the version we
would like but suspect we cannot have", live since before the brief was written.


Class A and B below are **not** fixed here, deliberately. Whether Aleph may call a document
"compliant" is DOC-067 §4 questions 1, 2 and 6, and rewriting it now would pre-empt the
answer the gate exists to wait for.

**Class A — Aleph produces a document it calls "compliant" (19 instances, 8 files)**
`index.html:175` · `industries.html:143` · `features/cpsia-cpc-generator.html:7,11,19,62,132`
· `features/prop-65-labels.html:7,11,19,131,132` · `for/toy-importers.html:164`
· `for/amazon-sellers.html:125` · `blog/prop-65-warnings-guide.html:210,241`
· `blog/product-compliance-for-amazon-sellers.html:201,243,263`

**Class B — the customer becomes "compliant" (13 instances, 4 files)**
`how-it-works.html:7,11,19,33,50,56,99,123,131` (`:50` and `:56` are **JSON-LD HowTo step
names**, covered by the structured-data guard) · `industries.html:144,174`
· `blog/fsvp-guide-for-importers.html:102` · `blog/product-compliance-for-amazon-sellers.html:235`

**Class C — "audit-ready" (`for/toy-importers.html:167`)**
`"AUDIT-READY"` is a literal the app's own guard bans as a rendered verdict. If it is a
verdict in the product it is a verdict in the copy, and the two repos should agree.

📌 **Worth putting to counsel directly:** DOC-067 §5 already says, "regardless of the
answer", that we will not say a document *is* compliant. If that binds, Class A is settled
against us today and is not actually a §4 question. §5 and §3-option-C appear to disagree —
option C ("Never send an incomplete certificate again… tells you what is missing") is
milder than what 18 live lines already say.

## Amber, deferred with Class A/B

- `for/toy-importers.html:160` — "See compliance status across your entire catalog"
- `blog/multi-regulation-compliance-framework.html:219,260` — "tracks your compliance status"
- `blog/multi-regulation-compliance-framework.html:242` — "which products are **compliant**
  in which states" (accurate to the product today; blocked on hand-back item 1)
- `features/cpsia-cpc-generator.html:125,156` — "validates all 7 required fields per CPSC
  rules". The 1110.11(a) elements are modelled with paragraph-level citations, but only
  `productDescription` is `notNull()`. Not called false; needs a closer look than this
  sweep gave it.

## Cleared

`fails` (12), `approved` (7), `passes` (1), `certified` (2) — all editorial or regulatory,
no Aleph verdict. `features/cfr-citations.html`'s five uses of "verdict" argue *against*
verdicts and are correct as written.
