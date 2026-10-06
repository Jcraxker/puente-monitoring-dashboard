const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, 'dist')
const PORT = 5137

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const mimeOf = p => MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0])
  if (urlPath === '/') urlPath = '/index.html'
  let filePath = path.join(ROOT, urlPath)
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return
  }
  fs.stat(filePath, (err, st) => {
    if (!err && st.isFile()) {
      res.writeHead(200, { 'Content-Type': mimeOf(filePath) })
      fs.createReadStream(filePath).pipe(res)
      return
    }
    if (!err && st.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
      fs.stat(filePath, (err2, st2) => {
        if (!err2 && st2.isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          fs.createReadStream(filePath).pipe(res)
        } else {
          res.writeHead(404); res.end('Not Found')
        }
      })
      return
    }
    // SPA fallback
    const index = path.join(ROOT, 'index.html')
    fs.stat(index, (err3, st3) => {
      if (!err3 && st3.isFile()) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        fs.createReadStream(index).pipe(res)
      } else {
        res.writeHead(404); res.end('Not Found')
      }
    })
  })
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Static server serving ${ROOT} on port ${PORT}`)
})
