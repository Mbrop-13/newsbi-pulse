"use client";

import React, { useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, GripVertical } from 'lucide-react';

// Reusing types from sandbox
interface AgentMessage {
  id: string;
  agentName: string;
  avatar: string;
  role: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  message: string;
  time: string;
}

// ── Custom Node (Agent Node) ──
function sentimentColor(s: string) {
  if (s === 'bullish') return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', hex: '#10b981' };
  if (s === 'bearish') return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', hex: '#ef4444' };
  return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', hex: '#64748b' };
}

const AgentNode = ({ data }: any) => {
  const { msg, isActive, isFused, thinkingTool } = data;
  const sc = sentimentColor(msg.sentiment || 'neutral');

  return (
    <>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white border-[2px] border-gray-300 shadow-sm !-left-1.5 transition-colors duration-300" />
      <div 
        className={`w-[230px] h-[68px] rounded-2xl border-[1.5px] backdrop-blur-md transition-all duration-300 flex items-stretch overflow-hidden relative cursor-grab active:cursor-grabbing bg-white/95 group ${
          isActive
            ? 'border-[#1890FF] shadow-[0_10px_40px_rgba(24,144,255,0.2)] ring-2 ring-[#1890FF]/30 scale-105 z-50'
            : isFused && msg.id === 'fused-consensus'
            ? 'border-amber-400 shadow-[0_10px_40px_rgba(245,158,11,0.2)] bg-gradient-to-r from-amber-50/50 to-white ring-2 ring-amber-400/30'
            : 'hover:scale-[1.02] hover:-translate-y-0.5'
        }`}
        style={
          !isActive && !(isFused && msg.id === 'fused-consensus') 
            ? { borderColor: sc.hex, boxShadow: `0 4px 24px ${sc.hex}25, inset 0 0 10px ${sc.hex}10` } 
            : undefined
        }
      >
        
        {/* Drag Handle Area */}
        <div className="w-6 flex items-center justify-center bg-gray-50/50 border-r border-gray-100 text-gray-300 group-hover:text-gray-400 transition-colors">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Avatar Area */}
        <div className="w-14 flex items-center justify-center shrink-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm border ${
            isFused && msg.id === 'fused-consensus' 
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-500/20 shadow-amber-500/30' 
              : 'bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200 text-gray-700'
          }`}>
            {isFused && msg.id === 'fused-consensus' ? '🤝' : msg.avatar}
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 min-w-0 pr-6 flex flex-col justify-center text-left py-1">
          <p className="text-[11px] font-black text-gray-900 truncate tracking-tight leading-tight">
            {isFused && msg.id === 'fused-consensus' ? 'Consenso Multilateral' : msg.agentName}
          </p>
          <p className="text-[8.5px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">
            {isFused && msg.id === 'fused-consensus' ? 'Síntesis Experta' : msg.role}
          </p>
        </div>

        {/* Status Indicator Area */}
        <div className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center">
          {thinkingTool ? (
            <div className="w-5 h-5 rounded-full bg-[#1890FF]/10 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-[#1890FF]" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div 
                className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white ring-1 ring-black/5 shadow-sm transition-all duration-500" 
                style={{ backgroundColor: sc.hex, boxShadow: `0 0 10px ${sc.hex}40` }} 
              />
            </div>
          )}
        </div>

        {/* Active Gradient Overlay */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white border-[2px] border-gray-300 shadow-sm !-right-1.5 transition-colors duration-300" />
    </>
  );
};

const nodeTypes = { agentNode: AgentNode };

export function ReactFlowCanvas({
  rawNodes,
  simulationIndex,
  fusionComplete,
  isConsensoActive,
  onNodeClick,
  selectedCardIndex,
  thinkingAgent,
  activeThinkingTool
}: any) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Map raw nodes from MiroFishSandbox to ReactFlow nodes
  useEffect(() => {
    if (!rawNodes) return;
    
    const rfNodes = rawNodes.map((n: any, idx: number) => {
      const isAgentThinking = thinkingAgent && thinkingAgent.agentName === n.msg.agentName;
      return {
        id: `node-${idx}`,
        type: 'agentNode',
        position: n.position,
        data: {
          msg: n.msg,
          isActive: selectedCardIndex === idx,
          isFused: n.isFused,
          fusedWith: n.fusedWith,
          thinkingTool: isAgentThinking ? activeThinkingTool : null
        },
        draggable: true,
      };
    });
    setNodes(rfNodes);

    const rfEdges: any[] = [];
    const nCount = rawNodes.length;
    const normalCount = isConsensoActive ? nCount - 1 : nCount;

    // 1. CHRONOLOGICAL DEBATE EDGES REMOVED AS REQUESTED

    // 2. AFFINITY GROUP EDGES (Grupos de Acuerdo)
    const lastSeenBySentiment: Record<string, number> = {};
    for (let i = 0; i < normalCount; i++) {
      const sentiment = rawNodes[i].msg.sentiment;
      if (lastSeenBySentiment[sentiment] !== undefined) {
        const fromIdx = lastSeenBySentiment[sentiment];
        const isConnected = i <= simulationIndex;
        const color = sentimentColor(sentiment).hex;
        
        rfEdges.push({
          id: `affinity-${fromIdx}-${i}`,
          source: `node-${fromIdx}`,
          target: `node-${i}`,
          animated: isConnected,
          type: 'bezier',
          style: {
            strokeWidth: isConnected ? 3 : 1.5,
            stroke: color,
            opacity: isConnected ? 0.85 : 0.2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
          },
        });
      }
      lastSeenBySentiment[sentiment] = i;
    }

    // 3. CONSENSUS EDGES (Confluencia Final)
    if (isConsensoActive) {
      Object.values(lastSeenBySentiment).forEach(fromIdx => {
        rfEdges.push({
          id: `consensus-${fromIdx}-${nCount - 1}`,
          source: `node-${fromIdx}`,
          target: `node-${nCount - 1}`,
          animated: true,
          type: 'bezier',
          style: {
            strokeWidth: 4,
            stroke: '#F59E0B',
            opacity: 0.9,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#F59E0B',
          },
        });
      });
    }

    setEdges(rfEdges);

  }, [rawNodes, simulationIndex, fusionComplete, isConsensoActive, selectedCardIndex, thinkingAgent, activeThinkingTool, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative bg-[#FAFAFA]">
      <div className="hidden" />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          const idx = parseInt(node.id.split('-')[1], 10);
          onNodeClick(idx);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={16} size={1} variant={BackgroundVariant.Dots} />
        <Controls 
          className="bg-white border-gray-200 fill-gray-500 shadow-sm" 
          position="bottom-right" 
          style={{ marginBottom: '16px', marginRight: '160px' }}
        />
        <MiniMap 
          nodeColor={(n: any) => n.data.isFused ? '#F59E0B' : sentimentColor(n.data.msg.sentiment).hex}
          nodeBorderRadius={4}
          maskColor="rgba(250, 250, 250, 0.7)"
          className="bg-white border-gray-200 shadow-sm overflow-hidden rounded-xl"
          position="bottom-right"
          pannable={true}
          zoomable={true}
        />
      </ReactFlow>
    </div>
  );
}
