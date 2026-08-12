function toClassList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
}

function setProperty(ctx, node, key, value) {
  ctx.setProperty(node, key, value);
}

function addLazyClass(node, ctx) {
  const properties = node.properties ?? {};
  const className = toClassList(properties.className ?? properties.class);
  if (!className.includes('lazy')) className.push('lazy');
  setProperty(ctx, node, 'className', className);
  setProperty(ctx, node, 'class', null);
}

function moveProperty(node, ctx, from, to) {
  const properties = node.properties ?? {};
  if (properties[from] === undefined || properties[to] !== undefined) return;
  setProperty(ctx, node, to, properties[from]);
  setProperty(ctx, node, from, null);
}

export default function rehypeLazyImages() {
  return {
    name: 'lazy-images',
    element: {
      filter: ['img', 'source'],
      visit(node, ctx) {
        if (node.tagName === 'img') {
          addLazyClass(node, ctx);
          moveProperty(node, ctx, 'src', 'data-src');
          moveProperty(node, ctx, 'srcSet', 'data-srcset');
          moveProperty(node, ctx, 'srcset', 'data-srcset');
          moveProperty(node, ctx, 'sizes', 'data-sizes');
          if (node.properties?.decoding === undefined) {
            setProperty(ctx, node, 'decoding', 'async');
          }
          setProperty(ctx, node, 'loading', null);
        }

        if (node.tagName === 'source') {
          moveProperty(node, ctx, 'srcSet', 'data-srcset');
          moveProperty(node, ctx, 'srcset', 'data-srcset');
          moveProperty(node, ctx, 'sizes', 'data-sizes');
        }
      },
    },
  };
}
