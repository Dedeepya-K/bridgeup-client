import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'https://bridgeup-server-production.up.railway.app'

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

function WelcomeBanner({ profile, currentChild, language }) {
  const [text, setText] = useState(null)
  useEffect(() => {
    const english = `Hi ${profile.name}! Here are ${currentChild?.name || profile.child_name || "your child"}'s latest updates, organised by subject. Tap any subject to see updates and personalised tips.`
    if (language === 'en') { setText(english); return; }
    axios.post(`${import.meta.env.VITE_API_URL}/api/translate`, { text: english, targetLanguage: language })
      .then(r => setText(r.data.translated))
      .catch(() => setText(english))
  }, [currentChild])
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
      {text || `Hi ${profile.name}!`}
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
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInit, setChatInit] = useState(false)
//  const [chatMessages, setChatMessages] = useState([
//    { role: 'assistant', text: "Hi! I'm here to help you support your child's learning at home. What would you like to know? 😊\n\nPowered by CurricuLLM 🎓" }
//  ])
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
      const res = await axios.post(`${API}/api/simplify`, {
        content: originalContent, level, language: profile.language
      })
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
    setTimeout(() => setSentReplies(s => ({ ...s, [messageId]: false })), 3000)
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
        parentId: profile.id,
        childInterests: interests,
        childStruggles: struggles,
        childLearningStyle: learningStyle,
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

  // ── CONSENT MODAL ──────────────────────────────────────────────────────────
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
          <button onClick={handleConsent}
            className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition">
            I understand and agree to continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Multi-child selector */}
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

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex gap-6">
        {['updates', 'profile'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-4 text-sm font-medium border-b-2 transition ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'updates'
              ? `📬 Learning Updates (${messages.length})`
              : `👤 ${currentChild?.name || profile.child_name || 'Child'}'s Profile`}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4 pb-32">

        {/* ── UPDATES TAB ── */}
        {tab === 'updates' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <WelcomeBanner profile={profile} currentChild={currentChild} language={profile.language} />
            </div>

            {/* ── TO-DO SUMMARY ── */}
{(() => {
  const allTodos = []
  Object.entries(groupedMessages).forEach(([subject, msgs]) => {
    msgs.forEach(item => {
      const tips = item.translated_tips ? item.translated_tips.split(' | ') : []
      tips.forEach((tip, i) => {
        const key = `${item.message_id}_${i}`
        if (!triedTips[key]) {
          allTodos.push({ subject, tip, messageId: item.message_id, tipIdx: i, recipientId: item.id, date: item.created_at })
        }
      })
    })
  })
  if (allTodos.length === 0) return null
  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
       <p className="font-bold text-yellow-800 text-sm">📋 To-Do: {allTodos.length} activities</p>
      </div>
      <div className="space-y-2">
        {allTodos.slice(0, 5).map((todo, i) => (
          <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
            <div className="flex-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
               todo.subject==='English'?'bg-blue-100 text-blue-700':
               todo.subject==='Science'?'bg-green-100 text-green-700':
               todo.subject==='Mathematics'?'bg-purple-100 text-purple-700':
              'bg-gray-100 text-gray-600'}`}>{todo.subject}
              </span>
              <p className="text-sm text-gray-700 mt-0.5">{todo.tip}</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={() => handleTried(todo.recipientId, todo.messageId, todo.tipIdx, 'tried')}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 whitespace-nowrap">
                ✅ Done
              </button>
              <button onClick={() => handleTried(todo.recipientId, todo.messageId, todo.tipIdx, 'struggled')}
                className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 whitespace-nowrap">
                😕 Hard
              </button>
            </div>
          </div>
        ))}
        {allTodos.length > 5 && (
          <p className="text-xs text-yellow-600 text-center">+{allTodos.length - 5} more — open a subject card to see all</p>
        )}
      </div>
    </div>
  )
})()}

            {Object.keys(groupedMessages).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📬</p>
                <p>No messages yet. Check back soon!</p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([subject, subjectMessages]) => {
                const cfg = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG['General']
                const isExpanded = expandedSubject === subject
                const todosRemaining = subjectMessages.filter(m => !m.tried_activity).length

                return (
                  <div key={subject} className={`rounded-xl border-2 overflow-hidden shadow-sm ${cfg.border}`}>
                    {/* Subject header — always visible */}
                    <button onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                      className={`w-full ${cfg.header} text-white px-5 py-4 flex justify-between items-center hover:opacity-90 transition`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{cfg.icon}</span>
                        <div className="text-left">
                          <p className="font-bold text-lg">{subject}</p>
                          <p className="text-xs opacity-75">{subjectMessages.length} update{subjectMessages.length !== 1 ? 's' : ''} from Ms. {profile.name === 'Ms. Tiffany Stephenson' ? 'Tiffany Stephenson' : 'your teacher'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {todosRemaining > 0 && (
                          <span className="bg-yellow-300 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">
                            {todosRemaining} to-do
                          </span>
                        )}
                        <span className="text-xl">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {/* Expanded timeline */}
                    {isExpanded && (
                      <div className={`${cfg.bg} divide-y divide-gray-200`}>
                        {subjectMessages.map((item, itemIdx) => {
                          const originalContent = item.translated_content || item.messages?.transformed_content
                          const displayContent = simplifiedContent[item.message_id] || originalContent
                          const tips = item.translated_tips ? item.translated_tips.split(' | ') : []

                          return (
                            <div key={item.id} className="p-5 space-y-4">
                              {/* Timeline marker + date + badge */}
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-white border-2 border-current mt-1"/>
                                  <span className="text-sm font-medium text-gray-600">
                                    📅 {new Date(item.created_at).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  {flagged[item.message_id] && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🚩 Flagged</span>
                                  )}
                                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                                    🤖 AI-generated • ✅ Teacher-approved
                                  </span>
                                </div>
                              </div>

                              {/* This week's learning */}
                              <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                                <p className="text-sm font-semibold text-gray-700">📚 This week's learning</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{displayContent}</p>

                                {/* Reading level buttons */}
                                <div className="flex gap-2 flex-wrap pt-1">
                                  <span className="text-xs text-gray-400 self-center">Reading level:</span>
                                  {[
                                    { key: 'simple', label: '🟢 Simpler' },
                                    { key: 'standard', label: '🔵 Standard' },
                                    { key: 'detailed', label: '🟣 More detail' }
                                  ].map(lvl => (
                                    <button key={lvl.key}
                                      onClick={() => handleSimplify(item.message_id, originalContent, lvl.key)}
                                      disabled={simplifying[item.message_id]}
                                      className={`text-xs px-3 py-1 rounded-full border transition ${readingLevel[item.message_id] === lvl.key ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'}`}>
                                      {simplifying[item.message_id] ? '...' : lvl.label}
                                    </button>
                                  ))}
                                  {simplifiedContent[item.message_id] && (
                                    <button onClick={() => { setSimplifiedContent(s => ({ ...s, [item.message_id]: null })); setReadingLevel(r => ({ ...r, [item.message_id]: null })) }}
                                      className="text-xs px-3 py-1 rounded-full border bg-gray-100 text-gray-500 hover:bg-gray-200">
                                      ↺ Reset
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* At-home tips with feedback */}
                              {tips.length > 0 && (
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                  <p className="text-sm font-semibold text-green-800 mb-3">🏠 How you can help at home</p>
                                  <div className="space-y-3">
                                    {tips.map((tip, i) => {
                                      const tipKey = `${item.message_id}_${i}`
                                      const fb = triedTips[tipKey]
                                      return (
                                        <div key={i} className={`rounded-lg p-3 transition ${fb === 'tried' ? 'bg-green-50 border border-green-200' : fb === 'struggled' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                                          <p className="text-sm text-gray-700"><span className="font-bold text-green-600">{i+1}.</span> {tip}</p>
                                          {!fb ? (
                                            <div className="flex gap-2 mt-2">
                                              <button onClick={() => handleTried(item.id, item.message_id, i, 'tried')}
                                                className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition">
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

                              {/* Reply section */}
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
                                <textarea
                                  value={replyText[item.message_id] || ''}
                                  onChange={e => setReplyText(r => ({ ...r, [item.message_id]: e.target.value }))}
                                  rows={2}
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
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">🎮 What do they love? (hobbies, interests)</label>
                <textarea value={interests} onChange={e => setInterests(e.target.value)} rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. Minecraft, Roblox, cricket, cooking, drawing..."/>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">📉 What do they find difficult?</label>
                <textarea value={struggles} onChange={e => setStruggles(e.target.value)} rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. grammar, essay writing, maths word problems..."/>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🧠 How do they learn best?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'visual', label: '👁️ Visual (diagrams, videos)' },
                    { value: 'hands-on', label: '🙌 Hands-on (doing things)' },
                    { value: 'reading', label: '📖 Reading & writing' },
                    { value: 'talking', label: '💬 Talking it through' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setLearningStyle(opt.value)}
                      className={`text-left px-3 py-2 rounded-lg text-sm border transition ${learningStyle === opt.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">💪 How confident do you feel supporting their learning?</label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: '😟 Not very' },
                    { value: 'medium', label: '🙂 Somewhat' },
                    { value: 'high', label: '😄 Very confident' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setConfidenceLevel(opt.value)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs border transition ${confidenceLevel === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🕐 When do you have time for home activities?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'morning', label: '🌅 Mornings' },
                    { value: 'evening', label: '🌙 Evenings' },
                    { value: 'weekend', label: '📅 Weekends' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setAvailabilityWindow(opt.value)}
                      className={`px-2 py-2 rounded-lg text-sm border transition ${availabilityWindow === opt.value ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">⏱️ How long can you spend on home activities?</label>
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
                <div className="bg-green-100 text-green-800 text-center py-3 rounded-lg font-semibold">
                  ✅ Profile saved! Tips will now be personalised.
                </div>
              ) : (
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                  {savingProfile ? 'Saving...' : '💾 Save Profile'}
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
              <p className="font-semibold">🔐 Privacy notice</p>
              <p>Stored securely. Never shared or used for advertising. Delete anytime. Compliant with the Australian Privacy Act 1988.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING AI CHAT BUBBLE ── */}
      {/* ── FLOATING AI CHAT BUBBLE ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-4 w-80 flex flex-col overflow-hidden"
            style={{ height: '420px' }}>
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
                  <div className="bg-white text-gray-400 px-3 py-2 rounded-2xl text-sm shadow rounded-bl-none">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            <div className="p-3 border-t flex gap-2 flex-shrink-0">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                placeholder="Ask anything in any language..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"/>
              <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}
                className="bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 font-bold">
                →
              </button>
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