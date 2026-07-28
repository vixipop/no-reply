import { useLayoutEffect, useRef } from 'react'
import { newId } from '../lib/storage'
import { PinIcon } from './icons'

function readAsDataURL(file) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.readAsDataURL(file)
  })
}

// always keep a text block at the end so you can keep writing under an image
function withTrailingText(blocks) {
  if (blocks.length === 0) return [{ id: newId(), type: 'text', text: '' }]
  const last = blocks[blocks.length - 1]
  if (last.type !== 'text') return [...blocks, { id: newId(), type: 'text', text: '' }]
  return blocks
}

function TextBlock({ block, placeholder, onChange, onPasteImage }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [block.text])
  return (
    <textarea
      ref={ref}
      className="block-text"
      rows={1}
      placeholder={placeholder}
      value={block.text}
      onChange={(e) => onChange(block.id, e.target.value)}
      onPaste={(e) => onPasteImage(e, block.id)}
    />
  )
}

function ImageBlock({ block, isCover, onSetCover, onRemove, onResize }) {
  const ref = useRef(null)

  // drag a side handle to resize horizontally (image stays centered)
  const startResize = (e, side) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = ref.current.offsetWidth
    const maxW = ref.current.parentElement?.clientWidth || startW
    const move = (ev) => {
      const dx = ev.clientX - startX
      const w = side === 'right' ? startW + dx * 2 : startW - dx * 2
      onResize(block.id, Math.round(Math.max(90, Math.min(maxW, w))))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      className="img-block"
      ref={ref}
      style={block.width ? { width: `${block.width}px` } : undefined}
    >
      <img src={block.src} alt="" draggable={false} />
      <span className="img-handle left" onPointerDown={(e) => startResize(e, 'left')} />
      <span className="img-handle right" onPointerDown={(e) => startResize(e, 'right')} />
      <div className="img-tools">
        <button
          className={`img-pin${isCover ? ' active' : ''}`}
          title={isCover ? 'this is the archive cover' : 'make this the archive cover'}
          onClick={() => onSetCover(block.id)}
        >
          <PinIcon />
        </button>
        <button className="img-del" title="remove" onClick={() => onRemove(block.id)}>
          ×
        </button>
      </div>
    </div>
  )
}

export function BlockEditor({ blocks, coverId, onChange, onSetCover }) {
  const set = (nb) => onChange(withTrailingText(nb))

  const updateText = (id, text) =>
    set(blocks.map((b) => (b.id === id ? { ...b, text } : b)))

  const updateWidth = (id, width) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, width } : b)))

  const removeBlock = (id) => set(blocks.filter((b) => b.id !== id))

  // paste an image → split the focused text block at the caret and drop it in
  const pasteImage = (e, blockId) => {
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'))
    if (!item) return
    e.preventDefault()
    const file = item.getAsFile()
    const pos = e.target.selectionStart
    const idx = blocks.findIndex((b) => b.id === blockId)
    readAsDataURL(file).then((src) => {
      const b = blocks[idx]
      const before = b.text.slice(0, pos)
      const after = b.text.slice(pos)
      const nb = [...blocks]
      nb.splice(
        idx,
        1,
        { id: newId(), type: 'text', text: before },
        { id: newId(), type: 'image', src, width: null },
        { id: newId(), type: 'text', text: after },
      )
      set(nb)
    })
  }

  // drag an image file onto the canvas → append it
  const onDrop = async (e) => {
    const files = [...(e.dataTransfer?.files || [])].filter((f) =>
      f.type.startsWith('image/'),
    )
    if (!files.length) return
    e.preventDefault()
    const srcs = await Promise.all(files.map(readAsDataURL))
    set([...blocks, ...srcs.map((src) => ({ id: newId(), type: 'image', src, width: null }))])
  }

  return (
    <div className="block-editor" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      {blocks.map((b, i) =>
        b.type === 'text' ? (
          <TextBlock
            key={b.id}
            block={b}
            placeholder={i === 0 ? 'start writing… (paste or drop images anywhere)' : ''}
            onChange={updateText}
            onPasteImage={pasteImage}
          />
        ) : (
          <ImageBlock
            key={b.id}
            block={b}
            isCover={b.id === coverId}
            onSetCover={onSetCover}
            onRemove={removeBlock}
            onResize={updateWidth}
          />
        ),
      )}
    </div>
  )
}

// read-only render of blocks (entry reading view)
export function BlockView({ blocks }) {
  return (
    <div className="block-view">
      {(blocks || []).map((b) =>
        b.type === 'text' ? (
          b.text ? (
            <p key={b.id} className="bv-text">
              {b.text}
            </p>
          ) : null
        ) : (
          <img
            key={b.id}
            className="bv-img"
            src={b.src}
            alt=""
            style={b.width ? { width: `${b.width}px` } : undefined}
          />
        ),
      )}
    </div>
  )
}
