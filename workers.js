import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const startTime = Date.now() // Début du calcul du temps
  const url = new URL(event.request.url)

  // Si on demande /robots.txt, on sert le fichier du répertoire /dist
  if (url.pathname === '/robots.txt') {
    try {
      const response = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/robots.txt`)
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // On lit le contenu original et on y ajoute le temps de traitement
      const originalText = await response.text()
      const responseText = `${originalText}\n# Processing time: ${duration} ms`

      return new Response(responseText, {
        headers: {
          'Content-Type': 'text/plain; charset=UTF-8',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch (err) {
      const endTime = Date.now()
      const duration = endTime - startTime
      return new Response(`robots.txt not found\n# Processing time: ${duration} ms`, { status: 404 })
    }
  }

  // Pour tout le reste, laisser passer normalement
  const fetchResponse = await fetch(event.request)
  const endTime = Date.now()
  const duration = endTime - startTime

  // Optionnel : ajouter un header pour mesurer le temps sur les autres requêtes
  const newHeaders = new Headers(fetchResponse.headers)
  newHeaders.set('X-Processing-Time-ms', duration)

  return new Response(fetchResponse.body, {
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    headers: newHeaders
  })
}
