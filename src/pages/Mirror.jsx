import { useNavigate } from 'react-router-dom'
import { BackIcon, CornerSparkle } from '../components/icons'
import TopNav from '../components/TopNav'

export default function Mirror() {
  const navigate = useNavigate()
  return (
    <div className="app">
      <CornerSparkle />

      <div className="top-row">
        <button className="icon-button back" onClick={() => navigate('/')} aria-label="back">
          <BackIcon />
          <span>back</span>
        </button>
        <TopNav />
      </div>

      <div className="page-wrap">
        <h1 className="page-title">mirror</h1>
        <p className="page-empty">your reflection is still developing.</p>
      </div>
    </div>
  )
}
