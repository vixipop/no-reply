import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Archive from './pages/Archive'
import Entry from './pages/Entry'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/entry/:id" element={<Entry />} />
    </Routes>
  )
}
