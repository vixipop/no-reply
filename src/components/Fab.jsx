import { useLocation, useNavigate } from 'react-router-dom'
import { PlusIcon } from './icons'

// "new entry" button (bottom-right) on every page EXCEPT home — home is already
// the composer (quick note / journal), so a "+" there is redundant.
export default function Fab() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return (
    <button
      className="fab"
      onClick={() => navigate('/?new=journal')}
      aria-label="new entry"
      title="new entry"
    >
      <PlusIcon />
    </button>
  )
}
