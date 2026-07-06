function toClassList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
}

function addLazyClass(properties) {
  const className = toClassList(properties.className ?? properties.class);
  if (!className.includes('lazy')) className.push('lazy');
  properties.className = className;
  delete properties.class;
}

function moveProperty(properties, from, to) {
  if (properties[from] === undefined || properties[to] !== undefined) return;
  properties[to] = properties[from];
  delete properties[from];
}

function visit(node) {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'element' && node.properties) {
    const { tagName, properties } = node;

    if (tagName === 'img') {
      addLazyClass(properties);
      moveProperty(properties, 'src', 'data-src');
      moveProperty(properties, 'srcSet', 'data-srcset');
      moveProperty(properties, 'srcset', 'data-srcset');
      moveProperty(properties, 'sizes', 'data-sizes');
      properties.decoding ??= 'async';
      delete properties.loading;
    }

    if (tagName === 'source') {
      moveProperty(properties, 'srcSet', 'data-srcset');
      moveProperty(properties, 'srcset', 'data-srcset');
      moveProperty(properties, 'sizes', 'data-sizes');
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) visit(child);
  }
}

export default function rehypeLazyImages() {
  return (tree) => visit(tree);
}
