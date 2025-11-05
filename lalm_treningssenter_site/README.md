# Lalm Treningssenter – Nettside (demo klar til bruk)

Fullstendig miniløsning for innmelding, kontrakt og betaling med Stripe Checkout.

## Hva du får
- Framside med innmeldingsskjema og avkryssing for kontrakt/personvern
- Stripe Checkout for abonnementsbetaling (måned/år)
- SQLite-database for medlemmer og samtykke
- Webhook som aktiverer medlemsstatus når betaling er fullført
- Enkle sider for kontrakt, husregler, personvern, suksess/avbrutt

## Kom i gang (lokalt)
1. Installer Node 18+.
2. I prosjektmappa:
   ```bash
   npm install
   cp .env.example .env
   # Fyll inn STRIPE_SECRET_KEY og STRIPE_WEBHOOK_SECRET
   # Sett PUBLIC_BASE_URL=http://localhost:3000
   npm run start
   ```
3. Start Stripe CLI for webhook lokalt (valgfritt men anbefalt):
   ```bash
   stripe listen --forward-to localhost:3000/webhook
   # Lim inn webhook secret i .env som STRIPE_WEBHOOK_SECRET
   ```
4. Åpne http://localhost:3000 og test innmelding.

## Produkter og pris
- Som standard opprettes priser «on the fly»: 249,-/mnd og 1 999,-/år.
- Alternativt kan du definere PRICE_ID fra Stripe (MONTHLY_PRICE_ID, YEARLY_PRICE_ID).

## Produksjon
- Host på en Node-plattform (Railway, Render, Fly.io, VPS el.l.).
- Sett `PUBLIC_BASE_URL` til den offentlige URLen.
- Sett opp Stripe webhook mot `https://din-url/webhook`.

## Videre arbeid
- Knytte tilgangssystem (QR/adgang) ved «active» status.
- Egen administrasjon for å se medlemmer.
- Tripletex-integrasjon for fakturering om ønskelig.
- E-postkvitteringer (Stripe) kan aktiveres i Stripe Dashboard.
- Legg til Google Analytics/Matomo hvis ønskelig (ikke inkludert).

## Miljøvariabler (.env)
```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PUBLIC_BASE_URL=https://din-produksjons-url
# Valgfritt:
# MONTHLY_PRICE_ID=price_xxx
# YEARLY_PRICE_ID=price_xxx
```

## Sikkerhet og etterlevelse
- Denne demoen bruker Stripe for betaling og lagrer kun nødvendige medlemsdata i SQLite.
- Sørg for databehandleravtaler med leverandører (Stripe/Tripletex).
- Kameraskilt/overvåking må følge norsk lov. Hent råd fra Datatilsynet.
- Ta jevnlige sikkerhetskopier av databasen `lalm_treningssenter.sqlite`.

## Enkle admin-oppslag
Når betaling er fullført (webhook), blir medlemmet satt til `active`. Du kan verifisere med:
```
GET /api/member/:id
```
(Bruker-IDen følger som `m`-parameter i `success.html`-URLen.)

## Tilpasninger
- Tekst og priser: endre i `public/*.html` og i `server.js` (beløp/Stripe-priser).
- Legg inn egen logo/farger i `public/styles.css`.
- Legg til «Drop-in»/uke-passer i Checkout ved å legge flere `line_items` eller egne knapper/planer.

## Ofte stilte spørsmål
**Kan vi bruke Tripletex i stedet for Stripe?**  
Ja, men da må betalingsflyten endres til fakturering. Denne demoen er optimalisert for kort/abonnement via Stripe.

**Hvordan koble til adgangssystem?**  
Når status `active`, kan dere kalle et API mot adgangssystemet for å opprette bruker/nøkkel. Legg til kall i webhook-håndteringen.

**Hvordan kansellere medlemskap?**  
Gjør det i Stripe Dashboard eller bygg et lite «Min side» der kunden kan avslutte abonnementet.

---

**Lisens:** MIT. Bruk, modifiser og distribuer fritt. Ingen garanti.