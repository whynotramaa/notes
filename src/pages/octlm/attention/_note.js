export const site = { order: 1, name: 'attention', day: 'day 1', home: 'Attention · octlm day 1', title: 'Attention', sub: 'From raw bytes to the next token', hue: 85 };

export const chapters = [
  { slug: '', title: 'The map', sub: 'Every station of the story on one page', hue: 25 },
  { slug: '01-tokenization', title: 'Byte-level BPE', sub: 'Text becomes integer ids', hue: 85, act: 1 },
  { slug: '02-embeddings', title: 'Token embeddings', sub: 'Ids become vectors', hue: 150, act: 1 },
  { slug: '03-positions', title: 'Positional information', sub: 'Order is invisible until you add it', hue: 195, act: 2 },
  { slug: '04-sinusoidal', title: 'Sinusoidal positions', sub: 'A ruler made of waves', hue: 250, act: 2 },
  { slug: '05-rope', title: 'RoPE', sub: 'Rotate the query, rotate the key', hue: 300, act: 2 },
  { slug: '06-qkv', title: 'Q, K and V', sub: 'Ask, advertise, hand over', hue: 85, act: 3 },
  { slug: '07-scaled-dot-product', title: 'Scaled dot-product', sub: 'Score, scale, softmax, mix', hue: 150, act: 3 },
  { slug: '08-causal-mask', title: 'Causal masking', sub: 'No peeking at the answer', hue: 195, act: 3 },
  { slug: '09-multi-head', title: 'Multi-head attention', sub: 'Many small lookups at once', hue: 250, act: 3 },
  { slug: '10-quadratic', title: 'The n × n matrix', sub: 'Where the quadratic cost lives', hue: 300, act: 3 },
  { slug: '11-kv-cache', title: 'KV cache', sub: 'Keep the keys, skip the redo', hue: 85, act: 3 },
  { slug: '12-decoder-block', title: 'The decoder block', sub: 'Attention and MLP on a residual highway', hue: 150, act: 4 },
  { slug: '13-optimization', title: 'Optimization and reproducibility', sub: 'Train it, then train it again identically', hue: 195, act: 4 },
];
