import { useNavigate } from 'react-router-dom'
import { PlusIcon } from './icons'

// always-present "new entry" button (bottom-right). Opens a fresh journal page
// with a blank title, from anywhere in the app.
export default function Fab() {
  const navigate = useNavigate()
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
