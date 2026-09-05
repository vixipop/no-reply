import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/icons'
import TopNav from '../components/TopNav'
import Puzzle from '../components/Puzzle'
import { useToast } from '../components/Toast'

export default function PuzzlePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [shadow, setShadow] = useState('dramatic')
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
        <div className="puzzle-head">
          <h1 className="page-title">the deck</h1>
          <div className="pz-shadow-toggle" role="group" aria-label="shadow style">
            <button
              className={shadow === 'dramatic' ? 'active' : ''}
              onClick={() => setShadow('dramatic')}
            >
              dramatic
            </button>
            <button className={shadow === 'soft' ? 'active' : ''} onClick={() => setShadow('soft')}>
              soft
            </button>
          </div>
        </div>
        <Puzzle
          cols={6}
          rows={8}
          seed={42}
          shadow={shadow}
          onSolved={() => toast('you finished the picture ✶')}
        />
      </div>
    </div>
  )
}
