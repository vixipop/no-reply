import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon, CornerSparkle } from '../components/icons'
import { exportData, importData, loadEntries } from '../lib/storage'
import { useToast } from '../components/Toast'

export default function Settings() {
  const navigate = useNavigate()
  const toast = useToast()
  const fileRef = useRef(null)

  // download every entry as a JSON backup file
  const onExport = () => {
    const count = loadEntries().length
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `no-reply-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast(count ? 'backup downloaded — keep it somewhere safe' : 'nothing to back up yet')
  }

  // read a backup file and merge its entries in
  const onImport = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be re-picked later
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const { added, total } = importData(JSON.parse(reader.result))
        toast(
          added === 0
            ? 'already up to date — nothing new to import'
            : `imported ${added} ${added === 1 ? 'entry' : 'entries'} · ${total} total`,
        )
      } catch {
        toast("that file isn't a no reply backup")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="app">
      <CornerSparkle />

      <div className="top-row">
        <button className="icon-button back" onClick={() => navigate('/')} aria-label="back">
          <BackIcon />
          <span>back</span>
        </button>
      </div>

      <div className="page-wrap">
        <h1 className="page-title">settings</h1>

        <section className="settings-section">
          <h2 className="settings-label">your data</h2>
          <p className="settings-hint">
            everything stays on this device. download a backup, or bring one in to move your
            entries to another browser.
          </p>
          <div className="settings-actions">
            <button className="text-button" onClick={onExport}>
              export
            </button>
            <button className="text-button" onClick={() => fileRef.current?.click()}>
              import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={onImport}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
