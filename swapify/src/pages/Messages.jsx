import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/messages.css'

const normalizeValue = (value) => String(value || '').trim()
const normalizeKey = (value) => String(value || '').trim().toLowerCase()

const seedThreads = () => ([
  {
    id: 'thread-alex-ross',
    participant: 'Alex Ross',
    participantKey: 'alex ross',
    preview: 'Hey! Is this still available?',
    updatedAt: '2m',
    messages: [
      { id: 'm1', from: 'them', text: 'Hey! Is this still available?', time: '10:21 AM' },
      { id: 'm2', from: 'me', text: 'Yes, it is available.', time: '10:24 AM' },
    ],
  },
  {
    id: 'thread-jordan-lee',
    participant: 'Jordan Lee',
    participantKey: 'jordan lee',
    preview: 'Could we meet tomorrow?',
    updatedAt: '1h',
    messages: [
      { id: 'm3', from: 'me', text: 'Interested in your listing!', time: 'Yesterday' },
      { id: 'm4', from: 'them', text: 'Could we meet tomorrow?', time: 'Yesterday' },
    ],
  },
])

const shortTime = () => {
  const now = new Date()
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function Messages() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [threadFilter, setThreadFilter] = useState('')
  const [threads, setThreads] = useState(seedThreads)
  const [activeThreadId, setActiveThreadId] = useState('')
  const initializedContextRef = useRef('')

  const query = useMemo(() => new URLSearchParams(location.search), [location.search])

  const seller = normalizeValue(query.get('seller'))
  const listingId = normalizeValue(query.get('listingId'))
  const listingTitle = normalizeValue(query.get('listingTitle'))
  const sellerKey = normalizeKey(seller)

  useEffect(() => {
    if (!sellerKey) {
      initializedContextRef.current = ''
      return
    }

    const contextKey = `${sellerKey}|${normalizeKey(listingTitle)}`
    if (initializedContextRef.current === contextKey) {
      return
    }

    setThreads((prev) => {
      const existing = prev.find((thread) => thread.participantKey === sellerKey)
      if (existing) {
        initializedContextRef.current = contextKey
        return prev
      }

      const newThread = {
        id: `thread-${sellerKey.replace(/\s+/g, '-') || 'new'}`,
        participant: seller,
        participantKey: sellerKey,
        preview: listingTitle ? `About: ${listingTitle}` : 'Start a conversation',
        updatedAt: 'now',
        messages: listingTitle
          ? [{ id: `m-${Date.now()}`, from: 'system', text: `Started chat about "${listingTitle}"`, time: shortTime() }]
          : [],
      }

      initializedContextRef.current = contextKey
      return [newThread, ...prev]
    })
  }, [seller, sellerKey, listingTitle])

  const resolvedActiveThreadId = useMemo(() => {
    if (!threads.length) return ''
    if (activeThreadId && threads.some((t) => t.id === activeThreadId)) {
      return activeThreadId
    }
    if (sellerKey) {
      const match = threads.find((t) => t.participantKey === sellerKey)
      if (match) return match.id
    }
    return threads[0].id
  }, [threads, activeThreadId, sellerKey])

  const filteredThreads = useMemo(() => {
    if (!threadFilter.trim()) return threads
    const needle = normalizeKey(threadFilter)
    return threads.filter((thread) => thread.participantKey.includes(needle))
  }, [threadFilter, threads])

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === resolvedActiveThreadId) || null,
    [threads, resolvedActiveThreadId]
  )

  const handleSend = () => {
    const trimmed = draft.trim()
    if (!trimmed || !activeThread) return

    const time = shortTime()

    setThreads((prev) => prev.map((thread) => {
      if (thread.id !== activeThread.id) return thread
      const nextMessages = [
        ...thread.messages,
        { id: `m-${Date.now()}`, from: 'me', text: trimmed, time },
      ]
      return {
        ...thread,
        messages: nextMessages,
        preview: trimmed,
        updatedAt: 'now',
      }
    }))

    setDraft('')
  }

  return (
    <main className="messages-page">
      <Navbar searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} />

      <section className="dm-shell">
        <aside className="dm-sidebar">
          <div className="dm-sidebar-header">
            <h1>Messages</h1>
          </div>

          <div className="dm-search-wrap">
            <input
              type="text"
              value={threadFilter}
              onChange={(e) => setThreadFilter(e.target.value)}
              placeholder="Search chats"
              className="dm-thread-search"
            />
          </div>

          <div className="dm-thread-list">
            {filteredThreads.length > 0 ? filteredThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`dm-thread-item ${thread.id === resolvedActiveThreadId ? 'active' : ''}`}
                onClick={() => setActiveThreadId(thread.id)}
              >
                <div className="dm-thread-avatar">{thread.participant.charAt(0).toUpperCase()}</div>
                <div className="dm-thread-meta">
                  <div className="dm-thread-top-row">
                    <span className="dm-thread-name">{thread.participant}</span>
                    <span className="dm-thread-time">{thread.updatedAt}</span>
                  </div>
                  <span className="dm-thread-preview">{thread.preview}</span>
                </div>
              </button>
            )) : (
              <p className="dm-empty-list">No matching chats.</p>
            )}
          </div>
        </aside>

        <div className="dm-chat-pane">
          {activeThread ? (
            <>
              <header className="dm-chat-header">
                <div className="dm-chat-user">
                  <div className="dm-thread-avatar">{activeThread.participant.charAt(0).toUpperCase()}</div>
                  <div>
                    <h2>{activeThread.participant}</h2>
                    {listingId && sellerKey === activeThread.participantKey ? (
                      <p>
                        About{' '}
                        <Link to={`/post/${encodeURIComponent(listingId)}`}>
                          {listingTitle || 'this listing'}
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </div>
              </header>

              <div className="dm-messages-scroll">
                {activeThread.messages.length > 0 ? activeThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`dm-bubble-row ${message.from === 'me' ? 'from-me' : message.from === 'system' ? 'from-system' : 'from-them'}`}
                  >
                    <div className="dm-bubble">
                      {message.text}
                      <span className="dm-bubble-time">{message.time}</span>
                    </div>
                  </div>
                )) : (
                  <p className="dm-empty-chat">Say hi to start the conversation.</p>
                )}
              </div>

              <footer className="dm-composer">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${activeThread.participant}`}
                  className="dm-composer-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <button
                  type="button"
                  className="dm-send-button"
                  disabled={!draft.trim()}
                  onClick={handleSend}
                >
                  Send
                </button>
              </footer>
            </>
          ) : (
            <div className="dm-empty-state">
              <h2>Your messages</h2>
              <p>Choose a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default Messages
