# Companion to DOC-067 — the copy that is already live

_Prepared session 117, 2026-09-07, from a sweep of 101 customer-facing files on
alephco.io. Quotes are verbatim as published on that date._

## Why this document exists

DOC-067 asks counsel to review three **proposed** registers of copy (its §3) and answer six
questions about them (§4). It is a good brief and it has one gap: it does not say what the
site already publishes.

**31 lines are live today that go further than any of the three proposed options.** A
reviewer given only §3 would rule on "Know which documents are incomplete before someone
else tells you" without learning that twenty-six published lines already say Aleph *generates
a compliant certificate*. That is a materially different question, and it is the one that
carries present exposure rather than future exposure.

This companion supplies those sentences. It proposes **no replacement wording** — that is
what the review is for.

🔴 **The single most important line to put in front of counsel is already published.**
DOC-067 §3 offers option C, "Never send an incomplete certificate again", and calls it
*"the version we would like but suspect we cannot have"*.
`features/cpsia-cpc-generator.html:125` currently reads:

> Aleph validates all 7 required CPC fields — product description, applicable regulations,
> lab details, test dates, manufacturing info, contact person, and certification date —
> before generating the PDF. **No incomplete certificates.**

That is option C, in the imperative, live since before this brief was written. §4 Q1 asks
whether "incomplete" is safe to *start* using. It is already in use, in its strongest form,
as an unqualified guarantee about the platform's own output.

✅ **But the mechanism behind it is real, and counsel should be told so.**
`server/services/compliance/CpsiaService.ts` exports the 16 CFR 1110.11(a) requirement
groups as cited constants, handles the 1110.11(c) exclusions rule correctly — the testing
group is waived only when EVERY applicable standard carries a claimed exclusion, partial
exclusions still require it — and enforces at PDF-generation time.
`client/…/lib/cpc-required-fields.ts` mirrors it to gate the Generate button. A certificate
missing a required element genuinely cannot be produced.

So this is **not** an unsupported claim. It is a supported claim in contested words, which
is a materially easier question: does "incomplete" read as *"missing a field on the list
16 CFR 1110.11(a) sets"* — which is what the software checks and can cite — or as
*"legally insufficient"*, which it does not assess? That is question 8.

⚠️ DOC-067 lives in the app repo and was not edited. This is a separate document, to be read
beside it or folded into its §3 by whoever owns that file.

## How to read this

Grouped by claim type, because the groups may well get different answers. Each entry gives
file and line so a redline can be applied precisely. Where a line is a `<title>`, meta
description or structured-data field it is marked — those placements cannot carry the
standing qualifier, which is DOC-067 §4 question 4 with real instances attached.

---

## Group 1 — Aleph produces a document, and calls that document "compliant" or "valid" (26 lines)

- `index.html:175`
  > Generate compliant Children’s Product Certificates in minutes, not weeks. Find the right CPSC-accepted testing lab near your manufacturer and never miss an annual re-test deadline.
- `industries.html:143`
  > Generate compliant Children’s Product Certificates from lab reports. Find CPSC-accepted labs near your manufacturer. Never miss an annual re-test — and Aleph watches CPSIA rule changes for you (see how).
- `features/cpsia-cpc-generator.html:7` _(meta description)_
  > Generate CPSIA-compliant Children's Product Certificates from lab reports in minutes. A directory of 10 accredited testing labs with match scoring, 7-field validation, tracking labels, and annual re-test alerts.
- `features/cpsia-cpc-generator.html:11` _(og:description)_
  > Generate CPSIA-compliant Children's Product Certificates from lab reports in minutes. Auto-populate fields, find an accredited testing lab, and track re-test dates.
- `features/cpsia-cpc-generator.html:19` _(twitter:description)_
  > Generate CPSIA-compliant Children's Product Certificates from lab reports in minutes. Auto-populate fields, find an accredited testing lab, and track re-test dates.
- `features/cpsia-cpc-generator.html:62`
  > Generate CPSIA-compliant Children’s Product Certificates
- `features/cpsia-cpc-generator.html:132`
  > Download your CPC as a compliant PDF, generate tracking labels with lot numbers, and get automatic alerts 60 days before your annual re-test deadline.
- `features/prop-65-labels.html:7` _(meta description)_
  > California Prop 65 compliance made easy. Search 95+ chemicals, calculate exposure risk with NSRL/MADL thresholds, and generate compliant warning labels.
- `features/prop-65-labels.html:11` _(og:description)_
  > California Prop 65 compliance made easy. Search 95+ chemicals, calculate exposure risk with NSRL/MADL thresholds, and generate compliant warning labels.
- `features/prop-65-labels.html:19` _(twitter:description)_
  > California Prop 65 compliance made easy. Search 95+ chemicals, calculate exposure risk with NSRL/MADL thresholds, and generate compliant warning labels.
- `features/prop-65-labels.html:131`
  > Compliant label generator
- `features/prop-65-labels.html:132`
  > Generate 2018-amendment-compliant Prop 65 warning labels. Short-form warnings must name specific chemicals — Aleph handles that automatically. Both short-form and long-form options with the required triangle icon.
- `for/toy-importers.html:164`
  > Download compliant CPCs as PDFs. Share with retailers, customs brokers, or include in your product documentation.
- `for/amazon-sellers.html:125`
  > Generate compliant California Prop 65 warning labels for products that need them. Include them in your listing images to avoid customer complaints.
- `blog/prop-65-warnings-guide.html:210`
  > How to Generate Compliant Prop 65 Labels
- `blog/prop-65-warnings-guide.html:241`
  > Generate compliant Prop 65 labels in minutes
- `blog/product-compliance-for-amazon-sellers.html:201`
  > Aleph generates compliant CPCs, manages Prop 65 documentation, and keeps all your compliance records in one vault — ready for Amazon or anyone else who asks.
- `blog/product-compliance-for-amazon-sellers.html:243`
  > Prop 65 documentation: Aleph tracks which products need Prop 65 warnings, generates compliant warning labels, and maintains your assessment records — so you have documentation whether you're adding warnings or justifying why you don't need them.
- `blog/product-compliance-for-amazon-sellers.html:263`
  > Aleph generates compliant CPCs, tracks Prop 65 requirements, and keeps all your product compliance documents organized and ready — for Amazon, retailers, or regulators.
- `features/prop-65-labels.html:63`
  > 900+ listed chemicals. Changing exposure thresholds. Complex safe harbor requirements. Aleph gives you a 95-chemical database with real OEHHA NSRL/MADL values, an exposure assessment calculator, and a label generator that produces 2018-amendment-compliant warnings with named chemicals — so you get it right the first time.
- `features/prop-65-labels.html:110`
  > Aleph’s Prop 65 module includes a 95-chemical database with real OEHHA NSRL/MADL threshold values, an exposure assessment calculator, and a label generator that produces 2018-amendment-compliant short-form and long-form warnings — with named chemicals as required.
- `blog/cpc-certificate-guide.html:174`
  > Aleph auto-generates valid CPCs from your test reports — all 7 required elements, correctly formatted, every time.
- `blog/cpc-certificate-guide.html:217`
  > This is exactly what Aleph was built to handle. You upload your third-party test reports, Aleph extracts the relevant data — lab name, accreditation info, test dates, standards tested, results — and maps it to your product. Then it generates a valid CPC with all 7 required elements populated correctly. No manual data entry. No hoping you listed the right CFR citation. No realizing six months later that you referenced the wrong lab address.
- `blog/cpc-certificate-guide.html:227`
  > You don't need a consultant to produce a CPC — use Aleph to auto-generate valid certificates directly from your test reports. Start free.
- `blog/cpc-certificate-guide.html:233`
  > Generate valid CPCs in minutes, not hours
- `blog/cpsc-recalls-for-importers.html:252`
  > Certificate tracking and generation. Aleph tracks your Children's Product Certificates, test reports, and supplier documentation in one place. When a test report is approaching expiry, you get an alert — not a scramble. If you need to generate a new CPC, Aleph pulls the data from your test reports and produces a valid certificate automatically.

📌 **Two §5 adjectives, one claim.** DOC-067 §5 bans saying a document is "compliant,
**valid**, sufficient, accepted or approved". Seven of these lines use *valid* rather than
*compliant* — "Aleph auto-generates valid CPCs", "produces a valid certificate
automatically" — and they were missed on the first pass because that pass swept only
"compliant". They are the same claim in a different word and should get the same answer.

📌 **`blog/cpc-certificate-guide.html:174` is the most exposed sentence in this inventory**,
alongside Group 3's. It does not merely call the output valid — it adds **"every time"**,
which converts a description into a guarantee.

📌 **Editorial uses of "valid" are deliberately excluded** and are not offered for review.
`blog/cpc-certificate-guide.html:126` ("A valid CPC must contain 7 specific elements"),
`:156`, `:215`, `:225` and `blog/cpsc-recalls-for-importers.html:267` describe what the
regulation requires rather than what Aleph delivers. That distinction — the regulation's
standard versus our output — is the same one question 8 turns on.

📌 **Six of these twenty-six are in meta, `og:` or `twitter:` descriptions** — short-form
placements that cannot carry the standing qualifier, and that get republished as link
previews on other people's platforms. DOC-067 §4 Q4 asks about this hypothetically; these
are the actual instances. The other twenty are body copy, where a qualifier would fit.

---

## Group 2 — the customer becomes "compliant" (13 lines)

- `how-it-works.html:7` _(meta description)_
  > Tell us what you import, we map every requirement, get compliant fast, and stay compliant automatically — four simple steps.
- `how-it-works.html:11` _(og:description)_
  > Tell us what you import, we map every requirement, get compliant fast, and stay compliant automatically — four simple steps.
- `how-it-works.html:19` _(twitter:description)_
  > Tell us what you import, we map every requirement, get compliant fast, and stay compliant automatically — four simple steps.
- `how-it-works.html:33` _(JSON-LD description)_
  > How US importers set up product compliance in Aleph: tell us what you import, map the requirements, get compliant, and stay compliant.
- `how-it-works.html:50` _(JSON-LD HowTo step name)_
  > Get compliant, fast
- `how-it-works.html:56` _(JSON-LD HowTo step name)_
  > Stay compliant, automatically
- `how-it-works.html:99`
  > Four steps from import to compliant
- `how-it-works.html:123`
  > Get compliant, fast
- `how-it-works.html:131`
  > Stay compliant, automatically
- `industries.html:144`
  > Get CPSIA compliant
- `industries.html:174`
  > Get MoCRA compliant
- `blog/fsvp-guide-for-importers.html:102`
  > The Foreign Supplier Verification Program isn't optional, and FDA isn't bluffing. Here's what you actually need to do — in plain language — to stay compliant and keep your shipments moving.
- `blog/product-compliance-for-amazon-sellers.html:235`
  > How Aleph helps Amazon sellers stay compliant

📌 **`how-it-works.html:50` and `:56` are JSON-LD `HowTo` step names** — structured data
served to search engines and eligible for rich results. They are copy that is read by
machines and republished by third parties, which may or may not change the analysis.

---

## Group 3 — "incomplete", the §4 Q1 word, already in use (1 line)

- `features/cpsia-cpc-generator.html:125`
  > Aleph validates all 7 required CPC fields — product description, applicable regulations, lab details, test dates, manufacturing info, contact person, and certification date — before generating the PDF. No incomplete certificates.

📌 Two other uses of the word are editorial and describe the world rather than the product,
and are not offered for review: `for/toy-importers.html:98` (CPSC recalls "for products
that lacked proper testing or had incomplete certificates") and
`blog/multi-regulation-compliance-framework.html:168` ("do incompletely").

📌 **"Validates all 7 required CPC fields per CPSC rules" (`:125`, `:156`) checks out**,
with one imprecision. There are seven requirement GROUPS under 1110.11(a), comprising
**26 fields** — not seven fields. The copy then lists the seven groups ("product
description, applicable regulations, lab details, test dates, manufacturing info, contact
person, and certification date"), so the description is right and the noun is wrong.
Worth correcting for accuracy; not a positioning question.

---

## Group 4 — "audit-ready" (2 lines)

- `for/toy-importers.html:167`
  > Audit-ready records
- `for/toy-importers.html:168`
  > Every CPC, lab report, and tracking label is stored with a full audit trail. Ready for CPSC inspection at any time.

📌 The app repo's own regression guard (`scripts/no-compliance-score.test.ts`) bans the
literal `"AUDIT-READY"` as a rendered verdict. If it is a verdict in the product it is
presumably a verdict in the marketing, and the two repos should not disagree.

---

## The question we think counsel should take first

DOC-067 §5 says, **"regardless of the answer"**, that we will not say a document *is*
compliant, valid, sufficient, accepted or approved.

Read literally, that settles all twenty-six Group 1 lines today, and they are not §4 questions
at all. But there is a real scope argument the brief never addresses:

- **DOC-067 is scoped to the document-readiness flags** — a feature that reads documents the
  customer **uploads**, and forms no view on them. §5 plainly binds there.
- **Group 1 is about documents Aleph itself GENERATES** — a CPC or a Prop 65 label the
  platform composes. "This certificate contains the seven elements 16 CFR 1110.11(a)
  requires" is a statement about our own output's *format*, and it is a thing the product
  genuinely does.

Those may deserve different answers. If they do, §5 needs a scope line saying so, because as
written it appears to forbid what twenty-six live lines currently say.

## Proposed additional questions

Numbered to extend DOC-067 §4.

7. **Does §5 reach documents Aleph generates, or only documents it reads?** See above. This
   is the question that decides whether Group 1 is a redline or a rewrite.
8. **Is a format claim distinguishable from a compliance claim** in short-form copy — can we
   say "a CPC with all seven required elements" where we cannot say "a compliant CPC"?
9. **Do the six short-form placements need different treatment** from the twenty in body
   copy, given they cannot carry the qualifier? (§4 Q4, now with instances.)
10. **Does structured data (JSON-LD) carry the same exposure as visible copy?** Two Group 2
    lines are `HowTo` step names.
11. **Is "audit-ready" a verdict?** The product side already treats it as one.
12. **Group 2 asserts a state of the customer, not of a document** — "Get CPSIA compliant".
    Is that a different risk from Group 1, or the same one worded from the other end?
13. **Is "No incomplete certificates" defensible as a statement about our own output** —
    a guarantee that a document we generated contains the fields we require of it — or does
    it read as a guarantee that the certificate satisfies CPSC? This is §4 Q1 with the word
    already published, in the form §3 option C calls the one we suspect we cannot have.

## What is NOT in this inventory

- **The readiness feature is not named anywhere on the site.** Confirmed across all 101
  files: no "document readiness", no "N of M", no "fields found". DOC-067 §4 Q5's premise
  holds — the 25 drafted blog posts do not mention it either.
- **Three false claims found in the same sweep have been corrected already** and are not
  counsel questions: they were factually wrong about the product, not wrongly worded. See
  `docs/566-positioning-sweep-findings.md`.
- **`features/pfas-tracking.html:118`** advertises "a clear compliant/non-compliant
  indicator". It is **accurate** — `PfasStateReportService` really does return
  `status: "compliant" | "non_compliant" | "needs_review"`. That is a product change, not a
  copy change, and it is logged as a hand-back in the findings document. Counsel should know
  the product currently renders the verdict PRD-008 §1 forbids.
