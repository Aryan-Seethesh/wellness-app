import React, { useState, useRef } from 'react'
import { Mic, Square, Loader } from 'lucide-react'
import { aiApi } from '../../services/api'

export default function VoiceInput({ onTextResult }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (blob) => {
    setIsProcessing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', blob, 'recording.webm')
      const res = await aiApi.speechToText(formData)
      if (res.data?.text) {
        onTextResult(res.data.text)
      }
    } catch (err) {
      console.error('Error processing audio:', err)
      setError('Transcription failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isProcessing) {
    return (
      <button type="button" className="btn btn-secondary" disabled>
        <Loader size={16} className="spinner" /> processing
      </button>
    )
  }

  if (isRecording) {
    return (
      <button type="button" className="btn" style={{ background: 'var(--accent-rose)', color: 'white', padding: '8px 12px' }} onClick={stopRecording}>
        <Square size={16} /> Stop Recording
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button type="button" className="btn btn-secondary" onClick={startRecording} title="Voice Input" style={{ padding: '8px 12px' }}>
        <Mic size={16} /> Voice Input
      </button>
      {error && <span style={{ fontSize: '12px', color: 'var(--accent-rose)' }}>{error}</span>}
    </div>
  )
}
