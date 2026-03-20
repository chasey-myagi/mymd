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

// Redirect HTTP/HTTPS .md URLs to viewer (file:// handled by content script)
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return
    if (!isMarkdownUrl(details.url)) return
    if (details.url.startsWith('chrome-extension://')) return
    // Skip file:// — content script handles these
    if (details.url.startsWith('file://')) return

    chrome.tabs.update(details.tabId, {
      url: getViewerUrl(details.url),
    })
  },
  { url: [{ schemes: ['http', 'https'] }] }
)

// Handle messages from content script and viewer
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NAVIGATE_FILE') {
    // Content script requests navigation to a file:// URL
    if (sender.tab?.id) {
      chrome.tabs.update(sender.tab.id, { url: message.url })
    }
    return false
  }

  if (message.type === 'FETCH_URL') {
    // Viewer requests content fetch for http/https
    try {
      const url = new URL(message.url)
      if (!['http:', 'https:'].includes(url.protocol)) {
        sendResponse({ success: false, error: 'Only HTTP/HTTPS URLs allowed' })
        return true
      }
    } catch {
      sendResponse({ success: false, error: 'Invalid URL' })
      return true
    }
    fetch(message.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(text => sendResponse({ success: true, content: text }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true // async response
  }

  if (message.type === 'FETCH_FILE') {
    // Content script or viewer requests file:// content (used for auto-refresh)
    try {
      const url = new URL(message.url)
      if (url.protocol !== 'file:') {
        sendResponse({ success: false, error: 'Only file:// URLs allowed' })
        return true
      }
    } catch {
      sendResponse({ success: false, error: 'Invalid URL' })
      return true
    }
    fetch(message.url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to read file`)
        return res.text()
      })
      .then(text => sendResponse({ success: true, content: text }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }

  if (message.type === 'LIST_DIRECTORY') {
    try {
      const url = new URL(message.url)
      if (url.protocol !== 'file:') {
        sendResponse({ success: false, error: 'Only file:// URLs allowed' })
        return true
      }
    } catch {
      sendResponse({ success: false, error: 'Invalid URL' })
      return true
    }
    // Fetch directory listing for file:// sidebar
    fetch(message.url)
      .then(res => res.text())
      .then(html => sendResponse({ success: true, html }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }
})

console.log('[mymd] Background service worker loaded')
