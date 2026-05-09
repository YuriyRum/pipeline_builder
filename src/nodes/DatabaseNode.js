/**
 * DATABASE SOURCE NODE
 * Simulates reading from a SQL/NoSQL database.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const DatabaseNode = {
  id:     'database',
  title:  'Database',
  icon:   '🗄️',
  iconBg: '#1f1a30',
  group:  'ingestion',

  defaultControls: [
    { type: 'select',   label: 'Driver',  key: 'driver', val: 'Postgres', opts: ['Postgres', 'MySQL', 'SQLite', 'MongoDB'] },
    { type: 'select',   label: 'Mode',    key: 'mode',   val: 'Query',    opts: ['Query', 'CDC', 'Full dump'] },
    { type: 'checkbox', label: 'SSL',     key: 'ssl',    val: true },
    { type: 'toggle',   label: 'Batch',   key: 'batch',  val: false },
  ],

  async run(nodeData, ctx) {
    const driver = nodeData.controls.find(c => c.key === 'driver')?.val ?? 'Postgres'
    const mode   = nodeData.controls.find(c => c.key === 'mode')?.val   ?? 'Query'
    const ssl    = nodeData.controls.find(c => c.key === 'ssl')?.val    ?? true

    ctx.log(`Connecting to ${driver}${ssl ? ' (SSL)' : ''}…`)
    await delay(600)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    ctx.log(`Running ${mode}…`)
    await delay(800)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const rows = Math.floor(Math.random() * 10000) + 500
    ctx.log(`${rows.toLocaleString()} rows fetched`)

    return {
      ok: true,
      message: `${rows.toLocaleString()} rows from ${driver}`,
      output: { rows, driver, mode },
    }
  },
}

export default DatabaseNode
