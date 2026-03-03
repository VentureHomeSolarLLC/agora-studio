import React from 'react';

type TreeNode = {
  name: string;
  children: Map<string, TreeNode>;
  isFile?: boolean;
};

interface FileTreePreviewProps {
  paths: string[];
  title?: string;
  note?: string;
}

const buildTree = (paths: string[]) => {
  const root: TreeNode = { name: 'root', children: new Map() };

  paths
    .filter(Boolean)
    .forEach((path) => {
      const parts = path.split('/').filter(Boolean);
      let current = root;
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1 && part.includes('.');
        if (!current.children.has(part)) {
          current.children.set(part, { name: part, children: new Map(), isFile });
        }
        const next = current.children.get(part)!;
        if (isFile) {
          next.isFile = true;
        }
        current = next;
      });
    });

  return root;
};

const sortNodes = (nodes: TreeNode[]) =>
  nodes.sort((a, b) => {
    const aIsFile = !!a.isFile;
    const bIsFile = !!b.isFile;
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

const renderTree = (node: TreeNode, depth = 0): React.ReactNode => {
  const children = sortNodes(Array.from(node.children.values()));
  if (children.length === 0) return null;

  return (
    <ul className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1'}>
      {children.map((child) => (
        <li key={`${depth}-${child.name}`} className="text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">{child.isFile ? '📄' : '📁'}</span>
            <span className={child.isFile ? 'font-mono text-xs text-gray-700' : 'font-medium'}>
              {child.name}
            </span>
          </div>
          {renderTree(child, depth + 1)}
        </li>
      ))}
    </ul>
  );
};

export function FileTreePreview({ paths, title = 'File Layout Preview', note }: FileTreePreviewProps) {
  const tree = buildTree(Array.from(new Set(paths)));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
      {note && <p className="text-xs text-gray-500 mb-3">{note}</p>}
      {paths.length === 0 ? (
        <p className="text-sm text-gray-500">No files generated yet.</p>
      ) : (
        renderTree(tree)
      )}
    </div>
  );
}
