import { NavLink } from 'react-router-dom'
import { ArchiveIcon, CogIcon, MirrorIcon } from './icons'

// top-centre navigation, shown on every page (current page is highlighted)
export default function TopNav() {
  return (
    <nav className="top-nav">
      <NavLink to="/archive">
        <ArchiveIcon />
        archive
      </NavLink>
      <NavLink to="/mirror">
        <MirrorIcon />
        mirror
      </NavLink>
      <NavLink to="/settings">
        <CogIcon />
        settings
      </NavLink>
    </nav>
  )
}
