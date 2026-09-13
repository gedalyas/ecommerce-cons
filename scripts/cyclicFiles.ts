export type ImportGraph = ReadonlyMap<string, readonly string[]>;

export interface CyclicSummary {
  readonly components: readonly (readonly string[])[];
  readonly files: number;
  readonly edges: number;
}

export const findCyclicComponents = (graph: ImportGraph): string[][] => {
  let nextIndex = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indexOf = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const components: string[][] = [];

  const visit = (node: string): void => {
    indexOf.set(node, nextIndex);
    lowLink.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);

    for (const next of graph.get(node) ?? []) {
      if (!indexOf.has(next)) {
        visit(next);
        lowLink.set(node, Math.min(lowLink.get(node)!, lowLink.get(next)!));
      } else if (onStack.has(next)) {
        lowLink.set(node, Math.min(lowLink.get(node)!, indexOf.get(next)!));
      }
    }

    if (lowLink.get(node) !== indexOf.get(node)) return;

    const component: string[] = [];
    let popped: string;
    do {
      popped = stack.pop()!;
      onStack.delete(popped);
      component.push(popped);
    } while (popped !== node);
    if (component.length > 1) components.push(component.sort());
  };

  for (const node of graph.keys()) {
    if (!indexOf.has(node)) visit(node);
  }
  return components.sort((a, b) => b.length - a.length);
};

export const summarizeCycles = (graph: ImportGraph): CyclicSummary => {
  const components = findCyclicComponents(graph);
  const componentOf = new Map<string, number>();
  components.forEach((component, position) => {
    for (const file of component) componentOf.set(file, position);
  });

  let edges = 0;
  for (const [file, imports] of graph) {
    const own = componentOf.get(file);
    if (own === undefined) continue;
    for (const target of imports) {
      if (componentOf.get(target) === own) edges += 1;
    }
  }

  return { components, files: componentOf.size, edges };
};
