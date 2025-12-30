import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeMarkdownForNestedLists } from '../utils/markdownUtils';

interface PreviewProps {
  content: string;
}

export const Preview: React.FC<PreviewProps> = ({ content }) => {
  const normalized = useMemo(() => normalizeMarkdownForNestedLists(content), [content]);

  return (
    <div className="h-full overflow-y-auto px-8 pt-12 pb-8 bg-white dark:bg-gray-900 transition-colors">
      <article className="w0-prose prose prose-lg dark:prose-invert prose-headings:font-sans prose-p:font-sans prose-a:text-blue-600 mx-auto prose-code:before:content-none prose-code:after:content-none [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized}</ReactMarkdown>
      </article>
      <div className="h-20"></div>
    </div>
  );
};
