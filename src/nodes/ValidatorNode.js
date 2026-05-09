/**
 * VALIDATOR NODE
 * Schema validation with configurable strictness.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const ValidatorNode = {
  id:     'validator',
  title:  'Validator',
  icon:   '✅',
  iconBg: '#1e2e1a',
  group:  'processing',

  defaultControls: [
    { type: 'toggle', label: 'Strict mode',   key: 'strict', val: true },
    { type: 'select', label: 'Schema',        key: 'schema', val: 'v2',    opts: ['v1', 'v2', 'v3', 'custom'] },
    { type: 'select', label: 'On fail',       key: 'fail',   val: 'Warn',  opts: ['Warn', 'Drop', 'Abort'] },
    { type: 'toggle', label: 'Type coerce',   key: 'coerce', val: false },
  ],

  async run(nodeData, ctx) {
    const strict = nodeData.controls.find(c => c.key === 'strict')?.val ?? true
    const schema = nodeData.controls.find(c => c.key === 'schema')?.val ?? 'v2'
    const fail   = nodeData.controls.find(c => c.key === 'fail')?.val   ?? 'Warn'

    ctx.log(`Loading schema ${schema}${strict ? ' (strict)' : ''}…`)
    await delay(400)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    ctx.log('Validating records…')
    await delay(700)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const invalid = Math.floor(Math.random() * 10)
    if (invalid > 0) {
      ctx.log(`${invalid} invalid record(s) — action: ${fail}`)
      if (fail === 'Abort') {
        return { ok: false, message: `${invalid} invalid records, aborted` }
      }
    } else {
      ctx.log('All records valid ✓')
    }

    return {
      ok: true,
      message: invalid ? `${invalid} issue(s) → ${fail}` : 'all valid',
      output: { schema, invalid, action: fail },
    }
  },
}

export default ValidatorNode
