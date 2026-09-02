import { useEffect, useLayoutEffect, useRef } from 'react'
import { newId } from '../lib/storage'
import { fileToDataURL } from '../lib/image'
import { AlignIcon, PinIcon, WrapIcon } from './icons'

const ALIGN_ORDER = ['center', 'left', 'right']
const WRAP_DEFAULT_WIDTH = 320 // px an image snaps to when text starts flowing beside it

// always keep a plain text block at the very end so you can keep writing under
// an image — including when the last text was pulled *beside* a wrapped image
function withTrailingText(blocks) {
  if (blocks.length === 0) return [{ id: newId(), type: 'text', text: '' }]
  const last = blocks[blocks.length - 1]
  const prev = blocks[blocks.length - 2]
  const lastIsWrapPaired =
    last.type === 'text' && prev && prev.type === 'image' && prev.wrap
  if (last.type !== 'text' || lastIsWrapPaired)
    return [...blocks, { id: newId(), type: 'text', text: '' }]
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

function TextBlock({ block, placeholder, onChange, onPasteImage, onKeyDown, registerRef }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [block.text])
  return (
    <textarea
      ref={(el) => {
        ref.current = el
        registerRef(block.id, el)
      }}
      className="block-text"
      rows={1}
      placeholder={placeholder}
      value={block.text}
      onChange={(e) => onChange(block.id, e.target.value)}
      onPaste={(e) => onPasteImage(e, block.id)}
      onKeyDown={(e) => onKeyDown(e, block)}
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

  // keep a live map of each text block's textarea, so a merge can restore the caret
  const refs = useRef({})
  const pendingFocus = useRef(null)
  const registerRef = (id, el) => {
    if (el) refs.current[id] = el
    else delete refs.current[id]
  }
  useLayoutEffect(() => {
    const pf = pendingFocus.current
    if (!pf) return
    pendingFocus.current = null
    const el = refs.current[pf.id]
    if (el) {
      el.focus()
      const o = Math.min(pf.offset, el.value.length)
      el.setSelectionRange(o, o)
    }
  })

  // entries that were saved ending in an image (e.g. a quick note + photo) have
  // no trailing text block, so there's nowhere to type after the image. Enforce
  // the invariant on mount / whenever blocks change.
  useEffect(() => {
    const fixed = withTrailingText(blocks)
    if (fixed !== blocks) onChange(fixed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks])

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

  // Backspace at the very start of a text block joins it upward: merge into the
  // previous text block, or delete a preceding image and rejoin the text around
  // it. Fixes fragmented text boxes and stuck empty lines/gaps.
  const mergeBack = (e, block) => {
    if (e.key !== 'Backspace') return
    const el = e.target
    if (el.selectionStart !== 0 || el.selectionEnd !== 0) return
    const idx = blocks.findIndex((b) => b.id === block.id)
    if (idx <= 0) return
    const prev = blocks[idx - 1]
    e.preventDefault()
    if (prev.type === 'text') {
      pendingFocus.current = { id: prev.id, offset: prev.text.length }
      set(
        blocks
          .map((b) => (b.id === prev.id ? { ...b, text: prev.text + block.text } : b))
          .filter((b) => b.id !== block.id),
      )
    } else {
      // prev is an image → remove it and rejoin the text on either side
      const before = blocks[idx - 2]
      let nb = blocks.filter((b) => b.id !== prev.id)
      if (before && before.type === 'text') {
        pendingFocus.current = { id: before.id, offset: before.text.length }
        nb = nb
          .map((b) => (b.id === before.id ? { ...b, text: before.text + block.text } : b))
          .filter((b) => b.id !== block.id)
      } else {
        pendingFocus.current = { id: block.id, offset: 0 }
      }
      set(nb)
    }
  }

  // paste an image → split the focused text block at the caret and drop it in
  const pasteImage = (e, blockId) => {
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'))
    if (!item) return
    e.preventDefault()
    const file = item.getAsFile()
    const pos = e.target.selectionStart
    const idx = blocks.findIndex((b) => b.id === blockId)
    fileToDataURL(file).then((src) => {
      if (!src) return
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
    const srcs = (await Promise.all(files.map((f) => fileToDataURL(f)))).filter(Boolean)
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
      placeholder={
        i === 0
          ? 'start writing… (paste or drop images anywhere)'
          : i === blocks.length - 1
            ? 'keep writing…'
            : ''
      }
      onChange={updateText}
      onPasteImage={pasteImage}
      onKeyDown={mergeBack}
      registerRef={registerRef}
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
