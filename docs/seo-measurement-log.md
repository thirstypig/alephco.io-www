# SEO measurement log

Readings for todo **539 §6** ("how to know if this is working"). §6 itself lives in the app
repo (`todos/539-…md`), which this repo's agent must not edit — so the numbers land here, in
the repo whose content they are measuring.

**Append a new section per reading. Never rewrite an old one**: the point is the series, and a
corrected-in-place number cannot be compared against what someone acted on at the time.

## How to reproduce a reading

GA4 property **Aleph** = `properties/533923897` (account "Thirsty Pig"). Every query MUST
carry both filters:

- `hostName` EXACT `www.alephco.io` — the property also receives `app.alephco.io`, and
  historically `localhost`. Session 111's GA4 audit found **5,109 of 5,210 "active users"
  in Aug 2026 came from localhost**; the hostname filter is what keeps that out of the series.
- `sessionDefaultChannelGroup` EXACT `Organic Search` for the organic figures.

⚠️ **Anything before 2026-09-01 is contaminated** by that localhost traffic and is not
comparable. Compare forward only.

📌 Read **sessions and users together.** At this volume one frequent visitor moves the
headline: see September's homepage row below.

## 2026-09-11 — the first reading after post 1

Post 1 of the 31-post schedule ("PFAS rules for importers") went live **2026-09-07**.

| Window | Organic sessions | Engagement rate |
|---|---|---|
| 2026-01-01 → 08-31 (8 months) | **88** | 47.7% |
| 2026-09-01 → 09-11 (11 days) | **22** | 50.0% |

**Baseline confirmed.** 88 over eight months ≈ **11 organic sessions/month**, which matches
the "86 for 2026 YTD" figure §6 was written against. §6's target — exceed 86 in a single
month by Feb 2027 — is therefore ~8× the run rate, not a small increment.

⚠️ **Do not read 22-in-11-days as a 60/month pace.** Nine of the 22 are a single returning
desktop visitor arriving from Google onto `/` on 9/1, 9/3, 9/5, 9/7, 9/8, 9/9 and 9/11 — one
`activeUser` across all nine sessions. Excluding it: **13 sessions in 11 days ≈ 35/month**.
🔴 Whether that visitor is internal is **an open question put to James on 2026-09-11 and not
yet answered.** If internal, GA4 needs an internal-traffic filter (Admin → Data collection
and modification → Data filters); until then every reading in this series carries the same
inflation and the two numbers must both be reported.

**Post 1 itself:** 2 organic sessions on 9/8 — one day after publishing — both engaged
(engagement rate 1.0). Small, but indexed and ranking within a day.

**Pages earning their first-ever organic session** (§6's third metric), vs the Jan–Aug
landing-page list: `/blog/pfas-rules-for-importers.html`, `/blog.html`, and
`/learn/articles/compliance/pfas-tof-testing/` — **3 pages**.

**Engagement rate is holding**: 50.0% vs 47.7% baseline. §6's warning is that new posts
dragging this down means they are the wrong posts; so far they are not.

📌 **Bing is not noise here.** `/blog/cpc-certificate-guide.html` took organic visits from
Bing on 9/2 and 9/10, and the Amazon guide from `cn.bing.com` on 9/2 — 3 of 22 organic
sessions. Every plan document discusses Google only.

**Not measured, and GA4 cannot measure it:** impressions, queries and indexation status live
in Google Search Console, which no agent here has access to. Asked of James 2026-09-11,
unanswered: whether post 1 shows "URL is on Google", and whether `sitemap.xml` is submitted.
