export const site = { order: 2, name: 'modern arch', day: 'day 2', home: 'Modern decoder architecture · octlm day 2', title: 'Modern decoder architecture', sub: 'From the 2017 block to a 2024 LLM block', hue: 250 };

export const chapters = [
  { slug: '', title: 'The map', sub: 'From the 2017 block to a 2024 LLM block', hue: 25 },
  { slug: '01-rope', title: 'RoPE, properly', sub: 'Frequencies, caches, conventions and long context', hue: 300, act: 1 },
  { slug: '02-rmsnorm', title: 'RMSNorm', sub: 'Rescale, skip the re-centering', hue: 150, act: 1 },
  { slug: '03-swiglu', title: 'SwiGLU', sub: 'A gated MLP with a smooth switch', hue: 85, act: 1 },
  { slug: '04-gqa', title: 'Grouped-query attention', sub: 'Many queries, few keys and values', hue: 250, act: 2 },
  { slug: '05-sdpa', title: 'SDPA', sub: 'One call, three backends', hue: 195, act: 2 },
  { slug: '06-flashattention', title: 'FlashAttention', sub: 'Exact attention that respects memory', hue: 300, act: 2 },
  { slug: '07-modern-block', title: 'The modern decoder block', sub: 'Every upgrade, assembled', hue: 150, act: 3 },
];
