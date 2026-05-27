import ReactFlow, {
  Background, Controls, EdgeLabelRenderer, BaseEdge,
  getSmoothStepPath,
  type Node, type EdgeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { FlowDiagramSection as FlowDiagramSectionType } from '@study-guild/shared';

interface Props {
  section: FlowDiagramSectionType;
}

function LabeledEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, label, data, style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={data?.animated ? { ...style, strokeDasharray: '5,3' } : style}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 10,
            }}
            className="nodrag nopan text-xs font-medium text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-600 whitespace-pre-line text-center leading-tight"
          >
            {label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { labeled: LabeledEdge };

export default function FlowDiagramSection({ section }: Props) {
  const nodes: Node[] = section.nodes.map(n => ({
    id: n.id,
    position: n.position,
    data: { label: n.label },
    type: n.type === 'decision' ? 'default' : (n.type ?? 'default'),
    style: nodeStyle(n.type),
  }));

  const edges = section.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'labeled',
    style: { stroke: '#7C3AED', strokeWidth: 1.5 },
    data: { animated: e.animated ?? false },
  }));

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden">
      {section.title && (
        <div className="border-b border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300">
          {section.title}
        </div>
      )}
      <div style={{ height: 360 }} className="bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          edgeTypes={edgeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" gap={16} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}

function nodeStyle(type?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    background: '#1e1b4b',
    color: '#c4b5fd',
    border: '1px solid #7c3aed',
    borderRadius: 8,
    fontSize: 12,
    padding: '6px 12px',
  };
  if (type === 'input') return { ...base, background: '#064e3b', color: '#6ee7b7', border: '1px solid #10b981' };
  if (type === 'output') return { ...base, background: '#1c1917', color: '#fcd34d', border: '1px solid #f59e0b' };
  if (type === 'decision') return { ...base, background: '#1e1a2e', color: '#a78bfa', border: '1px dashed #7c3aed' };
  return base;
}
