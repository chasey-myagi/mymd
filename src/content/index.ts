const MD_EXTENSIONS = /\.(md|mkd|mdx|markdown)$/i

function isMarkdownFile(): boolean {
  return MD_EXTENSIONS.test(window.location.pathname)
}

function getViewerUrl(originalUrl: string): string {
  const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
  return `${viewerUrl}?url=${encodeURIComponent(originalUrl)}`
}

if (isMarkdownFile()) {
  // Grab raw text before redirecting
  const rawText = document.body.innerText || document.body.textContent || ''

  // Store in session for viewer to pick up
  chrome.storage.session.set({
    [`file_content_${window.location.href}`]: rawText,
  }).then(() => {
    // Redirect to viewer
    window.location.href = getViewerUrl(window.location.href)
  })
}
