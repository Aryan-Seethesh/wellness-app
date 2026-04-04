import React, { useState, useEffect } from 'react'
import { Send, Bot, User, Loader } from 'lucide-react'
import { aiApi } from '../../services/api'
import VoiceInput from '../ui/VoiceInput'

export default function AiCoachChat() {
  const [history, setHistory] = useState([
    { role: 'assistant', content: 'Hi there! I am your AI Wellness Coach powered by Qwen 2.5 via Hugging Face. Click the button below to generate a tailored wellness recommendation.' }
  ])
  const [loading, setLoading] = useState(false)

  const askCoach = async () => {
    setLoading(true)
    try {
      const res = await aiApi.coach()
      const newResponse = res.data?.response || "I couldn't generate a response."
      setHistory(h => [...h, { role: 'assistant', content: newResponse }])
    } catch (e) {
      setHistory(h => [...h, { role: 'assistant', content: 'Unable to reach the AI Coach right now.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Bot size={20} color="var(--accent-purple)" /> 
        AI Wellness Coach
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--bg-secondary)',
            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
            padding: '10px 14px',
            borderRadius: '12px',
            maxWidth: '85%',
            lineHeight: 1.5,
            fontSize: '14px',
            whiteSpace: 'pre-wrap'
          }}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)' }}>
            <Loader size={16} className="spinner" /> Generating your plan...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-primary w-full" onClick={askCoach} disabled={loading} style={{ justifyContent: 'center' }}>
          Get Personalized Recommendation
        </button>
      </div>
    </div>
  )
}
