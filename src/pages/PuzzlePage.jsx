import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/icons'
import TopNav from '../components/TopNav'
import Puzzle from '../components/Puzzle'
import { useToast } from '../components/Toast'

export default function PuzzlePage() {
  const navigate = useNavigate()
  const toast = useToast()
  return (
    <div className="app">
      <div className="top-row">
        <button className="icon-button back" onClick={() => navigate('/')} aria-label="back">
          <BackIcon />
          <span>back</span>
        </button>
        <TopNav />
      </div>

      <div className="puzzle-wrap">
        <h1 className="page-title">the deck</h1>
        <Puzzle cols={6} rows={8} seed={42} onSolved={() => toast('you finished the picture ✶')} />
      </div>
    </div>
  )
}
