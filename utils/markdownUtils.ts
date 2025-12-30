/**
 * Normalizes markdown so that a bulleted list placed "between" ordered list items
 * is treated as a nested list under the preceding ordered item.
 *
 * Example input:
 * 2. Parent
 *
 * - Child
 * - Child
 *
 * 3. Next
 *
 * Output (children indented):
 * 2. Parent
 *
 *     - Child
 *     - Child
 *
 * 3. Next
 */
export function normalizeMarkdownForNestedLists(markdown: string): string {
  const lines = markdown.split(/\r?\n/);

  let inFence = false;
  let lastNonEmptyWasTopLevelOrderedItem = false;
  let nestingBulletBlock = false;

  const isFence = (line: string) => /^\s*```/.test(line);
  const isTopLevelOrderedItem = (line: string) => /^\d+\.\s+/.test(line);
  const isTopLevelBulletItem = (line: string) => /^[-*+]\s+/.test(line);
  const isAnyListLine = (line: string) => /^\s*(\d+\.|[-*+])\s+/.test(line);

  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isFence(line)) {
      inFence = !inFence;
      nestingBulletBlock = false;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    const trimmed = line.trim();

    // End nesting as soon as we hit the next top-level ordered list item.
    if (nestingBulletBlock && isTopLevelOrderedItem(line)) {
      nestingBulletBlock = false;
      lastNonEmptyWasTopLevelOrderedItem = true;
      out.push(line);
      continue;
    }

    // Start nesting when a top-level bullet list appears after a top-level ordered item.
    if (!nestingBulletBlock && isTopLevelBulletItem(line) && lastNonEmptyWasTopLevelOrderedItem) {
      nestingBulletBlock = true;
    }

    if (nestingBulletBlock) {
      // Only indent truly top-level lines; preserve existing indentation.
      if (/^\s*$/.test(line)) {
        out.push('');
      } else if (isAnyListLine(line) && /^\S/.test(line)) {
        out.push(`    ${line}`);
      } else if (/^\S/.test(line)) {
        // Continuation lines within the bullet block (rare, but keeps them nested).
        out.push(`    ${line}`);
      } else {
        out.push(line);
      }

      // If we hit a non-list, non-empty line at top level, stop nesting.
      // This prevents accidentally nesting paragraphs unrelated to the list.
      if (trimmed !== '' && !isAnyListLine(line) && /^\S/.test(line)) {
        nestingBulletBlock = false;
        lastNonEmptyWasTopLevelOrderedItem = false;
      }

      continue;
    }

    // Track whether the last non-empty line was a top-level ordered item.
    if (trimmed !== '') {
      lastNonEmptyWasTopLevelOrderedItem = isTopLevelOrderedItem(line);
    }

    out.push(line);
  }

  return out.join('\n');
}
