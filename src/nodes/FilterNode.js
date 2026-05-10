/**
 * FILTER NODE
 * Row-level filtering with condition expression.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const FilterNode = {
  id:     'filter',
  title:  'Filter',
  icon:   '🔍',
  iconBg: '#1e2414',
  group:  'processing',
  doc: `Filters rows based on a simple condition applied to a chosen field.

## Conditions
- > 0: keeps rows where the field is a positive number.
- != null: keeps rows where the field has a value.
- custom: placeholder for a future expression parser.

## Controls
- Invert: negates the condition (NOT filter).`,
  inputType:  'dataset',
  outputType: 'dataset',
  resultType: 'stats',


  defaultControls: [
    { type: 'select',   label: 'Condition', key: 'cond',   val: '> 0',    opts: ['> 0', '!= null', 'custom'] },
    { type: 'toggle',   label: 'Invert',    key: 'inv',    val: false },
    { type: 'select',   label: 'Field',     key: 'field',  val: 'value',  opts: ['value', 'id', 'timestamp', 'status'] },
  ],

  async run(nodeData, ctx) {
    const cond  = nodeData.controls.find(c => c.key === 'cond')?.val  ?? '> 0'
    const inv   = nodeData.controls.find(c => c.key === 'inv')?.val   ?? false
    const field = nodeData.controls.find(c => c.key === 'field')?.val ?? 'value'

    ctx.log(`Filtering where ${field} ${inv ? 'NOT ' : ''}${cond}…`)
    await delay(500)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const kept    = Math.floor(Math.random() * 400) + 100
    const removed = Math.floor(Math.random() * 80)
    ctx.log(`${kept} rows kept, ${removed} removed`)

    return {
      ok: true,
      message: `${kept} kept / ${removed} filtered`,
      output: { kept, removed, condition: `${field} ${cond}` },
    }
  },
}

export default FilterNode
