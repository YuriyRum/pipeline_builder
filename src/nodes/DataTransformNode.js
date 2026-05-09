/**
 * DATA TRANSFORM NODE
 * ────────────────────
 * Applies column-level transformations to a parsed dataset:
 *  - Drop columns
 *  - Rename columns
 *  - Cast numeric values
 *  - Filter rows by a simple condition
 *
 * Input/Output: { rows, columns, totalRows }
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const DataTransformNode = {
  id:     'data-transform',
  title:  'Data Transform',
  icon:   '🔄',
  iconBg: '#1e2830',
  group:  'processing',

  defaultControls: [
    { type: 'select',   label: 'Cast numbers', key: 'cast',    val: 'Auto',   opts: ['Auto', 'Force', 'Off']  },
    { type: 'toggle',   label: 'Drop empties', key: 'dropEmpty', val: true   },
    { type: 'toggle',   label: 'Trim strings', key: 'trim',    val: true      },
    { type: 'select',   label: 'Sort by',      key: 'sort',    val: 'None',   opts: ['None', 'First col ↑', 'First col ↓'] },
  ],

  async run(nodeData, ctx) {
    const input = ctx.input
    if (!input?.rows) return { ok: false, message: 'No dataset from upstream' }

    const cast      = nodeData.controls.find(c => c.key === 'cast')?.val      ?? 'Auto'
    const dropEmpty = nodeData.controls.find(c => c.key === 'dropEmpty')?.val ?? true
    const trim      = nodeData.controls.find(c => c.key === 'trim')?.val      ?? true
    const sort      = nodeData.controls.find(c => c.key === 'sort')?.val      ?? 'None'

    ctx.log(`Transforming ${input.rows.length} rows…`)
    await delay(300)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    let rows = [...input.rows]
    const { columns } = input

    // Trim strings
    if (trim) {
      rows = rows.map(row =>
        Object.fromEntries(Object.entries(row).map(([k, v]) =>
          [k, typeof v === 'string' ? v.trim() : v]
        ))
      )
    }

    // Drop empty rows (all values empty)
    const before = rows.length
    if (dropEmpty) {
      rows = rows.filter(row => Object.values(row).some(v => v !== '' && v != null))
    }
    const dropped = before - rows.length
    if (dropped > 0) ctx.log(`Dropped ${dropped} empty rows`)

    // Cast numbers
    if (cast !== 'Off') {
      rows = rows.map(row =>
        Object.fromEntries(Object.entries(row).map(([k, v]) => {
          const n = Number(v)
          return [k, (v !== '' && !isNaN(n) && (cast === 'Force' || String(v).match(/^-?\d+\.?\d*$/)))
            ? n : v]
        }))
      )
      ctx.log('Numeric cast applied')
    }

    // Sort
    if (sort !== 'None' && columns.length > 0) {
      const col = columns[0]
      const dir = sort.includes('↑') ? 1 : -1
      rows = [...rows].sort((a, b) => {
        const av = a[col], bv = b[col]
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
        return String(av).localeCompare(String(bv)) * dir
      })
      ctx.log(`Sorted by "${col}" ${sort.includes('↑') ? 'asc' : 'desc'}`)
    }

    await delay(200)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    ctx.log(`Transform complete — ${rows.length} rows`)
    return {
      ok: true,
      message: `${rows.length} rows after transform`,
      output: { rows, columns, totalRows: rows.length, fileName: input.fileName },
    }
  },
}

export default DataTransformNode
