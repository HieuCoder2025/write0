import React, { useCallback, useContext, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeMarkdownForNestedLists } from '../utils/markdownUtils';

interface PreviewProps {
  content: string;
  focusMode: boolean;
  focusLine: number | null;
}

function cx(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

const DimAncestorContext = React.createContext(false);

type MarkdownNodePosition = {
  position?: {
    start?: { line?: number };
    end?: { line?: number };
  };
};

function getNodeLineRange(node: unknown): { startLine: number; endLine: number } | null {
  const anyNode = node as MarkdownNodePosition | null | undefined;
  const startLine = anyNode?.position?.start?.line;
  const endLine = anyNode?.position?.end?.line;

  if (typeof startLine !== 'number' || typeof endLine !== 'number') return null;
  return { startLine, endLine };
}

export const Preview: React.FC<PreviewProps> = ({ content, focusMode, focusLine }) => {
  const normalized = useMemo(() => normalizeMarkdownForNestedLists(content), [content]);

  const opacityClassForNode = useCallback(
    (node: unknown): string => {
      if (!focusMode || focusLine == null) return 'opacity-100';

      const range = getNodeLineRange(node);
      if (!range) return 'opacity-100';

      const isFocused = range.startLine <= focusLine && focusLine <= range.endLine;
      return isFocused ? 'opacity-100' : 'opacity-25';
    },
    [focusMode, focusLine],
  );

  const dimBoundary = useCallback(
    (tag: keyof React.JSX.IntrinsicElements) => {
      return ({ node, className, ...props }: any) => {
        const dimmedByAncestor = useContext(DimAncestorContext);

        const element = React.createElement(tag as string, {
          ...props,
          className: cx(
            className,
            dimmedByAncestor ? undefined : 'transition-opacity duration-300 ease-in-out',
            dimmedByAncestor ? undefined : opacityClassForNode(node),
          ),
        });

        if (dimmedByAncestor) return element;
        return <DimAncestorContext.Provider value={true}>{element}</DimAncestorContext.Provider>;
      };
    },
    [opacityClassForNode],
  );

  const markdownComponents = useMemo(
    () => ({
      p: dimBoundary('p'),
      h1: dimBoundary('h1'),
      h2: dimBoundary('h2'),
      h3: dimBoundary('h3'),
      h4: dimBoundary('h4'),
      h5: dimBoundary('h5'),
      h6: dimBoundary('h6'),
      blockquote: dimBoundary('blockquote'),
      pre: dimBoundary('pre'),
      li: dimBoundary('li'),
      table: dimBoundary('table'),
      hr: dimBoundary('hr'),
    }),
    [dimBoundary],
  );

  return (
    <div className="h-full overflow-y-auto px-8 pt-12 pb-8 bg-white dark:bg-gray-900 transition-colors">
      <article className="w0-prose prose prose-lg dark:prose-invert prose-headings:font-sans prose-p:font-sans prose-a:text-blue-600 mx-auto prose-code:before:content-none prose-code:after:content-none [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {normalized}
        </ReactMarkdown>
      </article>
      <div className="h-20"></div>
    </div>
  );
};
