/**
 * PipelineNode — ReactFlow custom node wrapper.
 *
 * Merges the registry definition's renderBody into data before
 * passing to the shared NodeCard shell.
 *
 * For nodes that use _renderBodyFactory (e.g. FileUploadNode),
 * we bind nodeId and setNodes into the factory so the custom body
 * can write back to node state (e.g. store a picked File object).
 */
import { memo } from 'react'
import { useReactFlow } from 'reactflow'
import NodeCard from './nodes/NodeCard.jsx'
import { NODE_DEFS } from './nodes/registry.js'

function PipelineNode({ id, data, selected }) {
  const { setNodes } = useReactFlow()
  const def = NODE_DEFS[data.nodeDefId]

  let renderBody = def?.renderBody ?? null

  // FileUploadNode (and any node with _renderBodyFactory) needs
  // nodeId + setNodes injected so it can update its own data.
  if (!renderBody && def?._renderBodyFactory) {
    const factory = def._renderBodyFactory
    renderBody = (nodeData, updateControl) =>
      factory(nodeData, updateControl, id, setNodes)
  }

  const enrichedData = { ...data, renderBody }
  return <NodeCard id={id} data={enrichedData} selected={selected} />
}

export default memo(PipelineNode)
