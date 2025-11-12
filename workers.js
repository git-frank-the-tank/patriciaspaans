import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const startTime = Date.now()
  const url = new URL(event.request.url)

  // Intercepter /robots.txt
  if (url.pathname === '/robots.txt') {
    try {
      const response = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/robots.txt`)
      })

      const duration = Date.now() - startTime

      // On retourne le fichier avec un header indiquant le temps de traitement
      const newHeaders = new Headers(response.headers)
      newHeaders.set('X-Processing-Time-ms', duration.toString())

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      })

    } catch (err) {
      const duration = Date.now() - startTime
      return new Response('robots.txt not found', {
        status: 404,
        headers: { 'X-Processing-Time-ms': duration.toString() }
      })
    }
  }

  // Pour tout le reste, passer à travers
  return fetch(event.request)
}
