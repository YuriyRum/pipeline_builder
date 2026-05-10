/**
 * TRANSFORMER NODE
 * Applies data transformations: normalize, scale, encode.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const TransformerNode = {
  id:     'transformer',
  title:  'Transformer',
  icon:   '⚙️',
  iconBg: '#1a3028',
  group:  'processing',
  doc: `Applies normalization or encoding strategies to a dataset.

## Modes
- Normalize: scale values to 0-1.
- Scale: Z-score standardization.
- Encode: one-hot encode categorical columns.
- Flatten: collapse nested objects into dot-notation keys.`,
  inputType:  'any',
  outputType: 'dataset',
  resultType: 'stats',


  defaultControls: [
    { type: 'select',   label: 'Mode',       key: 'mode',   val: 'Normalize', opts: ['Normalize', 'Scale', 'Encode', 'Flatten'] },
    { type: 'checkbox', label: 'Drop nulls', key: 'nulls',  val: true },
    { type: 'checkbox', label: 'Dedupe',     key: 'dup',    val: false },
    { type: 'toggle',   label: 'Parallel',   key: 'par',    val: true },
  ],

  async run(nodeData, ctx) {
    const mode   = nodeData.controls.find(c => c.key === 'mode')?.val   ?? 'Normalize'
    const nulls  = nodeData.controls.find(c => c.key === 'nulls')?.val  ?? true
    const dup    = nodeData.controls.find(c => c.key === 'dup')?.val    ?? false
    const par    = nodeData.controls.find(c => c.key === 'par')?.val    ?? true

    ctx.log(`Applying ${mode} transform${par ? ' (parallel)' : ''}…`)
    await delay(500)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    if (nulls) {
      ctx.log('Dropping null rows…')
      await delay(300)
    }
    if (dup) {
      ctx.log('Deduplicating records…')
      await delay(300)
    }
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const dropped = nulls ? Math.floor(Math.random() * 50) : 0
    ctx.log(`Transform complete — ${dropped} rows dropped`)

    return {
      ok: true,
      message: `${mode} applied, ${dropped} dropped`,
      output: { mode, dropped },
    }
  },
}

export default TransformerNode
