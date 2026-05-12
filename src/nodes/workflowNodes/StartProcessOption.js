/**
 * START PROCESS OPTION NODE
 * Initiates a new process option.
 */

const delay = ms => new Promise(r => setTimeout(r, ms))

const StartProcessOption = {
  id:     'start-process-option',
  title:  'Start Process Option',
  icon:   'pi pi-user-edit',
  iconBg: '#2e1f14',
  group:  'output',
  doc: `Initiates a new process option.

## Controls
- Receives process option input from the frontend.

## Notes
Channel credentials are configured in the backend environment, not in this node.`,
  inputType:  'any',
  outputType: 'any',
  resultType: 'none',

  defaultControls: [

  ],
  async run(nodeData, ctx) {
    ctx.log(`Data is about to be sent to the process option...`)

    await delay(1000);

    ctx.log(`Data is sent to the process option...`)
    return {
      ok: true,
      message: `sent to the process option!`,
      output: {},
    }
  },
}

export default StartProcessOption
