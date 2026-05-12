/**
 * NODE REGISTRY
 * =============
 * To add a new node type:
 *   1. Create src/nodes/MyNode.js (or .jsx if it uses JSX)
 *   2. Export a default object:
 *      {
 *        id, title, icon, iconBg, group,
 *        defaultControls,
 *        renderBody?(nodeData, updateControl) -> JSX,
 *        async run(nodeData, ctx) -> { ok, message?, output? }
 *          ctx: { log(msg), signal, input, setNodeData(patch) }
 *      }
 *   3. Import and add to REGISTRY below. Done.
 */

import FileSourceNode    from './FileSourceNode.js'
import ApiStreamNode     from './ApiStreamNode.js'
import DatabaseNode      from './DatabaseNode.js'
import FileUploadNode    from './FileUploadNode.jsx'
import TxtUploadNode     from './TxtUploadNode.jsx'

import TransformerNode   from './TransformerNode.js'
import ValidatorNode     from './ValidatorNode.js'
import FilterNode        from './FilterNode.js'
import CsvParserNode     from './CsvParserNode.js'
import DataTransformNode from './DataTransformNode.js'
import TimerNode         from './TimerNode.jsx'
import ScriptNode        from './ScriptNode.jsx'
import { IfNodeDef }     from './IfNode.jsx'
import { LoopNodeDef }   from './LoopNode.jsx'

import OutputDBNode      from './OutputDBNode.js'
import NotifierNode      from './NotifierNode.js'
import HttpExportNode    from './HttpExportNode.js'
import TableViewNode     from './TableViewNode.jsx'

const REGISTRY = [
  // ── Ingestion ──────────────────────────────
  FileUploadNode,
  TxtUploadNode,
  FileSourceNode,
  ApiStreamNode,
  DatabaseNode,

  // ── Control flow ───────────────────────────
  IfNodeDef,
  LoopNodeDef,

  // ── Processing ─────────────────────────────
  CsvParserNode,
  DataTransformNode,
  TransformerNode,
  ValidatorNode,
  FilterNode,
  TimerNode,
  ScriptNode,

  // ── Output ─────────────────────────────────
  TableViewNode,
  OutputDBNode,
  NotifierNode,
  HttpExportNode,
]

/** Lookup map: id → definition */
export const NODE_DEFS = Object.fromEntries(REGISTRY.map(d => [d.id, d]))

/** Ordered list consumed by NodePalette */
export default REGISTRY
