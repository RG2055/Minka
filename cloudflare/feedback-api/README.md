# Minka feedback API

Atsevišķs Cloudflare Worker un D1 datubāze maiņu vērtējumiem, komentāriem un idejām.
Tas neizmanto un nemaina `minka-api` vai `minka-db`.

## Izvietošana

```bash
npx wrangler@latest d1 migrations apply minka-feedback-db --remote
npx wrangler@latest deploy --minify
```

Worker: `minka-feedback-api`

D1: `minka-feedback-db`

## Veiktspēja

- Nav WebSocket un nav periodiskas aptaujas.
- Dienas vērtējumi un divi ierakstu skaitītāji tiek nolasīti vienā D1 `batch`.
- Komentāri un idejas tiek ielādēti tikai pēc attiecīgās pogas nospiešanas.
- Ziņas tiek lapotas pa 50; API vienā reizē atļauj ne vairāk par 100.
- Strauji emoji klikšķi PWA pusē tiek apvienoti vienā `delta` pieprasījumā.
