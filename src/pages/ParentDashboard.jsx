import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'https://bridgeup-server-production.up.railway.app'

function JargonText({ text, language }) {
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)

  const JARGON_TERMS = [
    'phonemic awareness', 'phonics', 'numeracy', 'literacy', 'scaffolding',
    'differentiation', 'NAPLAN', 'curriculum', 'strand', 'outcome',
    'formative', 'summative', 'assessment', 'pedagogy', 'inquiry',
    'PEEL', 'persuasive', 'narrative', 'expository', 'bioprinting',
    'algebra', 'equations', 'fractions', 'decimals', 'geometry',
    'EAL', 'extension', 'intervention', 'metacognition', 'wellbeing',
    'peel', 'phonemic', 'scaffold', 'growth mindset'
  ]

  const handleWordClick = async (word, e) => {
    const clean = word.toLowerCase().replace(/[^a-z\s]/g, '')
    const originalClean = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
    const matched = JARGON_TERMS.find(t =>
      clean.includes(t.toLowerCase()) ||
      originalClean === t.toLowerCase().replace(/\s/g, '') ||
      originalClean.startsWith(t.toLowerCase().replace(/\s/g, ''))
    )
    if (!matched) return
    setLoading(true)
    setTooltipPos({ x: e.clientX, y: e.clientY })
    setTooltip('...')
    try {
      const res = await fetch(`${API}/api/explain-term`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: matched, language })
      })
      const data = await res.json()
      setTooltip(data.explanation)
    } catch (e) {
      setTooltip('Could not load explanation.')
    }
    setLoading(false)
  }

  const words = text.split(' ')

  return (
    <span className="relative">
      {words.map((word, i) => {
        const clean = word.toLowerCase().replace(/[^a-z\s]/g, '')
        const isJargon = JARGON_TERMS.some(t => clean.includes(t.toLowerCase()))
        return (
          <span key={i}>
            {isJargon ? (
              <span onClick={(e) => handleWordClick(word, e)}
                className="underline decoration-dotted decoration-teal-500 cursor-pointer text-teal-700 font-medium hover:bg-teal-50 rounded px-0.5">
                {word}
              </span>
            ) : word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
      {tooltip && (
        <div className="fixed z-50 bg-teal-800 text-white text-xs rounded-xl px-3 py-2 shadow-xl max-w-xs"
          style={{ left: Math.min(tooltipPos.x, window.innerWidth - 200), top: tooltipPos.y - 60 }}>
          <div className="flex justify-between items-start gap-2">
            <span>{loading ? '⏳ Explaining...' : `💡 ${tooltip}`}</span>
            <button onClick={() => setTooltip(null)} className="text-teal-300 hover:text-white ml-1 flex-shrink-0">✕</button>
          </div>
          <p className="text-teal-300 text-xs mt-1">Powered by CurricuLLM</p>
        </div>
      )}
    </span>
  )
}

function WelcomeBanner({ profile, currentChild, language }) {
  const [text, setText] = useState(null)
  useEffect(() => {
    const english = `Hi ${profile.name}! Here are ${currentChild?.name || profile.child_name || "your child"}'s latest updates, organised by subject. Tap any subject to see updates and personalised tips.`
    if (language === 'en') { setText(english); return; }
    axios.post(`${API}/api/translate`, { text: english, targetLanguage: language })
      .then(r => setText(r.data.translated))
      .catch(() => setText(english))
  }, [currentChild])
  return (
    <div className="rounded-xl p-4 text-sm font-medium" style={{ background: '#EDE9FF', color: '#4B0FA8' }}>
      {text || `Hi ${profile.name}!`}
    </div>
  )
}

function PersonalMessageBanner({ item, profile, children, selectedChildIdx }) {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const currentChild = children[selectedChildIdx]

  const generate = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/personalise-message`, {
        messageContent: item.messages?.transformed_content || '',
        childName: currentChild?.name || profile.child_name || 'your child',
        childInterests: currentChild?.interests || profile.child_interests || '',
        childStruggles: currentChild?.struggles || profile.child_struggles || '',
        language: profile.language
      })
      setMessage(res.data.message)
    } catch(e) {}
    setLoading(false)
  }

  if (message) return (
    <div className="rounded-xl p-3 border" style={{ background: '#EDE9FF', borderColor: '#C4B5FD' }}>
      <p className="text-xs font-semibold mb-1" style={{ color: '#6C47FF' }}>👤 What this means for {currentChild?.name || profile.child_name}:</p>
      <p className="text-sm" style={{ color: '#4B0FA8' }}>{message}</p>
      <p className="text-xs mt-1 opacity-60" style={{ color: '#6C47FF' }}>Powered by CurricuLLM</p>
    </div>
  )

  return (
    <button onClick={generate} disabled={loading} className="text-xs underline disabled:opacity-50" style={{ color: '#6C47FF' }}>
      {loading ? '✨ Personalising...' : `✨ What does this mean for ${currentChild?.name || profile.child_name}?`}
    </button>
  )
}

function FAQItem({ questionEn, language }) {
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [translatedQ, setTranslatedQ] = useState(questionEn)

  useEffect(() => {
    if (language !== 'en') {
      axios.post(`${API}/api/translate`, { text: questionEn, targetLanguage: language })
        .then(r => setTranslatedQ(r.data.translated))
        .catch(() => {})
    }
  }, [language])

  const handleClick = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true)
    if (answer) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/faq`, { question: questionEn, language })
      setAnswer(res.data.answer)
    } catch(e) { setAnswer('Could not load answer.') }
    setLoading(false)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={handleClick} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex justify-between items-center">
        <span>{translatedQ}</span>
        <span className="text-gray-400 ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 bg-gray-50">
          {loading ? (
            <p className="text-sm text-gray-400">⏳ Getting answer from CurricuLLM...</p>
          ) : (
            <>
              <p className="text-sm text-gray-700">{answer}</p>
              <p className="text-xs mt-1" style={{ color: '#6C47FF' }}>Powered by CurricuLLM 🎓</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function CustomFAQ({ language }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAsk = async () => {
    if (!question.trim()) return
    setLoading(true)
    setAnswer(null)
    try {
      const res = await axios.post(`${API}/api/faq`, { question, language })
      setAnswer(res.data.answer)
    } catch(e) { setAnswer('Could not load answer.') }
    setLoading(false)
  }

  return (
    <div className="card p-5 space-y-3">
      <p className="text-sm font-semibold text-gray-700">Ask your own question:</p>
      <div className="flex gap-2">
        <input value={question} onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          className="input-base flex-1"
          placeholder="Type any question about your child's learning..."/>
        <button onClick={handleAsk} disabled={loading || !question.trim()} className="btn-primary px-4 py-2">
          {loading ? '...' : 'Ask'}
        </button>
      </div>
      {answer && (
        <div className="rounded-xl p-3" style={{ background: '#EDE9FF' }}>
          <p className="text-sm text-gray-700">{answer}</p>
          <p className="text-xs mt-1" style={{ color: '#6C47FF' }}>Powered by CurricuLLM 🎓</p>
        </div>
      )}
    </div>
  )
}

const LANGUAGES = [
  { code: 'en', label: '🇦🇺 English' },
  { code: 'hi', label: '🇮🇳 Hindi' },
  { code: 'zh-Hans', label: '🇨🇳 Mandarin' },
  { code: 'te', label: '🇮🇳 Telugu' },
  { code: 'ar', label: '🇸🇦 Arabic' },
  { code: 'vi', label: '🇻🇳 Vietnamese' },
]

const SUBJECT_CONFIG = {
  'Science':     { icon: '🔬', header: 'bg-emerald-600', border: 'border-emerald-300', bg: 'bg-emerald-50' },
  'English':     { icon: '📖', header: 'bg-blue-600',    border: 'border-blue-300',    bg: 'bg-blue-50' },
  'Mathematics': { icon: '🔢', header: 'bg-violet-600',  border: 'border-violet-300',  bg: 'bg-violet-50' },
  'History':     { icon: '🏛️', header: 'bg-amber-600',   border: 'border-amber-300',   bg: 'bg-amber-50' },
  'Geography':   { icon: '🌍', header: 'bg-teal-600',    border: 'border-teal-300',    bg: 'bg-teal-50' },
  'PDHPE':       { icon: '⚽', header: 'bg-red-600',     border: 'border-red-300',     bg: 'bg-red-50' },
  'General':     { icon: '📚', header: 'bg-gray-600',    border: 'border-gray-300',    bg: 'bg-gray-50' },
}

function WeekendSpark({ item, profile, children, selectedChildIdx }) {
  const [spark, setSpark] = useState(null)
  const [loading, setLoading] = useState(false)
  const currentChild = children[selectedChildIdx]

  const generate = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/weekend-spark`, {
        subject: item.messages?.subject || 'General',
        lessonSummary: item.messages?.transformed_content?.slice(0, 200) || '',
        childName: currentChild?.name || profile.child_name || 'your child',
        childInterests: currentChild?.interests || profile.child_interests || 'games',
        language: profile.language
      })
      setSpark(res.data.spark)
    } catch(e) {}
    setLoading(false)
  }

  if (spark) return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">🌟</span>
        <p className="text-sm font-bold text-orange-800">Weekend Mission!</p>
        <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">CurricuLLM</span>
      </div>
      <p className="text-sm text-gray-700">{spark}</p>
    </div>
  )

  return (
    <button onClick={generate} disabled={loading}
      className="w-full text-left bg-orange-50 border border-orange-200 rounded-xl p-3 hover:bg-orange-100 transition disabled:opacity-50">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌟</span>
        <div>
          <p className="text-sm font-semibold text-orange-700">{loading ? '✨ Generating Weekend Mission...' : "Get this weekend's activity mission!"}</p>
          <p className="text-xs text-orange-500">Personalised for {currentChild?.name || profile.child_name} by CurricuLLM</p>
        </div>
      </div>
    </button>
  )
}

function AudioPlayer({ text, language }) {
  const [playing, setPlaying] = useState(false)

  const handlePlay = () => {
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return; }
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 400))
    const langMap = { 'hi': 'hi-IN', 'zh-Hans': 'zh-CN', 'en': 'en-AU', 'te': 'te-IN', 'ar': 'ar-SA', 'vi': 'vi-VN' }
    utterance.lang = langMap[language] || 'en-AU'
    utterance.rate = 0.9
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }

  return (
    <button onClick={handlePlay}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${playing ? 'text-white border-violet-600' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}
      style={playing ? { background: '#6C47FF' } : {}}>
      {playing ? '⏹ Stop' : '🔊 Listen'}
      <span>{playing ? 'Playing...' : 'Hear this'}</span>
    </button>
  )
}

function ConfidenceBadge({ tip, subject, yearLevel }) {
  const [data, setData] = useState(null)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchConfidence = async () => {
    if (data) { setShow(!show); return; }
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/confidence-check`, { tip, subject, yearLevel })
      setData(res.data.data)
      setShow(true)
    } catch(e) {}
    setLoading(false)
  }

  const color = !data ? 'bg-gray-200' : data.confidence >= 80 ? 'bg-emerald-500' : data.confidence >= 60 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="relative flex-shrink-0">
      <button onClick={fetchConfidence} disabled={loading}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        title="Check curriculum alignment">
        {loading ? '...' : (
          <div className="flex gap-0.5">
            {[1,2,3].map(b => <div key={b} className={`w-1.5 h-3 rounded-sm ${data && b <= Math.ceil(data.confidence/34) ? color : 'bg-gray-200'}`}/>)}
          </div>
        )}
      </button>
      {show && data && (
        <div className="absolute right-0 top-6 z-40 bg-white border border-gray-200 rounded-xl p-3 shadow-xl w-56 text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">ACARA Alignment</span>
            <span className={`px-2 py-0.5 rounded-full text-white text-xs ${color}`}>{data.confidence}%</span>
          </div>
          <p className="text-gray-500">{data.reason}</p>
          <p className="font-medium" style={{ color: '#6C47FF' }}>{data.acara_ref}</p>
          <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">Close</button>
        </div>
      )}
    </div>
  )
}

function GrowthMindsetPrompt({ tip, childName, subject, language }) {
  const [prompt, setPrompt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const generate = async () => {
    if (prompt) { setShow(!show); return; }
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/growth-mindset-prompt`, { tip, childName, subject, language })
      setPrompt(res.data.prompt)
      setShow(true)
    } catch(e) {}
    setLoading(false)
  }

  return (
    <div className="mt-2">
      <button onClick={generate} disabled={loading}
        className="text-xs flex items-center gap-1 disabled:opacity-50" style={{ color: '#6C47FF' }}>
        {loading ? '✨ Generating...' : show ? '▲ Hide mindset script' : '🧠 What to say if they get stuck?'}
      </button>
      {show && prompt && (
        <div className="mt-2 rounded-xl p-3 space-y-1" style={{ background: '#EDE9FF', border: '1px solid #C4B5FD' }}>
          {prompt.split('\n').map((line, i) => (
            <p key={i} className={`text-xs ${line.toLowerCase().includes('instead') ? 'text-red-600' : 'font-medium'}`}
              style={!line.toLowerCase().includes('instead') ? { color: '#4B0FA8' } : {}}>
              {line}
            </p>
          ))}
          <p className="text-xs mt-1 opacity-60" style={{ color: '#6C47FF' }}>🧠 Dweck Growth Mindset • CurricuLLM</p>
        </div>
      )}
    </div>
  )
}

function CommunityStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/community-stats`)
      .then(r => { if (r.data.success) setStats(r.data.data) })
      .catch(() => {})
  }, [])

  if (!stats) return null

  return (
    <div className="card p-4 text-white" style={{ background: '#4B0FA8' }}>
      <p className="eyebrow" style={{ color: '#C4B5FD' }}>THIS WEEK'S COMMUNITY IMPACT</p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-white bg-opacity-10 rounded-xl p-2 text-center">
          <p className="text-xl font-bold">{stats.totalActivities}</p>
          <p className="text-xs opacity-75">Activities completed</p>
        </div>
        <div className="bg-white bg-opacity-10 rounded-xl p-2 text-center">
          <p className="text-xl font-bold">{stats.totalFamilies}</p>
          <p className="text-xs opacity-75">Families engaged</p>
        </div>
        <div className="bg-white bg-opacity-10 rounded-xl p-2 text-center">
          <p className="text-xl font-bold">{stats.totalLanguages}</p>
          <p className="text-xs opacity-75">Languages supported</p>
        </div>
        <div className="bg-white bg-opacity-10 rounded-xl p-2 text-center">
          <p className="text-xl font-bold">{stats.topSubject}</p>
          <p className="text-xs opacity-75">Most active subject</p>
        </div>
      </div>
      <p className="text-xs opacity-50 text-center mt-2">Powered by CurricuLLM 🎓</p>
    </div>
  )
}

function RemindersWidget({ profile }) {
  const [reminders, setReminders] = useState([])

  useEffect(() => { fetchReminders() }, [])

  const fetchReminders = async () => {
    try {
      const res = await axios.get(`${API}/api/reminders/${profile.id}`)
      setReminders(res.data.data || [])
    } catch(e) {}
  }

  const typeConfig = {
    exam:       { emoji: '📝', color: 'bg-red-50 border-red-200 text-red-800' },
    absent:     { emoji: '🏠', color: 'bg-orange-50 border-orange-200 text-orange-800' },
    assessment: { emoji: '📊', color: 'bg-violet-50 border-violet-200 text-violet-800' },
    event:      { emoji: '🎉', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  }

  const getDaysUntil = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return '🔴 Today!'
    if (diff === 1) return '🟠 Tomorrow!'
    if (diff <= 7) return `🟡 In ${diff} days`
    return `🟢 In ${diff} days`
  }

  if (reminders.length === 0) return (
    <div className="card p-5">
      <p className="eyebrow mb-2">Reminders</p>
      <p className="text-xs text-gray-400 text-center py-3">No upcoming reminders from your teacher.</p>
    </div>
  )

  return (
    <div className="card p-5 space-y-3">
      <p className="eyebrow">Reminders from Teacher</p>
      <div className="space-y-2">
        {reminders.map((r, i) => {
          const cfg = typeConfig[r.type] || typeConfig.event
          return (
            <div key={i} className={`rounded-xl p-3 border space-y-1 ${cfg.color}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{cfg.emoji}</span>
                <p className="text-sm font-bold">{r.title}</p>
              </div>
              <p className="text-xs font-medium">
                📅 {new Date(r.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                <span className="ml-2 font-bold">{getDaysUntil(r.date)}</span>
              </p>
              {r.note && <p className="text-xs italic opacity-80">"{r.note}"</p>}
              <p className="text-xs opacity-60">From your teacher • BridgeUp</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AppointmentBooking({ profile, currentChild, children }) {
  const [appointments, setAppointments] = useState([])
  const [booking, setBooking] = useState(false)
  const [appointmentType, setAppointmentType] = useState('Academic Progress')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedChild, setSelectedChild] = useState('')

  const TEACHER_ID = '83e0135e-9d7b-43af-aa81-4bce2c025208'

  useEffect(() => {
    fetchAppointments()
    setSelectedChild(currentChild?.name || profile.child_name || '')
  }, [])

  useEffect(() => {
    if (!selectedChild) setSelectedChild(currentChild?.name || profile.child_name || '')
  }, [currentChild])

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API}/api/appointments/${profile.id}`)
      setAppointments(res.data.data || [])
    } catch(e) {}
  }

  const handleBook = async () => {
    if (!preferredDate || !preferredTime) return
    setSaving(true)
    try {
      await axios.post(`${API}/api/book-appointment`, {
        parentId: profile.id, parentName: profile.name, childName: selectedChild,
        teacherId: TEACHER_ID, appointmentType, preferredDate, preferredTime, note
      })
      setSaved(true)
      setPreferredDate(''); setPreferredTime(''); setNote(''); setBooking(false)
      fetchAppointments()
      setTimeout(() => setSaved(false), 3000)
    } catch(e) {}
    setSaving(false)
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="eyebrow">Appointments</p>
          <h3 className="text-sm font-semibold text-gray-900">📋 Book an Appointment</h3>
        </div>
        <button onClick={() => setBooking(!booking)} className="btn-ghost text-xs px-3 py-1.5">
          {booking ? '✕ Cancel' : '+ Book'}
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-center py-2 rounded-xl text-sm font-semibold">
          ✅ Request sent! Teacher will confirm.
        </div>
      )}

      {booking && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#F5F3FF' }}>
          {children && children.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Which child is this for?</label>
              <div className="flex gap-2 flex-wrap">
                {children.map((child) => (
                  <button key={child.id} onClick={() => setSelectedChild(child.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${selectedChild === child.name ? 'text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'}`}
                    style={selectedChild === child.name ? { background: '#6C47FF' } : {}}>
                    👤 {child.name} — Yr {child.year_level}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">What is this about?</label>
            <div className="grid grid-cols-2 gap-2">
              {['Academic Progress', 'Behaviour Concern', 'Learning Support', 'General Check-in'].map(t => (
                <button key={t} onClick={() => setAppointmentType(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition text-left ${appointmentType === t ? 'text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'}`}
                  style={appointmentType === t ? { background: '#6C47FF' } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred date</label>
            <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} className="input-base"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred time</label>
            <div className="grid grid-cols-3 gap-2">
              {['8:00 AM','9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','After school','Phone call'].map(t => (
                <button key={t} onClick={() => setPreferredTime(t)}
                  className={`px-2 py-2 rounded-xl text-xs font-medium border transition ${preferredTime === t ? 'text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'}`}
                  style={preferredTime === t ? { background: '#6C47FF' } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="input-base"
            placeholder="What would you like to discuss? (optional)"/>
          <div className="rounded-xl p-2 text-xs bg-amber-50 border border-amber-200 text-amber-700">
            ⚠️ For urgent welfare concerns contact the school directly.
          </div>
          {selectedChild && (
            <div className="rounded-xl p-2 text-xs" style={{ background: '#EDE9FF', color: '#4B0FA8' }}>
              📋 Booking for: <strong>{selectedChild}</strong>
            </div>
          )}
          <button onClick={handleBook} disabled={saving || !preferredDate || !preferredTime} className="btn-primary w-full">
            {saving ? 'Booking...' : '📅 Request Appointment'}
          </button>
        </div>
      )}

      {appointments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">Your appointments:</p>
          {appointments.map((a, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.appointment_type}</p>
                  {a.child_name && <p className="text-xs" style={{ color: '#6C47FF' }}>👤 {a.child_name}</p>}
                </div>
                <span className={`badge ${a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {a.status === 'confirmed' ? '✅ Confirmed' : a.status === 'cancelled' ? '❌ Cancelled' : '⏳ Pending'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                📅 {new Date(a.preferred_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })} at {a.preferred_time}
              </p>
              {a.note && <p className="text-xs text-gray-400 italic">"{a.note}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AchievementBadges({ profile }) {
  const [badges, setBadges] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    axios.get(`${API}/api/badges/${profile.id}`)
      .then(r => { if (r.data.success) setBadges(r.data) })
      .catch(() => {})
  }, [])

  if (!badges) return null

  return (
    <div className="card p-5 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="eyebrow">Achievements</p>
          <span className="badge bg-amber-100 text-amber-700">{badges.earned.length} earned</span>
        </div>
        <button onClick={() => setShow(!show)} className="text-xs font-medium" style={{ color: '#6C47FF' }}>
          {show ? '▲ Hide' : '▼ Show all'}
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {badges.earned.slice(0, show ? 99 : 3).map((badge, i) => (
          <div key={i} className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${badge.color}`}>
            <span className="text-xl">{badge.emoji}</span>
            <div>
              <p className="text-xs font-bold">{badge.title}</p>
              <p className="text-xs opacity-70">{badge.description}</p>
            </div>
          </div>
        ))}
        {!show && badges.earned.length > 3 && (
          <button onClick={() => setShow(true)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50">
            +{badges.earned.length - 3} more
          </button>
        )}
      </div>
      {show && badges.locked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 mt-2">🔒 Still to earn:</p>
          <div className="flex gap-2 flex-wrap">
            {badges.locked.map((badge, i) => (
              <div key={i} className="rounded-xl border border-gray-200 px-3 py-2 flex items-center gap-2 bg-gray-50 opacity-60">
                <span className="text-xl grayscale">{badge.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-gray-600">{badge.title}</p>
                  <p className="text-xs text-gray-400">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 text-center">Keep supporting {profile.child_name}'s learning to unlock more! 🌟</p>
    </div>
  )
}

function ProgressSummary({ profile, messages, triedTips }) {
  const totalMessages = messages.length
  const totalTips = messages.reduce((acc, m) => {
    const tips = m.translated_tips ? m.translated_tips.split(' | ') : []
    return acc + tips.length
  }, 0)
  const totalTried = Object.values(triedTips).filter(v => v === 'tried').length

  const getEncouragement = () => {
    if (totalTried >= 5) return "You're an amazing learning partner! 🌟"
    if (totalTried >= 3) return "Great effort supporting learning at home! 💪"
    if (totalTried >= 1) return "You've made a great start! Keep going! 😊"
    return "Try an activity today to get started! 🚀"
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="eyebrow">Your Progress</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{getEncouragement()}</p>
        </div>
        <span className="text-2xl">👨‍👩‍👧</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xl font-bold" style={{ color: '#6C47FF' }}>{totalMessages}</p>
          <p className="text-xs text-gray-500">Updates</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xl font-bold text-emerald-600">{totalTried}</p>
          <p className="text-xs text-gray-500">Tried</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xl font-bold text-amber-600">{totalTips}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
      </div>
      {totalTried > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Completion</span>
            <span>{totalTips > 0 ? Math.round((totalTried/totalTips)*100) : 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${totalTips > 0 ? Math.min(Math.round((totalTried/totalTips)*100), 100) : 0}%` }}/>
          </div>
        </div>
      )}
    </div>
  )
}

function ShareWithPartner({ profile, currentChild, messages }) {
  const [copied, setCopied] = useState(false)

  const generateSummary = () => {
    const childName = currentChild?.name || profile.child_name || 'your child'
    const subjects = [...new Set(messages.map(m => m.messages?.subject).filter(Boolean))]
    const tips = []
    messages.slice(0, 2).forEach(m => {
      if (m.translated_tips) {
        const t = m.translated_tips.split(' | ')[0]
        if (t) tips.push(`• ${t}`)
      }
    })
    return `📚 BridgeUp Update for ${childName}\n\nThis week ${childName} is learning: ${subjects.join(', ')}\n\n🏠 How you can help at home:\n${tips.slice(0, 2).join('\n')}\n\nSent via BridgeUp — bridging school and home 🌉`
  }

  const handleShare = async () => {
    const text = generateSummary()
    if (navigator.share) {
      try { await navigator.share({ title: 'BridgeUp Update', text }) } catch(e) {}
    } else {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  if (messages.length === 0) return null

  return (
    <button onClick={handleShare}
      className="card w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition text-left">
      <span className="text-2xl">📤</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">
          {copied ? '✅ Copied to clipboard!' : "Share this week's update"}
        </p>
        <p className="text-xs text-gray-500">Send to your partner or family via WhatsApp, SMS or email</p>
      </div>
      <span className="text-gray-400">→</span>
    </button>
  )
}

function PrintableSummary({ profile, currentChild, messages, triedTips }) {
  const [generating, setGenerating] = useState(false)

  const handlePrint = async () => {
    setGenerating(true)
    const childName = currentChild?.name || profile.child_name || 'your child'
    const subjects = [...new Set(messages.map(m => m.messages?.subject).filter(Boolean))]
    const allTips = []
    messages.forEach(m => {
      const subject = m.messages?.subject || 'General'
      const tips = m.translated_tips ? m.translated_tips.split(' | ') : []
      tips.forEach((tip, i) => {
        const key = `${m.message_id}_${i}`
        allTips.push({ subject, tip, status: triedTips[key] })
      })
    })
    const tried = allTips.filter(t => t.status === 'tried').length
    const total = allTips.length
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`<!DOCTYPE html><html><head><title>BridgeUp — ${childName}'s Learning Summary</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:30px auto;color:#333;padding:20px}.header{background:linear-gradient(135deg,#6C47FF,#4B0FA8);color:white;padding:24px;border-radius:12px;margin-bottom:24px}.header h1{margin:0 0 4px 0;font-size:24px}.header p{margin:0;opacity:.85;font-size:14px}.section{background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:16px;border-left:4px solid #6C47FF}.section h2{margin:0 0 12px 0;font-size:16px;color:#6C47FF}.tip{background:white;border-radius:8px;padding:10px 14px;margin-bottom:8px;border:1px solid #e5e7eb}.tip-subject{font-size:11px;font-weight:bold;color:#6C47FF;text-transform:uppercase;margin-bottom:4px}.tip-text{font-size:13px;color:#374151}.tip-status{font-size:11px;margin-top:4px}.tried{color:#16a34a}.struggled{color:#ea580c}.pending{color:#9ca3af}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.stat{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center}.stat-value{font-size:28px;font-weight:bold;color:#6C47FF}.stat-label{font-size:11px;color:#6b7280;margin-top:2px}.subjects{display:flex;gap:8px;flex-wrap:wrap}.subject-tag{background:#EDE9FF;color:#6C47FF;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold}.footer{text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af}</style></head><body><div class="header"><h1>🌉 BridgeUp Learning Summary</h1><p>${childName}'s Weekly Update · ${new Date().toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p><p style="margin-top:6px;font-size:13px;">Prepared for ${profile.name}</p></div><div class="stats"><div class="stat"><div class="stat-value">${messages.length}</div><div class="stat-label">Updates this week</div></div><div class="stat"><div class="stat-value">${tried}</div><div class="stat-label">Activities tried</div></div><div class="stat"><div class="stat-value">${total}</div><div class="stat-label">Total activities</div></div></div><div class="section"><h2>📚 Subjects This Week</h2><div class="subjects">${subjects.map(s=>`<span class="subject-tag">${s}</span>`).join('')}</div></div><div class="section"><h2>🏠 At-Home Activities</h2>${allTips.slice(0,10).map(t=>`<div class="tip"><div class="tip-subject">${t.subject}</div><div class="tip-text">${t.tip}</div><div class="tip-status ${t.status==='tried'?'tried':t.status==='struggled'?'struggled':'pending'}">${t.status==='tried'?'✅ Completed!':t.status==='struggled'?'😕 Needs support':'⏳ Not yet tried'}</div></div>`).join('')}</div><div class="footer"><p>Generated by BridgeUp — Powered by CurricuLLM 🎓</p><p>Compliant with the Australian Privacy Act 1988 · H-AI-H Human-Centered AI Principles</p></div></body></html>`)
    printWindow.document.close()
    setTimeout(() => { printWindow.print(); setGenerating(false) }, 500)
  }

  if (messages.length === 0) return null

  return (
    <button onClick={handlePrint} disabled={generating}
      className="card w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition text-left disabled:opacity-50">
      <span className="text-2xl">🖨️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{generating ? '⏳ Generating...' : "Print this week's summary"}</p>
        <p className="text-xs text-gray-500">PDF with all tips, activities and progress for {currentChild?.name || profile.child_name}</p>
      </div>
      <span className="text-gray-400">→</span>
    </button>
  )
}

export default function ParentDashboard({ supabase, profile }) {
  const [tab, setTab] = useState('updates')
  const [messages, setMessages] = useState([])
  const [children, setChildren] = useState([])
  const [selectedChildIdx, setSelectedChildIdx] = useState(0)
  const [expandedSubject, setExpandedSubject] = useState(null)
  const [replyText, setReplyText] = useState({})
  const [sending, setSending] = useState({})
  const [sentReplies, setSentReplies] = useState({})
  const [simplifying, setSimplifying] = useState({})
  const [simplifiedContent, setSimplifiedContent] = useState({})
  const [readingLevel, setReadingLevel] = useState({})
  const [triedTips, setTriedTips] = useState({})
  const [flagged, setFlagged] = useState({})
  const [lastReadSubject, setLastReadSubject] = useState({})
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInit, setChatInit] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [consentGiven, setConsentGiven] = useState(
    () => localStorage.getItem(`consent_${profile.id}`) === 'true'
  )
  const chatEndRef = useRef(null)
  const [interests, setInterests] = useState(profile.child_interests || '')
  const [struggles, setStruggles] = useState(profile.child_struggles || '')
  const [learningStyle, setLearningStyle] = useState(profile.child_learning_style || '')
  const [confidenceLevel, setConfidenceLevel] = useState('medium')
  const [availabilityWindow, setAvailabilityWindow] = useState('evening')
  const [activityLength, setActivityLength] = useState('10')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [activityVisible, setActivityVisible] = useState(profile.activity_visible !== false)
  const [savingVisibility, setSavingVisibility] = useState(false)

  useEffect(() => {
    fetchMessages()
    fetchChildren()
    axios.post(`${API}/api/track-activity`, { parentId: profile.id }).catch(() => {})
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    const unread = messages.filter(m => !m.is_read).length
    document.title = unread > 0 ? `(${unread}) BridgeUp` : 'BridgeUp'
    return () => { document.title = 'BridgeUp' }
  }, [messages])

  const fetchMessages = async () => {
    const res = await axios.get(`${API}/api/parent-messages/${profile.id}`)
    setMessages(res.data.data || [])
  }

  const fetchChildren = async () => {
    const res = await axios.get(`${API}/api/children/${profile.id}`)
    setChildren(res.data.data || [])
  }

  const groupedMessages = messages.reduce((acc, item) => {
    const subject = item.messages?.subject || 'General'
    if (!acc[subject]) acc[subject] = []
    acc[subject].push(item)
    return acc
  }, {})

  const handleConsent = () => {
    localStorage.setItem(`consent_${profile.id}`, 'true')
    setConsentGiven(true)
  }

  const handleSimplify = async (messageId, originalContent, level) => {
    setSimplifying(s => ({ ...s, [messageId]: true }))
    try {
      const res = await axios.post(`${API}/api/simplify`, { content: originalContent, level, language: profile.language })
      setSimplifiedContent(s => ({ ...s, [messageId]: res.data.content }))
      setReadingLevel(r => ({ ...r, [messageId]: level }))
    } catch (e) {}
    setSimplifying(s => ({ ...s, [messageId]: false }))
  }

  const handleTried = async (recipientId, messageId, tipIndex, feedbackType) => {
    const key = `${messageId}_${tipIndex}`
    setTriedTips(t => ({ ...t, [key]: feedbackType }))
    try { await axios.post(`${API}/api/mark-tried`, { recipientId, feedback: feedbackType }) } catch (e) {}
  }

  const handleFlag = (messageId) => setFlagged(f => ({ ...f, [messageId]: true }))

  const handleReply = async (messageId) => {
    const text = replyText[messageId]
    if (!text?.trim()) return
    setSending(s => ({ ...s, [messageId]: true }))
    await axios.post(`${API}/api/reply`, { messageId, parentId: profile.id, parentName: profile.name, content: text })
    setSentReplies(s => ({ ...s, [messageId]: true }))
    setReplyText(r => ({ ...r, [messageId]: '' }))
    setSending(s => ({ ...s, [messageId]: false }))
  }

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput
    setChatInput('')
    setChatMessages(m => [...m, { role: 'user', text: userMsg }])
    setChatLoading(true)
    try {
      const currentChild = children[selectedChildIdx]
      const res = await axios.post(`${API}/api/parent-chat`, {
        question: userMsg,
        childName: currentChild?.name || profile.child_name,
        subject: expandedSubject || '',
        language: profile.language
      })
      setChatMessages(m => [...m, { role: 'assistant', text: res.data.answer }])
    } catch (e) {
      setChatMessages(m => [...m, { role: 'assistant', text: 'Sorry, I had trouble with that. Please try again.' }])
    }
    setChatLoading(false)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await axios.post(`${API}/api/update-profile`, {
        parentId: profile.id, childInterests: interests,
        childStruggles: struggles, childLearningStyle: learningStyle,
        confidenceLevel, availabilityWindow, activityLength
      })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (e) {}
    setSavingProfile(false)
  }

  const handleLogout = () => supabase.auth.signOut()
  const currentChild = children[selectedChildIdx]

  const renderSubjectContent = (subject, subjectMessages) => {
    const cfg = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG['General']
    return (
      <div className={`rounded-xl border-2 overflow-hidden shadow-sm ${cfg.border}`}>
        <button onClick={() => setExpandedSubject(null)}
          className={`w-full ${cfg.header} text-white px-5 py-4 flex justify-between items-center hover:opacity-90 transition`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cfg.icon}</span>
            <div className="text-left">
              <p className="font-bold text-lg">{subject}</p>
              <p className="text-xs opacity-75">{subjectMessages.length} update{subjectMessages.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">← All subjects</span>
        </button>
        <div className={`${cfg.bg} divide-y divide-gray-200`}>
          {subjectMessages.map((item) => {
            const originalContent = item.translated_content || item.messages?.transformed_content
            const displayContent = simplifiedContent[item.message_id] || originalContent
            const tips = item.translated_tips ? item.translated_tips.split(' | ') : []
            return (
              <div key={item.id} className="p-5 space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white border-2 border-current mt-1"/>
                    <span className="text-sm font-medium text-gray-600">
                      📅 {new Date(item.created_at).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {flagged[item.message_id] && (
                      <span className="badge bg-red-100 text-red-700">🚩 Flagged</span>
                    )}
                    <span className="badge text-xs font-medium" style={{ background: '#EDE9FF', color: '#6C47FF' }}>
                      🤖 CurricuLLM • ✅ Teacher reviewed
                    </span>
                    {profile.language !== 'en' && (
                      <span className="badge bg-amber-100 text-amber-700 text-xs">
                        🌐 Machine translated
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📚 This week's learning</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <JargonText text={displayContent} language={profile.language} />
                  </p>
                  <PersonalMessageBanner item={item} profile={profile} children={children} selectedChildIdx={selectedChildIdx} />
                  <AudioPlayer text={displayContent} language={profile.language} />
                  <WeekendSpark item={item} profile={profile} children={children} selectedChildIdx={selectedChildIdx} />
                  {profile.language !== 'en' && (
                    <p className="text-xs text-gray-400 italic">🔍 Tap highlighted terms for explanations in your language</p>
                  )}
                  {profile.language !== 'en' && (
                    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
                      ⚠️ This message was machine-translated. For critical school matters please contact your teacher or school office directly.
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap pt-1">
                    <span className="text-xs text-gray-400 self-center">Reading level:</span>
                    {[{ key: 'simple', label: '🟢 Simpler' }, { key: 'standard', label: '🔵 Standard' }, { key: 'detailed', label: '🟣 More detail' }].map(lvl => (
                      <button key={lvl.key} onClick={() => handleSimplify(item.message_id, originalContent, lvl.key)} disabled={simplifying[item.message_id]}
                        className={`text-xs px-3 py-1 rounded-full border transition ${readingLevel[item.message_id] === lvl.key ? 'text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
                        style={readingLevel[item.message_id] === lvl.key ? { background: '#6C47FF' } : {}}>
                        {simplifying[item.message_id] ? '...' : lvl.label}
                      </button>
                    ))}
                    {simplifiedContent[item.message_id] && (
                      <button onClick={() => { setSimplifiedContent(s => ({ ...s, [item.message_id]: null })); setReadingLevel(r => ({ ...r, [item.message_id]: null })) }}
                        className="text-xs px-3 py-1 rounded-full border bg-gray-100 text-gray-500 hover:bg-gray-200">↺ Reset</button>
                    )}
                  </div>
                </div>

                {tips.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">🏠 How you can help at home</p>
                    <div className="space-y-3">
                      {tips.map((tip, i) => {
                        const tipKey = `${item.message_id}_${i}`
                        const fb = triedTips[tipKey]
                        return (
                          <div key={i} className={`rounded-xl p-3 transition ${fb === 'tried' ? 'bg-emerald-50 border border-emerald-200' : fb === 'struggled' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-gray-700 flex-1">
                                <span className="font-bold text-emerald-600">{i+1}.</span> {tip}
                              </p>
                              <ConfidenceBadge tip={tip} subject={item.messages?.subject} yearLevel="8" />
                            </div>
                            <GrowthMindsetPrompt
                              tip={tip}
                              childName={children[selectedChildIdx]?.name || profile.child_name || 'your child'}
                              subject={item.messages?.subject || 'General'}
                              language={profile.language}
                            />
                            {!fb ? (
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => handleTried(item.id, item.message_id, i, 'tried')}
                                  className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition">
                                  ✅ We tried this!
                                </button>
                                <button onClick={() => handleTried(item.id, item.message_id, i, 'struggled')}
                                  className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition">
                                  😕 We struggled
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs mt-2 text-gray-500 italic">
                                {fb === 'tried' ? '✅ Great! Your teacher can see this.' : '😕 Noted — your teacher will follow up.'}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">💬 Reply to teacher</p>
                    <button onClick={() => handleFlag(item.message_id)} disabled={flagged[item.message_id]}
                      className={`text-xs transition ${flagged[item.message_id] ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                      🚩 {flagged[item.message_id] ? 'Flagged' : 'Flag'}
                    </button>
                  </div>
                  <div className="rounded-xl p-2 text-xs bg-amber-50 border border-amber-200 text-amber-700">
                    ⚠️ Not for urgent welfare issues — contact the school directly.
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 self-center">Quick:</span>
                    {[
                      { emoji: '👍', textEn: 'Thanks, got it!' },
                      { emoji: '😕', textEn: "I'm not sure how to help with this" },
                      { emoji: '❓', textEn: 'Can you explain this more simply?' },
                      { emoji: '🌟', textEn: 'We tried the activities and it went well!' },
                    ].map((reaction, i) => (
                      <button key={i}
                        onClick={async () => {
                          let text = reaction.textEn
                          if (profile.language !== 'en') {
                            try {
                              const res = await axios.post(`${API}/api/translate`, { text: reaction.textEn, targetLanguage: profile.language })
                              text = res.data.translated
                            } catch(e) {}
                          }
                          setReplyText(r => ({ ...r, [item.message_id]: text }))
                        }}
                        className="text-xl hover:scale-125 transition-transform">
                        {reaction.emoji}
                      </button>
                    ))}
                  </div>
                  <textarea value={replyText[item.message_id] || ''} onChange={e => setReplyText(r => ({ ...r, [item.message_id]: e.target.value }))} rows={2}
                    className="input-base"
                    placeholder="Write in any language — translated automatically for your teacher..."/>
                  {sentReplies[item.message_id] ? (
                    <p className="text-emerald-600 text-sm font-medium">✅ Reply sent!</p>
                  ) : (
                    <button onClick={() => handleReply(item.message_id)} disabled={sending[item.message_id]} className="btn-primary">
                      {sending[item.message_id] ? 'Sending...' : 'Send Reply'}
                    </button>
                  )}
                  <p className="text-xs text-gray-400">You can send multiple replies to your teacher.</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!consentGiven) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F3FF' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#6C47FF' }}>🌉</div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to BridgeUp</h1>
            <p className="text-gray-500 text-sm mt-1">Before you continue, please read this</p>
          </div>
          <div className="rounded-xl p-4 space-y-3 text-sm text-gray-700" style={{ background: '#F5F3FF' }}>
            <p><strong>What BridgeUp does:</strong> We turn your child's teacher updates into plain language and personalised home support tips.</p>
            <p><strong>AI usage:</strong> Messages are generated by CurricuLLM, a curriculum-trained AI. Your teacher always reviews and approves every message. AI may occasionally produce inaccurate content — contact the school directly for critical matters.</p>
            <p><strong>Machine translation:</strong> Messages are translated using Azure AI Translator. Translation quality may vary. For important communications please contact the school directly.</p>
            <p><strong>Your data:</strong> Your language preference and child profile are stored securely on Australian servers and never sold or shared. Data is retained for the school year and deleted upon request.</p>
            <p><strong>Your rights:</strong> Update or delete your profile at any time. Flag any message that concerns you. You may opt out of activity tracking in your profile settings.</p>
            <p><strong>Activity tracking:</strong> Your last login time is visible to your teacher to help them support your family. You can turn this off in your profile.</p>
            <p><strong>Child data:</strong> Information about your child is used solely to personalise learning tips and is never shared outside your school.</p>
            
          </div>
          <button onClick={handleConsent} className="btn-primary w-full py-3">
            I understand and agree to continue
          </button>
          <p className="text-xs text-gray-400 pt-1 border-t border-gray-200">The class teacher is the data controller for your information. Data is retained for the duration of the school year and deleted upon request. Compliant with the Australian Privacy Act 1988 · Australian Framework for Generative AI in Schools (2023) · H-AI-H Human-Centered AI Principles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg" style={{ background: '#6C47FF' }}>🌉</div>
          <div>
            <h1 className="text-base font-bold text-gray-900">BridgeUp</h1>
            <p className="eyebrow" style={{ marginTop: 0 }}>Family Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={profile.language}
              onChange={async (e) => {
                const newLang = e.target.value
                try {
                  await axios.post(`${API}/api/update-language`, { parentId: profile.id, language: newLang })
                  window.location.reload()
                } catch(e) {}
              }}
              className="text-white text-xs border rounded-lg px-2 py-1.5 cursor-pointer transition appearance-none pr-6"
              style={{ background: '#6C47FF', borderColor: '#7C3AED' }}>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-white text-gray-800">{l.label}</option>
              ))}
            </select>
            <span className="absolute right-1.5 top-1.5 text-white text-xs pointer-events-none">▼</span>
          </div>
          <span className="text-sm text-gray-600 font-medium">👋 {profile.name}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 transition">Sign out</button>
        </div>
      </header>

      {children.length > 1 && (
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex gap-3 items-center overflow-x-auto">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Viewing:</span>
          {children.map((child, idx) => (
            <button key={child.id} onClick={() => setSelectedChildIdx(idx)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedChildIdx === idx ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              style={selectedChildIdx === idx ? { background: '#6C47FF' } : {}}>
              👤 {child.name} — Yr {child.year_level}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border-b border-gray-100 px-6 flex gap-1 overflow-x-auto">
        {['updates', 'faq', 'schedule', 'profile'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-4 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'updates' ? `📬 Learning Updates (${messages.length})` : t === 'faq' ? '❓ FAQ' : t === 'schedule' ? '📅 Schedule' : `👤 ${currentChild?.name || profile.child_name || 'Child'}'s Profile`}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4 pb-32">

        {/* ── UPDATES TAB ── */}
        {tab === 'updates' && (
          <>
            <WelcomeBanner profile={profile} currentChild={currentChild} language={profile.language} />
            <CommunityStats />
            <AchievementBadges profile={profile} />
            <ProgressSummary profile={profile} messages={messages} triedTips={triedTips} />
            <ShareWithPartner profile={profile} currentChild={currentChild} messages={messages} />
            <PrintableSummary profile={profile} currentChild={currentChild} messages={messages} triedTips={triedTips} />
            {(() => {
              const allTodos = []
              Object.entries(groupedMessages).forEach(([subject, msgs]) => {
                msgs.forEach(item => {
                  const tips = item.translated_tips ? item.translated_tips.split(' | ') : []
                  tips.forEach((tip, i) => {
                    const key = `${item.message_id}_${i}`
                    if (!triedTips[key]) allTodos.push({ subject, tip, messageId: item.message_id, tipIdx: i, recipientId: item.id })
                  })
                })
              })
              if (allTodos.length === 0) return null
              return (
                <div className="card p-4 space-y-3" style={{ borderColor: '#FCD34D', borderWidth: 2, background: '#FFFBEB' }}>
                  <p className="eyebrow text-amber-700">To-Do List</p>
                  <p className="text-sm font-semibold text-amber-800">📋 {allTodos.length} activities to try</p>
                  <div className="space-y-2">
                    {allTodos.slice(0, 5).map((todo, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex-1">
                          <span className={`badge text-xs ${todo.subject==='English'?'bg-blue-100 text-blue-700':todo.subject==='Science'?'bg-emerald-100 text-emerald-700':todo.subject==='Mathematics'?'bg-violet-100 text-violet-700':'bg-gray-100 text-gray-600'}`}>
                            {todo.subject}
                          </span>
                          <p className="text-sm text-gray-700 mt-1">{todo.tip}</p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button onClick={() => handleTried(todo.recipientId, todo.messageId, todo.tipIdx, 'tried')}
                            className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 whitespace-nowrap">✅ Done</button>
                          <button onClick={() => handleTried(todo.recipientId, todo.messageId, todo.tipIdx, 'struggled')}
                            className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 whitespace-nowrap">😕 Hard</button>
                        </div>
                      </div>
                    ))}
                    {allTodos.length > 5 && <p className="text-xs text-amber-600 text-center">+{allTodos.length - 5} more — open a subject card to see all</p>}
                  </div>
                </div>
              )
            })()}

            {Object.keys(groupedMessages).length === 0 ? (
              <div className="card p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📬</p>
                <p>No messages yet. Check back soon!</p>
              </div>
            ) : expandedSubject ? (
              renderSubjectContent(expandedSubject, groupedMessages[expandedSubject] || [])
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 items-start">
                {Object.entries(groupedMessages).map(([subject, subjectMessages]) => {
                  const cfg = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG['General']
                  const todosRemaining = subjectMessages.filter(m => !m.tried_activity).length
                  const hasNew = subjectMessages.some(m => {
                    const msgDate = new Date(m.created_at)
                    const lastRead = lastReadSubject[subject]
                    return !lastRead || msgDate > new Date(lastRead)
                  })
                  return (
                    <button key={subject} onClick={() => {
                      setExpandedSubject(subject)
                      setLastReadSubject(prev => ({ ...prev, [subject]: new Date().toISOString() }))
                      axios.post(`${API}/api/mark-read`, { parentId: profile.id, subject }).catch(() => {})
                    }} className={`rounded-xl border-2 overflow-hidden shadow hover:shadow-md transition text-left flex flex-col ${cfg.border}`}>
                      <div className={`${cfg.header} text-white px-4 py-3 flex flex-col justify-between`} style={{ minHeight: '100px' }}>
                        <div className="flex justify-between items-start">
                          <span className="text-2xl">{cfg.icon}</span>
                          <div className="flex flex-col items-end gap-1">
                            {hasNew && <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse"/>}
                            {todosRemaining > 0 && (
                              <span className="badge bg-yellow-300 text-yellow-900 text-xs">{todosRemaining} to-do</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-sm mt-2 line-clamp-1">{subject}</p>
                          <p className="text-xs opacity-75">{subjectMessages.length} update{subjectMessages.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="bg-white px-4 py-2 mt-auto">
                        <p className="text-xs text-gray-500 line-clamp-1">{todosRemaining > 0 ? `${todosRemaining} activities` : 'All done! 🎉'}</p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: '#6C47FF' }}>Tap to view →</p>
                      </div>
                    </button>
                  )
                })}
                {Object.keys(groupedMessages).length % 2 !== 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 overflow-hidden opacity-40 flex flex-col">
                    <div className="bg-gray-100 px-4 py-3 flex flex-col justify-between" style={{ minHeight: '100px' }}>
                      <span className="text-2xl">📬</span>
                      <div>
                        <p className="font-bold text-sm mt-2 text-gray-400">More coming</p>
                        <p className="text-xs text-gray-400">New updates soon</p>
                      </div>
                    </div>
                    <div className="bg-white px-4 py-2 mt-auto">
                      <p className="text-xs text-gray-300">Stay tuned</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── FAQ TAB ── */}
        {tab === 'faq' && (
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Help Centre</p>
              <h2 className="text-lg font-semibold text-gray-900">Ask anything about your child's learning</h2>
            </div>
            <div className="card p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Common questions</p>
              <div className="space-y-2">
                {[
                  'What is NAPLAN and how can I help my child prepare?',
                  'What does "scaffolding" mean in teaching?',
                  'How can I support reading at home?',
                  'What is the Australian Curriculum?',
                  'How do I help with maths homework without doing it for them?',
                  'What is phonics and why does it matter?',
                ].map((q, i) => (
                  <FAQItem key={i} questionEn={q} language={profile.language} />
                ))}
              </div>
            </div>
            <CustomFAQ language={profile.language} />
          </div>
        )}

        {/* ── SCHEDULE TAB ── */}
        {tab === 'schedule' && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow">Scheduling</p>
              <h2 className="text-lg font-semibold text-gray-900">Reminders & Appointments</h2>
            </div>
            <RemindersWidget profile={profile} />
            <AppointmentBooking profile={profile} currentChild={currentChild} children={children} />
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow">Settings</p>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentChild?.name || profile.child_name || "Your Child"}'s Learning Profile
              </h2>
            </div>
            <div className="card p-5 rounded-xl p-3 text-sm font-medium" style={{ background: '#EDE9FF', color: '#4B0FA8', border: 'none' }}>
              🌟 BridgeUp uses this profile to generate personalised at-home tips — not generic advice.
            </div>
            <div className="card p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">🎮 What do they love?</label>
                <textarea value={interests} onChange={e => setInterests(e.target.value)} rows={2} className="input-base"
                  placeholder="e.g. Minecraft, Roblox, cricket, cooking..."/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">📉 What do they find difficult?</label>
                <textarea value={struggles} onChange={e => setStruggles(e.target.value)} rows={2} className="input-base"
                  placeholder="e.g. grammar, essay writing, maths..."/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🧠 How do they learn best?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: 'visual', label: '👁️ Visual' }, { value: 'hands-on', label: '🙌 Hands-on' }, { value: 'reading', label: '📖 Reading & writing' }, { value: 'talking', label: '💬 Talking it through' }].map(opt => (
                    <button key={opt.value} onClick={() => setLearningStyle(opt.value)}
                      className={`text-left px-3 py-2 rounded-xl text-sm font-medium border transition ${learningStyle === opt.value ? 'text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'}`}
                      style={learningStyle === opt.value ? { background: '#6C47FF' } : {}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">💪 Confidence supporting their learning?</label>
                <div className="flex gap-2">
                  {[{ value: 'low', label: '😟 Not very' }, { value: 'medium', label: '🙂 Somewhat' }, { value: 'high', label: '😄 Confident' }].map(opt => (
                    <button key={opt.value} onClick={() => setConfidenceLevel(opt.value)}
                      className={`flex-1 px-2 py-2 rounded-xl text-xs font-medium border transition ${confidenceLevel === opt.value ? 'text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'}`}
                      style={confidenceLevel === opt.value ? { background: '#6C47FF' } : {}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🕐 Best time for activities?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ value: 'morning', label: '🌅 Mornings' }, { value: 'evening', label: '🌙 Evenings' }, { value: 'weekend', label: '📅 Weekends' }].map(opt => (
                    <button key={opt.value} onClick={() => setAvailabilityWindow(opt.value)}
                      className={`px-2 py-2 rounded-xl text-sm font-medium border transition ${availabilityWindow === opt.value ? 'text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'}`}
                      style={availabilityWindow === opt.value ? { background: '#6C47FF' } : {}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">⏱️ Activity duration?</label>
                <div className="flex gap-2">
                  {['5', '10', '15'].map(min => (
                    <button key={min} onClick={() => setActivityLength(min)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${activityLength === min ? 'text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'}`}
                      style={activityLength === min ? { background: '#6C47FF' } : {}}>
                      {min} mins
                    </button>
                  ))}
                </div>
              </div>
              {profileSaved ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-center py-3 rounded-xl font-semibold text-sm">✅ Profile saved!</div>
              ) : (
                <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary w-full">
                  {savingProfile ? 'Saving...' : '💾 Save Profile'}
                </button>
              )}
            </div>

            <div className="card p-5 space-y-3">
              <p className="eyebrow">Privacy Settings</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">👁️ Show my last active time</p>
                    <p className="text-xs text-gray-400 mt-0.5">Your teacher can see when you last used the app</p>
                  </div>
                  <button onClick={async () => {
                    const newVal = !activityVisible
                    setActivityVisible(newVal)
                    setSavingVisibility(true)
                    try {
                      await axios.post(`${API}/api/update-activity-visibility`, { parentId: profile.id, visible: newVal })
                    } catch(e) {}
                    setSavingVisibility(false)
                  }}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${savingVisibility ? 'opacity-50' : ''}`}
                    style={{ background: activityVisible ? '#6C47FF' : '#D1D5DB' }}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${activityVisible ? 'left-6' : 'left-0.5'}`}/>
                  </button>
                </div>
                <p className={`text-xs font-medium ${activityVisible ? '' : 'text-gray-400'}`}
                  style={activityVisible ? { color: '#6C47FF' } : {}}>
                  {activityVisible ? '✅ Visible to teacher — helps them support your family' : '🔒 Hidden — teacher cannot see your activity'}
                </p>
              </div>
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                Stored securely · Never shared or used for advertising · Australian Privacy Act 1988 compliant
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING CHAT ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 mb-4 w-80 flex flex-col overflow-hidden" style={{ height: '420px' }}>
            <div className="text-white px-4 py-3 flex justify-between items-center flex-shrink-0" style={{ background: '#6C47FF' }}>
              <div>
                <p className="font-semibold text-sm">💬 Ask BridgeUp</p>
                <p className="text-xs opacity-75">Powered by CurricuLLM 🎓</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white opacity-75 hover:opacity-100 text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'text-white rounded-br-none' : 'bg-white text-gray-800 shadow rounded-bl-none'}`}
                    style={msg.role === 'user' ? { background: '#6C47FF' } : {}}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-400 px-3 py-2 rounded-2xl text-sm shadow rounded-bl-none">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                placeholder="Ask anything in any language..."
                className="input-base flex-1"/>
              <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}
                className="text-white px-3 py-2 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition"
                style={{ background: '#6C47FF' }}>→</button>
            </div>
            <p className="text-xs text-center text-gray-400 pb-2 px-2">Not for urgent welfare issues — contact school directly</p>
          </div>
        )}
        <button onClick={async () => {
          setChatOpen(!chatOpen)
          if (!chatOpen && !chatInit) {
            setChatInit(true)
            const welcome = "Hi! I'm here to help you support your child's learning at home. What would you like to know? 😊\n\nPowered by CurricuLLM 🎓"
            let translated = welcome
            try {
              if (profile.language !== 'en') {
                const res = await axios.post(`${API}/api/translate`, { text: welcome, targetLanguage: profile.language })
                translated = res.data.translated
              }
            } catch(e) {}
            setChatMessages([{ role: 'assistant', text: translated }])
          }
        }}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition hover:scale-110 text-white`}
          style={{ background: chatOpen ? '#4B5563' : '#6C47FF' }}>
          {chatOpen ? '✕' : '💬'}
        </button>
      </div>
    </div>
  )
}