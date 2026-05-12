/**
 * presets.js
 * ──────────
 * Built-in pipeline presets shown in the catalog under a "Presets" section.
 * Each preset is a plain object shaped like a saved pipeline
 * (same format as pipelineStore output) so it can be loaded directly.
 *
 * To add a preset: define a node/edge array here and add it to PRESETS.
 */

import { MarkerType } from 'reactflow'

const ARROW = { type: MarkerType.ArrowClosed, width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }
const edge  = (id, source, target) => ({ id, source, target, type: 'pipeline', markerEnd: ARROW, data: {} })

/* ── 1. CSV / XLSX → Transform → Table ─────────────────────── */
const CSV_PIPELINE = {
  id:      'preset_csv',
  name:    '📂 CSV / XLSX → Table',
  savedAt: '2024-01-01T00:00:00.000Z',
  _preset: true,
  nodes: [
    // Group: Ingestion
    {
      id: 'pg1', type: 'group',
      position: { x: 20, y: 20 }, style: { width: 220, height: 160 },
      data: { label: 'Ingestion', bg: 'rgba(74,144,217,0.07)', border: '#4A90D9', labelColor: '#4A90D9' },
    },
    // Group: Processing
    {
      id: 'pg2', type: 'group',
      position: { x: 270, y: 20 }, style: { width: 280, height: 260 },
      data: { label: 'Processing', bg: 'rgba(226,0,116,0.06)', border: 'var(--magenta)', labelColor: 'var(--magenta)' },
    },
    // Group: Output
    {
      id: 'pg3', type: 'group',
      position: { x: 20, y: 220 }, style: { width: 220, height: 200 },
      data: { label: 'Output', bg: 'rgba(245,166,35,0.07)', border: '#F5A623', labelColor: '#F5A623' },
    },

    // File Upload node
    {
      id: 'pu1', type: 'pipeline', position: { x: 50, y: 70 },
      data: {
        nodeDefId: 'file-upload',
        title: 'File Upload', icon: '📤', iconBg: '#1a2d3a',
        status: 'idle', lastOutput: null, controls: [],
      },
    },

    // CSV Parser node
    {
      id: 'pu2', type: 'pipeline', position: { x: 295, y: 55 },
      data: {
        nodeDefId: 'csv-parser',
        title: 'CSV / XLSX Parser', icon: '📊', iconBg: '#1a2030',
        status: 'idle', lastOutput: null,
        controls: [
          { type: 'select',   label: 'Delimiter',  key: 'delim',  val: 'Auto', opts: ['Auto', ',', ';', '\\t'] },
          { type: 'toggle',   label: 'Header row', key: 'header', val: true   },
          { type: 'checkbox', label: 'Trim spaces',key: 'trim',   val: true   },
          { type: 'select',   label: 'Encoding',   key: 'enc',    val: 'UTF-8', opts: ['UTF-8','Latin-1','Auto'] },
        ],
      },
    },

    // Data Transform node
    {
      id: 'pu3', type: 'pipeline', position: { x: 295, y: 185 },
      data: {
        nodeDefId: 'data-transform',
        title: 'Data Transform', icon: '🔄', iconBg: '#1e2830',
        status: 'idle', lastOutput: null,
        controls: [
          { type: 'select', label: 'Cast numbers',  key: 'cast',      val: 'Auto',        opts: ['Auto','Force','Off']                 },
          { type: 'toggle', label: 'Drop empties',  key: 'dropEmpty', val: true           },
          { type: 'toggle', label: 'Trim strings',  key: 'trim',      val: true           },
          { type: 'select', label: 'Sort by',       key: 'sort',      val: 'None',        opts: ['None','First col ↑','First col ↓']   },
        ],
      },
    },

    // Table View node
    {
      id: 'pu4', type: 'pipeline', position: { x: 50, y: 260 },
      data: {
        nodeDefId: 'table-view',
        title: 'Table View', icon: '📋', iconBg: '#1e2516',
        status: 'idle', lastOutput: null, controls: [],
      },
    },
  ],
  edges: [
    edge('pe1', 'pu1', 'pu2'),
    edge('pe2', 'pu2', 'pu3'),
    edge('pe3', 'pu3', 'pu4'),
  ],
}

/* ── 2. Default general pipeline ───────────────────────────── */
const GENERAL_PIPELINE = {
  id:      'preset_general',
  name:    '⬡ General Pipeline',
  savedAt: '2024-01-01T00:00:00.000Z',
  _preset: true,
  nodes: [
    { id:'g1', type:'group', position:{x:20,y:20}, style:{width:250,height:290},
      data:{label:'Data ingestion',bg:'rgba(74,144,217,0.07)',border:'#4A90D9',labelColor:'#4A90D9'}},
    { id:'g2', type:'group', position:{x:305,y:20}, style:{width:285,height:290},
      data:{label:'Processing',bg:'rgba(226,0,116,0.06)',border:'var(--magenta)',labelColor:'var(--magenta)'}},
    { id:'g3', type:'group', position:{x:20,y:345}, style:{width:570,height:220},
      data:{label:'Output',bg:'rgba(245,166,35,0.07)',border:'#F5A623',labelColor:'#F5A623'}},
    { id:'n1', type:'pipeline', position:{x:50,y:75},
      data:{ nodeDefId:'file-source', title:'File source', icon:'📂', iconBg:'#1a2d3a', status:'idle', lastOutput:null,
        controls:[{type:'toggle',label:'Watch dir',key:'watch',val:true},{type:'select',label:'Format',key:'fmt',val:'CSV',opts:['CSV','JSON','Parquet']}]}},
    { id:'n2', type:'pipeline', position:{x:50,y:215},
      data:{ nodeDefId:'api-stream', title:'API stream', icon:'🌐', iconBg:'#1a2838', status:'idle', lastOutput:null,
        controls:[{type:'toggle',label:'Enabled',key:'enabled',val:false},{type:'checkbox',label:'Auth token',key:'auth',val:true}]}},
    { id:'n3', type:'pipeline', position:{x:335,y:60},
      data:{ nodeDefId:'transformer', title:'Transformer', icon:'⚙️', iconBg:'#1a3028', status:'idle', lastOutput:null,
        controls:[{type:'select',label:'Mode',key:'mode',val:'Normalize',opts:['Normalize','Scale','Encode']},{type:'checkbox',label:'Drop nulls',key:'nulls',val:true},{type:'checkbox',label:'Dedupe',key:'dup',val:false}]}},
    { id:'n4', type:'pipeline', position:{x:335,y:205},
      data:{ nodeDefId:'validator', title:'Validator', icon:'✅', iconBg:'#1e2e1a', status:'idle', lastOutput:null,
        controls:[{type:'toggle',label:'Strict mode',key:'strict',val:true},{type:'select',label:'Schema',key:'schema',val:'v2',opts:['v1','v2','v3']}]}},
    { id:'n5', type:'pipeline', position:{x:50,y:385},
      data:{ nodeDefId:'output-db', title:'Output DB', icon:'💾', iconBg:'#2e2516', status:'idle', lastOutput:null,
        controls:[{type:'select',label:'Target',key:'db',val:'Postgres',opts:['Postgres','MySQL','Mongo']},{type:'toggle',label:'Batch write',key:'batch',val:true}]}},
    { id:'n6', type:'pipeline', position:{x:345,y:385},
      data:{ nodeDefId:'notifier', title:'Notifier', icon:'🔔', iconBg:'#2e1f14', status:'idle', lastOutput:null,
        controls:[{type:'checkbox',label:'Email',key:'email',val:true},{type:'checkbox',label:'Slack',key:'slack',val:false},{type:'toggle',label:'On error only',key:'eronly',val:false}]}},
  ],
  edges: [
    edge('e1','n1','n3'), edge('e2','n2','n3'),
    edge('e3','n3','n4'), edge('e4','n4','n5'),
    edge('e4b','n3','n5'), edge('e5','n4','n6'), edge('e6','n5','n6'),
  ],
}


/* ── 3. File Upload → Subflow (Backend Calls) → Log ─────────── */
const BACKEND_CALL_PIPELINE = {
  id:      'preset_backend_call',
  name:    '🔗 File Upload → Backend Calls → Log',
  savedAt: '2024-01-01T00:00:00.000Z',
  _preset: true,
  nodes: [

    /* ── Outer group labels ── */
    {
      id:'bg1', type:'group',
      position:{x:20, y:20}, style:{width:240, height:160},
      data:{ label:'Ingestion', bg:'rgba(74,144,217,0.07)', border:'#4A90D9', labelColor:'#4A90D9' },
    },
    {
      id:'bg2', type:'group',
      position:{x:290, y:20}, style:{width:260, height:160},
      data:{ label:'Parse', bg:'rgba(226,0,116,0.06)', border:'#E20074', labelColor:'#E20074' },
    },
    {
      id:'bg3', type:'group',
      position:{x:20, y:220}, style:{width:530, height:480},
      data:{ label:'Processing', bg:'rgba(155,89,182,0.06)', border:'#9B59B6', labelColor:'#9B59B6' },
    },
    {
      id:'bg4', type:'group',
      position:{x:20, y:740}, style:{width:530, height:180},
      data:{ label:'Output', bg:'rgba(245,166,35,0.06)', border:'#F5A623', labelColor:'#F5A623' },
    },

    /* ── 1. File Upload ── */
    {
      id:'n1', type:'pipeline', position:{x:50, y:70},
      data:{
        nodeDefId:'file-upload', title:'File Upload', icon:'📤', iconBg:'#1a2d3a',
        status:'idle', lastOutput:null, controls:[],
      },
    },

    /* ── 2. CSV Parser ── */
    {
      id:'n2', type:'pipeline', position:{x:315, y:55},
      data:{
        nodeDefId:'csv-parser', title:'CSV / XLSX Parser', icon:'📊', iconBg:'#1a2030',
        status:'idle', lastOutput:null,
        controls:[
          {type:'select', label:'Delimiter',  key:'delim',  val:'Auto', opts:['Auto',',',';','\\t']},
          {type:'toggle', label:'Header row', key:'header', val:true},
          {type:'checkbox',label:'Trim spaces',key:'trim', val:true},
          {type:'select', label:'Encoding',   key:'enc',   val:'UTF-8', opts:['UTF-8','Latin-1','Auto']},
        ],
      },
    },

    /* ── 3. Loop node — iterates over each row ── */
    {
      id:'n3', type:'loop', position:{x:40, y:250},
      style:{ width:490, height:350 },
      data:{
        nodeDefId:'loop', title:'Process Each Row', icon:'↺', iconBg:'rgba(155,89,182,0.2)',
        status:'idle', lastOutput:null,
        controls:[
          {type:'select', label:'Array field', key:'arrayField', val:'rows', opts:['auto','rows','items','lines','data']},
          {type:'select', label:'Max iter',    key:'maxIter',    val:'100',  opts:['10','50','100','500','unlimited']},
          {type:'toggle', label:'Stop on error',key:'stopOnError',val:false},
        ],
      },
    },

    /* ── 3a. Backend Call 1 — inside Loop (child node) ── */
    {
      id:'n3a', type:'pipeline', parentId:'n3', extent:'parent',
      position:{x:30, y:60}, style:{width:200},
      data:{
        nodeDefId:'backend-call', title:'Validate Item', icon:'🌐', iconBg:'#1a2838',
        status:'idle', lastOutput:null,
        controls:[
          {type:'select', label:'Method',       key:'method',    val:'POST',       opts:['POST','PUT','PATCH','GET']},
          {type:'select', label:'Endpoint',     key:'endpoint',  val:'/validate',  opts:['/process','/validate','/enrich','/store']},
          {type:'select', label:'Error rate',   key:'errorRate', val:'5%',         opts:['0%','5%','10%','20%']},
          {type:'toggle', label:'Log response', key:'logResp',   val:true},
        ],
      },
    },

    /* ── 3b. Backend Call 2 — inside Loop, after first call ── */
    {
      id:'n3b', type:'pipeline', parentId:'n3', extent:'parent',
      position:{x:260, y:60}, style:{width:200},
      data:{
        nodeDefId:'backend-call', title:'Enrich Item', icon:'🌐', iconBg:'#1a2838',
        status:'idle', lastOutput:null,
        controls:[
          {type:'select', label:'Method',       key:'method',    val:'POST',      opts:['POST','PUT','PATCH','GET']},
          {type:'select', label:'Endpoint',     key:'endpoint',  val:'/enrich',   opts:['/process','/validate','/enrich','/store']},
          {type:'select', label:'Error rate',   key:'errorRate', val:'5%',        opts:['0%','5%','10%','20%']},
          {type:'toggle', label:'Log response', key:'logResp',   val:true},
        ],
      },
    },

    /* ── 3c. If/Branch — inside Loop, checks if enrich succeeded ── */
    {
      id:'n3c', type:'if-branch', parentId:'n3', extent:'parent',
      position:{x:130, y:200}, style:{width:210},
      data:{
        nodeDefId:'if-branch', title:'Check Success', icon:'⎇', iconBg:'rgba(245,166,35,0.2)',
        status:'idle', lastOutput:null,
        controls:[
          {type:'select', label:'Field',        key:'field',     val:'success',  opts:['value','id','status','count','error','success']},
          {type:'select', label:'Condition',    key:'condition', val:'=== true', opts:['truthy','=== true','!== null','> 0','=== 0','has error','custom']},
          {type:'toggle', label:'Negate (NOT)', key:'negate',    val:false},
        ],
      },
    },

    /* ── 4. Log Output — after loop (outer, summarises all iterations) ── */
    {
      id:'n4', type:'pipeline', position:{x:160, y:760},
      data:{
        nodeDefId:'log-output', title:'Execution Log', icon:'📋', iconBg:'#1a2520',
        status:'idle', lastOutput:null,
        controls:[
          {type:'select', label:'Format',          key:'format',   val:'plain',        opts:['plain','JSON','CSV']},
          {type:'toggle', label:'Include timing',  key:'timing',   val:true},
          {type:'select', label:'Severity filter', key:'severity', val:'all',          opts:['all','errors only','warnings+']},
        ],
      },
    },
  ],

  edges: [
    /* outer flow */
    edge('be1', 'n1', 'n2'),   // Upload → Parser
    edge('be2', 'n2', 'n3'),   // Parser → Loop
    edge('be3', 'n3', 'n4'),   // Loop → Log

    /* inside Loop */
    edge('be4', 'n3a', 'n3b'),  // Validate → Enrich
    edge('be5', 'n3b', 'n3c'),  // Enrich → If/Branch
    // If true branch goes nowhere extra (success path completes)
    // If false branch also just terminates (failed item logged automatically)
  ],
}

export const PRESETS = [CSV_PIPELINE, BACKEND_CALL_PIPELINE, GENERAL_PIPELINE]
