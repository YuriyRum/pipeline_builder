/**
 * PipelineNode — ReactFlow custom node wrapper.
 *
 * Enriches node data with registry def fields (doc, resultType, etc.)
 * and adds a NodeResizer so every pipeline node can be resized by
 * dragging its corner/edge handles when selected in build mode.
 */
import { memo } from 'react'
import { useReactFlow, NodeResizer } from 'reactflow'
import NodeCard from './NodeCard.jsx'
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
    _doc:             def?.doc            ?? null,
    _resultType:      def?.resultType     ?? null,
    _inputType:       def?.inputType      ?? null,
    _outputType:      def?.outputType     ?? null,
    _defaultControls: def?.defaultControls ?? data.controls,
  }

  return (
    <>
      {/* NodeResizer only active in build mode when node is selected */}
      {data.buildMode && (
        <NodeResizer
          isVisible={selected}
          minWidth={200}
          minHeight={80}
          lineStyle={{
            stroke: 'var(--magenta)',
            strokeWidth: 1,
            strokeDasharray: '4 3',
          }}
          handleStyle={{
            width: 10,
            height: 10,
            background: 'var(--surface)',
            border: '2px solid #E20074',
            borderRadius: 3,
          }}
        />
      )}
      <NodeCard id={id} data={enrichedData} selected={selected} />
    </>
  )
}

export default memo(PipelineNode)
