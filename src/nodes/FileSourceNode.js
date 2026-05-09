/**
 * FILE SOURCE NODE
 * Simulates reading files from disk / watching a directory.
 */

const FileSourceNode = {
  id:     'file-source',
  title:  'File source',
  icon:   '📂',
  iconBg: '#1a2d3a',
  group:  'ingestion',

  defaultControls: [
    { type: 'toggle', label: 'Watch dir', key: 'watch', val: true },
    { type: 'select', label: 'Format',    key: 'fmt',   val: 'CSV', opts: ['CSV', 'JSON', 'Parquet', 'XLSX'] },
    { type: 'select', label: 'Encoding',  key: 'enc',   val: 'UTF-8', opts: ['UTF-8', 'Latin-1', 'ASCII'] },
  ],

  /** Called when the pipeline runs this node.
   * @param {object} nodeData   – live node data (read controls here)
   * @param {object} ctx        – { log(msg), signal, input }
   * @returns {Promise<{ ok, message, output }>}
   */
  async run(nodeData, ctx) {
    const fmt   = nodeData.controls.find(c => c.key === 'fmt')?.val   ?? 'CSV'
    const watch = nodeData.controls.find(c => c.key === 'watch')?.val ?? false

    ctx.log(`Opening ${fmt} reader${watch ? ' (watch mode)' : ''}…`)
    await delay(400)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    ctx.log(`Scanning directory…`)
    await delay(600)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    const fileCount = Math.floor(Math.random() * 8) + 3
    ctx.log(`Found ${fileCount} ${fmt} file(s)`)
    await delay(300)

    return {
      ok: true,
      message: `${fileCount} ${fmt} files read`,
      output: { fileCount, fmt, rows: fileCount * 120 },
    }
  },
}

const delay = ms => new Promise(r => setTimeout(r, ms))
export default FileSourceNode
