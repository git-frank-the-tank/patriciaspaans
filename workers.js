import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const startTime = Date.now()
  const url = new URL(event.request.url)

  // Fonction utilitaire pour servir un fichier depuis dist/
  async function serveAsset(path) {
    try {
      const response = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}${path}`)
      })
      const duration = Date.now() - startTime
      const newHeaders = new Headers(response.headers)
      newHeaders.set('X-Processing-Time-ms', duration.toString())
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      })
    } catch (err) {
      const duration = Date.now() - startTime
      return new Response(`${path} not found`, {
        status: 404,
        headers: { 'X-Processing-Time-ms': duration.toString() }
      })
    }
  }

  // Servir robots.txt
  if (url.pathname === '/robots.txt') {
    return serveAsset('/robots.txt')
  }

  // Servir sitemap-video.xml
  if (url.pathname === '/sitemap-video.xml') {
    return serveAsset('/sitemap-video.xml')
  }

  // Servir llms.txt
  if (url.pathname === '/llms.txt') {
    return serveAsset('/llms.txt')
  }

  // Pour tout le reste, laisser passer
  return fetch(event.request)
}
