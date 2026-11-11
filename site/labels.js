// Keep the last two namespace components intact so a file's name stays readable.
export function moduleLabel(id) {
  return id.split('.').slice(-2).join('.');
}

// Split only where necessary to fit the canvas. Joining the lines reproduces
// the label exactly, including long identifiers without spaces.
export function wrapLabel(label, maxWidth, measure) {
  const lines = [];
  let line = '';
  for (const character of label) {
    if (line && measure(line + character) > maxWidth) {
      lines.push(line);
      line = '';
    }
    line += character;
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}
