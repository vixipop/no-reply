import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Archive from './pages/Archive'
import Entry from './pages/Entry'
import { useToast } from './components/Toast'
import MusicPlayer from './components/MusicPlayer'
import './App.css'

export default function App() {
  const toast = useToast()

  // Ctrl/Cmd+S never triggers the browser's save dialog — everything autosaves,
  // so it just reassures.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        toast('no reply saves your work automatically <3')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toast])

  return (
    <>
      <MusicPlayer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/entry/:id" element={<Entry />} />
      </Routes>
    </>
  )
}
