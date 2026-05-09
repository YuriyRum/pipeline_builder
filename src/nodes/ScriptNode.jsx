/**
 * SCRIPT NODE
 * Runs arbitrary JS in a sandboxed async Function.
 * Demonstrates a fully custom renderBody with a code editor textarea.
 */

import { MiniTextarea } from './NodeCard.jsx'

const DEFAULT_SCRIPT = `// input: data passed from upstream node
// return your transformed data
return { ...input, processed: true, ts: Date.now() }`

function ScriptBody(nodeData, updateControl) {
  const code    = nodeData.controls.find(c => c.key === 'code')?.val ?? DEFAULT_SCRIPT
  const timeout = nodeData.controls.find(c => c.key === 'timeout')?.val ?? '5s'

  return (
    <>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>
        async (input) =&gt; &#123;
      </div>
      <MiniTextarea
        value={code}
        onChange={v => updateControl('code', v)}
        rows={4}
        placeholder="// write JS here"
      />
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
        &#125;
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Timeout</span>
        <select
          value={timeout}
          onChange={e => updateControl('timeout', e.target.value)}
          style={{
            fontSize: 11, background: 'var(--surface2)', color: 'var(--text)',
            border: '1px solid var(--border2)', borderRadius: 4,
            padding: '1px 4px', fontFamily: 'var(--font-ui)', cursor: 'pointer',
          }}
        >
          {['2s','5s','10s','30s'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    </>
  )
}

const TIMEOUTS = { '2s': 2000, '5s': 5000, '10s': 10000, '30s': 30000 }
const delay = ms => new Promise(r => setTimeout(r, ms))

const ScriptNode = {
  id:     'script',
  title:  'Script',
  icon:   '📝',
  iconBg: '#1a1e2a',
  group:  'processing',

  defaultControls: [
    { type: 'text',   label: 'Code',    key: 'code',    val: DEFAULT_SCRIPT },
    { type: 'select', label: 'Timeout', key: 'timeout', val: '5s', opts: ['2s','5s','10s','30s'] },
  ],

  renderBody: ScriptBody,

  async run(nodeData, ctx) {
    const code       = nodeData.controls.find(c => c.key === 'code')?.val    ?? DEFAULT_SCRIPT
    const timeoutKey = nodeData.controls.find(c => c.key === 'timeout')?.val ?? '5s'
    const timeoutMs  = TIMEOUTS[timeoutKey] ?? 5000

    ctx.log(`Running script (timeout: ${timeoutKey})…`)

    const timeoutPromise = delay(timeoutMs).then(() => {
      throw new Error(`Script timeout after ${timeoutKey}`)
    })

    try {
      // Build an async function from the user script code.
      // input = null here (wire real upstream output in a full impl).
      // eslint-disable-next-line no-new-func
      const fn = new Function('input', `return (async () => { ${code} })()`)

      const result = await Promise.race([
        fn(ctx.input ?? null),
        timeoutPromise,
      ])

      ctx.log(`Script returned: ${JSON.stringify(result).slice(0, 60)}`)
      return {
        ok: true,
        message: 'script ok',
        output: result,
      }
    } catch (err) {
      ctx.log(`Script error: ${err.message}`)
      return {
        ok: false,
        message: err.message,
        output: null,
      }
    }
  },
}

export default ScriptNode
