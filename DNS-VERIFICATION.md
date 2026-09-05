# Green Ngoria — Final DNS step to finish the domain hookup

Both apps are deployed and the domains are attached to the correct Vercel
projects. `greenngoria.com` and `www.greenngoria.com` are **already live**.
Three subdomains (`admin`, `portal`, `api`) need one ownership-verification
TXT record each before Vercel will serve them — because `greenngoria.com`'s
DNS zone is managed in a **different Vercel account** than the one hosting
these projects (`mwangiwanyekis-projects`), so the records must be added by
the account that controls the domain.

## Add these 3 TXT records

In the Vercel account that manages `greenngoria.com` (Domains →
greenngoria.com → DNS Records → Add), or at whatever DNS host controls it,
add three TXT records — **all with the same name `_vercel`** (i.e.
`_vercel.greenngoria.com`), each with one of these values:

| Type | Name      | Value                                                        |
|------|-----------|--------------------------------------------------------------|
| TXT  | `_vercel` | `vc-domain-verify=admin.greenngoria.com,1f1455690564e06e4d69`  |
| TXT  | `_vercel` | `vc-domain-verify=portal.greenngoria.com,eff013212d5a34f38c41` |
| TXT  | `_vercel` | `vc-domain-verify=api.greenngoria.com,9bb7f6b0dba211943a3f`    |

A single DNS name can hold multiple TXT values — add all three.

Once they're in, tell me and I'll run Vercel's verify + confirm all
surfaces are live. (If you'd rather I do it: give me an API token for the
Vercel account that owns `greenngoria.com`, and I'll add the records and
verify directly.)

## Current live status

| Surface | URL | Status |
|---|---|---|
| Public site | https://greenngoria.com , https://www.greenngoria.com | ✅ Live (HTTP 200) |
| Admin | https://admin.greenngoria.com | ⏳ Needs TXT above |
| Client portal | https://portal.greenngoria.com | ⏳ Needs TXT above |
| API | https://api.greenngoria.com | ⏳ Needs TXT above |

Working `.vercel.app` fallback URLs (already fully functional):
- Frontend: https://gng-frontend-zeta.vercel.app
- API: https://gng-api-omega.vercel.app  (e.g. `/api/v1/health`)

---

## Follow-up (apex reclaim) — 2 more TXT records

A concurrent session re-pointed the **apex** `greenngoria.com` to a different
project, so to move it (and `www`) onto the build from this session it now
needs verification too. Add these **two more** TXT records at name `_vercel`
(alongside the three already there — a name can hold many TXT values):

| Type | Name      | Value                                                     |
|------|-----------|----------------------------------------------------------|
| TXT  | `_vercel` | `vc-domain-verify=greenngoria.com,b728036b31d514951ea4`     |
| TXT  | `_vercel` | `vc-domain-verify=www.greenngoria.com,38fb6aeff3125213490c` |

Add them in the Vercel account that manages greenngoria.com's DNS (the same
place the first three went), then tell me — I'll verify + redeploy so the
apex serves this session's build (3D hero + full ERP/POS platform).

Note: if the other session re-adds the domain afterwards, the apex could
flip back — worth pausing that session or deciding which build is canonical.
