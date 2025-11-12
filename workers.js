import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const startTime = Date.now()
  const url = new URL(event.request.url)

  // Interception de /robots.txt
  if (url.pathname === '/robots.txt') {
    try {
      const response = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/robots.txt`)
      })

      const originalText = await response.text()
      const duration = Date.now() - startTime
      const responseText = `${originalText}\n# Processing time: ${duration} ms`

      return new Response(responseText, {
        headers: {
          'Content-Type': 'text/plain; charset=UTF-8',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch (err) {
      const duration = Date.now() - startTime
      return new Response(`robots.txt not found\n# Processing time: ${duration} ms`, { status: 404 })
    }
  }

  // Pour toutes les autres requêtes
  const fetchResponse = await fetch(event.request)
  const duration = Date.now() - startTime
  const newHeaders = new Headers(fetchResponse.headers)
  newHeaders.set('X-Processing-Time-ms', duration.toString())

  const body = await fetchResponse.arrayBuffer() // lecture sûre du body
  return new Response(body, {
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    headers: newHeaders
  })
}
