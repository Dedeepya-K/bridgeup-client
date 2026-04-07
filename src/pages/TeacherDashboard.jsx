import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const SENTIMENT_CONFIG = {
  positive: { emoji: '✅', label: 'Positive', color: 'bg-green-100 text-green-800 border-green-200' },
  question: { emoji: '❓', label: 'Question',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  concern:  { emoji: '⚠️', label: 'Concern',   color: 'bg-red-100 text-red-800 border-red-200' },
}

const URGENCY_CONFIG = {
  low:    { label: 'Low',    color: 'text-gray-400' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high:   { label: 'High',   color: 'text-red-600 font-bold' },
}

const TONE_OPTIONS = [
  { value: 'friendly',    label: '😊 Friendly' },
  { value: 'formal',      label: '📋 Formal' },
  { value: 'supportive',  label: '🤗 Supportive' },
  { value: 'concise',     label: '⚡ Concise' },
]

function TeacherReplyBox({ replyId, messageId, parentId, teacherName, suggestedResponse }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/teacher-reply`, {
        parentId, teacherName, content: text, messageId
      })
      setSent(true)
      setText('')
      setTimeout(() => { setSent(false); setOpen(false) }, 2000)
    } catch(e) {}
    setSending(false)
  }

  if (sent) return <p className="text-xs text-green-600 font-medium">✅ Reply sent to parent!</p>

  return (
    <div className="mt-1">
      {!open ? (
        <button onClick={() => { setOpen(true); setText(suggestedResponse || '') }}
          className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition">
          ↩️ Reply to this parent
        </button>
      ) : (
        <div className="space-y-2 mt-1">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
            className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
            placeholder="Type your reply — will be translated to parent's language automatically..."/>
          <div className="flex gap-2">
            <button onClick={handleSend} disabled={sending || !text.trim()}
              className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
              {sending ? 'Sending...' : '📤 Send'}
            </button>
            <button onClick={() => setOpen(false)}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TeacherDashboard({ supabase, profile }) {
  const [tab, setTab] = useState('compose')
  const [subject, setSubject] = useState('Science')
  const [yearLevel, setYearLevel] = useState('8')
  const [rawContent, setRawContent] = useState('')
  const [tone, setTone] = useState('friendly')
  const [preview, setPreview] = useState(null)
  const [showRaw, setShowRaw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([])
  const [sent, setSent] = useState(false)
  const [engagement, setEngagement] = useState(null)
  const [expandedReplies, setExpandedReplies] = useState({})
  const [expandedSubjectTeacher, setExpandedSubjectTeacher] = useState(null)
  useEffect(() => { fetchMessages(); fetchEngagement(); }, [])

  const fetchMessages = async () => {
    const res = await axios.get(`${API}/api/teacher-messages/${profile.id}`)
    setMessages(res.data.data || [])
  }

  const fetchEngagement = async () => {
    const res = await axios.get(`${API}/api/engagement/${profile.id}`)
    if (res.data.success) setEngagement(res.data.data)
  }

  const handleTransform = async () => {
    if (!rawContent.trim()) return
    setLoading(true)
    setPreview(null)
    try {
      const res = await axios.post(`${API}/api/transform`, { rawContent, subject, yearLevel, tone })
      setPreview(res.data.data)
    } catch (e) { alert('Transform failed: ' + e.message) }
    setLoading(false)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await axios.post(`${API}/api/send-message`, {
        teacherId: profile.id, teacherName: profile.name,
        subject, rawContent, transformedData: preview
      })
      setSent(true)
      setRawContent(''); setPreview(null)
      fetchMessages(); fetchEngagement()
      setTimeout(() => { setSent(false); setTab('inbox') }, 2000)
    } catch (e) { alert('Send failed: ' + e.message) }
    setSending(false)
  }

  const handleLogout = () => supabase.auth.signOut()
  const toggleReplies = (msgId) => setExpandedReplies(prev => ({ ...prev, [msgId]: !prev[msgId] }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-teal-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌉</span>
          <div>
            <h1 className="text-xl font-bold">BridgeUp</h1>
            <p className="text-teal-200 text-xs">Teacher Portal — Powered by CurricuLLM</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">👋 {profile.name}</span>
          <button onClick={handleLogout} className="text-teal-200 hover:text-white text-sm">Sign out</button>
        </div>
      </header>

      <div className="bg-white border-b px-6 flex gap-6">
        {['compose', 'inbox', 'insights'].map(t => (
          <button key={t} onClick={() => { setTab(t); if(t==='inbox') fetchMessages(); if(t==='insights') fetchEngagement(); }}
            className={`py-4 text-sm font-medium border-b-2 transition ${tab===t ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t==='compose' ? '✏️ New Update' : t==='inbox' ? `📬 Sent Messages (${messages.length})` : '📊 Insights'}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto p-6">

        {/* ── COMPOSE ── */}
        {tab === 'compose' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>How it works:</strong> Write your lesson notes naturally. BridgeUp uses <strong>CurricuLLM</strong> to transform them into parent-friendly messages with personalised at-home tips for each family.
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">📝 This Week's Learning Update</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select value={subject} onChange={e => setSubject(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    {['Science','English','Mathematics','History','Geography','PDHPE'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                  <select value={yearLevel} onChange={e => setYearLevel(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    {['7','8','9','10','11','12'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Tone selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Communication tone</label>
                <div className="flex gap-2 flex-wrap">
                  {TONE_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => setTone(t.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${tone === t.value ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your lesson notes (write naturally)</label>
                <textarea value={rawContent} onChange={e => setRawContent(e.target.value)} rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="e.g. This week Year 8 Science covered bioprinting — how scientists use 3D printers to create human tissue..."/>
              </div>

              <button onClick={handleTransform} disabled={loading || !rawContent.trim()}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50">
                {loading ? '✨ Transforming with CurricuLLM...' : '✨ Transform for Parents'}
              </button>
            </div>

            {preview && (
              <div className="bg-white rounded-xl shadow p-6 space-y-5 border-2 border-teal-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-teal-700">👀 Preview — What Parents Will See</h2>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setShowRaw(!showRaw)}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition">
                      {showRaw ? '👁️ Show transformed' : '🔄 Before / After'}
                    </button>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">⚡ Powered by CurricuLLM</span>
                  </div>
                </div>

                {/* Before / After toggle */}
                {showRaw ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-2">📝 BEFORE — Teacher's raw notes:</p>
                    <p className="text-sm text-gray-600 italic">"{rawContent}"</p>
                  </div>
                ) : (
                  <>
                    {/* Curriculum alignment label */}
                    {preview.curriculumLabel && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 flex items-center gap-2">
                        <span className="text-indigo-600">🎓</span>
                        <p className="text-xs text-indigo-700 font-medium">{preview.curriculumLabel}</p>
                      </div>
                    )}

                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-teal-800 mb-1">📚 What your child is learning</p>
                      <p className="text-sm text-gray-700">{preview.parentSummary}</p>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-800 mb-1">💡 Why it matters</p>
                      <p className="text-sm text-gray-700">{preview.whyItMatters}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-green-800 mb-2">🏠 What parents can do at home</p>
                      <ul className="space-y-1">
                        {preview.atHomeTips.map((tip, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-green-600 font-bold">{i+1}.</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">✉️ Teacher's message</p>
                      <p className="text-sm text-gray-600 italic">"{preview.teacherMessage}"</p>
                    </div>

                    {/* Pedagogy note — teacher only */}
                    {preview.pedagogyNote && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                        <p className="text-xs text-purple-600"><strong>🧠 Educational theory (visible to teacher only):</strong> {preview.pedagogyNote}</p>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                      🌍 Will be automatically translated into each parent's preferred language. Tips personalised per child's interest profile.
                    </div>
                  </>
                )}

                {sent ? (
                  <div className="bg-green-100 text-green-800 text-center py-3 rounded-lg font-semibold">✅ Message sent to all parents!</div>
                ) : (
                  <button onClick={handleSend} disabled={sending || showRaw}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">
                    {sending ? 'Sending to all parents...' : '📤 Approve & Send to All Parents'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── INBOX ── */}
        {tab === 'inbox' && (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-800">Sent Messages & Parent Replies</h2>
      <button onClick={() => { fetchMessages(); fetchEngagement(); }} className="text-sm text-teal-600 hover:text-teal-800">🔄 Refresh</button>
    </div>

    {messages.length === 0 ? (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p>No messages sent yet.</p>
      </div>
    ) : (
      <>
        {/* Subject cards grid */}
        {(() => {
          const grouped = messages.reduce((acc, msg) => {
            const subj = msg.subject || 'General'
            if (!acc[subj]) acc[subj] = []
            acc[subj].push(msg)
            return acc
          }, {})

          const SUBJ_CFG = {
            'Science':     { icon: '🔬', header: 'bg-green-700',  border: 'border-green-300' },
            'English':     { icon: '📖', header: 'bg-blue-700',   border: 'border-blue-300' },
            'Mathematics': { icon: '🔢', header: 'bg-purple-700', border: 'border-purple-300' },
            'History':     { icon: '🏛️', header: 'bg-amber-700',  border: 'border-amber-300' },
            'Geography':   { icon: '🌍', header: 'bg-teal-700',   border: 'border-teal-300' },
            'PDHPE':       { icon: '⚽', header: 'bg-red-700',    border: 'border-red-300' },
            'General':     { icon: '📚', header: 'bg-gray-700',   border: 'border-gray-300' },
          }

          return (
            <>
              {/* Subject card grid — collapsed view */}
              {!expandedSubjectTeacher && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {Object.entries(grouped).map(([subject, subjectMsgs]) => {
                    const cfg = SUBJ_CFG[subject] || SUBJ_CFG['General']
                    const totalReplies = subjectMsgs.reduce((sum, m) => sum + (m.replies?.length || 0), 0)
                    const unrepliedConcerns = subjectMsgs.reduce((sum, m) => 
                      sum + (m.replies?.filter(r => r.sentiment === 'concern' || r.urgency === 'high').length || 0), 0)
                    const hasUnread = totalReplies > 0

                    return (
                      <button key={subject} onClick={() => setExpandedSubjectTeacher(subject)}
                        className={`rounded-xl border-2 overflow-hidden shadow hover:shadow-md transition text-left ${cfg.border}`}>
                        <div className={`${cfg.header} text-white px-4 py-3`}>
                          <div className="flex justify-between items-start">
                            <span className="text-2xl">{cfg.icon}</span>
                            <div className="flex flex-col items-end gap-1">
                              {unrepliedConcerns > 0 && (
                                <span className="bg-red-400 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                  ⚠️ {unrepliedConcerns} concern{unrepliedConcerns > 1 ? 's' : ''}
                                </span>
                              )}
                              {hasUnread && unrepliedConcerns === 0 && (
                                <span className="bg-yellow-300 text-yellow-900 text-xs px-2 py-0.5 rounded-full">
                                  💬 {totalReplies} repl{totalReplies > 1 ? 'ies' : 'y'}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="font-bold mt-2">{subject}</p>
                          <p className="text-xs opacity-75">{subjectMsgs.length} update{subjectMsgs.length > 1 ? 's' : ''} sent</p>
                        </div>
                        <div className="bg-white px-4 py-2">
                          <p className="text-xs text-gray-500">
                            {totalReplies > 0 ? `${totalReplies} parent repl${totalReplies > 1 ? 'ies' : 'y'}` : 'No replies yet'}
                          </p>
                          <p className="text-xs text-teal-600 font-medium mt-0.5">Tap to view →</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Expanded subject view */}
              {expandedSubjectTeacher && (() => {
                const cfg = SUBJ_CFG[expandedSubjectTeacher] || SUBJ_CFG['General']
                const subjectMsgs = grouped[expandedSubjectTeacher] || []
                return (
                  <div className={`rounded-xl border-2 overflow-hidden ${cfg.border}`}>
                    <div className={`${cfg.header} text-white px-5 py-3 flex justify-between items-center`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cfg.icon}</span>
                        <div>
                          <p className="font-bold text-lg">{expandedSubjectTeacher}</p>
                          <p className="text-xs opacity-75">{subjectMsgs.length} update{subjectMsgs.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <button onClick={() => setExpandedSubjectTeacher(null)}
                        className="text-white opacity-75 hover:opacity-100 text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        ← All subjects
                      </button>
                    </div>

                    <div className="bg-white divide-y">
                      {subjectMsgs.map(message => (
                        <div key={message.id} className="p-5 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">⚡ CurricuLLM</span>
                                <span className="text-xs text-gray-400">{new Date(message.created_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                              </div>
                              <p className="text-sm text-gray-700">{message.transformed_content}</p>
                            </div>
                          </div>

                          {message.replies?.length > 0 && (
                            <div className="border-t pt-3 space-y-2">
                              <button onClick={() => toggleReplies(message.id)} className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                              ref={el => { if (el && !expandedReplies[message.id] && message.replies?.length > 0) toggleReplies(message.id) }}>
                                💬 {message.replies.length} Parent {message.replies.length===1?'Reply':'Replies'} {expandedReplies[message.id]?'▲':'▼'}
                              </button>
                              {expandedReplies[message.id] && message.replies.map(r => {
                                const s = SENTIMENT_CONFIG[r.sentiment] || SENTIMENT_CONFIG.positive
                                const u = URGENCY_CONFIG[r.urgency] || URGENCY_CONFIG.low
                                return (
                                  <div key={r.id} className={`rounded-lg p-3 border space-y-2 ${s.color}`}>
                                    <div className="flex justify-between items-center flex-wrap gap-1">
                                      <p className="text-xs font-semibold">{r.parent_name}</p>
                                      <div className="flex gap-2 items-center">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-60">{s.emoji} {s.label}</span>
                                        <span className={`text-xs ${u.color}`}>Urgency: {u.label}</span>
                                      </div>
                                    </div>
                                    <p className="text-sm font-medium">🌐 {r.translated_content || r.content}</p>
                                    {r.translated_content && r.translated_content !== r.content && (
                                      <p className="text-xs opacity-70 italic">Original: "{r.content}"</p>
                                    )}
                                    {r.suggested_response && (
                                      <div className="bg-white bg-opacity-60 rounded p-2">
                                        <p className="text-xs font-semibold mb-0.5">💡 Suggested reply:</p>
                                        <p className="text-xs italic">"{r.suggested_response}"</p>
                                      </div>
                                    )}
                                    {!r.parent_name?.includes('(Teacher)') && (
                                          <TeacherReplyBox
                                            replyId={r.id}
                                            messageId={r.message_id}
                                            parentId={r.parent_id}
                                            teacherName={profile.name}
                                            suggestedResponse={r.suggested_response}
                                          />
                                        )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </>
          )
        })()}
      </>
    )}
  </div>
)}
        {/* ── INSIGHTS ── */}
        {tab === 'insights' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">📊 Parent Engagement Insights</h2>
            {!engagement ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Messages Sent',    value: engagement.totalMessages,  emoji: '📤', color: 'bg-teal-50 border-teal-200' },
                    { label: 'Parent Replies',    value: engagement.totalReplies,   emoji: '💬', color: 'bg-blue-50 border-blue-200' },
                    { label: 'Families Reached',  value: engagement.totalParents,   emoji: '👨‍👩‍👧', color: 'bg-purple-50 border-purple-200' },
                    { label: 'Activities Tried',  value: engagement.triedActivity || 0, emoji: '✅', color: 'bg-green-50 border-green-200' },
                  ].map(card => (
                    <div key={card.label} className={`rounded-xl border p-4 text-center ${card.color}`}>
                      <p className="text-2xl">{card.emoji}</p>
                      <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                    </div>
                  ))}
                </div>

                {engagement.totalReplies > 0 && (
                  <div className="bg-white rounded-xl shadow p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Reply Sentiment Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(engagement.sentiments).map(([key, val]) => {
                        const s = SENTIMENT_CONFIG[key]
                        const pct = Math.round((val / engagement.totalReplies) * 100)
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-sm w-24">{s?.emoji} {s?.label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-3">
                              <div className={`h-3 rounded-full ${key==='positive'?'bg-green-400':key==='question'?'bg-yellow-400':'bg-red-400'}`}
                                style={{ width: `${pct}%` }}/>
                            </div>
                            <span className="text-xs text-gray-500 w-16">{val} ({pct}%)</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {engagement.languages && (
                  <div className="bg-white rounded-xl shadow p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">🌍 Languages Reached</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(engagement.languages).map(([lang, count]) => (
                        <span key={lang} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                          {lang==='en'?'🇦🇺 English':lang==='hi'?'🇮🇳 Hindi':lang==='zh-Hans'?'🇨🇳 Mandarin':lang}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {engagement.highUrgency > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                    <strong>⚠️ {engagement.highUrgency} high-urgency {engagement.highUrgency===1?'reply':'replies'} detected.</strong>
                    <p className="mt-1">Check inbox — a parent may need immediate attention.</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
                  <p className="font-semibold mb-1">⚡ Powered by CurricuLLM AI Analysis</p>
                  <p>Sentiment auto-detected from parent replies to help prioritise responses. Always use professional judgment when following up.</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}