const stripMarkdownLite = (s: string) => {
  let out = String(s || '');
  // remove code fences
  out = out.replace(/```[\s\S]*?```/g, ' ');
  // inline code
  out = out.replace(/`([^`]+)`/g, '$1');
  // links [text](url) -> text
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  // images ![alt](url) -> alt
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');
  // headings/bullets
  out = out.replace(/^\s*[#>*-]+\s+/gm, ' ');
  // html tags
  out = out.replace(/<[^>]*>/g, ' ');
  // collapse whitespace
  out = out.replace(/\s+/g, ' ').trim();
  return out;
};

export const readingTime = (input: string, wpm = 220) => {
  const text = stripMarkdownLite(input);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / wpm));
  return {
    words,
    minutes,
    label: `${minutes} min read`,
  };
};
