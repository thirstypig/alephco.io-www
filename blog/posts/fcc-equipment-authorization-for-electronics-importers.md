---
title: "FCC equipment authorization: the gate importers miss"
description: "A Bluetooth or Wi-Fi radio needs FCC certification before it's marketed in the US, and a CE mark doesn't count. What SDoC and Certification ask of importers."
date: 2027-04-05
slug: fcc-equipment-authorization-for-electronics-importers
keywords: [FCC equipment authorization, SDoC, RF device import, CE marking, unauthorized RF device]
sources: [https://www.fcc.gov/general/equipment-authorization-procedures, https://www.fcc.gov/oet/ea/importation, https://www.ecfr.gov/current/title-47/section-15.201, https://www.ecfr.gov/current/title-47/section-15.101, https://www.ecfr.gov/current/title-47/section-2.909, https://www.ecfr.gov/current/title-47/section-2.1077, https://www.ecfr.gov/current/title-47/section-2.1203, https://www.ecfr.gov/current/title-47/section-2.1204, https://www.ecfr.gov/current/title-47/section-2.903, https://www.ecfr.gov/current/title-47/section-2.948, https://www.ecfr.gov/current/title-47/section-2.960, https://www.ecfr.gov/current/title-47/part-2, https://www.federalregister.gov/d/2017-23217, https://www.federalregister.gov/d/2025-21001, https://www.federalregister.gov/d/2026-16197, https://docs.fcc.gov/public/attachments/DA-26-278A1.pdf, https://docs.fcc.gov/public/attachments/FCC-26-50A1.pdf, https://docs.fcc.gov/public/attachments/DOC-399140A1.pdf, https://docs.fcc.gov/public/attachments/FCC-23-113A1_Rcd.pdf]
draft: true
---

CPSIA gets most of the attention in consumer products. FCC compliance gets missed by
importers who don't think of themselves as "electronics companies", even though their
product has a Bluetooth chip inside it. In December 2023 the FCC
[proposed a $1.2 million penalty](https://docs.fcc.gov/public/attachments/DOC-399140A1.pdf)
against a Brooklyn electronics seller for marketing radio devices that weren't properly
authorized.

Checked against the eCFR, the Federal Register and the FCC's own pages on **10 September 2026**.
These rules are moving, so if you're reading this much later, check the links rather than
the text.

## Two different processes, and you need to know which applies

**Certification** is for intentional radiators: anything that transmits, like a phone, a
Wi-Fi access point or a remote control. With a few narrow exceptions,
[Part 15 requires it](https://www.ecfr.gov/current/title-47/section-15.201) before the
product is marketed. It's the more demanding path. The product is tested at an
FCC-recognized accredited lab, and the grant of certification is
[issued by an FCC-recognized Telecommunication Certification Body](https://www.fcc.gov/general/equipment-authorization-procedures)
(TCB). Certified equipment is listed in the FCC's public database.

One class of transmitter can't be certified at all right now. In March 2026 the FCC
[added routers produced in a foreign country to its Covered List](https://docs.fcc.gov/public/attachments/DA-26-278A1.pdf),
except those with a Conditional Approval from the Department of War or DHS, and
[covered equipment can't get an equipment authorization](https://www.ecfr.gov/current/title-47/section-2.903).
If you import routers, check the Covered List before anything else.

**Supplier's Declaration of Conformity (SDoC)** is for most unintentional radiators:
devices that don't transmit but still generate RF energy internally, like
[computer peripherals, LED light bulbs and switching power supplies](https://www.fcc.gov/general/equipment-authorization-procedures).
For most of these,
[Part 15 allows SDoC or Certification](https://www.ecfr.gov/current/title-47/section-15.101);
a few, like scanning receivers and radar detectors, need Certification. SDoC is a
self-declaration. The responsible party makes sure the product is tested and complies, but
[files nothing with the FCC](https://www.fcc.gov/general/equipment-authorization-procedures),
and the product isn't listed in an FCC database. The FCC can still ask for the test report.

Many products need both. The
[FCC's own examples](https://www.fcc.gov/general/equipment-authorization-procedures) are
mobile phones, Wi-Fi equipment, notebooks and tablets: each combines a transmitter that
needs Certification with digital circuitry that uses SDoC.

## If you import SDoC products, the responsible party is probably you

This is the part that lands on importers. The SDoC responsible party
[must be located in the United States](https://www.ecfr.gov/current/title-47/section-2.1077),
and for imported equipment
[that's the importer](https://www.ecfr.gov/current/title-47/section-2.909). A compliance
information statement has to ship with the product, identifying it and naming that party
with a name, address, and phone number or internet contact.

So if your overseas supplier did the testing, the paperwork may have come from them, but
the responsibility sits with you.

## What happens at the border

There's no FCC import form any more. The FCC
[eliminated the Form 740 filing requirement](https://www.federalregister.gov/d/2017-23217)
effective 2 November 2017. It found the form wasn't a meaningful deterrent to illegal
imports, that filing had become a large burden, and that the information was more widely
available elsewhere, including from CBP's own database. The FCC's
[importation page](https://www.fcc.gov/oet/ea/importation) confirms there's nothing to file
with the FCC for an imported RF device.

That didn't remove the obligation. It moved it. Before a radio frequency device comes in,
[the importer, ultimate consignee or customs broker has to determine](https://www.ecfr.gov/current/title-47/section-2.1203)
that it meets one of the
[import conditions](https://www.ecfr.gov/current/title-47/section-2.1204). For most
commercial goods, that means a valid FCC equipment authorization. A device that meets none
of the conditions can be refused entry, and whoever made the call has to show how they made
it if asked within one year of entry.

Since December 2025, "valid" also means an authorization the FCC hasn't
[limited under its covered-equipment procedure](https://www.federalregister.gov/d/2025-21001),
which exists to stop the continued importation and marketing of covered equipment. If you
can't produce the documentation, the problem isn't a missing form. It's a missing
authorization.

## CE marking doesn't substitute for any of this

[Part 2 of the FCC's rules](https://www.ecfr.gov/current/title-47/part-2), which governs
equipment authorization, doesn't mention CE marking at all. A CE mark tells you about the
product's EU status and nothing about its FCC status.

What does exist is narrower. Under mutual recognition agreements, labs and certification
bodies designated in partner economies can
[test](https://www.ecfr.gov/current/title-47/section-2.948) and
[certify](https://www.ecfr.gov/current/title-47/section-2.960) to the FCC's rules. That's a
route to an FCC grant, not an exemption from one. The product is still tested against FCC
standards and still certified through the FCC process.

## What this can cost

In December 2023 the FCC
[proposed a **$1,202,454** penalty](https://docs.fcc.gov/public/attachments/DOC-399140A1.pdf)
against **Sound Around, Inc.**, a Brooklyn-based online electronics seller. The FCC said
the company had marketed 33 radio frequency device models that weren't properly
authorized, and had given incomplete answers to its letters of inquiry.

It wasn't a first offense. According to the
[Notice of Apparent Liability](https://docs.fcc.gov/public/attachments/FCC-23-113A1_Rcd.pdf),
the FCC's enforcement staff cited the company in 2011. The Commission proposed a $685,338
fine in 2020 and upheld it in a 2022 forfeiture order, and the company still hadn't paid
that fine when the 2023 notice was issued.

The arithmetic is worth seeing. The base amount for the 33 marketing violations was
$231,000 (33 × $7,000). The rest came from upward adjustments for intentional conduct,
prior violations, repeated marketing and ability to pay, plus separate amounts for the
incomplete answers.

A Notice of Apparent Liability is a *proposed* penalty, not a final one, and the company
gets to respond before the FCC acts. We couldn't confirm how this one was resolved. The
exposure is real either way, and a history of repeat violations is what made it a
seven-figure number.

## What's coming

Two parts of one FCC document from July 2026 (ET Docket No. 21-232) are worth watching.
Neither was in force when we checked.

- **Online marketplaces and FCC IDs.** In
  [FCC 26-50](https://docs.fcc.gov/public/attachments/FCC-26-50A1.pdf), adopted 22 July
  2026, the FCC required online marketplaces to display the FCC ID of certified devices at
  the point of sale. It takes effect only after publication in the Federal Register, and
  it wasn't in the eCFR when we checked.
- **SDoC registration.** In the
  [proposal that accompanies that order](https://www.federalregister.gov/d/2026-16197), the FCC
  proposes that every SDoC device be registered and given a publicly listed identification
  number, and that certified equipment also have a US-based liable party. If that's
  adopted, "no FCC filing" stops being true for SDoC products.

## What this means practically

- **Classify every product with a radio or digital circuitry before you import it.**
  Whether it transmits decides whether you need Certification, SDoC, or both.
- **If you import SDoC products, assume you're the responsible party.** Make sure your
  name and US contact details are on the compliance statement that ships with the product.
- **Get the grant or the SDoC test report before the goods ship**, and keep it where you
  can produce it for at least a year after entry.
- **CE marking is not a substitute for FCC authorization.** Confirm both independently if
  you sell into both markets.
- **Check routers, and anything else on the Covered List, separately.** A test report
  won't help if the equipment can't be authorized at all.

---

*General information, not legal advice. Each regulatory claim above links to the eCFR, the
Federal Register, or the FCC's own guidance or enforcement record. These rules are changing
quickly, so check those links before acting, and talk to counsel about your own products.*
