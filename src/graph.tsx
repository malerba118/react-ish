// If no children, the node will be considered a leaf
export interface Node {
  children?: Node[];
}

export interface PathItem<T extends Node> {
  key: number;
  value: T;
}

// Map function for graph nodes. Returns a new graph, mimicking the shape
// of the orginal graph, but with new nodes defined by the callback.
export const map = <Input extends Node, Output extends Node>(
  node: Input,
  callback: (node: Input, path: PathItem<Input>[]) => Output
): Output => {
  return mapRec(node, callback, []);
};

const mapRec = <Input extends Node, Output extends Node>(
  node: Input,
  callback: (node: Input, path: PathItem<Input>[]) => Output,
  path: PathItem<Input>[]
): Output => {
  let mapped = callback(node, path);
  if (mapped && mapped.children) {
    mapped.children = mapped.children.map((child, i) => {
      return mapRec(child, callback, [...path, { key: i, value: child }]);
    });
  }
  return mapped;
};

// forEach function for graph nodes.
// Traverses graph and invokes callbabck for each node in the graph.
export const forEach = <Input extends Node>(
  node: Input,
  callback: (node: Input, path: PathItem<Input>[]) => void
): void => {
  return forEachRec(node, callback, []);
};

const forEachRec = <Input extends Node>(
  node: Input,
  callback: (node: Input, path: PathItem<Input>[]) => void,
  path: PathItem<Input>[]
): void => {
  callback(node, path);
  if (node && node.children) {
    node.children.forEach((child, i) => {
      return forEachRec(child, callback, [...path, { key: i, value: child }]);
    });
  }
};
