/**
 * PipelineNode — ReactFlow custom node wrapper.
 * Enriches node data with registry def fields before passing to NodeCard:
 *   - renderBody (custom JSX body, with setNodes injected for factory nodes)
 *   - _doc, _resultType, _inputType, _outputType, _defaultControls
 */
import { memo } from 'react'
import { useReactFlow } from 'reactflow'
import NodeCard from './nodes/NodeCard.jsx'
import { NODE_DEFS } from './nodes/registry.js'

function PipelineNode({ id, data, selected }) {
  const { setNodes } = useReactFlow()
  const def = NODE_DEFS[data.nodeDefId]

  let renderBody = def?.renderBody ?? null
  if (!renderBody && def?._renderBodyFactory) {
    const factory = def._renderBodyFactory
    renderBody = (nodeData, updateControl) =>
      factory(nodeData, updateControl, id, setNodes)
  }

  const enrichedData = {
    ...data,
    renderBody,
    // inject doc metadata so NodeCard can show the ? and ⊞ buttons
    _doc:             def?.doc            ?? null,
    _resultType:      def?.resultType     ?? null,
    _inputType:       def?.inputType      ?? null,
    _outputType:      def?.outputType     ?? null,
    _defaultControls: def?.defaultControls ?? data.controls,
  }

  return <NodeCard id={id} data={enrichedData} selected={selected} />
}

export default memo(PipelineNode)
