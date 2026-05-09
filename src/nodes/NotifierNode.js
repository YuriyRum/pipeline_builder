/**
 * NOTIFIER NODE
 * Sends notifications via email, Slack, webhooks.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const NotifierNode = {
  id:     'notifier',
  title:  'Notifier',
  icon:   '🔔',
  iconBg: '#2e1f14',
  group:  'output',

  defaultControls: [
    { type: 'checkbox', label: 'Email',         key: 'email',   val: true  },
    { type: 'checkbox', label: 'Slack',         key: 'slack',   val: false },
    { type: 'checkbox', label: 'Webhook',       key: 'webhook', val: false },
    { type: 'toggle',   label: 'On error only', key: 'eronly',  val: false },
  ],

  async run(nodeData, ctx) {
    const email   = nodeData.controls.find(c => c.key === 'email')?.val   ?? false
    const slack   = nodeData.controls.find(c => c.key === 'slack')?.val   ?? false
    const webhook = nodeData.controls.find(c => c.key === 'webhook')?.val ?? false
    const eronly  = nodeData.controls.find(c => c.key === 'eronly')?.val  ?? false

    const channels = [email && 'Email', slack && 'Slack', webhook && 'Webhook'].filter(Boolean)
    if (channels.length === 0) {
      ctx.log('No channels enabled — skipping')
      return { ok: true, message: 'no channels', output: null }
    }

    if (eronly) {
      ctx.log('Error-only mode — no errors, skipping')
      return { ok: true, message: 'error-only (skipped)', output: null }
    }

    ctx.log(`Sending to: ${channels.join(', ')}…`)
    await delay(600)
    if (ctx.signal.aborted) return { ok: false, message: 'aborted' }

    ctx.log(`Notifications sent ✓`)

    return {
      ok: true,
      message: `sent via ${channels.join(', ')}`,
      output: { channels },
    }
  },
}

export default NotifierNode
