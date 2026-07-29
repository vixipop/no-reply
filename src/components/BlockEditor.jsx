import { useLayoutEffect, useRef } from 'react'
import { newId } from '../lib/storage'
import { AlignIcon, PinIcon, WrapIcon } from './icons'

const ALIGN_ORDER = ['center', 'left', 'right']
const WRAP_DEFAULT_WIDTH = 320 // px an image snaps to when text starts flowing beside it

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

// group a wrap-image with the text block right after it into one side-by-side row
function groupBlocks(blocks) {
  const out = []
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const next = blocks[i + 1]
    if (b.type === 'image' && b.wrap && next && next.type === 'text') {
      out.push({ kind: 'row', image: b, text: next })
      i++ // the text block is consumed into the row
    } else {
      out.push({ kind: 'single', block: b })
    }
  }
  return out
}

// which side the image sits on when text flows beside it
const wrapSide = (align) => (align === 'right' ? 'right' : 'left')

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

function ImageBlock({ block, isCover, onSetCover, onRemove, onResize, onCycleAlign, onToggleWrap }) {
  const ref = useRef(null)
  const align = block.align || 'center'

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
      className={`img-block align-${align}${block.wrap ? ' is-wrap' : ''}`}
      ref={ref}
      style={block.width ? { width: `${block.width}px` } : undefined}
    >
      <img src={block.src} alt="" draggable={false} />
      <span className="img-handle left" onPointerDown={(e) => startResize(e, 'left')} />
      <span className="img-handle right" onPointerDown={(e) => startResize(e, 'right')} />
      <div className="img-tools">
        <button
          className={`img-wrap${block.wrap ? ' active' : ''}`}
          title={block.wrap ? 'text flows beside — click to stack' : 'flow text beside this image'}
          onClick={() => onToggleWrap(block.id)}
        >
          <WrapIcon on={!!block.wrap} />
        </button>
        <button
          className="img-align"
          title={`align: ${align} — click to change`}
          onClick={() => onCycleAlign(block.id)}
        >
          <AlignIcon align={align} />
        </button>
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

  const cycleAlign = (id) =>
    onChange(
      blocks.map((b) => {
        if (b.id !== id) return b
        const next = ALIGN_ORDER[(ALIGN_ORDER.indexOf(b.align || 'center') + 1) % 3]
        return { ...b, align: next }
      }),
    )

  // toggle "text flows beside this image"; snap to a sensible width when turning on
  const toggleWrap = (id) =>
    set(
      blocks.map((b) => {
        if (b.id !== id) return b
        const wrap = !b.wrap
        const width = wrap && !b.width ? WRAP_DEFAULT_WIDTH : b.width
        const align = wrap && (b.align || 'center') === 'center' ? 'left' : b.align
        return { ...b, wrap, width, align }
      }),
    )

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

  const renderImage = (b) => (
    <ImageBlock
      block={b}
      isCover={b.id === coverId}
      onSetCover={onSetCover}
      onRemove={removeBlock}
      onResize={updateWidth}
      onCycleAlign={cycleAlign}
      onToggleWrap={toggleWrap}
    />
  )

  const renderText = (b, i) => (
    <TextBlock
      block={b}
      placeholder={i === 0 ? 'start writing… (paste or drop images anywhere)' : ''}
      onChange={updateText}
      onPasteImage={pasteImage}
    />
  )

  const groups = groupBlocks(blocks)
  let idx = 0

  return (
    <div className="block-editor" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      {groups.map((g) => {
        if (g.kind === 'row') {
          const at = idx
          idx += 2
          return (
            <div key={g.image.id} className={`wrap-row wrap-${wrapSide(g.image.align)}`}>
              {renderImage(g.image)}
              {renderText(g.text, at + 1)}
            </div>
          )
        }
        const at = idx
        idx += 1
        return (
          <div key={g.block.id}>
            {g.block.type === 'text' ? renderText(g.block, at) : renderImage(g.block)}
          </div>
        )
      })}
    </div>
  )
}

// read-only render of blocks (entry reading view)
export function BlockView({ blocks }) {
  const groups = groupBlocks(blocks || [])
  return (
    <div className="block-view">
      {groups.map((g) => {
        if (g.kind === 'row') {
          return (
            <div key={g.image.id} className={`wrap-row wrap-${wrapSide(g.image.align)}`}>
              <img
                className={`bv-img align-${g.image.align || 'center'} is-wrap`}
                src={g.image.src}
                alt=""
                style={g.image.width ? { width: `${g.image.width}px` } : undefined}
              />
              {g.text.text ? <p className="bv-text">{g.text.text}</p> : null}
            </div>
          )
        }
        const b = g.block
        return b.type === 'text' ? (
          b.text ? (
            <p key={b.id} className="bv-text">
              {b.text}
            </p>
          ) : null
        ) : (
          <img
            key={b.id}
            className={`bv-img align-${b.align || 'center'}`}
            src={b.src}
            alt=""
            style={b.width ? { width: `${b.width}px` } : undefined}
          />
        )
      })}
    </div>
  )
}
