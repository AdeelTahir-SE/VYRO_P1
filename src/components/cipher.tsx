"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { caesarCipher } from "./cipher_algos/ceaser_cipher";
import { columnarTransposition } from "./cipher_algos/columnar_transposition";
import { railFence } from "./cipher_algos/rail_fence";
import { substitutionCipher } from "./cipher_algos/substitution";
import { vigenereCipher } from "./cipher_algos/viginere";
import { xorCipher } from "./cipher_algos/xor";

type AlgorithmId = "caesar" | "vigenere" | "substitution" | "railFence" | "columnar" | "xor";
type NodeMode = "encrypt" | "decrypt";

type NodeParams = {
  shift: number;
  key: string;
  rails: number;
  alphabet: string;
};

type CipherNodeData = {
  algorithm: AlgorithmId;
  mode: NodeMode;
  params: NodeParams;
  summary: string;
  result?: string;
  isTerminal?: boolean;
  pipelineNumber?: number;
};

type PipelineNode = Node<CipherNodeData>;
type PipelineEdge = Edge;

type NodeResult = {
  id: string;
  algorithm: AlgorithmId;
  mode: NodeMode;
  input: string;
  output: string;
};

type PipelineRun = {
  source: string;
  finalOutput: string;
  nodes: NodeResult[];
};

const algorithmLabels: Record<AlgorithmId, string> = {
  caesar: "Caesar",
  vigenere: "Vigenere",
  substitution: "Substitution",
  railFence: "Rail Fence",
  columnar: "Columnar Transposition",
  xor: "XOR",
};

const algorithmDescriptions: Record<AlgorithmId, string> = {
  caesar: "Shift letters by a fixed amount",
  vigenere: "Repeat a keyword across the text",
  substitution: "Map A-Z through a custom alphabet",
  railFence: "Write text in a zigzag fence",
  columnar: "Reorder columns by keyword",
  xor: "XOR bytes with a repeating key",
};

const defaultAlphabet = "QWERTYUIOPASDFGHJKLZXCVBNM";

const algorithmOptions: AlgorithmId[] = ["caesar", "vigenere", "substitution", "railFence", "columnar", "xor"];

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function createDefaultsFor(algorithm: AlgorithmId): NodeParams {
  return {
    shift: 3,
    key: algorithm === "substitution" ? defaultAlphabet : "KEY",
    rails: 3,
    alphabet: defaultAlphabet,
  };
}

function buildSummary(algorithm: AlgorithmId, mode: NodeMode, params: NodeParams): string {
  const direction = mode === "encrypt" ? "Encrypt" : "Decrypt";

  switch (algorithm) {
    case "caesar":
      return `${direction} with shift ${params.shift}`;
    case "vigenere":
      return `${direction} with key ${params.key || "KEY"}`;
    case "substitution":
      return `${direction} with custom alphabet`;
    case "railFence":
      return `${direction} with ${params.rails} rails`;
    case "columnar":
      return `${direction} with keyword ${params.key || "KEY"}`;
    case "xor":
      return `${direction} with key ${params.key || "KEY"}`;
    default:
      return direction;
  }
}

function createNode(algorithm: AlgorithmId, position: { x: number; y: number }): PipelineNode {
  const params = createDefaultsFor(algorithm);

  return {
    id: createId(),
    type: "cipher",
    position,
    data: {
      algorithm,
      mode: "encrypt",
      params,
      summary: buildSummary(algorithm, "encrypt", params),
    },
  };
}

function runNode(node: PipelineNode, input: string): string {
  const { algorithm, mode, params } = node.data;

  switch (algorithm) {
    case "caesar":
      return caesarCipher(input, params.shift, mode);
    case "vigenere":
      return vigenereCipher(input, params.key, mode);
    case "substitution":
      return substitutionCipher(input, params.alphabet, mode);
    case "railFence":
      return railFence(input, params.rails, mode);
    case "columnar":
      return columnarTransposition(input, params.key, mode);
    case "xor":
      return xorCipher(input, params.key, mode);
    default:
      return input;
  }
}

function evaluatePipeline(source: string, nodes: PipelineNode[], edges: PipelineEdge[]): PipelineRun {
  if (nodes.length === 0) {
    return { source, finalOutput: source, nodes: [] };
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node] as const));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string>();
  const indegree = new Map<string, number>(nodes.map((node) => [node.id, 0]));

  edges.forEach((edge) => {
    const currentOutgoing = outgoing.get(edge.source) ?? [];
    currentOutgoing.push(edge.target);
    outgoing.set(edge.source, currentOutgoing);
    incoming.set(edge.target, edge.source);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  });

  const results = new Map<string, NodeResult>();
  const inputByNode = new Map<string, string>();
  const queue: string[] = [];
  const enqueued = new Set<string>();

  nodes.forEach((node) => {
    if ((indegree.get(node.id) ?? 0) === 0) {
      inputByNode.set(node.id, source);
      queue.push(node.id);
      enqueued.add(node.id);
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift() ?? "";
    enqueued.delete(nodeId);
    const node = nodeMap.get(nodeId);

    if (!node || results.has(nodeId)) {
      continue;
    }

    const input = inputByNode.get(nodeId) ?? source;
    const output = runNode(node, input);
    results.set(nodeId, {
      id: node.id,
      algorithm: node.data.algorithm,
      mode: node.data.mode,
      input,
      output,
    });

    const nextNodes = outgoing.get(nodeId) ?? [];
    nextNodes.forEach((targetId) => {
      if (!inputByNode.has(targetId)) {
        inputByNode.set(targetId, output);
      }

      const nextIndegree = (indegree.get(targetId) ?? 0) - 1;
      indegree.set(targetId, nextIndegree);

      if (nextIndegree <= 0 && !enqueued.has(targetId)) {
        queue.push(targetId);
        enqueued.add(targetId);
      }
    });
  }

  nodes.forEach((node) => {
    if (results.has(node.id)) {
      return;
    }

    const upstreamId = incoming.get(node.id);
    const fallbackInput = upstreamId ? results.get(upstreamId)?.output ?? source : source;
    const output = runNode(node, fallbackInput);

    results.set(node.id, {
      id: node.id,
      algorithm: node.data.algorithm,
      mode: node.data.mode,
      input: fallbackInput,
      output,
    });
  });

  const terminalNodes = nodes.filter((node) => !(outgoing.get(node.id)?.length ?? 0));
  const finalNode = terminalNodes.length > 0 ? terminalNodes[terminalNodes.length - 1] : nodes[nodes.length - 1];
  const finalOutput = finalNode ? results.get(finalNode.id)?.output ?? source : source;

  return {
    source,
    finalOutput,
    nodes: nodes.map((node) => results.get(node.id)).filter((value): value is NodeResult => Boolean(value)),
  };
}

function getNodeColor(algorithm: AlgorithmId): string {
  switch (algorithm) {
    case "caesar":
      return "#f59e0b";
    case "vigenere":
      return "#10b981";
    case "substitution":
      return "#8b5cf6";
    case "railFence":
      return "#38bdf8";
    case "columnar":
      return "#f97316";
    case "xor":
      return "#ef4444";
    default:
      return "#f59e0b";
  }
}

function identifyPipelines(nodes: PipelineNode[], edges: PipelineEdge[]): Map<string, number> {
  const incoming = new Map<string, string>();
  const outgoing = new Map<string, string>();

  edges.forEach((edge) => {
    incoming.set(edge.target, edge.source);
    outgoing.set(edge.source, edge.target);
  });

  const pipelineMap = new Map<string, number>();
  let pipelineIndex = 0;

  // Find all start nodes (no incoming edges)
  nodes.forEach((node) => {
    if (!incoming.has(node.id)) {
      // Follow the chain from this start node
      let currentId: string | undefined = node.id;
      while (currentId && !pipelineMap.has(currentId)) {
        pipelineMap.set(currentId, pipelineIndex);
        currentId = outgoing.get(currentId);
      }
      pipelineIndex++;
    }
  });

  return pipelineMap;
}

function identifyTerminalNodes(nodes: PipelineNode[], edges: PipelineEdge[]): Set<string> {
  const outgoing = new Map<string, string>();
  
  edges.forEach((edge) => {
    outgoing.set(edge.source, edge.target);
  });

  const terminals = new Set<string>();
  nodes.forEach((node) => {
    if (!outgoing.has(node.id)) {
      terminals.add(node.id);
    }
  });

  return terminals;
}

interface CipherNodeProps extends NodeProps {
  editingNodeId?: string;
  onStartEditing?: (nodeId: string) => void;
  onSaveEdit?: (nodeId: string, params: NodeParams) => void;
  onCancelEdit?: () => void;
}

function CipherNode({
  data,
  selected,
  id,
  editingNodeId,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
}: CipherNodeProps) {
  const nodeData = data as CipherNodeData;
  const isEditing = editingNodeId === id;
  const [editParams, setEditParams] = useState<NodeParams>(nodeData.params);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleCopyResult = useCallback(async () => {
    if (!nodeData.result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(nodeData.result);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1200);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 1200);
    }
  }, [nodeData.result]);

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSaveEdit?.(id, editParams);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancelEdit?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, id, editParams, onSaveEdit, onCancelEdit]);

  return (
    <div
      className={`rounded-2xl border-2 px-4 py-3 shadow-lg transition ${isEditing ? "border-blue-500 bg-blue-50 shadow-[0_0_0_2px_rgba(59,130,246,0.4)]" : selected ? "border-amber-600 bg-amber-50 shadow-[0_0_0_2px_rgba(217,119,6,0.4)]" : "border-gray-300 bg-white"}`}
      style={{ minWidth: 250 }}
      onDoubleClick={() => onStartEditing?.(id)}
      role="button"
      title="Double-click to edit parameters"
    >
      <Handle type="target" position={Position.Left} className="h-3! w-3! border-none! bg-amber-500!" />
      {isEditing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-medium">Algorithm</p>
            <p className="mt-1 text-xs font-semibold text-gray-900">{algorithmLabels[nodeData.algorithm]}</p>
          </div>
          {nodeData.algorithm === "caesar" && (
            <label className="block space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-medium">Shift</p>
              <input
                type="number"
                value={editParams.shift}
                onChange={(e) => setEditParams({ ...editParams, shift: Number(e.target.value) || 0 })}
                className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </label>
          )}
          {(nodeData.algorithm === "vigenere" || nodeData.algorithm === "columnar" || nodeData.algorithm === "xor") && (
            <label className="block space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-medium">Key</p>
              <input
                type="text"
                value={editParams.key}
                onChange={(e) => setEditParams({ ...editParams, key: e.target.value })}
                className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </label>
          )}
          {nodeData.algorithm === "railFence" && (
            <label className="block space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-medium">Rails</p>
              <input
                type="number"
                min={2}
                value={editParams.rails}
                onChange={(e) => setEditParams({ ...editParams, rails: Number(e.target.value) || 2 })}
                className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </label>
          )}
          {nodeData.algorithm === "substitution" && (
            <label className="block space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-medium">Alphabet</p>
              <input
                type="text"
                maxLength={26}
                value={editParams.alphabet}
                onChange={(e) => setEditParams({ ...editParams, alphabet: e.target.value.toUpperCase() })}
                className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </label>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSaveEdit?.(id, editParams)}
              className="flex-1 rounded border border-green-300 bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 transition hover:bg-green-100"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => onCancelEdit?.()}
              className="flex-1 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
          <p className="text-[9px] text-gray-500 pt-1">Enter to save, Esc to cancel</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">{algorithmLabels[nodeData.algorithm]}</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{nodeData.mode === "encrypt" ? "Encrypt" : "Decrypt"}</p>
            </div>
            <div className="flex flex-row items-center justify-center  gap-1">
              <span className="rounded-full border border-gray-300 bg-amber-100 px-2 py-1 text-[10px] text-amber-700 font-semibold">Pipeline</span>
              {nodeData.pipelineNumber !== undefined && (
                <span className="rounded-full border border-amber-400 bg-amber-200 px-2 py-0.5 text-[9px] text-amber-900 font-bold">
                  #{nodeData.pipelineNumber + 1}
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-600">{nodeData.summary}</p>
          <p className="mt-2 text-[9px] text-gray-400 italic">Double-click to edit</p>
          {nodeData.result && (
            <div className="mt-3 rounded bg-amber-50 border border-amber-200 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold text-amber-900">
                  {nodeData.isTerminal ? "Final result" : "Intermediate result"}:
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleCopyResult();
                  }}
                  className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                    copyStatus === "copied"
                      ? "bg-green-600 text-white"
                      : copyStatus === "error"
                        ? "bg-red-600 text-white"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                  }`}
                  title="Copy node output"
                >
                  {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Error" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-amber-900 font-mono mt-1 break-all">{nodeData.result.substring(0, 40)}{nodeData.result.length > 40 ? "..." : ""}</p>
            </div>
          )}
        </>
      )}
      <Handle type="source" position={Position.Right} className="h-3! w-3! border-none! bg-amber-500!" />
    </div>
  );
}

function GraphEditor() {
  const [starterGraph] = useState(() => {
    const first = createNode("caesar", { x: 120, y: 120 });
    const second = createNode("vigenere", { x: 420, y: 120 });

    return {
      nodes: [first, second],
      edges: [
        {
          id: `edge-${first.id}-${second.id}`,
          source: first.id,
          target: second.id,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#d97706", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#d97706" },
        },
      ] satisfies PipelineEdge[],
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<PipelineNode>(starterGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<PipelineEdge>(starterGraph.edges);
  const [source, setSource] = useState("HELLO WORLD");
  const [selectedNodeId, setSelectedNodeId] = useState<string>(starterGraph.nodes[0]?.id ?? "");
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "success" | "error">("idle");
  const [globalMode, setGlobalMode] = useState<"forward" | "reverse">("forward");
  const [editingNodeId, setEditingNodeId] = useState<string | undefined>(undefined);
  const { screenToFlowPosition } = useReactFlow();

  const updateNode = useCallback(
    (nodeId: string, updater: (node: PipelineNode) => PipelineNode) => {
      setNodes((current: PipelineNode[]) => current.map((node: PipelineNode) => (node.id === nodeId ? updater(node) : node)));
    },
    [setNodes],
  );

  const updatePipelineNumbers = useCallback(
    (nodesList: PipelineNode[]) => {
      const pipelineMap = identifyPipelines(nodesList, edges);
      return nodesList.map((node: PipelineNode) => ({
        ...node,
        data: {
          ...node.data,
          pipelineNumber: pipelineMap.get(node.id),
        },
      }));
    },
    [edges],
  );

  const handleStartEditing = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    setSelectedNodeId(nodeId);
  }, []);

  const handleSaveEdit = useCallback(
    (nodeId: string, newParams: NodeParams) => {
      updateNode(nodeId, (node) => {
        const newData = {
          ...node.data,
          params: newParams,
          summary: buildSummary(node.data.algorithm, node.data.mode, newParams),
        };
        return { ...node, data: newData };
      });
      setEditingNodeId(undefined);
    },
    [updateNode]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingNodeId(undefined);
  }, []);

  const nodeTypes = useMemo(
    () => ({
      cipher: (props: NodeProps) => (
        <CipherNode
          {...props}
          editingNodeId={editingNodeId}
          onStartEditing={handleStartEditing}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
        />
      ),
    }),
    [editingNodeId, handleStartEditing, handleSaveEdit, handleCancelEdit]
  );

  const addNodeToCanvas = useCallback(
    (algorithm: AlgorithmId, position?: { x: number; y: number }) => {
      const lastNode = nodes[nodes.length - 1];
      const fallbackPosition = lastNode ? { x: lastNode.position.x + 260, y: lastNode.position.y } : { x: 120, y: 120 };
      const params = createDefaultsFor(algorithm);
      const mode: NodeMode = globalMode === "forward" ? "encrypt" : "decrypt";
      const node: PipelineNode = {
        id: createId(),
        type: "cipher",
        position: position ?? fallbackPosition,
        data: {
          algorithm,
          mode,
          params,
          summary: buildSummary(algorithm, mode, params),
        },
      };
      setNodes((current: PipelineNode[]) => {
        const newNodes = [
          ...current.map((n: PipelineNode) => ({
            ...n,
            data: { ...n.data, result: undefined, isTerminal: undefined },
          })),
          node,
        ];
        return updatePipelineNumbers(newNodes);
      });
      setSelectedNodeId(node.id);
    },
    [nodes, setNodes, globalMode, updatePipelineNumbers],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((current: PipelineNode[]) => {
        const filtered = current
          .filter((node: PipelineNode) => node.id !== nodeId)
          .map((node: PipelineNode) => ({
            ...node,
            data: { ...node.data, result: undefined, isTerminal: undefined },
          }));
        return updatePipelineNumbers(filtered);
      });
      setEdges((current: PipelineEdge[]) => current.filter((edge: PipelineEdge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNodeId((current) => (current === nodeId ? "" : current));
    },
    [setEdges, setNodes, updatePipelineNumbers],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      const connectionEdge: Omit<PipelineEdge, "id"> = {
        source: connection.source,
        target: connection.target,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#d97706", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#d97706" },
      };

      setEdges((current: PipelineEdge[]) => {
        // For linear chain: prevent multiple inputs to a node
        const filtered = current.filter((edge: PipelineEdge) => edge.target !== connection.target);
        // Also prevent multiple outputs from source node
        const linearFiltered = filtered.filter((edge: PipelineEdge) => edge.source !== connection.source);
        return [...linearFiltered, { id: createId(), ...connectionEdge }];
      });

      // Clear results when edges change and update pipeline numbers
      setNodes((current: PipelineNode[]) =>
        updatePipelineNumbers(
          current.map((node: PipelineNode) => ({
            ...node,
            data: { ...node.data, result: undefined, isTerminal: undefined },
          }))
        )
      );
    },
    [setEdges, setNodes, updatePipelineNumbers],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const algorithm = event.dataTransfer.getData("application/x-cipher-node") as AlgorithmId;

      if (!algorithmOptions.includes(algorithm)) {
        return;
      }

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNodeToCanvas(algorithm, position);
    },
    [addNodeToCanvas, screenToFlowPosition],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const runPipeline = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunStatus("idle");
    
    try {
      // Simulate async operation with minimal delay for feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = evaluatePipeline(source, nodes, edges);
      
      // Update nodes with results and mark terminal nodes
      const terminals = identifyTerminalNodes(nodes, edges);
      const resultMap = new Map(result.nodes.map((r) => [r.id, r]));
      
      setNodes((current: PipelineNode[]) =>
        updatePipelineNumbers(
          current.map((node: PipelineNode) => {
            const nodeResult = resultMap.get(node.id);
            return {
              ...node,
              data: {
                ...node.data,
                result: nodeResult?.output,
                isTerminal: terminals.has(node.id),
              },
            };
          })
        )
      );
      
      setRunStatus("success");
      
      // Clear success status after 2 seconds
      setTimeout(() => setRunStatus("idle"), 2000);
    } catch {
      setRunStatus("error");
      setTimeout(() => setRunStatus("idle"), 2000);
    } finally {
      setIsRunning(false);
    }
  }, [edges, nodes, source, isRunning, setNodes, updatePipelineNumbers]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: PipelineNode) => {
      updateNode(node.id, (current) => ({ ...current, position: node.position }));
    },
    [updateNode],
  );

  const toggleMode = useCallback(() => {
    const newMode = globalMode === "forward" ? "reverse" : "forward";
    setGlobalMode(newMode);
    const newNodeMode: NodeMode = newMode === "forward" ? "encrypt" : "decrypt";
    
    setNodes((current: PipelineNode[]) =>
      updatePipelineNumbers(
        current.map((node: PipelineNode) => ({
          ...node,
          data: {
            ...node.data,
            mode: newNodeMode,
            summary: buildSummary(node.data.algorithm, newNodeMode, node.data.params),
          },
        }))
      )
    );
  }, [globalMode, setNodes, updatePipelineNumbers]);

  // Handle keyboard Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedNodeId) {
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, deleteNode]);

  return (
    <section
      className="min-h-screen px-4 py-6 text-gray-900 sm:px-6 lg:px-8 bg-white"
    >
      <div className="mx-auto grid h-[calc(100vh-3rem)] w-full gap-4 xl:grid-cols-[300px_minmax(0,1fr)]" style={{ maxWidth: 1600 }}>
        <aside className="flex flex-col gap-4 rounded-3xl border border-gray-300 bg-gray-50 p-4 shadow-lg overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-700 font-semibold">Cipher pipeline</p>
                <p className="mt-1 text-sm leading-5 text-gray-600">Connect nodes, toggle mode, press Delete to remove.</p>
              </div>
              
            </div>
            <div>
            <p className="text-xs text-gray-500 mb-3">Click the button to toggle between Encrypt and Decrypt mode for all nodes</p>
          <button
                type="button"
                onClick={toggleMode}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap border-2 cursor-pointer ${
                  globalMode === "forward"
                    ? "border-amber-500 bg-amber-100 text-amber-900 hover:bg-amber-200"
                    : "border-orange-500 bg-orange-100 text-orange-900 hover:bg-orange-200"
                }`}
                title="Click to toggle between Encrypt and Decrypt mode"
              >
                {globalMode === "forward" ? "🔒 Encrypt" : "🔓 Decrypt"}
              </button>
              </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-gray-300 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-600 font-medium">Source text</p>
                <p className="text-sm text-gray-700">Input for the pipeline</p>
              </div>
              <button
                type="button"
                onClick={runPipeline}
                disabled={isRunning}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isRunning
                    ? "bg-amber-300 text-gray-700 cursor-not-allowed"
                    : runStatus === "success"
                      ? "bg-green-500 text-white"
                      : runStatus === "error"
                        ? "bg-red-500 text-white"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                {isRunning ? "Running..." : runStatus === "success" ? "✓ Done" : runStatus === "error" ? "✗ Error" : "Run"}
              </button>
            </div>
            <textarea
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                // Clear results when source changes
                setNodes((current: PipelineNode[]) =>
                  updatePipelineNumbers(
                    current.map((node: PipelineNode) => ({
                      ...node,
                      data: { ...node.data, result: undefined, isTerminal: undefined },
                    }))
                  )
                );
              }}
              rows={4}
              className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="Type the text to process"
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-gray-300 bg-white p-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-600 font-medium">Algorithm library</p>
            <div className="grid gap-2">
              {algorithmOptions.map((algorithm) => (
                <button
                  key={algorithm}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/x-cipher-node", algorithm);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => addNodeToCanvas(algorithm)}
                  className="group flex items-center justify-between rounded-2xl border border-gray-300 bg-gray-100 px-3 py-2 text-left transition hover:border-amber-500 hover:bg-amber-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{algorithmLabels[algorithm]}</p>
                    <p className="text-xs text-gray-600">{algorithmDescriptions[algorithm]}</p>
                  </div>
                  <span className="rounded-full border border-gray-300 bg-white px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">
                    Drag
                  </span>
                </button>
              ))}
            </div>
          </div>


        </aside>

        <main className="relative h-full overflow-hidden rounded-3xl border border-gray-300 bg-gray-50 shadow-lg">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_: React.MouseEvent, node: PipelineNode) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId("")}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            snapToGrid
            snapGrid={[24, 24]}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              style: { stroke: "#d97706", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#d97706" },
            }}
          >
            <Panel position="top-left" className="pointer-events-none rounded-full border border-gray-400 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-700 font-medium shadow-sm">
              Linear chain: drag nodes and connect in sequence
            </Panel>
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(0,0,0,0.08)" />
            <MiniMap
              zoomable
              pannable
              nodeStrokeWidth={2}
              nodeColor={(node) => getNodeColor((node as PipelineNode).data.algorithm)}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </main>
      </div>
    </section>
  );
}

export default function Pipeline() {
  return (
    <ReactFlowProvider>
      <GraphEditor />
    </ReactFlowProvider>
  );
}
