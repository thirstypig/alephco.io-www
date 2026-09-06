---
title: "GCC vs CPC: which certificate does your product need?"
description: "The difference is not paperwork preference. One requires testing at a CPSC-accepted lab, and since July 2026 both must be filed electronically at entry."
date: 2026-10-05
slug: gcc-vs-cpc-which-certificate-does-your
keywords: [GCC, CPC, general certificate of conformity, children's product certificate, CPSIA, CPSC eFiling, importer certification]
sources: [https://www.ecfr.gov/current/title-16/part-1110, https://www.law.cornell.edu/uscode/text/15/2063, https://www.federalregister.gov/documents/2025/01/08/2024-30826/certificates-of-compliance, https://www.ecfr.gov/current/title-16/part-1200]
draft: true
---

Two certificates, similar names, completely different amounts of work. Picking the wrong
one is the most common CPSIA mistake we see, and since July it has a new consequence:
the certificate now has to reach Customs electronically at the moment of entry.

Checked against the regulations on **6 September 2026**.

## The short answer

| | General Certificate of Conformity (GCC) | Children's Product Certificate (CPC) |
|---|---|---|
| Authority | [15 U.S.C. 2063(a)(1)](https://www.law.cornell.edu/uscode/text/15/2063) | [15 U.S.C. 2063(a)(2)](https://www.law.cornell.edu/uscode/text/15/2063) |
| Applies to | Non-children's consumer products subject to a CPSC rule | Children's products subject to a children's product safety rule |
| Testing | Your own reasonable basis | **Third party, at a CPSC-accepted lab** |
| Cost | Low | The expensive one |

Both are defined in [16 CFR §1110.3](https://www.ecfr.gov/current/title-16/part-1110). The
substantive gap is the testing: a GCC rests on a reasonable testing basis you determine,
while a CPC must be supported by testing at a third party conformity assessment body
accredited for the specific rule.

## Which one you need turns on one question

**Is it a children's product?** [16 CFR §1200.2(a)(1)](https://www.ecfr.gov/current/title-16/part-1200)
defines that as "a consumer product designed or intended primarily for children 12 years of
age or younger", and §1200.2(c) gives four factors, weighed together:

1. A statement by the manufacturer about intended use, including a label, **if reasonable**.
2. Whether the packaging, display, promotion or advertising represents it as appropriate
   for children 12 or under.
3. Whether consumers commonly recognise it as intended for that age group.
4. The CPSC's Age Determination Guidelines.

Note factor 1's qualifier. Labelling something "not for children" does not settle it if the
other three point the other way — the factors are weighed as a whole, not passed one at a
time.

## The importer is the certifier

This is the part people outsource and shouldn't. From
[16 CFR §1110.7](https://www.ecfr.gov/current/title-16/part-1110):

> For a finished product manufactured outside of the United States that must be accompanied
> by a certificate, the importer, as defined in this part, is the finished product
> certifier.

Not the factory. Not the broker. A certificate your supplier hands you is an input to your
certificate — you are the one attesting.

## What has to be on it

§1110.11 lists the required elements, and they are more specific than most templates:

1. Product identification — GTIN, model, serial, SKU or UPC, plus enough description to
   identify it.
2. **Each** applicable safety rule, ban, standard or regulation, listed separately.
3. The certifier's name and full contact details.
4. The record-keeper's name and contact details.
5. Manufacturing date and place, with manufacturer details.
6. The **most recent** testing date and place, and the testing body's contact details.
7. The certifier's attestation.

"Complies with all applicable CPSC regulations" fails item 2. Each rule gets named.

## The July 2026 change: it is now filed at entry

The [final rule](https://www.federalregister.gov/documents/2025/01/08/2024-30826/certificates-of-compliance)
amending Part 1110 took effect **8 July 2026**. Imported finished products must now eFile
the certificate data elements into CBP's Automated Commercial Environment at entry
(§1110.13). Products entered from a **foreign trade zone** for consumption or warehousing
follow on **8 January 2027**.

Seven data elements go into the message set: Product ID, Citation Codes, Manufacture Date,
Manufacture Place, Product Test Date, Testing Laboratory, and Point of Contact.

Two practical notes. CPSC has said ACE will initially return **warning** messages rather
than rejections for missing data — so a quiet entry is not evidence you filed correctly.
And the agency has been explicit that it continues to enforce certificate requirements and
to ask CBP to seize non-compliant products. The soft landing is on the message, not the
obligation.

A **Product Registry** exists for repeat shipments: you pre-load certificate data and give
your broker a Certificate Identifier instead of the full set. It does not talk to ACE by
itself — the broker still transmits.

## What to do this week

1. Sort your catalogue into children's products and everything else, using the four
   factors rather than instinct.
2. For each children's product, confirm you hold a CPC backed by third-party testing at a
   lab accepted **for that rule** — accreditation is scope-specific.
3. Check your certificates name each rule separately and carry the most recent test date.
4. Ask your broker what they are currently transmitting for you, and whether they are
   getting warnings.

Aleph keeps certificates on the product record with the rules they cite and their test
dates, so the answer to "which of these is stale" is a filter rather than a search.

---

*General information, not legal advice. Every requirement above links to the regulation or
statute — check those and talk to counsel about your catalogue.*
