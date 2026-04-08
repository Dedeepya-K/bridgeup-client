import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://bridgeup-server-production.up.railway.app'

const SENTIMENT_CONFIG = {
  positive: { emoji: '✅', label: 'Positive', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  question: { emoji: '❓', label: 'Question',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  concern:  { emoji: '⚠️', label: 'Concern',   color: 'bg-red-50 text-red-700 border-red-200' },
}

const URGENCY_CONFIG = {
  low:    { label: 'Low',    color: 'text-gray-400' },
  medium: { label: 'Medium', color: 'text-amber-500' },
  high:   { label: 'High',   color: 'text-red-600 font-bold' },
}

const TONE_OPTIONS = [
  { value: 'friendly',   label: '😊 Friendly' },
  { value: 'formal',     label: '📋 Formal' },
  { value: 'supportive', label: '🤗 Supportive' },
  { value: 'concise',    label: '⚡ Concise' },
]

function TeacherReplyBox({ messageId, parentId, teacherName, suggestedResponse }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await axios.post(`${API}/api/teacher-reply`, { parentId, teacherName, content: text, messageId })
      setSent(true); setText('')
      setTimeout(() => { setSent(false); setOpen(false) }, 2000)
    } catch(e) {}
    setSending(false)
  }

  if (sent) return <p className="text-xs text-emerald-600 font-medium">✅ Reply sent!</p>

  return (
    <div className="mt-2">
      {!open ? (
        <button onClick={() => { setOpen(true); setText(suggestedResponse || '') }}
          className="text-xs px-3 py-1.5 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 font-medium transition">
          ↩️ Reply
        </button>
      ) : (
        <div className="space-y-2 mt-1">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
            className="input-base text-xs"
            placeholder="Reply — auto-translated to parent's language..."/>
          <div className="flex gap-2">
            <button onClick={handleSend} disabled={sending || !text.trim()} className="btn-primary text-xs px-4 py-1.5">
              {sending ? 'Sending...' : '📤 Send'}
            </button>
            <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TeacherDashboard({ supabase, profile }) {
  const [teacherConsentGiven, setTeacherConsentGiven] = useState(
  () => localStorage.getItem(`teacher_consent_${profile.id}`) === 'true'
)
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
    fetchMessages(); fetchEngagement()
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
    setLoading(true); setPreview(null)
    try {
      const res = await axios.post(`${API}/api/transform`, { rawContent, subject, yearLevel, tone })
      setPreview(res.data.data)
    } catch(e) { alert('Transform failed') }
    setLoading(false)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await axios.post(`${API}/api/send-message`, {
        teacherId: profile.id, teacherName: profile.name,
        subject, rawContent, transformedData: preview
      })
      setSent(true); setRawContent(''); setPreview(null)
      fetchMessages(); fetchEngagement()
      setTimeout(() => { setSent(false); setTab('inbox') }, 2000)
    } catch(e) { alert('Send failed') }
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
      setDmSent(true); setDmContent(''); setDmSubject(''); setDmParentId('')
      setTimeout(() => setDmSent(false), 3000)
    } catch(e) {}
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

  const handleBroadcast = async () => {
    if (!broadcastContent.trim()) return
    setBroadcastSending(true)
    try {
      const res = await axios.post(`${API}/api/broadcast`, {
        teacherId: profile.id, teacherName: profile.name,
        subject: broadcastSubject || 'Important Notice',
        content: broadcastContent, urgent: broadcastUrgent
      })
      if (res.data.success) {
        setBroadcastSent(true); setBroadcastCount(res.data.sentTo)
        setBroadcastContent(''); setBroadcastSubject(''); setBroadcastUrgent(false)
        setTimeout(() => setBroadcastSent(false), 5000)
        fetchMessages()
      }
    } catch(e) {}
    setBroadcastSending(false)
  }

  const handleLogout = () => supabase.auth.signOut()
  const toggleReplies = (msgId) => setExpandedReplies(prev => ({ ...prev, [msgId]: !prev[msgId] }))

  const downloadPDF = () => {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>BridgeUp Weekly Report</title><style>body{font-family:'DM Sans',Arial,sans-serif;max-width:800px;margin:40px auto;color:#111827}h1{color:#6C47FF;border-bottom:3px solid #6C47FF;padding-bottom:10px}h2{color:#4B0FA8;margin-top:25px}.metric{display:inline-block;background:#EDE9FF;border:1px solid #C4B5FD;border-radius:12px;padding:12px 20px;margin:8px;text-align:center}.metric-value{font-size:28px;font-weight:700;color:#6C47FF}.metric-label{font-size:12px;color:#6B7280}.summary{background:#F5F3FF;border-left:4px solid #6C47FF;padding:15px;border-radius:4px}.footer{margin-top:40px;padding-top:15px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;text-align:center}</style></head><body>
    <h1>🌉 BridgeUp Weekly Report</h1>
    <p><strong>Teacher:</strong> ${weeklyReport.teacherName}</p>
    <p><strong>Generated:</strong> ${new Date(weeklyReport.generatedAt).toLocaleString('en-AU')}</p>
    <h2>Key Metrics</h2>
    <div>
      <div class="metric"><div class="metric-value">${weeklyReport.totalMessages}</div><div class="metric-label">Messages Sent</div></div>
      <div class="metric"><div class="metric-value">${weeklyReport.totalReplies}</div><div class="metric-label">Replies</div></div>
      <div class="metric"><div class="metric-value">${weeklyReport.tried}</div><div class="metric-label">Activities</div></div>
      <div class="metric"><div class="metric-value">${Object.keys(weeklyReport.languages).length}</div><div class="metric-label">Languages</div></div>
    </div>
    <h2>Summary</h2><div class="summary">${weeklyReport.summary}</div>
    <div class="footer"><p>BridgeUp — Powered by CurricuLLM 🎓 · Australian Privacy Act 1988 Compliant · H-AI-H Human-Centered AI Principles</p></div>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const TABS = [
    { id: 'compose',  label: '✏️ New Update' },
    { id: 'inbox',    label: `📬 Sent (${messages.length})` },
    { id: 'insights', label: '📊 Insights' },
    { id: 'direct',   label: '✉️ Direct' },
    { id: 'schedule', label: '📅 Schedule' },
    { id: 'naplan',   label: '📈 NAPLAN' },
  ]

  const SUBJ_CFG = {
    'Science':     { icon: '🔬', color: 'bg-emerald-600' },
    'English':     { icon: '📖', color: 'bg-blue-600' },
    'Mathematics': { icon: '🔢', color: 'bg-violet-600' },
    'History':     { icon: '🏛️', color: 'bg-amber-600' },
    'Geography':   { icon: '🌍', color: 'bg-teal-600' },
    'PDHPE':       { icon: '⚽', color: 'bg-red-600' },
    'General':     { icon: '📚', color: 'bg-gray-600' },
  }

  const ReminderForm = () => (
    <div className="card p-6 space-y-4">
      <p className="eyebrow">Send Reminder</p>
      <h3 className="text-base font-semibold text-gray-900">🔔 Notify Parents</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: 'exam',       label: '📝 Exam' },
          { value: 'absent',     label: '🏠 Absence' },
          { value: 'assessment', label: '📊 Assessment' },
          { value: 'event',      label: '🎉 Event' },
        ].map(t => (
          <button key={t.value} onClick={() => setReminderType(t.value)}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${reminderType === t.value ? 'text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
            style={reminderType === t.value ? { background: '#6C47FF' } : {}}>
            {t.label}
          </button>
        ))}
      </div>
      <input value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} className="input-base" placeholder="e.g. Year 8 Maths Exam next Tuesday"/>
      <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-base"/>
      <textarea value={reminderNote} onChange={e => setReminderNote(e.target.value)} rows={2} className="input-base" placeholder="Additional details (optional)"/>
      <select value={reminderParent} onChange={e => setReminderParent(e.target.value)} className="input-base">
        <option value="">📢 All parents</option>
        {allParents.map(p => <option key={p.id} value={p.id}>{p.name} ({p.child_name})</option>)}
      </select>
      {reminderSent ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-center py-3 rounded-xl font-semibold text-sm">✅ Reminder sent!</div>
      ) : (
        <button onClick={handleSendReminder} disabled={reminderSending || !reminderTitle || !reminderDate} className="btn-primary w-full">
          {reminderSending ? 'Sending...' : '📤 Send Reminder'}
        </button>
      )}
    </div>
  )

  if (!teacherConsentGiven) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F3FF' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#6C47FF' }}>🌉</div>
            <h1 className="text-2xl font-bold text-gray-900">BridgeUp — Teacher Portal</h1>
            <p className="text-gray-500 text-sm mt-1">Before you continue, please read your responsibilities</p>
          </div>
          <div className="rounded-xl p-4 space-y-3 text-sm text-gray-700" style={{ background: '#F5F3FF' }}>
            <p className="font-semibold" style={{ color: '#4B0FA8' }}>📋 Your responsibilities under H-AI-H</p>
            <p><strong>Human oversight:</strong> All AI-generated content must be reviewed and edited by you before sending to families. You are the qualified educator — AI assists, never replaces.</p>
            <p><strong>Accuracy:</strong> CurricuLLM may produce inaccurate or biased content. Always verify curriculum facts and check cultural appropriateness before approving messages.</p>
            <p><strong>Machine translation:</strong> Parent messages are machine-translated. For critical communications, verify with EAL/D families directly.</p>
            <p><strong>Data controller:</strong> You are the data controller for student and family information processed through BridgeUp. Handle all data in accordance with your school's privacy policy.</p>
            <p><strong>Privacy:</strong> Do not enter sensitive student welfare information into BridgeUp. For urgent welfare concerns, use your school's official channels.</p>
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">Compliant with the Australian Privacy Act 1988 · Australian Framework for Generative AI in Schools (2023) · H-AI-H Human-Centered AI Principles</p>
          </div>
          <button onClick={() => {
            localStorage.setItem(`teacher_consent_${profile.id}`, 'true')
            setTeacherConsentGiven(true)
          }} className="btn-primary w-full py-3">
            I understand my responsibilities — Continue to BridgeUp
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: '#6C47FF' }}>🌉</div>
          <div>
            <h1 className="text-base font-bold text-gray-900">BridgeUp</h1>
            <p className="eyebrow" style={{ marginTop: 0 }}>Teacher Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">👋 {profile.name}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 transition">Sign out</button>
        </div>
      </header>

      {/* ── TAB BAR ── */}
      <div className="bg-white border-b border-gray-100 px-6 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => {
            setTab(t.id)
            if (t.id === 'inbox') fetchMessages()
            if (['insights','naplan','schedule'].includes(t.id)) fetchEngagement()
          }}
            className={`py-4 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.id ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">

        {/* ── COMPOSE ── */}
        {tab === 'compose' && (
          <div className="space-y-5">

            {/* H-AI-H Info Card */}
            <div className="card p-5 text-white" style={{ background: '#4B0FA8' }}>
              <p className="eyebrow" style={{ color: '#C4B5FD' }}>CURRICULLM AI · H-AI-H FRAMEWORK</p>
              <p className="text-white font-semibold mt-1">Write your lesson notes naturally — CurricuLLM transforms them into parent-friendly messages.</p>
              <div className="mt-3 rounded-xl bg-white bg-opacity-10 p-3 text-xs space-y-1" style={{ color: '#E0D7FF' }}>
                <p>✏️ <strong>Your role:</strong> Start with your notes → review AI output → edit if needed → approve to send</p>
                <p>⚠️ <strong>AI may hallucinate</strong> — always verify curriculum facts before sending to families</p>
                <p>⚖️ <strong>AI may reflect bias</strong> — review tips for cultural appropriateness for all families</p>
                <p>🌍 <strong>Translated messages</strong> are machine-translated — check with EAL/D families if unsure</p>
              </div>
            </div>

            {/* Compose Form */}
            <div className="card p-6 space-y-4">
              <p className="eyebrow">New Learning Update</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject</label>
                  <select value={subject} onChange={e => setSubject(e.target.value)} className="input-base">
                    {['Science','English','Mathematics','History','Geography','PDHPE'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Year Level</label>
                  <select value={yearLevel} onChange={e => setYearLevel(e.target.value)} className="input-base">
                    {['7','8','9','10','11','12'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tone</label>
                <div className="flex gap-2 flex-wrap">
                  {TONE_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => setTone(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${tone === t.value ? 'text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
                      style={tone === t.value ? { background: '#6C47FF' } : {}}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Your lesson notes</label>
                <textarea value={rawContent} onChange={e => setRawContent(e.target.value)} rows={5} className="input-base"
                  placeholder="e.g. This week Year 8 Science covered bioprinting — how scientists use 3D printers to create human tissue..."/>
              </div>
              <button onClick={handleTransform} disabled={loading || !rawContent.trim()} className="btn-primary w-full">
                {loading ? '✨ Transforming with CurricuLLM...' : '✨ Transform for Parents'}
              </button>
            </div>

            {/* Preview with editable fields */}
            {preview && (
              <div className="card p-6 space-y-4" style={{ borderColor: '#C4B5FD', borderWidth: 2 }}>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="eyebrow">Preview — Edit Before Sending</p>
                    <h3 className="text-base font-semibold text-gray-900">What parents will see</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRaw(!showRaw)} className="btn-ghost text-xs px-3 py-1.5">
                      {showRaw ? '👁️ Show transformed' : '🔄 Before/After'}
                    </button>
                    <span className="badge" style={{ background: '#EDE9FF', color: '#6C47FF' }}>⚡ CurricuLLM</span>
                  </div>
                </div>

                {showRaw ? (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="eyebrow mb-2">Before — raw notes</p>
                    <p className="text-sm text-gray-600 italic">"{rawContent}"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {preview.curriculumLabel && (
                      <div className="rounded-xl px-4 py-2.5 flex gap-2 items-center" style={{ background: '#EDE9FF' }}>
                        <span>🎓</span>
                        <p className="text-xs font-semibold" style={{ color: '#6C47FF' }}>{preview.curriculumLabel}</p>
                      </div>
                    )}

                    {/* Editable: What your child is learning */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                      <p className="text-xs font-semibold text-gray-500">📚 What your child is learning <span className="font-normal text-gray-400">(editable)</span></p>
                      <textarea
                        value={preview.parentSummary}
                        onChange={e => setPreview(p => ({ ...p, parentSummary: e.target.value }))}
                        rows={3}
                        className="input-base text-sm mt-1"
                      />
                    </div>

                    {/* Editable: Why it matters */}
                    <div className="bg-amber-50 rounded-xl p-4 space-y-1">
                      <p className="text-xs font-semibold text-amber-700">💡 Why it matters <span className="font-normal text-gray-400">(editable)</span></p>
                      <textarea
                        value={preview.whyItMatters}
                        onChange={e => setPreview(p => ({ ...p, whyItMatters: e.target.value }))}
                        rows={2}
                        className="input-base text-sm mt-1"
                      />
                    </div>

                    {/* Editable: At-home tips */}
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-emerald-700 mb-2">🏠 At-home tips <span className="font-normal text-gray-400">(click each to edit)</span></p>
                      <div className="space-y-2">
                        {preview.atHomeTips.map((tip, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="font-bold text-emerald-600 mt-2.5 flex-shrink-0 text-sm">{i+1}.</span>
                            <textarea
                              value={tip}
                              onChange={e => {
                                const newTips = [...preview.atHomeTips]
                                newTips[i] = e.target.value
                                setPreview(p => ({ ...p, atHomeTips: newTips }))
                              }}
                              rows={2}
                              className="input-base text-sm flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {preview.pedagogyNote && (
                      <div className="rounded-xl px-4 py-2.5 border" style={{ background: '#EDE9FF', borderColor: '#C4B5FD' }}>
                        <p className="text-xs" style={{ color: '#4B0FA8' }}>
                          <strong>🧠 Pedagogy note (teacher only):</strong> {preview.pedagogyNote}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* H-AI-H Human Review Notice */}
                <div className="rounded-xl px-4 py-3 text-xs space-y-1" style={{ background: '#EDE9FF', color: '#4B0FA8' }}>
                  <p className="font-semibold">✏️ Human review required — H-AI-H Framework</p>
                  <p className="opacity-75">Please review and edit the AI-generated content above before sending. You are responsible for the accuracy of this message as the qualified educator. CurricuLLM may occasionally produce inaccurate information.</p>
                </div>

                {sent ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-center py-3 rounded-xl font-semibold text-sm">
                    ✅ Sent to all parents!
                  </div>
                ) : (
                  <button onClick={handleSend} disabled={sending || showRaw} className="btn-primary w-full">
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
              <div>
                <p className="eyebrow">Sent Messages</p>
                <h2 className="text-lg font-semibold text-gray-900">Parent Replies</h2>
              </div>
              <button onClick={() => { fetchMessages(); fetchEngagement() }} className="btn-ghost text-xs px-3 py-1.5">🔄 Refresh</button>
            </div>

            {messages.length === 0 ? (
              <div className="card p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm">No messages sent yet.</p>
              </div>
            ) : (() => {
              const grouped = messages.reduce((acc, msg) => {
                const subj = msg.subject || 'General'
                if (!acc[subj]) acc[subj] = []
                acc[subj].push(msg)
                return acc
              }, {})

              return (
                <>
                  {!expandedSubjectTeacher && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 items-stretch">
  {Object.entries(grouped).map(([subj, msgs]) => {
    const cfg = SUBJ_CFG[subj] || SUBJ_CFG['General']
    const totalReplies = msgs.reduce((s, m) => s + (m.replies?.length || 0), 0)
    const concerns = msgs.reduce((s, m) => s + (m.replies?.filter(r => r.sentiment === 'concern' || r.urgency === 'high').length || 0), 0)
    return (
      <button key={subj} onClick={() => setExpandedSubjectTeacher(subj)}
        className="card overflow-hidden text-left hover:shadow-md transition flex flex-col">
        
        {/* Fixed height header — prevents title length affecting card size */}
        <div className={`${cfg.color} p-4 text-white relative flex flex-col justify-end`} style={{ minHeight: '112px' }}>
          
          {/* Badge — always top right, shown when replies exist */}
          {concerns > 0 && (
            <span className="absolute top-3 right-3 badge bg-red-400 text-white animate-pulse">⚠️ {concerns}</span>
          )}
          {totalReplies > 0 && concerns === 0 && (
            <span className="absolute top-3 right-3 badge bg-yellow-300 text-yellow-900">💬 {totalReplies}</span>
          )}

          <span className="text-2xl mb-2">{cfg.icon}</span>

          {/* line-clamp-2 prevents title from growing the card */}
          <p className="font-semibold text-sm leading-snug line-clamp-2">{subj}</p>
          <p className="text-xs opacity-75 mt-0.5">{msgs.length} update{msgs.length > 1 ? 's' : ''}</p>
        </div>

        {/* Body — flex-1 + justify-between pins View → to bottom */}
        <div className="flex-1 bg-white px-4 py-3 flex flex-col justify-between">
          <p className="text-xs text-gray-500">
            {totalReplies > 0 ? `${totalReplies} repl${totalReplies > 1 ? 'ies' : 'y'}` : 'No replies yet'}
          </p>
          <p className="text-xs font-semibold mt-2" style={{ color: '#6C47FF' }}>View →</p>
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
                      <div className="card overflow-hidden">
                        <div className={`${cfg.color} text-white px-5 py-3 flex justify-between items-center`}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{cfg.icon}</span>
                            <div>
                              <p className="font-bold text-lg">{expandedSubjectTeacher}</p>
                              <p className="text-xs opacity-75">{subjectMsgs.length} update{subjectMsgs.length > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <button onClick={() => setExpandedSubjectTeacher(null)}
                            className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-lg hover:bg-opacity-30 transition">
                            ← Back
                          </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {subjectMsgs.map(message => (
                            <div key={message.id} className="p-5 space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="badge" style={{ background: '#EDE9FF', color: '#6C47FF' }}>⚡ CurricuLLM</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(message.created_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{message.transformed_content}</p>
                              {message.replies?.length > 0 && (
                                <div className="border-t border-gray-100 pt-3 space-y-2">
                                  <button onClick={() => toggleReplies(message.id)}
                                    className="text-xs font-semibold hover:opacity-70" style={{ color: '#6C47FF' }}
                                    ref={el => { if (el && !expandedReplies[message.id] && message.replies?.length > 0) toggleReplies(message.id) }}>
                                    💬 {message.replies.length} {message.replies.length === 1 ? 'Reply' : 'Replies'} {expandedReplies[message.id] ? '▲' : '▼'}
                                  </button>
                                  {expandedReplies[message.id] && message.replies.map(r => {
                                    const s = SENTIMENT_CONFIG[r.sentiment] || SENTIMENT_CONFIG.positive
                                    const u = URGENCY_CONFIG[r.urgency] || URGENCY_CONFIG.low
                                    return (
                                      <div key={r.id} className={`rounded-xl p-3 border space-y-2 ${s.color}`}>
                                        <div className="flex justify-between items-center flex-wrap gap-1">
                                          <p className="text-xs font-semibold">{r.parent_name}</p>
                                          <div className="flex gap-2 items-center">
                                            <span className="badge bg-white bg-opacity-60">{s.emoji} {s.label}</span>
                                            <span className={`text-xs ${u.color}`}>{u.label}</span>
                                          </div>
                                        </div>
                                        <p className="text-sm">🌐 {r.translated_content || r.content}</p>
                                        {r.translated_content && r.translated_content !== r.content && (
                                          <p className="text-xs opacity-60 italic">Original: "{r.content}"</p>
                                        )}
                                        {r.suggested_response && (
                                          <div className="bg-white bg-opacity-60 rounded-lg p-2 text-xs space-y-1">
                                            <p className="font-semibold">💡 Suggested reply:</p>
                                            <p className="italic">"{r.suggested_response}"</p>
                                            {r.non_curriculum_flag && (
                                              <div className="bg-amber-50 border border-amber-200 rounded p-1.5 mt-1">
                                                <p className="text-amber-700">⚠️ Mixed message: <span className="font-medium">{r.non_curriculum_flag}</span> — refer to school office.</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        {!r.parent_name?.includes('(Teacher)') && (
                                          <TeacherReplyBox
                                            messageId={r.message_id} parentId={r.parent_id}
                                            teacherName={profile.name} suggestedResponse={r.suggested_response}
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
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {tab === 'insights' && (
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Analytics</p>
              <h2 className="text-lg font-semibold text-gray-900">Parent Engagement Insights</h2>
            </div>

            {engagement && (
              <div className="card p-5 text-white" style={{ background: '#4B0FA8' }}>
                <p className="eyebrow" style={{ color: '#C4B5FD' }}>BRIDGE INSIGHTS</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[
                    { value: `${Math.round((engagement.totalMessages || 0) * 12.5)} mins`, label: 'Admin time saved' },
                    { value: Math.round((engagement.totalParents || 0) * 847), label: 'Words translated' },
                    { value: `${engagement.totalParents || 0}`, label: 'Families reached' },
                    { value: `${engagement.triedActivity || 0}`, label: 'Activities done' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs opacity-75">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!engagement ? (
              <div className="card p-12 text-center text-gray-400">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Messages Sent',    value: engagement.totalMessages,      emoji: '📤', bg: 'bg-violet-50', text: 'text-violet-700' },
                    { label: 'Parent Replies',   value: engagement.totalReplies,       emoji: '💬', bg: 'bg-blue-50',   text: 'text-blue-700' },
                    { label: 'Families Reached', value: engagement.totalParents,       emoji: '👨‍👩‍👧', bg: 'bg-amber-50',  text: 'text-amber-700' },
                    { label: 'Activities Tried', value: engagement.triedActivity || 0, emoji: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                  ].map(c => (
                    <div key={c.label} className={`card p-4 text-center ${c.bg}`}>
                      <p className="text-2xl">{c.emoji}</p>
                      <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{c.label}</p>
                    </div>
                  ))}
                </div>

                {engagement.totalReplies > 0 && (
                  <div className="card p-5">
                    <p className="eyebrow mb-3">Reply Sentiment</p>
                    <div className="space-y-2.5">
                      {Object.entries(engagement.sentiments)
                        .filter(([key]) => ['positive', 'question', 'concern'].includes(key))
                        .map(([key, val]) => {
                          const s = SENTIMENT_CONFIG[key]
                          const pct = Math.round((val / engagement.totalReplies) * 100)
                          return (
                            <div key={key} className="flex items-center gap-3">
                              <span className="text-sm w-24 text-gray-600">{s?.emoji} {s?.label}</span>
                              <div className="progress-bar flex-1">
                                <div className="progress-fill" style={{ width: `${pct}%`, background: key === 'positive' ? '#10B981' : key === 'question' ? '#F59E0B' : '#EF4444' }}/>
                              </div>
                              <span className="text-xs text-gray-500 w-16">{val} ({pct}%)</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {engagement.languages && (
                  <div className="card p-5">
                    <p className="eyebrow mb-3">Languages Reached</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(engagement.languages).map(([lang, count]) => (
                        <span key={lang} className="badge" style={{ background: '#EDE9FF', color: '#6C47FF' }}>
                          {lang === 'en' ? '🇦🇺 English' : lang === 'hi' ? '🇮🇳 Hindi' : lang === 'zh-Hans' ? '🇨🇳 Mandarin' : lang}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {engagement.highUrgency > 0 && (
                  <div className="card p-4 bg-red-50 border-red-200">
                    <p className="text-sm font-semibold text-red-700">⚠️ {engagement.highUrgency} high-urgency {engagement.highUrgency === 1 ? 'reply' : 'replies'} — check inbox immediately.</p>
                  </div>
                )}

                {unengaged.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <p className="eyebrow">Not Yet Engaged</p>
                    <p className="text-sm font-semibold text-gray-900">📭 {unengaged.length} {unengaged.length === 1 ? 'family has' : 'families have'} not replied</p>
                    <div className="space-y-1.5">
                      {unengaged.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                          <span className="text-sm">👤</span>
                          <span className="text-sm text-gray-700 flex-1">{p.name} {p.childName && <span className="text-gray-400 text-xs">({p.childName})</span>}</span>
                          <span className="badge" style={{ background: '#EDE9FF', color: '#6C47FF', fontSize: 10 }}>
                            {p.language === 'hi' ? '🇮🇳' : p.language === 'zh-Hans' ? '🇨🇳' : '🇦🇺'} {p.language}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {frictionData.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <p className="eyebrow">Friction Forecast</p>
                    <p className="text-sm font-semibold text-gray-900">🔮 Topics Parents Struggled With</p>
                    {frictionData.map((f, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-gray-800">{f.subject}</p>
                          <span className={`badge ${f.percentage >= 40 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{f.percentage}% struggled</span>
                        </div>
                        <p className="text-xs text-gray-500">{f.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {familyFeed.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="eyebrow">Live Activity Feed</p>
                      <span className="badge bg-emerald-100 text-emerald-700">{feedAverage}% engaged</span>
                    </div>
                    {familyFeed.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                        <span>{f.feedback === 'tried' ? '✅' : '😕'}</span>
                        <span className="text-sm text-gray-700">
                          <strong>{f.childName || f.parentName}</strong> {f.feedback === 'tried' ? 'completed' : 'struggled with'} {f.subject}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="card p-5 space-y-3">
                  <p className="eyebrow">Smart Nudges</p>
                  {unengaged.length === 0 ? (
                    <p className="text-sm text-emerald-600 font-medium">🎉 All families are engaged!</p>
                  ) : unengaged.map((p, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-800">{p.name} <span className="text-gray-400 font-normal text-xs">({p.childName})</span></p>
                      {nudges[p.parentId] ? (
                        <div className="space-y-2 rounded-xl p-3" style={{ background: '#EDE9FF' }}>
                          <p className="text-xs" style={{ color: '#4B0FA8' }}>💡 {nudges[p.parentId]}</p>
                          <button onClick={() => { setDmParentId(p.parentId); setDmContent(nudges[p.parentId]); setDmSubject('A quick note about your child'); setTab('direct') }}
                            className="btn-primary text-xs px-3 py-1.5 w-full">
                            📤 Send as Direct Message
                          </button>
                        </div>
                      ) : (
                        <button onClick={async () => {
                          setNudgeLoading(n => ({ ...n, [p.parentId]: true }))
                          try {
                            const res = await axios.post(`${API}/api/engagement-nudge`, {
                              parentName: p.name, childName: p.childName, language: p.language,
                              availability: 'evening', confidence: 'medium', lastSubject: messages[0]?.subject || 'Mathematics'
                            })
                            setNudges(n => ({ ...n, [p.parentId]: res.data.nudge }))
                          } catch(e) {}
                          setNudgeLoading(n => ({ ...n, [p.parentId]: false }))
                        }} disabled={nudgeLoading[p.parentId]} className="btn-ghost text-xs px-3 py-1.5">
                          {nudgeLoading[p.parentId] ? '✨ Generating...' : '✨ Generate Nudge'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="card p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="eyebrow">Weekly Report</p>
                    <button onClick={async () => {
                      setReportLoading(true)
                      try { const res = await axios.get(`${API}/api/weekly-report/${profile.id}`); if (res.data.success) setWeeklyReport(res.data.data) } catch(e) {}
                      setReportLoading(false)
                    }} disabled={reportLoading} className="btn-ghost text-xs px-3 py-1.5">
                      {reportLoading ? '⏳ Generating...' : '📊 Generate'}
                    </button>
                  </div>
                  {weeklyReport && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm text-gray-700">{weeklyReport.summary}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-violet-50 rounded-xl p-2"><p className="font-bold text-violet-700">{weeklyReport.totalMessages}</p><p className="text-gray-500">Updates</p></div>
                        <div className="bg-emerald-50 rounded-xl p-2"><p className="font-bold text-emerald-700">{weeklyReport.tried}</p><p className="text-gray-500">Activities</p></div>
                        <div className="bg-blue-50 rounded-xl p-2"><p className="font-bold text-blue-700">{Object.keys(weeklyReport.languages).length}</p><p className="text-gray-500">Languages</p></div>
                      </div>
                      <button onClick={downloadPDF} className="btn-primary w-full">📥 Download PDF Report</button>
                    </div>
                  )}
                </div>

                {emojiInsights.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <p className="eyebrow">Parent Feedback Insights</p>
                    {emojiInsights.map((e, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">{e.subject}</span>
                          <div className="flex gap-2">
                            <span className="badge bg-emerald-100 text-emerald-700">✅ {e.tried}</span>
                            <span className="badge bg-orange-100 text-orange-700">😕 {e.struggled}</span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${e.pct}%` }}/>
                        </div>
                        <p className="text-xs text-gray-500 italic">💡 {e.insight}</p>
                      </div>
                    ))}
                  </div>
                )}

                {engagementScores.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <p className="eyebrow">Engagement Scores</p>
                    <p className="text-xs text-gray-500">Based on activities tried, messages read and replies sent</p>
                    {engagementScores.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <span className="text-lg">{p.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-gray-800">{p.name} <span className="text-gray-400 font-normal text-xs">({p.childName})</span></p>
                            <span className={`badge font-bold ${p.level === 'High' ? 'bg-emerald-100 text-emerald-700' : p.level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{p.score}/100</span>
                          </div>
                          <div className="progress-bar mt-1.5">
                            <div className="progress-fill" style={{ width: `${p.score}%`, background: p.level === 'High' ? '#10B981' : p.level === 'Medium' ? '#F59E0B' : '#EF4444' }}/>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            ✅ {p.tried} · 💬 {p.replies} · 👁 {p.read} · {p.language === 'hi' ? '🇮🇳' : p.language === 'zh-Hans' ? '🇨🇳' : '🇦🇺'} {p.language}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {parentActivity.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="eyebrow">Family Engagement Tracker</p>
                      <span className="text-xs text-gray-400">Support tool — not surveillance</span>
                    </div>
                    {parentActivity.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          p.statusColor === 'green' ? 'bg-emerald-500 animate-pulse' :
                          p.statusColor === 'yellow' ? 'bg-amber-400' :
                          p.statusColor === 'orange' ? 'bg-orange-400' :
                          p.statusColor === 'red' ? 'bg-red-400' : 'bg-gray-300'
                        }`}/>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-gray-800">{p.name} <span className="text-gray-400 font-normal text-xs">({p.childName})</span></p>
                            <span className={`badge text-xs ${
                              p.statusColor === 'green' ? 'bg-emerald-100 text-emerald-700' :
                              p.statusColor === 'yellow' ? 'bg-amber-100 text-amber-700' :
                              p.statusColor === 'orange' ? 'bg-orange-100 text-orange-700' :
                              p.statusColor === 'red' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                            }`}>{p.status}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {p.language === 'hi' ? '🇮🇳' : p.language === 'zh-Hans' ? '🇨🇳' : '🇦🇺'} {p.language}
                            {p.loginCount > 0 && ` · ${p.loginCount} login${p.loginCount > 1 ? 's' : ''}`}
                            {p.lastSeen && ` · ${new Date(p.lastSeen).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 text-center">Parents are informed of this tracking and can opt out in their profile.</p>
                  </div>
                )}

                <div className="card p-4 bg-gray-50">
                  <p className="eyebrow mb-1">About Insights</p>
                  <p className="text-xs text-gray-500">Sentiment auto-detected from parent replies via CurricuLLM. Always apply professional judgement when following up. Compliant with H-AI-H Human-Centered AI Principles.</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── DIRECT ── */}
        {tab === 'direct' && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow">Messaging</p>
              <h2 className="text-lg font-semibold text-gray-900">Direct & Broadcast</h2>
            </div>

            {/* Direct Message */}
            <div className="card p-6 space-y-4">
              <p className="eyebrow">Direct Message</p>
              <p className="text-sm text-gray-500">Send a private message to one parent — auto-translated to their language.</p>
              <select value={dmParentId} onChange={e => setDmParentId(e.target.value)} className="input-base">
                <option value="">— Select a parent —</option>
                {allParents.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.child_name ? `(${p.child_name})` : ''} — {p.language === 'hi' ? '🇮🇳 Hindi' : p.language === 'zh-Hans' ? '🇨🇳 Mandarin' : '🇦🇺 English'}
                  </option>
                ))}
              </select>
              <input value={dmSubject} onChange={e => setDmSubject(e.target.value)} className="input-base" placeholder="Subject"/>
              <textarea value={dmContent} onChange={e => setDmContent(e.target.value)} rows={4} className="input-base" placeholder="Message — will be auto-translated..."/>
              <div className="rounded-xl px-4 py-2.5 text-xs" style={{ background: '#EDE9FF', color: '#4B0FA8' }}>
                🌍 Auto-translated into the parent's language before delivery.
              </div>
              {dmSent ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-center py-3 rounded-xl font-semibold text-sm">✅ Message sent!</div>
              ) : (
                <button onClick={handleDmSend} disabled={dmSending || !dmParentId || !dmContent.trim()} className="btn-primary w-full">
                  {dmSending ? 'Sending...' : '📤 Send Direct Message'}
                </button>
              )}
            </div>

            {/* Broadcast */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-xl">📢</div>
                <div>
                  <p className="eyebrow">Broadcast</p>
                  <p className="text-sm font-semibold text-gray-900">Send to All {allParents.length} Families</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <button onClick={() => setBroadcastUrgent(!broadcastUrgent)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${broadcastUrgent ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${broadcastUrgent ? 'left-5' : 'left-0.5'}`}/>
                </button>
                <div>
                  <p className="text-sm font-semibold text-red-700">🚨 Mark as Urgent</p>
                  <p className="text-xs text-red-400">Adds urgent prefix in parent's language</p>
                </div>
              </div>
              <input value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} className="input-base" placeholder="Subject — e.g. School closure tomorrow"/>
              <textarea value={broadcastContent} onChange={e => setBroadcastContent(e.target.value)} rows={4} className="input-base" placeholder="Your message — sent exactly as written, auto-translated per family"/>
              <div className="rounded-xl px-4 py-2.5 text-xs bg-amber-50 border border-amber-200 text-amber-700">
                ⚡ Sent immediately to all {allParents.length} families. No CurricuLLM transform — exactly as written.
              </div>
              {broadcastSent ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-center py-3 rounded-xl font-semibold text-sm">✅ Sent to {broadcastCount} families!</div>
              ) : (
                <button onClick={handleBroadcast} disabled={broadcastSending || !broadcastContent.trim()}
                  className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition disabled:opacity-50 ${broadcastUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                  {broadcastSending ? 'Sending to all families...' : `📢 ${broadcastUrgent ? '🚨 Urgent Broadcast' : 'Send Broadcast'} to All ${allParents.length} Families`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {tab === 'schedule' && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow">Scheduling</p>
              <h2 className="text-lg font-semibold text-gray-900">Reminders & Appointments</h2>
            </div>
            <ReminderForm />

            {ptmRequests.length > 0 && (
              <div className="card p-5 space-y-3">
                <p className="eyebrow">Meeting Requests</p>
                <p className="text-sm font-semibold text-gray-900">📅 {ptmRequests.length} Pending Request{ptmRequests.length > 1 ? 's' : ''}</p>
                {ptmRequests.map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.parent_name} <span className="text-gray-400 font-normal text-xs">({r.child_name})</span></p>
                      <p className="text-xs text-gray-500">🕐 {r.preferred_time}</p>
                      {r.reason && <p className="text-xs text-gray-400 mt-0.5">"{r.reason}"</p>}
                    </div>
                    <span className="badge bg-amber-100 text-amber-700">Pending</span>
                  </div>
                ))}
              </div>
            )}

            {appointments.length > 0 ? (
              <div className="card p-5 space-y-3">
                <p className="eyebrow">Appointments ({appointments.length})</p>
                {appointments.map((a, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{a.parent_name} <span className="text-gray-400 font-normal text-xs">({a.child_name})</span></p>
                        <p className="text-xs text-gray-500">📋 {a.appointment_type}</p>
                        <p className="text-xs text-gray-500">📅 {new Date(a.preferred_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })} at {a.preferred_time}</p>
                        {a.note && <p className="text-xs text-gray-400 italic">"{a.note}"</p>}
                      </div>
                      <span className={`badge ${a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.status === 'confirmed' ? '✅ Confirmed' : a.status === 'cancelled' ? '❌ Cancelled' : '⏳ Pending'}
                      </span>
                    </div>
                    {a.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          await axios.post(`${API}/api/update-appointment-status`, { appointmentId: a.id, status: 'confirmed' })
                          const res = await axios.get(`${API}/api/appointments/teacher/${profile.id}`)
                          if (res.data.success) setAppointments(res.data.data)
                        }} className="flex-1 text-xs btn-primary py-1.5">✅ Confirm</button>
                        <button onClick={async () => {
                          await axios.post(`${API}/api/update-appointment-status`, { appointmentId: a.id, status: 'cancelled' })
                          const res = await axios.get(`${API}/api/appointments/teacher/${profile.id}`)
                          if (res.data.success) setAppointments(res.data.data)
                        }} className="flex-1 text-xs btn-danger py-1.5">❌ Decline</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : ptmRequests.length === 0 && (
              <div className="card p-10 text-center text-gray-400">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">No appointment requests yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── NAPLAN ── */}
        {tab === 'naplan' && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow">Assessment</p>
              <h2 className="text-lg font-semibold text-gray-900">NAPLAN Progress Snapshot</h2>
            </div>
            <div className="card p-5 space-y-4">
              <p className="text-sm text-gray-500">Turn your progress notes into parent-friendly NAPLAN updates with targeted home tips.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject</label>
                  <select value={naplanSubject} onChange={e => setNaplanSubject(e.target.value)} className="input-base">
                    {['English','Mathematics','Science'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Year Level</label>
                  <select value={naplanYear} onChange={e => setNaplanYear(e.target.value)} className="input-base">
                    {['3','5','7','8','9','10'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <textarea value={naplanNote} onChange={e => setNaplanNote(e.target.value)} rows={3} className="input-base"
                placeholder="e.g. Year 3 reading improving — strong comprehension but needs work on vocabulary..."/>
              <button onClick={async () => {
                if (!naplanNote.trim()) return
                setNaplanLoading(true)
                try {
                  const res = await axios.post(`${API}/api/naplan-snapshot`, { teacherNote: naplanNote, yearLevel: naplanYear, subject: naplanSubject })
                  setNaplanResult(res.data.message)
                } catch(e) {}
                setNaplanLoading(false)
              }} disabled={naplanLoading || !naplanNote.trim()} className="btn-primary w-full">
                {naplanLoading ? '✨ Generating with CurricuLLM...' : '📊 Generate NAPLAN Update'}
              </button>
              <div className="rounded-xl px-4 py-3 text-xs" style={{ background: '#EDE9FF', color: '#4B0FA8' }}>
  <p className="font-semibold">⚠️ H-AI-H Reminder</p>
  <p className="opacity-75 mt-1">This NAPLAN message is AI-generated. Review carefully before sharing with families. You are responsible as the qualified educator.</p>
</div>
              {naplanResult && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: '#EDE9FF' }}>
                  <p className="eyebrow">Parent-Ready Message</p>
                  <p className="text-sm text-gray-700">{naplanResult}</p>
                  <p className="text-xs" style={{ color: '#6C47FF' }}>Powered by CurricuLLM 🎓</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}