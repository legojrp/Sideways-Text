import { useEffect, useMemo, useState } from 'react'
import './index.css'
import mappings from './mappings.json'


function convertWithMapping(input, mapping) {
  if (!input) return ''
  let out = ''
  for (const ch of input) {
    out += mapping?.[ch] ?? ch
  }
  return out
}

// convert to upside-down: map each char and reverse the whole string
function convertUpsideDown(input, mapping) {
  const mapped = convertWithMapping(input, mapping)
  return mapped.split('').reverse().join('')
}

// convert to sideways: for each character we map it and produce a vertical stack
// convert to sideways: produce padded columns (arrays) so UI can render columns side-by-side
function getSidewaysColumns(input, mapping) {
  if (!input) return []
  const lines = input.split(/\r?\n/)
  // map and reverse each line individually; mapping may return multi-char strings
  const columns = lines.map((line) => {
    const mapped = [...line].map((ch) => mapping?.[ch] ?? ch)
    return mapped.reverse()
  })

  const maxLen = Math.max(...columns.map((c) => c.length), 0)

  // pad each column at the start so characters stay at the bottom
  const paddedColumns = columns.map((col) => {
    const padCount = maxLen - col.length
    if (padCount <= 0) return col
    return Array.from({ length: padCount }, () => '') .concat(col)
  })

  return paddedColumns
}

export default function App() {
  const [input, setInput] = useState('Hello! \nThis is some \nsideways text. \nUsing Unicode \nWORKS WITH CAPS TOO! ')
  const [mode, setMode] = useState('sideways') // 'sideways' or 'upside-down'

  const mapping = useMemo(() => {
    return mode === 'upside-down' ? mappings.upsideDown : mappings.sideways
  }, [mode])

  const output = useMemo(() => {
    if (mode === 'upside-down') return convertUpsideDown(input, mapping)
    return null
  }, [input, mapping, mode])

  // columns used only in sideways mode
  const sidewaysColumns = useMemo(() => {
    if (mode !== 'sideways') return []
    return getSidewaysColumns(input, mapping)
  }, [input, mapping, mode])

  const [copyMsg, setCopyMsg] = useState('')

  function sidewaysTextFromColumns(columns, colSep = '    ') {
    if (!columns || columns.length === 0) return ''
    const rows = []
    const maxLen = columns[0].length
    for (let i = 0; i < maxLen; i++) {
      const cells = columns.map((col) => col[i] ?? '')
      rows.push(cells.join(colSep))
    }
    return rows.join('\n')
  }

  async function handleCopy() {
    try {
      let textToCopy = ''
      if (mode === 'sideways') {
        textToCopy = sidewaysTextFromColumns(sidewaysColumns)
      } else {
        // upside-down
        textToCopy = convertUpsideDown(input, mapping)
      }
      await navigator.clipboard.writeText(textToCopy)
      setCopyMsg('Copied!')
      setTimeout(() => setCopyMsg(''), 1500)
    } catch (e) {
      console.error('copy failed', e)
      setCopyMsg('Failed')
      setTimeout(() => setCopyMsg(''), 1500)
    }
  }

// Ensure directionality doesn't break layout by wrapping lines with LRI..PDI
// LRI = U+2066, PDI = U+2069
function isolateForLTR(text) {
  if (!text) return text
  const LRI = '\u2066'
  const PDI = '\u2069'
  // wrap each line to avoid RTL characters reordering across lines
  return text.split('\n').map((line) => `${LRI}${line}${PDI}`).join('\n')
}

function isolateCell(text) {
  if (!text) return text
  const LRI = '\u2066'
  const PDI = '\u2069'
  return `${LRI}${text}${PDI}`
}

function SidewaysPreview({ columns }) {
  // measure column widths using canvas
  const [colWidths, setColWidths] = useState([])

  useEffect(() => {
    if (!columns || columns.length === 0) {
      setColWidths([])
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // match the font used in the output area
    const fontSize = 16
    const fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace"
    ctx.font = `${fontSize}px ${fontFamily}`

    const widths = columns.map((col) => {
      const w = col.reduce((max, cell) => {
        const txt = cell ?? ''
        const m = ctx.measureText(txt).width
        return Math.max(max, m)
      }, 0)
      // add small padding
      return Math.ceil(w + 12)
    })

    setColWidths(widths)
  }, [columns])

  if (!columns || columns.length === 0) return <div className="sideways-preview empty">(no input)</div>

  return (
    <div className="sideways-preview">
      {columns.map((col, ci) => (
        <div key={ci} className="col" style={{ width: colWidths[ci] ?? 'auto' }}>
          {col.map((cell, ri) => (
            <div key={ri} className="cell">{isolateCell(cell)}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

  return (
    <div className="app">
      <header>
        <h1>Sideways Text</h1>
        <p className="tagline">Convert alphanumeric text to sideways using a Unicode mapping (editable JSON)</p>
      </header>

      <main>
        <section className="converter">
          <div className="pane">
            <div className="pane-header">
              <label htmlFor="input">Input (editable)</label>
              <div className="pane-controls">
                <label htmlFor="mode" className="sr-only">Mode</label>
                <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="sideways">Sideways</option>
                  <option value="upside-down">Upside-down</option>
                </select>
              </div>
            </div>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type text here"
            />
          </div>

          <div className="pane">
            <div className="pane-header">
              <label htmlFor="output">Output (read-only)</label>
              <div className="output-controls">
                <button className="copy-btn" onClick={handleCopy} aria-label="Copy output">
                  Copy
                </button>
                <span className="copy-msg">{copyMsg}</span>
              </div>
            </div>
            {mode === 'sideways' ? (
              <SidewaysPreview columns={sidewaysColumns} />
            ) : (
              <textarea id="output" value={isolateForLTR(output)} readOnly />
            )}
          </div>
        </section>

        {/* mappings are loaded from src/mappings.json and controlled in source code */}
      </main>

      <footer>
        <div className="footer-left">
          <small>
            Made by <a href="https://github.com/legojrp">legojrp</a>, with help from <a href="https://www.reddit.com/r/Unicode/comments/1kormfj/best_upwardfacingsideways_alphabet/">a reddit post</a> and <a href="https://shapecatcher.com/">this website</a>.
            &nbsp;Mappings controlled in <code>src/mappings.json</code>
          </small>
        </div>
        <div className="footer-right">
          <a href="https://github.com/legojrp/Sideways-Text" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
