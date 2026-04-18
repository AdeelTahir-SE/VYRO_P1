"use client";

import { useMemo, useState } from "react";
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

type PipelineNode = {
  id: string;
  algorithm: AlgorithmId;
  mode: NodeMode;
  params: NodeParams;
};

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

const algorithmOptions: { id: AlgorithmId; description: string }[] = [
  { id: "caesar", description: "Shift letters by a fixed amount" },
  { id: "vigenere", description: "Repeat a keyword across the text" },
  { id: "substitution", description: "Map A-Z through a custom alphabet" },
  { id: "railFence", description: "Write text in a zigzag fence" },
  { id: "columnar", description: "Reorder columns by keyword" },
  { id: "xor", description: "XOR bytes with a repeating key" },
];

const defaultAlphabet = "QWERTYUIOPASDFGHJKLZXCVBNM";

function createNode(algorithm: AlgorithmId = "caesar"): PipelineNode {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    algorithm,
    mode: "encrypt",
    params: {
      shift: 3,
      key: algorithm === "substitution" ? defaultAlphabet : "KEY",
      rails: 3,
      alphabet: defaultAlphabet,
    },
  };
}

function createDefaultsFor(algorithm: AlgorithmId): NodeParams {
  return {
    shift: 3,
    key: algorithm === "substitution" ? defaultAlphabet : "KEY",
    rails: 3,
    alphabet: defaultAlphabet,
  };
}

function runNode(node: PipelineNode, input: string): string {
  switch (node.algorithm) {
    case "caesar":
      return caesarCipher(input, node.params.shift, node.mode);
    case "vigenere":
      return vigenereCipher(input, node.params.key, node.mode);
    case "substitution":
      return substitutionCipher(input, node.params.alphabet, node.mode);
    case "railFence":
      return railFence(input, node.params.rails, node.mode);
    case "columnar":
      return columnarTransposition(input, node.params.key, node.mode);
    case "xor":
      return xorCipher(input, node.params.key, node.mode);
    default:
      return input;
  }
}

function evaluatePipeline(source: string, nodes: PipelineNode[]): PipelineRun {
  let current = source;

  const results = nodes.map((node) => {
    const output = runNode(node, current);
    const result: NodeResult = {
      id: node.id,
      algorithm: node.algorithm,
      mode: node.mode,
      input: current,
      output,
    };
    current = output;
    return result;
  });

  return {
    source,
    finalOutput: current,
    nodes: results,
  };
}

function formatOutput(value: string): string {
  return value.length ? value : "[empty output]";
}

export default function Pipeline() {
  const [source, setSource] = useState("HELLO WORLD");
  const [nodes, setNodes] = useState<PipelineNode[]>([]);
  const liveRun = useMemo(() => evaluatePipeline(source, nodes), [source, nodes]);
  const [lastRun, setLastRun] = useState<PipelineRun>(liveRun);

  const addNode = (algorithm: AlgorithmId = "caesar") => {
    setNodes((current) => [...current, createNode(algorithm)]);
  };

  const insertNodeAt = (index: number, algorithm: AlgorithmId = "caesar") => {
    setNodes((current) => {
      const next = [...current];
      next.splice(index, 0, createNode(algorithm));
      return next;
    });
  };

  const updateNode = (nodeId: string, updater: (node: PipelineNode) => PipelineNode) => {
    setNodes((current) => current.map((node) => (node.id === nodeId ? updater(node) : node)));
  };

  const deleteNode = (nodeId: string) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
  };

  const moveNode = (nodeId: string, direction: -1 | 1) => {
    setNodes((current) => {
      const index = current.findIndex((node) => node.id === nodeId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  };

  const runPipeline = () => {
    setLastRun(evaluatePipeline(source, nodes));
  };

  return (
    <section
      className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at top, rgba(244, 180, 0, 0.18), transparent 35%), linear-gradient(180deg, #0f172a 0%, #111827 55%, #050816 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Cipher pipeline editor</p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Build a modifiable chain of cipher nodes</h1>
              <p className="text-sm leading-6 text-slate-300 sm:text-base">
                Add, insert, delete, reorder, and retune algorithms. The pipeline shows live step-by-step output and a separate last-run result panel.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                onClick={runPipeline}
                className="rounded-full bg-amber-400 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-amber-300"
              >
                Run pipeline
              </button>
              <button
                type="button"
                onClick={() => setNodes([createNode("caesar")])}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-medium text-slate-100 transition hover:bg-white/10"
              >
                Reset nodes
              </button>
              <button
                type="button"
                onClick={() => setSource("")}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-medium text-slate-100 transition hover:bg-white/10"
              >
                Clear input
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Source input</h2>
                  <p className="text-sm text-slate-400">This text is fed into the first node and transformed through the chain.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addNode()}
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
                >
                  Add node
                </button>
              </div>

              <textarea
                value={source}
                onChange={(event) => setSource(event.target.value)}
                rows={5}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-amber-300/50"
                placeholder="Type the text to encrypt or decrypt"
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live final output</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100" style={{ overflowWrap: "anywhere" }}>
                    {formatOutput(liveRun.finalOutput)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Last run output</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100" style={{ overflowWrap: "anywhere" }}>
                    {formatOutput(lastRun.finalOutput)}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-lg font-semibold">Pipeline nodes</h2>
                  <p className="text-sm text-slate-400">Each node can be edited independently. Outputs are displayed after every step.</p>
                </div>
                <div className="text-sm text-slate-400">{nodes.length} node{nodes.length === 1 ? "" : "s"}</div>
              </div>

              <div className="space-y-4">
                {nodes.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
                    No nodes yet. Add one to start building the pipeline.
                  </div>
                ) : null}

                {nodes.map((node, index) => {
                  const liveNodeResult = liveRun.nodes[index];

                  return (
                    <article key={node.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
                              Step {index + 1}
                            </span>
                            <select
                              value={node.algorithm}
                              onChange={(event) =>
                                updateNode(node.id, (current) => ({
                                  ...current,
                                  algorithm: event.target.value as AlgorithmId,
                                  params: createDefaultsFor(event.target.value as AlgorithmId),
                                }))
                              }
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100 outline-none"
                            >
                              {algorithmOptions.map((option) => (
                                <option key={option.id} value={option.id} className="bg-slate-950 text-slate-100">
                                  {algorithmLabels[option.id]}
                                </option>
                              ))}
                            </select>
                            <select
                              value={node.mode}
                              onChange={(event) =>
                                updateNode(node.id, (current) => ({ ...current, mode: event.target.value as NodeMode }))
                              }
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100 outline-none"
                            >
                              <option value="encrypt" className="bg-slate-950 text-slate-100">
                                Encrypt
                              </option>
                              <option value="decrypt" className="bg-slate-950 text-slate-100">
                                Decrypt
                              </option>
                            </select>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {node.algorithm === "caesar" ? (
                              <label className="space-y-2 text-sm text-slate-300">
                                <span>Shift</span>
                                <input
                                  type="number"
                                  value={node.params.shift}
                                  onChange={(event) =>
                                    updateNode(node.id, (current) => ({
                                      ...current,
                                      params: { ...current.params, shift: Number(event.target.value) || 0 },
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none"
                                />
                              </label>
                            ) : null}

                            {node.algorithm === "vigenere" || node.algorithm === "columnar" || node.algorithm === "xor" ? (
                              <label className="space-y-2 text-sm text-slate-300">
                                <span>{node.algorithm === "columnar" ? "Keyword" : "Key"}</span>
                                <input
                                  type="text"
                                  value={node.params.key}
                                  onChange={(event) =>
                                    updateNode(node.id, (current) => ({
                                      ...current,
                                      params: { ...current.params, key: event.target.value },
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                                  placeholder={node.algorithm === "columnar" ? "keyword" : "key"}
                                />
                              </label>
                            ) : null}

                            {node.algorithm === "railFence" ? (
                              <label className="space-y-2 text-sm text-slate-300">
                                <span>Rails</span>
                                <input
                                  type="number"
                                  min={2}
                                  value={node.params.rails}
                                  onChange={(event) =>
                                    updateNode(node.id, (current) => ({
                                      ...current,
                                      params: { ...current.params, rails: Number(event.target.value) || 2 },
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none"
                                />
                              </label>
                            ) : null}

                            {node.algorithm === "substitution" ? (
                              <label className="space-y-2 text-sm text-slate-300 sm:col-span-2 lg:col-span-2">
                                <span>Substitution alphabet</span>
                                <input
                                  type="text"
                                  value={node.params.alphabet}
                                  onChange={(event) =>
                                    updateNode(node.id, (current) => ({
                                      ...current,
                                      params: { ...current.params, alphabet: event.target.value.toUpperCase() },
                                    }))
                                  }
                                  maxLength={26}
                                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                                  placeholder="26-letter alphabet mapping"
                                />
                              </label>
                            ) : null}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Input</p>
                              <p className="mt-2 text-sm leading-6 text-slate-100" style={{ overflowWrap: "anywhere" }}>
                                {formatOutput(liveNodeResult?.input ?? source)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Output</p>
                              <p className="mt-2 text-sm leading-6 text-emerald-50" style={{ overflowWrap: "anywhere" }}>
                                {formatOutput(liveNodeResult?.output ?? source)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:w-48 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => insertNodeAt(index, "caesar")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10"
                          >
                            Insert above
                          </button>
                          <button
                            type="button"
                            onClick={() => insertNodeAt(index + 1, "caesar")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10"
                          >
                            Insert below
                          </button>
                          <button
                            type="button"
                            onClick={() => moveNode(node.id, -1)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10"
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveNode(node.id, 1)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10"
                          >
                            Move down
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNode(node.id)}
                            className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-400/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
              <h2 className="text-lg font-semibold">Last run snapshot</h2>
              <p className="mt-1 text-sm text-slate-400">This panel updates only when you press Run pipeline.</p>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Source</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100" style={{ overflowWrap: "anywhere" }}>
                    {formatOutput(lastRun.source)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Final output</p>
                  <p className="mt-2 text-sm leading-6 text-amber-50" style={{ overflowWrap: "anywhere" }}>
                    {formatOutput(lastRun.finalOutput)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
              <h2 className="text-lg font-semibold">Available nodes</h2>
              <div className="mt-4 space-y-3">
                {algorithmOptions.map((option) => (
                  <div key={option.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-100">{algorithmLabels[option.id]}</p>
                        <p className="text-sm text-slate-400">{option.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addNode(option.id)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
