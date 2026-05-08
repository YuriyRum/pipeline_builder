import { memo } from 'react'
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow'

function PipelineEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data = {}, markerEnd, style = {},
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const isAnimated = data.animated
  const buildMode  = data.buildMode

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isAnimated ? 'var(--green)' : 'rgba(255,255,255,0.2)',
          strokeWidth: isAnimated ? 2.5 : 1.5,
          strokeDasharray: isAnimated ? '8 5' : undefined,
          animation: isAnimated ? 'flowDash 0.5s linear infinite' : undefined,
          ...style,
        }}
      />
      {buildMode && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <button
              onClick={() => data.onDelete(id)}
              style={{
                width: 18, height: 18,
                background: 'var(--surface2)',
                border: '1px solid var(--border2)',
                borderRadius: '50%',
                color: 'var(--red)',
                fontSize: 12, fontWeight: 700,
                cursor: 'pointer', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
              }}
            >×</button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(PipelineEdge)
