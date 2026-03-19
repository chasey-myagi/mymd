const MD_EXTENSIONS = /\.(md|mkd|mdx|markdown)(\?.*)?$/i

function isMarkdownUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url)
    return MD_EXTENSIONS.test(pathname)
  } catch {
    return false
  }
}

function getViewerUrl(originalUrl: string): string {
  const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
  return `${viewerUrl}?url=${encodeURIComponent(originalUrl)}`
}

// Redirect HTTP/HTTPS .md URLs to viewer
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return
    if (!isMarkdownUrl(details.url)) return
    if (details.url.startsWith('chrome-extension://')) return

    chrome.tabs.update(details.tabId, {
      url: getViewerUrl(details.url),
    })
  },
  { url: [{ schemes: ['http', 'https', 'file'] }] }
)

// Handle content script messages (file:// raw text)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_FILE_CONTENT') {
    // Content script sends the raw text from file:// page
    sendResponse({ success: true })
    return true
  }

  if (message.type === 'FETCH_URL') {
    // Viewer requests content fetch for http/https
    fetch(message.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(text => sendResponse({ success: true, content: text }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true // async response
  }

  if (message.type === 'LIST_DIRECTORY') {
    // Fetch directory listing for file:// sidebar
    fetch(message.url)
      .then(res => res.text())
      .then(html => sendResponse({ success: true, html }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }
})

console.log('[mymd] Background service worker loaded')
