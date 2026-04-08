import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://bridgeup-server-production.up.railway.app'

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
      await axios.post(`${API}/api/teacher-reply`, { parentId, teacherName, content: text, messageId })
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
  const [unengaged, setUnengaged] = useState([])
  const [ptmRequests, setPtmRequests] = useState([])
  const [allParents, setAllParents] = useState([])
  const [dmParentId, setDmParentId] = useState('')
  const [dmSubject, setDmSubject] = useState('')
  const [dmContent, setDmContent] = useState('')
  const [dmSending, setDmSending] = useState(false)
  const [dmSent, setDmSent] = useState(false)
  const [frictionData, setFrictionData] = useState([])
  const [weeklyReport, setWeeklyReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [familyFeed, setFamilyFeed] = useState([])
  const [feedAverage, setFeedAverage] = useState(0)
  const [nudges, setNudges] = useState({})
  const [nudgeLoading, setNudgeLoading] = useState({})
  const [naplanNote, setNaplanNote] = useState('')
  const [naplanResult, setNaplanResult] = useState('')
  const [naplanLoading, setNaplanLoading] = useState(false)
  const [naplanSubject, setNaplanSubject] = useState('English')
  const [naplanYear, setNaplanYear] = useState('8')
  const [emojiInsights, setEmojiInsights] = useState([])
  const [engagementScores, setEngagementScores] = useState([])
  const [parentActivity, setParentActivity] = useState([])
  const [appointments, setAppointments] = useState([])
  const [reminderType, setReminderType] = useState('exam')
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderNote, setReminderNote] = useState('')
  const [reminderParent, setReminderParent] = useState('')
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [broadcastContent, setBroadcastContent] = useState('')
const [broadcastSubject, setBroadcastSubject] = useState('')
const [broadcastUrgent, setBroadcastUrgent] = useState(false)
const [broadcastSending, setBroadcastSending] = useState(false)
const [broadcastSent, setBroadcastSent] = useState(false)
const [broadcastCount, setBroadcastCount] = useState(0)

  useEffect(() => {
    fetchMessages()
    fetchEngagement()
    axios.get(`${API}/api/all-parents`).then(r => setAllParents(r.data.data || [])).catch(() => {})
  }, [])

  const fetchMessages = async () => {
    const res = await axios.get(`${API}/api/teacher-messages/${profile.id}`)
    setMessages(res.data.data || [])
  }

  const fetchEngagement = async () => {
    const res = await axios.get(`${API}/api/engagement/${profile.id}`)
    if (res.data.success) setEngagement(res.data.data)
    const res2 = await axios.get(`${API}/api/unengaged/${profile.id}`)
    if (res2.data.success) setUnengaged(res2.data.data)
    const res3 = await axios.get(`${API}/api/ptm-requests/${profile.id}`)
    if (res3.data.success) setPtmRequests(res3.data.data)
    const res4 = await axios.get(`${API}/api/friction-forecast/${profile.id}`)
    if (res4.data.success) setFrictionData(res4.data.data)
    const res5 = await axios.get(`${API}/api/family-feed/${profile.id}`)
    if (res5.data.success) { setFamilyFeed(res5.data.data); setFeedAverage(res5.data.classAverage || 0) }
    const res6 = await axios.get(`${API}/api/emoji-insights/${profile.id}`)
    if (res6.data.success) setEmojiInsights(res6.data.data)
    const res7 = await axios.get(`${API}/api/appointments/teacher/${profile.id}`)
    if (res7.data.success) setAppointments(res7.data.data)
    const res8 = await axios.get(`${API}/api/parent-engagement-scores/${profile.id}`)
    if (res8.data.success) setEngagementScores(res8.data.data)
    const res9 = await axios.get(`${API}/api/parent-activity/${profile.id}`)
    if (res9.data.success) setParentActivity(res9.data.data)
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

  const handleDmSend = async () => {
    if (!dmParentId || !dmContent.trim()) return
    setDmSending(true)
    try {
      await axios.post(`${API}/api/direct-message`, {
        teacherId: profile.id, teacherName: profile.name,
        parentId: dmParentId, subject: dmSubject || 'Message from Teacher', content: dmContent
      })
      setDmSent(true)
      setDmContent(''); setDmSubject(''); setDmParentId('')
      setTimeout(() => setDmSent(false), 3000)
    } catch(e) { alert('Failed to send: ' + e.message) }
    setDmSending(false)
  }

  const handleSendReminder = async () => {
    if (!reminderTitle || !reminderDate) return
    setReminderSending(true)
    try {
      await axios.post(`${API}/api/send-reminder`, {
        teacherId: profile.id, type: reminderType,
        title: reminderTitle, date: reminderDate,
        note: reminderNote, targetParentId: reminderParent || null
      })
      setReminderSent(true)
      setReminderTitle(''); setReminderDate(''); setReminderNote(''); setReminderParent('')
      setTimeout(() => setReminderSent(false), 3000)
    } catch(e) {}
    setReminderSending(false)
  }

  const handleLogout = () => supabase.auth.signOut()
  const toggleReplies = (msgId) => setExpandedReplies(prev => ({ ...prev, [msgId]: !prev[msgId] }))

  const downloadPDF = () => {
    const reportWindow = window.open('', '_blank')
    reportWindow.document.write(`<!DOCTYPE html><html><head><title>BridgeUp Weekly Report</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#333}h1{color:#0d9488;border-bottom:3px solid #0d9488;padding-bottom:10px}h2{color:#1e40af;margin-top:25px}.metric{display:inline-block;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 20px;margin:8px;text-align:center}.metric-value{font-size:28px;font-weight:bold;color:#0d9488}.metric-label{font-size:12px;color:#666}.summary{background:#f0fdfa;border-left:4px solid #0d9488;padding:15px;border-radius:4px}.sentiment{display:flex;gap:15px;flex-wrap:wrap}.badge{padding:5px 12px;border-radius:20px;font-size:13px}.positive{background:#dcfce7;color:#166534}.question{background:#fef9c3;color:#854d0e}.concern{background:#fee2e2;color:#991b1b}.footer{margin-top:40px;padding-top:15px;border-top:1px solid #e5e7eb;font-size:11px;color:#999;text-align:center}.subject-item{padding:6px 12px;background:#f8fafc;border-radius:6px;margin:4px 0}</style></head><body>
    <h1>🌉 BridgeUp Weekly Engagement Report</h1>
    <p><strong>Teacher:</strong> ${weeklyReport.teacherName}</p>
    <p><strong>Generated:</strong> ${new Date(weeklyReport.generatedAt).toLocaleString('en-AU')}</p>
    <h2>📊 Key Metrics</h2>
    <div>
      <div class="metric"><div class="metric-value">${weeklyReport.totalMessages}</div><div class="metric-label">Messages Sent</div></div>
      <div class="metric"><div class="metric-value">${weeklyReport.totalReplies}</div><div class="metric-label">Parent Replies</div></div>
      <div class="metric"><div class="metric-value">${weeklyReport.tried}</div><div class="metric-label">Activities Tried</div></div>
      <div class="metric"><div class="metric-value">${Object.keys(weeklyReport.languages).length}</div><div class="metric-label">Languages</div></div>
    </div>
    <h2>📝 Summary</h2>
    <div class="summary">${weeklyReport.summary}</div>
    <h2>📚 Subjects</h2>
    ${Object.entries(weeklyReport.subjectBreakdown).map(([s,c]) => `<div class="subject-item">📖 ${s} — ${c} update${c>1?'s':''}</div>`).join('')}
    <h2>💬 Sentiment</h2>
    <div class="sentiment">
      <span class="badge positive">✅ Positive: ${weeklyReport.sentiments?.positive || 0}</span>
      <span class="badge question">❓ Questions: ${weeklyReport.sentiments?.question || 0}</span>
      <span class="badge concern">⚠️ Concerns: ${weeklyReport.sentiments?.concern || 0}</span>
    </div>
    <h2>🌍 Languages</h2>
    <div class="sentiment">${Object.entries(weeklyReport.languages).map(([lang,count]) => `<span class="badge positive">${lang==='en'?'🇦🇺 English':lang==='hi'?'🇮🇳 Hindi':lang==='zh-Hans'?'🇨🇳 Mandarin':lang}: ${count}</span>`).join('')}</div>
    <div class="footer"><p>Generated by BridgeUp — Powered by CurricuLLM 🎓</p><p>Australian Privacy Act 1988 Compliant</p></div>
    </body></html>`)
    reportWindow.document.close()
    setTimeout(() => reportWindow.print(), 500)
  }

  // ── Reminder Form (reusable) ──
  const ReminderForm = () => (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h3 className="text-base font-semibold text-gray-800">🔔 Send Reminder to Parents</h3>
      <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
        Send exam reminders, absence notices, or activity alerts directly to parents.
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reminder type</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'exam', label: '📝 Exam' },
            { value: 'absent', label: '🏠 Absence Notice' },
            { value: 'assessment', label: '📊 Assessment' },
            { value: 'event', label: '🎉 Class Activity' },
          ].map(t => (
            <button key={t.value} onClick={() => setReminderType(t.value)}
              className={`px-3 py-2 rounded-lg text-xs border transition text-left ${reminderType === t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input value={reminderTitle} onChange={e => setReminderTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g. Year 8 Maths Exam, Emma absent Tuesday..."/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
        <textarea value={reminderNote} onChange={e => setReminderNote(e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Additional details for parents..."/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Send to</label>
        <select value={reminderParent} onChange={e => setReminderParent(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">📢 All parents</option>
          {allParents.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.child_name})</option>
          ))}
        </select>
      </div>
      {reminderSent ? (
        <div className="bg-green-100 text-green-800 text-center py-3 rounded-lg font-semibold">✅ Reminder sent!</div>
      ) : (
        <button onClick={handleSendReminder} disabled={reminderSending || !reminderTitle || !reminderDate}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
          {reminderSending ? 'Sending...' : '📤 Send Reminder'}
        </button>
      )}
    </div>
  )

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

      <div className="bg-white border-b px-6 flex gap-6 overflow-x-auto">
        {['compose', 'inbox', 'insights', 'direct', 'schedule', 'naplan'].map(t => (
          <button key={t} onClick={() => {
            setTab(t)
            if(t==='inbox') fetchMessages()
            if(t==='insights'||t==='naplan'||t==='schedule') fetchEngagement()
          }}
            className={`py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab===t ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t==='compose' ? '✏️ New Update' : t==='inbox' ? `📬 Sent (${messages.length})` : t==='insights' ? '📊 Insights' : t==='direct' ? '✉️ Direct' : t==='schedule' ? '📅 Schedule' : '📈 NAPLAN'}
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
                {showRaw ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-2">📝 BEFORE — Teacher's raw notes:</p>
                    <p className="text-sm text-gray-600 italic">"{rawContent}"</p>
                  </div>
                ) : (
                  <>
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
                      {!expandedSubjectTeacher && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                          {Object.entries(grouped).map(([subject, subjectMsgs]) => {
                            const cfg = SUBJ_CFG[subject] || SUBJ_CFG['General']
                            const totalReplies = subjectMsgs.reduce((sum, m) => sum + (m.replies?.length || 0), 0)
                            const unrepliedConcerns = subjectMsgs.reduce((sum, m) =>
                              sum + (m.replies?.filter(r => r.sentiment === 'concern' || r.urgency === 'high').length || 0), 0)
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
                                      {totalReplies > 0 && unrepliedConcerns === 0 && (
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
                                  <p className="text-xs text-gray-500">{totalReplies > 0 ? `${totalReplies} parent repl${totalReplies > 1 ? 'ies' : 'y'}` : 'No replies yet'}</p>
                                  <p className="text-xs text-teal-600 font-medium mt-0.5">Tap to view →</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
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
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">⚡ CurricuLLM</span>
                                    <span className="text-xs text-gray-400">{new Date(message.created_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{message.transformed_content}</p>
                                  {message.replies?.length > 0 && (
                                    <div className="border-t pt-3 space-y-2">
                                      <button onClick={() => toggleReplies(message.id)}
                                        className="text-xs font-semibold text-teal-700 hover:text-teal-900"
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
                                              <div className="bg-white bg-opacity-60 rounded p-2 space-y-1">
                                                <p className="text-xs font-semibold mb-0.5">💡 Suggested reply:</p>
                                                <p className="text-xs italic">"{r.suggested_response}"</p>
                                                {r.non_curriculum_flag && (
                                                  <div className="bg-yellow-50 border border-yellow-200 rounded p-1.5 mt-1">
                                                    <p className="text-xs text-yellow-700">⚠️ Mixed message detected: <span className="font-medium">{r.non_curriculum_flag}</span> — refer to school office.</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            {!r.parent_name?.includes('(Teacher)') && (
                                              <TeacherReplyBox
                                                replyId={r.id} messageId={r.message_id}
                                                parentId={r.parent_id} teacherName={profile.name}
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
            {engagement && (
              <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl p-4 text-white space-y-1">
                <p className="text-xs font-semibold opacity-75 uppercase tracking-wide">⚡ BridgeUp Impact This Week</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{Math.round((engagement.totalMessages || 0) * 12.5)} mins</p>
                    <p className="text-xs opacity-80">Admin time saved</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{Math.round((engagement.totalParents || 0) * 847)}</p>
                    <p className="text-xs opacity-80">Words translated for EAL/D families</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{engagement.totalParents || 0} families</p>
                    <p className="text-xs opacity-80">Reached in their language</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{engagement.triedActivity || 0} activities</p>
                    <p className="text-xs opacity-80">Completed at home</p>
                  </div>
                </div>
                <p className="text-xs opacity-60 text-center mt-1">Powered by CurricuLLM 🎓</p>
              </div>
            )}
            {!engagement ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Messages Sent',   value: engagement.totalMessages,      emoji: '📤', color: 'bg-teal-50 border-teal-200' },
                    { label: 'Parent Replies',   value: engagement.totalReplies,       emoji: '💬', color: 'bg-blue-50 border-blue-200' },
                    { label: 'Families Reached', value: engagement.totalParents,       emoji: '👨‍👩‍👧', color: 'bg-purple-50 border-purple-200' },
                    { label: 'Activities Tried', value: engagement.triedActivity || 0, emoji: '✅', color: 'bg-green-50 border-green-200' },
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
                      {Object.entries(engagement.sentiments).filter(([key]) => ['positive','question','concern'].includes(key)).map(([key, val]) => {
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
                {unengaged.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-bold text-orange-800">
                      📭 {unengaged.length} {unengaged.length === 1 ? 'family has' : 'families have'} not yet engaged
                    </p>
                    <p className="text-xs text-orange-600">These parents have received messages but haven't replied yet. Consider a follow-up.</p>
                    <div className="space-y-1">
                      {unengaged.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                          <span className="text-sm">👤</span>
                          <span className="text-sm text-gray-700">{p.name}</span>
                          {p.childName && <span className="text-xs text-gray-400">({p.childName})</span>}
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full ml-auto">
                            {p.language === 'hi' ? '🇮🇳 Hindi' : p.language === 'zh-Hans' ? '🇨🇳 Mandarin' : '🇦🇺 English'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {frictionData.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-bold text-yellow-800">🔮 Friction Forecast — Topics Parents Struggled With</p>
                    {frictionData.map((f, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-gray-800">{f.subject}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${f.percentage >= 40 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {f.percentage}% struggled
                          </span>
                        </div>
                        <p className="text-xs text-teal-700">{f.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
                {familyFeed.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-green-800">🏃 Live Family Activity Feed</p>
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">{feedAverage}% class engaged</span>
                    </div>
                    <div className="space-y-1.5">
                      {familyFeed.slice(0, 5).map((f, i) => (
                        <div key={i} className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
                          <span className="text-sm">{f.feedback === 'tried' ? '✅' : '😕'}</span>
                          <span className="text-sm text-gray-700"><strong>{f.childName || f.parentName}</strong> {f.feedback === 'tried' ? 'completed' : 'tried but struggled with'} {f.subject} activity</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-orange-800">💬 Smart Nudges for Unengaged Families</p>
                  {unengaged.length === 0 ? (
                    <p className="text-xs text-orange-600">All families are engaged! 🎉</p>
                  ) : unengaged.map((p, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold">{p.name} ({p.childName})</p>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          {p.language === 'hi' ? '🇮🇳' : p.language === 'zh-Hans' ? '🇨🇳' : '🇦🇺'} {p.language}
                        </span>
                      </div>
                      {nudges[p.parentId] ? (
                        <div className="bg-teal-50 rounded p-2 space-y-2">
                          <p className="text-xs text-teal-800">💡 {nudges[p.parentId]}</p>
                          <button onClick={() => {
                            setDmParentId(p.parentId)
                            setDmContent(nudges[p.parentId])
                            setDmSubject('A quick note about your child')
                            setTab('direct')
                          }} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition w-full">
                            📤 Apply — Send as Direct Message
                          </button>
                        </div>
                      ) : (
                        <button onClick={async () => {
                          setNudgeLoading(n => ({ ...n, [p.parentId]: true }))
                          try {
                            const res = await axios.post(`${API}/api/engagement-nudge`, {
                              parentName: p.name, childName: p.childName,
                              language: p.language, availability: 'evening',
                              confidence: 'medium', lastSubject: messages[0]?.subject || 'Mathematics'
                            })
                            setNudges(n => ({ ...n, [p.parentId]: res.data.nudge }))
                          } catch(e) {}
                          setNudgeLoading(n => ({ ...n, [p.parentId]: false }))
                        }} disabled={nudgeLoading[p.parentId]}
                          className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 disabled:opacity-50">
                          {nudgeLoading[p.parentId] ? '✨ Generating...' : '✨ Generate Smart Nudge'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-800">📄 Weekly School Report</p>
                    <button onClick={async () => {
                      setReportLoading(true)
                      try {
                        const res = await axios.get(`${API}/api/weekly-report/${profile.id}`)
                        if (res.data.success) setWeeklyReport(res.data.data)
                      } catch(e) {}
                      setReportLoading(false)
                    }} disabled={reportLoading} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50">
                      {reportLoading ? '⏳ Generating...' : '📊 Generate Report'}
                    </button>
                  </div>
                  {weeklyReport && (
                    <div className="space-y-3">
                      <div className="bg-teal-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{weeklyReport.summary}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-blue-50 rounded-lg p-2"><p className="font-bold text-blue-800">{weeklyReport.totalMessages}</p><p className="text-gray-500">Updates</p></div>
                        <div className="bg-green-50 rounded-lg p-2"><p className="font-bold text-green-800">{weeklyReport.tried}</p><p className="text-gray-500">Activities</p></div>
                        <div className="bg-purple-50 rounded-lg p-2"><p className="font-bold text-purple-800">{Object.keys(weeklyReport.languages).length}</p><p className="text-gray-500">Languages</p></div>
                      </div>
                      <p className="text-xs text-gray-400 text-center">Generated {new Date(weeklyReport.generatedAt).toLocaleString('en-AU')}</p>
                      <button onClick={downloadPDF} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                        📥 Download PDF Report
                      </button>
                    </div>
                  )}
                </div>
                {emojiInsights.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-5 space-y-3">
                    <p className="text-sm font-bold text-gray-800">😊 Parent Feedback Insights</p>
                    <p className="text-xs text-gray-500">Auto-generated from parent emoji responses via CurricuLLM</p>
                    <div className="space-y-2">
                      {emojiInsights.map((e, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-700">{e.subject}</span>
                            <div className="flex gap-2">
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ {e.tried} tried</span>
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">😕 {e.struggled} struggled</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${e.pct}%` }}/>
                          </div>
                          <p className="text-xs text-teal-700 italic">💡 {e.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {engagementScores.length > 0 && (
  <div className="bg-white rounded-xl shadow p-5 space-y-3">
    <p className="text-sm font-bold text-gray-800">📊 Parent Engagement Scores</p>
    <p className="text-xs text-gray-500">Based on activities tried, messages read and replies sent</p>
    <div className="space-y-2">
      {engagementScores.map((p, i) => (
        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <span className="text-lg">{p.emoji}</span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-800">{p.name}
                <span className="text-gray-400 font-normal text-xs ml-1">({p.childName})</span>
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.level === 'High' ? 'bg-green-100 text-green-700' : p.level === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {p.score}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div className={`h-1.5 rounded-full ${p.level === 'High' ? 'bg-green-500' : p.level === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${p.score}%` }}/>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              ✅ {p.tried} activities · 💬 {p.replies} replies · 👁 {p.read} read
              · {p.language === 'hi' ? '🇮🇳' : p.language === 'zh-Hans' ? '🇨🇳' : '🇦🇺'} {p.language}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{parentActivity.length > 0 && (
  <div className="bg-white rounded-xl shadow p-5 space-y-3">
    <div className="flex justify-between items-center">
      <p className="text-sm font-bold text-gray-800">👁️ Family Engagement Tracker</p>
      <span className="text-xs text-gray-400">To identify families who may need extra support</span>
    </div>
    <div className="space-y-2">
      {parentActivity.map((p, i) => (
        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            p.statusColor === 'green' ? 'bg-green-500' :
            p.statusColor === 'yellow' ? 'bg-yellow-400' :
            p.statusColor === 'orange' ? 'bg-orange-400' :
            p.statusColor === 'red' ? 'bg-red-400' : 'bg-gray-300'
          } ${p.statusColor === 'green' ? 'animate-pulse' : ''}`}/>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-800">
                {p.name}
                <span className="text-gray-400 font-normal text-xs ml-1">({p.childName})</span>
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                p.statusColor === 'green' ? 'bg-green-100 text-green-700' :
                p.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                p.statusColor === 'orange' ? 'bg-orange-100 text-orange-700' :
                p.statusColor === 'red' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {p.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {p.language === 'hi' ? '🇮🇳' : p.language === 'zh-Hans' ? '🇨🇳' : '🇦🇺'} {p.language}
              {p.loginCount > 0 && ` · ${p.loginCount} login${p.loginCount > 1 ? 's' : ''}`}
              {p.lastSeen && ` · Last: ${new Date(p.lastSeen).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-400 text-center">🟢 Active · 🟡 Recent · 🔴 May need a check-in</p>
    <p className="text-xs text-gray-400 text-center">Use this to support families, not to assess them. Parents are informed of this tracking.</p>
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

        {/* ── DIRECT MESSAGE ── */}
        {tab === 'direct' && (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>✉️ Direct Message</strong> — Send a private message to a specific parent. It will be automatically translated into their language.
            </div>
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Send Direct Message</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Parent</label>
                <select value={dmParentId} onChange={e => setDmParentId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">-- Select a parent --</option>
                  {allParents.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.child_name ? `(${p.child_name})` : ''} — {p.language === 'hi' ? '🇮🇳 Hindi' : p.language === 'zh-Hans' ? '🇨🇳 Mandarin' : '🇦🇺 English'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input value={dmSubject} onChange={e => setDmSubject(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="e.g. Follow-up on last week's assessment"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={dmContent} onChange={e => setDmContent(e.target.value)} rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Write your message here — it will be automatically translated for the parent..."/>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                🌍 This message will be automatically translated into the parent's preferred language before delivery.
              </div>
              {dmSent ? (
                <div className="bg-green-100 text-green-800 text-center py-3 rounded-lg font-semibold">✅ Message sent!</div>
              ) : (
                <button onClick={handleDmSend} disabled={dmSending || !dmParentId || !dmContent.trim()}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50">
                  {dmSending ? 'Sending...' : '📤 Send Direct Message'}
                </button>
              )}
            </div>
          </div>
        )}
        {/* BROADCAST */}
<div className="bg-white rounded-xl shadow p-6 space-y-4">
  <div className="flex items-center gap-3">
    <span className="text-2xl">📢</span>
    <div>
      <h2 className="text-lg font-semibold text-gray-800">Broadcast to All Parents</h2>
      <p className="text-xs text-gray-500">Send an instant notice to every family — auto-translated to their language</p>
    </div>
  </div>

  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
    <button onClick={() => setBroadcastUrgent(!broadcastUrgent)}
      className={`relative w-10 h-6 rounded-full transition-colors ${broadcastUrgent ? 'bg-red-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${broadcastUrgent ? 'left-4.5 translate-x-0.5' : 'left-0.5'}`}/>
    </button>
    <div>
      <p className="text-sm font-semibold text-red-700">🚨 Mark as Urgent</p>
      <p className="text-xs text-red-500">Adds URGENT prefix in parent's language</p>
    </div>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
    <input value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      placeholder="e.g. School closure tomorrow, Excursion reminder..."/>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
    <textarea value={broadcastContent} onChange={e => setBroadcastContent(e.target.value)} rows={4}
      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      placeholder="e.g. Dear families, school will be closed tomorrow due to a staff development day..."/>
  </div>

  <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
    ⚡ This message will be sent immediately to all {allParents.length} families and auto-translated into their language. No CurricuLLM transform — exactly as written.
  </div>

  {broadcastSent ? (
    <div className="bg-green-100 text-green-800 text-center py-3 rounded-lg font-semibold">
      ✅ Broadcast sent to {broadcastCount} families!
    </div>
  ) : (
    <button onClick={async () => {
      if (!broadcastContent.trim()) return
      setBroadcastSending(true)
      try {
        const res = await axios.post(`${API}/api/broadcast`, {
          teacherId: profile.id, teacherName: profile.name,
          subject: broadcastSubject || 'Important Notice',
          content: broadcastContent, urgent: broadcastUrgent
        })
        if (res.data.success) {
          setBroadcastSent(true)
          setBroadcastCount(res.data.sentTo)
          setBroadcastContent(''); setBroadcastSubject(''); setBroadcastUrgent(false)
          setTimeout(() => setBroadcastSent(false), 5000)
          fetchMessages()
        }
      } catch(e) {}
      setBroadcastSending(false)
    }} disabled={broadcastSending || !broadcastContent.trim()}
      className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 text-white ${broadcastUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
      {broadcastSending ? 'Sending to all families...' : `📢 ${broadcastUrgent ? '🚨 Send Urgent Broadcast' : 'Send Broadcast'} to All ${allParents.length} Families`}
    </button>
  )}
</div>

        {/* ── SCHEDULE ── */}
        {tab === 'schedule' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">📅 Schedule & Reminders</h2>
            <ReminderForm />

            {ptmRequests.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-blue-800">📅 {ptmRequests.length} Meeting Request{ptmRequests.length > 1 ? 's' : ''}</p>
                <div className="space-y-2">
                  {ptmRequests.map((r, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{r.parent_name} <span className="text-gray-400 font-normal">({r.child_name})</span></p>
                        <p className="text-xs text-blue-600">🕐 {r.preferred_time}</p>
                        {r.reason && <p className="text-xs text-gray-500 mt-0.5">"{r.reason}"</p>}
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appointments.length > 0 ? (
              <div className="bg-white rounded-xl shadow p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-800">📋 Appointment Requests ({appointments.length})</h3>
                <div className="space-y-2">
                  {appointments.map((a, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{a.parent_name} <span className="text-gray-400 font-normal">({a.child_name})</span></p>
                          <p className="text-xs text-blue-600">📋 {a.appointment_type}</p>
                          <p className="text-xs text-gray-500">📅 {new Date(a.preferred_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })} at {a.preferred_time}</p>
                          {a.note && <p className="text-xs text-gray-400 italic">"{a.note}"</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : a.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {a.status === 'confirmed' ? '✅ Confirmed' : a.status === 'cancelled' ? '❌ Cancelled' : '⏳ Pending'}
                        </span>
                      </div>
                      {a.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            await axios.post(`${API}/api/update-appointment-status`, { appointmentId: a.id, status: 'confirmed' })
                            const res = await axios.get(`${API}/api/appointments/teacher/${profile.id}`)
                            if (res.data.success) setAppointments(res.data.data)
                          }} className="flex-1 text-xs bg-green-600 text-white py-1.5 rounded-lg hover:bg-green-700">
                            ✅ Confirm
                          </button>
                          <button onClick={async () => {
                            await axios.post(`${API}/api/update-appointment-status`, { appointmentId: a.id, status: 'cancelled' })
                            const res = await axios.get(`${API}/api/appointments/teacher/${profile.id}`)
                            if (res.data.success) setAppointments(res.data.data)
                          }} className="flex-1 text-xs bg-red-100 text-red-700 py-1.5 rounded-lg hover:bg-red-200">
                            ❌ Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : ptmRequests.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">No appointment requests yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── NAPLAN ── */}
        {tab === 'naplan' && (
          <div className="space-y-5">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
              <strong>📈 NAPLAN Progress Snapshot</strong>
              <p className="mt-1">Turn your progress notes into parent-friendly NAPLAN updates with targeted home tips.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select value={naplanSubject} onChange={e => setNaplanSubject(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {['English','Mathematics','Science'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                  <select value={naplanYear} onChange={e => setNaplanYear(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {['3','5','7','8','9','10'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your progress note</label>
                <textarea value={naplanNote} onChange={e => setNaplanNote(e.target.value)} rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Year 3 reading improving — strong comprehension but needs work on vocabulary..."/>
              </div>
              <button onClick={async () => {
                if (!naplanNote.trim()) return
                setNaplanLoading(true)
                try {
                  const res = await axios.post(`${API}/api/naplan-snapshot`, { teacherNote: naplanNote, yearLevel: naplanYear, subject: naplanSubject })
                  setNaplanResult(res.data.message)
                } catch(e) {}
                setNaplanLoading(false)
              }} disabled={naplanLoading || !naplanNote.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {naplanLoading ? '✨ Generating with CurricuLLM...' : '📊 Generate NAPLAN Update'}
              </button>
              {naplanResult && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-indigo-600">📬 Parent-Ready NAPLAN Message:</p>
                  <p className="text-sm text-gray-700">{naplanResult}</p>
                  <p className="text-xs text-indigo-400">Powered by CurricuLLM 🎓</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}