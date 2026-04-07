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
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
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
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-indigo-700 mb-1">👤 What this means for {currentChild?.name || profile.child_name}:</p>
      <p className="text-sm text-indigo-800">{message}</p>
      <p className="text-xs text-indigo-400 mt-1">Powered by CurricuLLM</p>
    </div>
  )

  return (
    <button onClick={generate} disabled={loading} className="text-xs text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50">
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
    <div className="border rounded-xl overflow-hidden">
      <button onClick={handleClick} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex justify-between items-center">
        <span>{translatedQ}</span>
        <span className="text-gray-400 ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 bg-blue-50">
          {loading ? (
            <p className="text-sm text-gray-400">⏳ Getting answer from CurricuLLM...</p>
          ) : (
            <>
              <p className="text-sm text-gray-700">{answer}</p>
              <p className="text-xs text-blue-400 mt-1">Powered by CurricuLLM 🎓</p>
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
    <div className="bg-white rounded-xl shadow p-5 space-y-3">
      <p className="text-sm font-semibold text-gray-700">Ask your own question:</p>
      <div className="flex gap-2">
        <input value={question} onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type any question about your child's learning..."/>
        <button onClick={handleAsk} disabled={loading || !question.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? '...' : 'Ask'}
        </button>
      </div>
      {answer && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">{answer}</p>
          <p className="text-xs text-blue-400 mt-1">Powered by CurricuLLM 🎓</p>
        </div>
      )}
    </div>
  )
}

function PTMRequest({ profile, currentChild }) {
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const TEACHER_ID = '83e0135e-9d7b-43af-aa81-4bce2c025208'

  const handleSubmit = async () => {
    if (!preferredDate || !preferredTime) return
    setSending(true)
    try {
      await axios.post(`${API}/api/book-appointment`, {
        parentId: profile.id, parentName: profile.name,
        childName: currentChild?.name || profile.child_name,
        teacherId: TEACHER_ID,
        appointmentType: 'Parent-Teacher Meeting',
        preferredDate, preferredTime, note: reason
      })
      setSent(true)
    } catch(e) {}
    setSending(false)
  }

  if (sent) return (
    <div className="bg-green-100 text-green-800 text-center py-3 rounded-lg font-semibold">
      ✅ Meeting request sent! Your teacher will confirm shortly.
    </div>
  )

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred date</label>
        <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred time</label>
        <div className="grid grid-cols-3 gap-2">
          {['8:00 AM','9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','After school','Phone call'].map(t => (
            <button key={t} onClick={() => setPreferredTime(t)}
              className={`px-2 py-2 rounded-lg text-xs border transition ${preferredTime === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder="e.g. I'd like to discuss my child's progress in maths..."/>
      </div>
      <button onClick={handleSubmit} disabled={sending || !preferredDate || !preferredTime}
        className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50">
        {sending ? 'Sending...' : '📅 Request Meeting'}
      </button>
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
  'Science':     { icon: '🔬', header: 'bg-green-700',  border: 'border-green-300',  bg: 'bg-green-50' },
  'English':     { icon: '📖', header: 'bg-blue-700',   border: 'border-blue-300',   bg: 'bg-blue-50' },
  'Mathematics': { icon: '🔢', header: 'bg-purple-700', border: 'border-purple-300', bg: 'bg-purple-50' },
  'History':     { icon: '🏛️', header: 'bg-amber-700',  border: 'border-amber-300',  bg: 'bg-amber-50' },
  'Geography':   { icon: '🌍', header: 'bg-teal-700',   border: 'border-teal-300',   bg: 'bg-teal-50' },
  'PDHPE':       { icon: '⚽', header: 'bg-red-700',    border: 'border-red-300',    bg: 'bg-red-50' },
  'General':     { icon: '📚', header: 'bg-gray-700',   border: 'border-gray-300',   bg: 'bg-gray-50' },
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
        <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">Powered by CurricuLLM</span>
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
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${playing ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-700 border-teal-300 hover:bg-teal-50'}`}>
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

  const color = !data ? 'bg-gray-200' : data.confidence >= 80 ? 'bg-green-500' : data.confidence >= 60 ? 'bg-yellow-400' : 'bg-red-400'

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
            <span className="font-semibold text-gray-700">AI Confidence</span>
            <span className={`px-2 py-0.5 rounded-full text-white text-xs ${color}`}>{data.confidence}%</span>
          </div>
          <p className="text-gray-500">{data.reason}</p>
          <p className="text-teal-600 font-medium">{data.acara_ref}</p>
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
        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50">
        {loading ? '✨ Generating...' : show ? '▲ Hide mindset script' : '🧠 What to say if they get stuck?'}
      </button>
      {show && prompt && (
        <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1">
          {prompt.split('\n').map((line, i) => (
            <p key={i} className={`text-xs ${line.toLowerCase().includes('instead') ? 'text-red-600' : 'text-purple-800 font-medium'}`}>
              {line}
            </p>
          ))}
          <p className="text-xs text-purple-400 mt-1">🧠 Dweck Growth Mindset • Powered by CurricuLLM</p>
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
    <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl p-4 text-white space-y-3">
      <p className="text-xs font-semibold opacity-75 uppercase tracking-wide">🌏 This Week's Community Impact</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
          <p className="text-xl font-bold">{stats.totalActivities}</p>
          <p className="text-xs opacity-80">Activities completed</p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
          <p className="text-xl font-bold">{stats.totalFamilies}</p>
          <p className="text-xs opacity-80">Families engaged</p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
          <p className="text-xl font-bold">{stats.totalLanguages}</p>
          <p className="text-xs opacity-80">Languages supported</p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
          <p className="text-xl font-bold">{stats.topSubject}</p>
          <p className="text-xs opacity-80">Most active subject</p>
        </div>
      </div>
      <p className="text-xs opacity-60 text-center">Powered by CurricuLLM 🎓</p>
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
    assessment: { emoji: '📊', color: 'bg-purple-50 border-purple-200 text-purple-800' },
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
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-2">🔔 Reminders from Teacher</h3>
      <p className="text-xs text-gray-400 text-center py-3">No upcoming reminders from your teacher.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-3">
      <h3 className="text-sm font-bold text-gray-800">🔔 Reminders from Teacher</h3>
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

function AppointmentBooking({ profile, currentChild }) {
  const [appointments, setAppointments] = useState([])
  const [booking, setBooking] = useState(false)
  const [appointmentType, setAppointmentType] = useState('Academic Progress')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const TEACHER_ID = '83e0135e-9d7b-43af-aa81-4bce2c025208'

  useEffect(() => { fetchAppointments() }, [])

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
        parentId: profile.id, parentName: profile.name,
        childName: currentChild?.name || profile.child_name,
        teacherId: TEACHER_ID, appointmentType,
        preferredDate, preferredTime, note
      })
      setSaved(true)
      setPreferredDate(''); setPreferredTime(''); setNote(''); setBooking(false)
      fetchAppointments()
      setTimeout(() => setSaved(false), 3000)
    } catch(e) {}
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800">📋 Book an Appointment</h3>
        <button onClick={() => setBooking(!booking)}
          className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition">
          {booking ? '✕ Cancel' : '+ Book'}
        </button>
      </div>

      {saved && <div className="bg-green-100 text-green-800 text-center py-2 rounded-lg text-sm font-semibold">✅ Request sent! Teacher will confirm.</div>}

      {booking && (
        <div className="bg-teal-50 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">What is this about?</label>
            <div className="grid grid-cols-2 gap-2">
              {['Academic Progress', 'Behaviour Concern', 'Learning Support', 'General Check-in'].map(t => (
                <button key={t} onClick={() => setAppointmentType(t)}
                  className={`px-3 py-2 rounded-lg text-xs border transition text-left ${appointmentType === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred date</label>
            <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred time</label>
            <div className="grid grid-cols-3 gap-2">
              {['8:00 AM','9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','After school','Phone call'].map(t => (
                <button key={t} onClick={() => setPreferredTime(t)}
                  className={`px-2 py-2 rounded-lg text-xs border transition ${preferredTime === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="What would you like to discuss? (optional)"/>
          <div className="bg-amber-50 rounded-lg p-2 text-xs text-amber-700">
            ⚠️ For urgent welfare concerns contact the school directly.
          </div>
          <button onClick={handleBook} disabled={saving || !preferredDate || !preferredTime}
            className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
            {saving ? 'Booking...' : '📅 Request Appointment'}
          </button>
        </div>
      )}

      {appointments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">Your appointments:</p>
          {appointments.map((a, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-800">{a.appointment_type}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : a.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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

  useEffect(() => { fetchMessages(); fetchChildren(); }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

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
  const lang = LANGUAGES.find(l => l.code === profile.language) || LANGUAGES[0]
  const currentChild = children[selectedChildIdx]

  // ── Shared expanded subject content renderer ──
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
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white border-2 border-current mt-1"/>
                    <span className="text-sm font-medium text-gray-600">
                      📅 {new Date(item.created_at).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {flagged[item.message_id] && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🚩 Flagged</span>}
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">🤖 AI-generated • ✅ Teacher-approved</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <p className="text-sm font-semibold text-gray-700">📚 This week's learning</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <JargonText text={displayContent} language={profile.language} />
                  </p>
                  <PersonalMessageBanner item={item} profile={profile} children={children} selectedChildIdx={selectedChildIdx} />
                  <AudioPlayer text={displayContent} language={profile.language} />
                  <WeekendSpark item={item} profile={profile} children={children} selectedChildIdx={selectedChildIdx} />
                  {profile.language !== 'en' && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      🔍 Tap highlighted terms for explanations
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap pt-1">
                    <span className="text-xs text-gray-400 self-center">Reading level:</span>
                    {[{ key: 'simple', label: '🟢 Simpler' }, { key: 'standard', label: '🔵 Standard' }, { key: 'detailed', label: '🟣 More detail' }].map(lvl => (
                      <button key={lvl.key} onClick={() => handleSimplify(item.message_id, originalContent, lvl.key)} disabled={simplifying[item.message_id]}
                        className={`text-xs px-3 py-1 rounded-full border transition ${readingLevel[item.message_id] === lvl.key ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'}`}>
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
                    <p className="text-sm font-semibold text-green-800 mb-3">🏠 How you can help at home</p>
                    <div className="space-y-3">
                      {tips.map((tip, i) => {
                        const tipKey = `${item.message_id}_${i}`
                        const fb = triedTips[tipKey]
                        return (
                          <div key={i} className={`rounded-lg p-3 transition ${fb === 'tried' ? 'bg-green-50 border border-green-200' : fb === 'struggled' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-gray-700 flex-1"><span className="font-bold text-green-600">{i+1}.</span> {tip}</p>
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
                                <button onClick={() => handleTried(item.id, item.message_id, i, 'tried')} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition">✅ We tried this!</button>
                                <button onClick={() => handleTried(item.id, item.message_id, i, 'struggled')} className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition">😕 We struggled</button>
                              </div>
                            ) : (
                              <p className="text-xs mt-2 text-gray-500 italic">{fb === 'tried' ? '✅ Great! Your teacher can see this.' : '😕 Noted — your teacher will follow up.'}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-700">💬 Reply to teacher</p>
                    <button onClick={() => handleFlag(item.message_id)} disabled={flagged[item.message_id]}
                      className={`text-xs transition ${flagged[item.message_id] ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                      🚩 {flagged[item.message_id] ? 'Flagged' : 'Flag this message'}
                    </button>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-xs text-amber-700">
                    ⚠️ Not for urgent welfare issues — contact the school directly for emergencies.
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 self-center">Quick reply:</span>
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
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Write in any language — translated automatically for your teacher..."/>
                  {sentReplies[item.message_id] ? (
                    <p className="text-green-600 text-sm font-medium">✅ Reply sent!</p>
                  ) : (
                    <button onClick={() => handleReply(item.message_id)} disabled={sending[item.message_id]}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                      {sending[item.message_id] ? 'Sending...' : 'Send Reply'}
                    </button>
                  )}
                  <p className="text-xs text-gray-400 mt-1">You can send multiple replies to your teacher.</p>
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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-5">
          <div className="text-center">
            <span className="text-5xl">🌉</span>
            <h1 className="text-2xl font-bold text-teal-700 mt-3">Welcome to BridgeUp</h1>
            <p className="text-gray-500 text-sm mt-1">Before you continue, please read this</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 space-y-3 text-sm text-gray-700">
            <p><strong>What BridgeUp does:</strong> We turn your child's teacher updates into plain language and personalised home support tips.</p>
            <p><strong>AI usage:</strong> Messages use CurricuLLM (curriculum-trained AI). Your teacher always reviews and approves every message before it reaches you.</p>
            <p><strong>Your data:</strong> Your language preference and child profile are stored securely and never sold or shared with third parties.</p>
            <p><strong>Your rights:</strong> Update or delete your profile at any time. Flag any message that concerns you.</p>
            <p className="text-xs text-gray-400">Compliant with the Australian Privacy Act 1988.</p>
          </div>
          <button onClick={handleConsent} className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition">
            I understand and agree to continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌉</span>
          <div>
            <h1 className="text-xl font-bold">BridgeUp</h1>
            <p className="text-blue-200 text-xs">Family Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">{lang.label}</span>
          <span className="text-sm">👋 {profile.name}</span>
          <button onClick={handleLogout} className="text-blue-200 hover:text-white text-sm">Sign out</button>
        </div>
      </header>

      {children.length > 1 && (
        <div className="bg-white border-b px-6 py-3 flex gap-3 items-center overflow-x-auto">
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Viewing:</span>
          {children.map((child, idx) => (
            <button key={child.id} onClick={() => setSelectedChildIdx(idx)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedChildIdx === idx ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              👤 {child.name} — Yr {child.year_level}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border-b px-6 flex gap-4 overflow-x-auto">
        {['updates', 'faq', 'profile'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'updates' ? `📬 Learning Updates (${messages.length})` : t === 'faq' ? '❓ FAQ' : `👤 ${currentChild?.name || profile.child_name || 'Child'}'s Profile`}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4 pb-32">

        {/* ── UPDATES TAB ── */}
        {tab === 'updates' && (
          <>
            <WelcomeBanner profile={profile} currentChild={currentChild} language={profile.language} />
            <CommunityStats />

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
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 space-y-3">
                  <p className="font-bold text-yellow-800 text-sm">📋 To-Do: {allTodos.length} activities</p>
                  <div className="space-y-2">
                    {allTodos.slice(0, 5).map((todo, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${todo.subject==='English'?'bg-blue-100 text-blue-700':todo.subject==='Science'?'bg-green-100 text-green-700':todo.subject==='Mathematics'?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-600'}`}>{todo.subject}</span>
                          <p className="text-sm text-gray-700 mt-0.5">{todo.tip}</p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button onClick={() => handleTried(todo.recipientId, todo.messageId, todo.tipIdx, 'tried')} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 whitespace-nowrap">✅ Done</button>
                          <button onClick={() => handleTried(todo.recipientId, todo.messageId, todo.tipIdx, 'struggled')} className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 whitespace-nowrap">😕 Hard</button>
                        </div>
                      </div>
                    ))}
                    {allTodos.length > 5 && <p className="text-xs text-yellow-600 text-center">+{allTodos.length - 5} more — open a subject card to see all</p>}
                  </div>
                </div>
              )
            })()}

            {Object.keys(groupedMessages).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📬</p>
                <p>No messages yet. Check back soon!</p>
              </div>
            ) : expandedSubject ? (
              renderSubjectContent(expandedSubject, groupedMessages[expandedSubject] || [])
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                    }} className={`rounded-xl border-2 overflow-hidden shadow hover:shadow-md transition text-left ${cfg.border}`}>
                      <div className={`${cfg.header} text-white px-4 py-3`}>
                        <div className="flex justify-between items-start">
                          <span className="text-3xl">{cfg.icon}</span>
                          <div className="flex flex-col items-end gap-1">
                            {hasNew && <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse"/>}
                            {todosRemaining > 0 && (
                              <span className="bg-yellow-300 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">
                                {todosRemaining} to-do
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-bold text-lg mt-2">{subject}</p>
                        <p className="text-xs opacity-75">{subjectMessages.length} update{subjectMessages.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="bg-white px-4 py-2">
                        <p className="text-xs text-gray-500">{todosRemaining > 0 ? `${todosRemaining} activities to try` : 'All done! 🎉'}</p>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">Tap to view →</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── FAQ TAB ── */}
        {tab === 'faq' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>❓ Ask anything about your child's learning</strong>
              <p className="mt-1">Powered by CurricuLLM — curriculum-aware answers for Australian parents.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Common questions — tap to get an answer:</p>
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

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="space-y-5">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
              <strong>🌟 Personalise {currentChild?.name || profile.child_name || "your child"}'s tips!</strong>
              <p className="mt-1">BridgeUp uses this to generate at-home tips tailored to your child — not generic advice.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-800">👤 {currentChild?.name || profile.child_name || "Your Child"}'s Learning Profile</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">🎮 What do they love?</label>
                <textarea value={interests} onChange={e => setInterests(e.target.value)} rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. Minecraft, Roblox, cricket, cooking..."/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">📉 What do they find difficult?</label>
                <textarea value={struggles} onChange={e => setStruggles(e.target.value)} rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. grammar, essay writing, maths..."/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🧠 How do they learn best?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: 'visual', label: '👁️ Visual' }, { value: 'hands-on', label: '🙌 Hands-on' }, { value: 'reading', label: '📖 Reading & writing' }, { value: 'talking', label: '💬 Talking it through' }].map(opt => (
                    <button key={opt.value} onClick={() => setLearningStyle(opt.value)}
                      className={`text-left px-3 py-2 rounded-lg text-sm border transition ${learningStyle === opt.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">💪 How confident are you supporting their learning?</label>
                <div className="flex gap-2">
                  {[{ value: 'low', label: '😟 Not very' }, { value: 'medium', label: '🙂 Somewhat' }, { value: 'high', label: '😄 Very confident' }].map(opt => (
                    <button key={opt.value} onClick={() => setConfidenceLevel(opt.value)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs border transition ${confidenceLevel === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🕐 When do you have time?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ value: 'morning', label: '🌅 Mornings' }, { value: 'evening', label: '🌙 Evenings' }, { value: 'weekend', label: '📅 Weekends' }].map(opt => (
                    <button key={opt.value} onClick={() => setAvailabilityWindow(opt.value)}
                      className={`px-2 py-2 rounded-lg text-sm border transition ${availabilityWindow === opt.value ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">⏱️ How long for activities?</label>
                <div className="flex gap-2">
                  {['5', '10', '15'].map(min => (
                    <button key={min} onClick={() => setActivityLength(min)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition ${activityLength === min ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'}`}>
                      {min} mins
                    </button>
                  ))}
                </div>
              </div>
              {profileSaved ? (
                <div className="bg-green-100 text-green-800 text-center py-3 rounded-lg font-semibold">✅ Profile saved!</div>
              ) : (
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                  {savingProfile ? 'Saving...' : '💾 Save Profile'}
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-5 space-y-4">
              <h3 className="text-base font-semibold text-gray-800">📅 Request a Parent-Teacher Meeting</h3>
              <PTMRequest profile={profile} currentChild={currentChild} />
            </div>
              <RemindersWidget profile={profile} />
              <AppointmentBooking profile={profile} currentChild={currentChild} />  
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
              <p className="font-semibold">🔐 Privacy notice</p>
              <p>Stored securely. Never shared or used for advertising. Compliant with the Australian Privacy Act 1988.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING CHAT ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-4 w-80 flex flex-col overflow-hidden" style={{ height: '420px' }}>
            <div className="bg-teal-700 text-white px-4 py-3 flex justify-between items-center flex-shrink-0">
              <div>
                <p className="font-semibold text-sm">💬 Ask BridgeUp</p>
                <p className="text-xs opacity-75">Powered by CurricuLLM 🎓</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white opacity-75 hover:opacity-100 text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow rounded-bl-none'}`}>
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
            <div className="p-3 border-t flex gap-2 flex-shrink-0">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                placeholder="Ask anything in any language..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"/>
              <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}
                className="bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 font-bold">→</button>
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
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition hover:scale-110 ${chatOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-teal-600 hover:bg-teal-700'} text-white`}>
          {chatOpen ? '✕' : '💬'}
        </button>
      </div>
    </div>
  )
}