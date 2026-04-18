"use client";

import { useCallback, useMemo, useState } from "react";
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

function formatOutput(value: string): string {
  return value.length ? value : "[empty output]";
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

function CipherNode({ data, selected }: NodeProps) {
  const nodeData = data as CipherNodeData;

  return (
    <div
      className={`rounded-2xl border-2 px-4 py-3 shadow-lg transition ${
        selected 
          ? "border-amber-600 bg-amber-50 shadow-[0_0_0_2px_rgba(217,119,6,0.4)]" 
          : "border-gray-300 bg-white"
      }`}
      style={{ minWidth: 210 }}
    >
      <Handle type="target" position={Position.Left} className="h-3! w-3! border-none! bg-amber-500!" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">{algorithmLabels[nodeData.algorithm]}</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{nodeData.mode === "encrypt" ? "Encrypt" : "Decrypt"}</p>
        </div>
        <span className="rounded-full border border-gray-300 bg-amber-100 px-2 py-1 text-[10px] text-amber-700 font-semibold">Pipeline</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-600">{nodeData.summary}</p>
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
  const [lastRun, setLastRun] = useState<PipelineRun>(() => evaluatePipeline(source, starterGraph.nodes, starterGraph.edges));
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "success" | "error">("idle");
  const { screenToFlowPosition } = useReactFlow();

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  const nodeTypes = useMemo(() => ({ cipher: CipherNode }), []);

  const updateNode = useCallback(
    (nodeId: string, updater: (node: PipelineNode) => PipelineNode) => {
      setNodes((current: PipelineNode[]) => current.map((node: PipelineNode) => (node.id === nodeId ? updater(node) : node)));
    },
    [setNodes],
  );

  const addNodeToCanvas = useCallback(
    (algorithm: AlgorithmId, position?: { x: number; y: number }) => {
      const lastNode = nodes[nodes.length - 1];
      const fallbackPosition = lastNode ? { x: lastNode.position.x + 260, y: lastNode.position.y } : { x: 120, y: 120 };
      const node = createNode(algorithm, position ?? fallbackPosition);
      setNodes((current: PipelineNode[]) => [...current, node]);
      setSelectedNodeId(node.id);
    },
    [nodes, setNodes],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((current: PipelineNode[]) => current.filter((node: PipelineNode) => node.id !== nodeId));
      setEdges((current: PipelineEdge[]) => current.filter((edge: PipelineEdge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNodeId((current) => (current === nodeId ? "" : current));
    },
    [setEdges, setNodes],
  );

  const updateSelectedNode = useCallback(
    (updater: (node: PipelineNode) => PipelineNode) => {
      if (!selectedNodeId) {
        return;
      }

      updateNode(selectedNodeId, updater);
    },
    [selectedNodeId, updateNode],
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
    },
    [setEdges],
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
      setLastRun(evaluatePipeline(source, nodes, edges));
      setRunStatus("success");
      
      // Clear success status after 2 seconds
      setTimeout(() => setRunStatus("idle"), 2000);
    } catch {
      setRunStatus("error");
      setTimeout(() => setRunStatus("idle"), 2000);
    } finally {
      setIsRunning(false);
    }
  }, [edges, nodes, source, isRunning]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: PipelineNode) => {
      updateNode(node.id, (current) => ({ ...current, position: node.position }));
    },
    [updateNode],
  );

  return (
    <section
      className="min-h-screen px-4 py-6 text-gray-900 sm:px-6 lg:px-8 bg-white"
    >
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full gap-4 xl:grid-cols-[300px_minmax(0,1fr)]" style={{ maxWidth: 1600 }}>
        <aside className="flex flex-col gap-4 rounded-3xl border border-gray-300 bg-gray-50 p-4 shadow-lg">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-700 font-semibold">Cipher pipeline</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">Drag algorithms onto the canvas, connect them in a linear chain, then edit the selected node here.</p>
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
              onChange={(event) => setSource(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="Type the text to process"
            />
          </div>

          <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-3 shadow-sm">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-900 font-semibold">Pipeline Output</p>
              <p className="text-sm text-amber-800 font-mono mt-2 p-2 bg-white rounded border border-amber-200 wrap-break-word">{formatOutput(lastRun.finalOutput)}</p>
            </div>
            {lastRun.nodes.length > 0 && (
              <div className="border-t border-amber-200 pt-3">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-900 font-semibold mb-2">Intermediate Results</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {lastRun.nodes.map((result, idx) => (
                    <div key={result.id} className="rounded border border-amber-200 bg-white p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{idx + 1}</span>
                        <span className="text-xs font-medium text-gray-700">{algorithmLabels[result.algorithm]} ({result.mode})</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div><span className="font-semibold">In:</span> <span className="text-gray-800 font-mono">{result.input.substring(0, 30)}{result.input.length > 30 ? "..." : ""}</span></div>
                        <div><span className="font-semibold">Out:</span> <span className="text-gray-800 font-mono">{result.output.substring(0, 30)}{result.output.length > 30 ? "..." : ""}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

          <div className="rounded-2xl border border-gray-300 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-600 font-medium">Selected node</p>
                <p className="text-sm text-gray-900 font-semibold">{selectedNode ? algorithmLabels[selectedNode.data.algorithm] : "None"}</p>
              </div>
              {selectedNode ? (
                <button
                  type="button"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              ) : null}
            </div>

            {selectedNode ? (
              <div className="mt-3 space-y-3">
                <label className="block space-y-1 text-sm">
                  <span className="text-gray-700 font-medium">Type</span>
                  <select
                    value={selectedNode.data.algorithm}
                    onChange={(event) =>
                      updateSelectedNode((current) => {
                        const algorithm = event.target.value as AlgorithmId;
                        const params = createDefaultsFor(algorithm);
                        return {
                          ...current,
                          data: {
                            ...current.data,
                            algorithm,
                            params,
                            summary: buildSummary(algorithm, current.data.mode, params),
                          },
                        };
                      })
                    }
                    className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    {algorithmOptions.map((algorithm) => (
                      <option key={algorithm} value={algorithm}>
                        {algorithmLabels[algorithm]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="text-gray-700 font-medium">Mode</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["encrypt", "decrypt"] as NodeMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() =>
                          updateSelectedNode((current) => ({
                            ...current,
                            data: {
                              ...current.data,
                              mode,
                              summary: buildSummary(current.data.algorithm, mode, current.data.params),
                            },
                          }))
                        }
                        className={`rounded-2xl border px-3 py-2 text-sm transition ${
                          selectedNode.data.mode === mode
                            ? "border-amber-500 bg-amber-100 text-amber-900 font-medium"
                            : "border-gray-300 bg-gray-100 text-gray-700 hover:border-amber-300"
                        }`}
                      >
                        {mode === "encrypt" ? "Encrypt" : "Decrypt"}
                      </button>
                    ))}
                  </div>
                </label>

                {selectedNode.data.algorithm === "caesar" ? (
                  <label className="block space-y-1 text-sm">
                    <span className="text-gray-700 font-medium">Shift</span>
                    <input
                      type="number"
                      value={selectedNode.data.params.shift}
                      onChange={(event) =>
                        updateSelectedNode((current) => {
                          const params = { ...current.data.params, shift: Number(event.target.value) || 0 };
                          return {
                            ...current,
                            data: {
                              ...current.data,
                              params,
                              summary: buildSummary(current.data.algorithm, current.data.mode, params),
                            },
                          };
                        })
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </label>
                ) : null}

                {selectedNode.data.algorithm === "vigenere" || selectedNode.data.algorithm === "columnar" || selectedNode.data.algorithm === "xor" ? (
                  <label className="block space-y-1 text-sm">
                    <span className="text-gray-700 font-medium">Key</span>
                    <input
                      type="text"
                      value={selectedNode.data.params.key}
                      onChange={(event) =>
                        updateSelectedNode((current) => {
                          const params = { ...current.data.params, key: event.target.value };
                          return {
                            ...current,
                            data: {
                              ...current.data,
                              params,
                              summary: buildSummary(current.data.algorithm, current.data.mode, params),
                            },
                          };
                        })
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </label>
                ) : null}

                {selectedNode.data.algorithm === "railFence" ? (
                  <label className="block space-y-1 text-sm">
                    <span className="text-gray-700 font-medium">Rails</span>
                    <input
                      type="number"
                      min={2}
                      value={selectedNode.data.params.rails}
                      onChange={(event) =>
                        updateSelectedNode((current) => {
                          const params = { ...current.data.params, rails: Number(event.target.value) || 2 };
                          return {
                            ...current,
                            data: {
                              ...current.data,
                              params,
                              summary: buildSummary(current.data.algorithm, current.data.mode, params),
                            },
                          };
                        })
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </label>
                ) : null}

                {selectedNode.data.algorithm === "substitution" ? (
                  <label className="block space-y-1 text-sm">
                    <span className="text-gray-700 font-medium">Alphabet</span>
                    <input
                      type="text"
                      maxLength={26}
                      value={selectedNode.data.params.alphabet}
                      onChange={(event) =>
                        updateSelectedNode((current) => {
                          const params = { ...current.data.params, alphabet: event.target.value.toUpperCase() };
                          return {
                            ...current,
                            data: {
                              ...current.data,
                              params,
                              summary: buildSummary(current.data.algorithm, current.data.mode, params),
                            },
                          };
                        })
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </label>
                ) : null}

                <div className="rounded-2xl border border-gray-300 bg-gray-100 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-600 font-medium">Summary</p>
                  <p className="mt-2 text-sm text-gray-900">{selectedNode.data.summary}</p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="relative min-h-[70vh] overflow-hidden rounded-3xl border border-gray-300 bg-gray-50 shadow-lg">
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
