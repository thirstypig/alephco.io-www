---
title: "Amazon compliance documents: what Seller Central asks for and why"
description: "Almost every document Amazon requests exists because a law requires it. Knowing which law tells you what will satisfy the request and what will not."
date: 2027-02-01
slug: amazon-compliance-documents-what-seller-central-requires
keywords: [Amazon Seller Central, compliance documents, CPC, GCC, Prop 65, listing suppression, marketplace compliance, importer]
sources: [https://www.ecfr.gov/current/title-16/part-1110, https://www.law.cornell.edu/uscode/text/15/2063, https://www.law.cornell.edu/regulations/california/27-CCR-25603, https://www.ecfr.gov/current/title-16/part-1107]
draft: true
---

⚠️ **Amazon's own requirements live in Seller Central and change without notice.** This post
is about the *laws* behind the requests, which change more slowly and explain what will
actually satisfy one. Always check the current policy in your account.

Regulatory citations checked on **6 September 2026**.

## The requests are not arbitrary

A marketplace asking for a "compliance document" is almost always asking for something a
statute or regulation already required you to have. That reframing is useful, because it
turns "what does Amazon want?" into "what does the rule require?" — a question with a
findable answer.

| Typical request | What it actually is |
|---|---|
| Children's Product Certificate | [16 CFR §1110.11](https://www.ecfr.gov/current/title-16/part-1110) certificate, backed by third-party testing |
| General Certificate of Conformity | The same, for non-children's products under a CPSC rule |
| Test report from an accepted lab | [16 CFR §1112](https://www.ecfr.gov/current/title-16/part-1112) accepted body, scope-specific |
| Prop 65 warning confirmation | [27 CCR §25603](https://www.law.cornell.edu/regulations/california/27-CCR-25603) content |
| Tracking label image | [15 U.S.C. 2063(a)(5)](https://www.law.cornell.edu/uscode/text/15/2063) markings |
| Supplier declaration | Whatever the underlying substance rule requires |

## The four reasons a document gets rejected

In our experience, rejections cluster:

**1. The certificate names no rules.** §1110.11(a)(2) requires each applicable safety rule
listed **separately**. "Complies with all applicable CPSC regulations" is not a citation, and
a reviewer cannot match it to the category. This is the single most common defect. See
[GCC vs CPC](/blog/gcc-vs-cpc-which-certificate-does-your.html).

**2. The lab is not accepted for that rule.** Acceptance is scope-specific — a body applies
naming the rules and test methods it seeks. A real report from a real lab still fails if the
rule you cite is outside its scope. See
[choosing a lab](/blog/third-party-testing-choosing-a-cpsc-accepted.html).

**3. The certificate is the factory's, not yours.** For imported goods
[§1110.7](https://www.ecfr.gov/current/title-16/part-1110) makes the **importer** the
finished product certifier. A supplier's certificate is an input to yours, not a substitute,
and it usually names the supplier as certifier — which is visibly the wrong party.

**4. The test date is stale.** §1110.11 asks for the **most recent** testing date, and
[§1107.21](https://www.ecfr.gov/current/title-16/part-1107) sets periodic intervals. A
three-year-old report on an annual interval invites the follow-up question.

## The one that costs the most

A **material change** you were not told about. Under §1107.23, a change in design,
manufacturing process or **component sourcing** that could affect compliance requires a new
certificate supported by new testing.

The listing does not change, the model number does not change, and nothing notifies anyone.
It surfaces when a document is requested and the dates do not line up with a product that
has quietly been made differently for eight months.

## Prepare before you are asked

The pattern that works is boring: hold the documents against the product, with dates, before
anyone asks. Requests usually come with a short window and a suspended listing attached, and
that is the worst moment to discover a certificate names the wrong party.

A workable minimum per SKU:

- the certificate, naming each rule separately, with you as certifier
- the underlying test report, from a lab accepted for those rules
- the test date, and the interval you are operating on
- the tracking label as it actually appears on the product
- any substance declarations, with dates
- the answer to "what changed since [date]?" from your supplier

Aleph keeps exactly this set against each product, so a document request is a lookup rather
than a hunt through email.

---

*General information, not legal advice, and not a statement of Amazon policy. Check Seller
Central for current requirements and talk to counsel about your products.*
