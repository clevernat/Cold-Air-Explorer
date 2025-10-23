import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import { DocumentTextIcon } from './icons';

interface ReportProps {
  markdownContent: string;
}

const Report: React.FC<ReportProps> = ({ markdownContent }) => {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (markdownContent) {
      // The `as string` is safe here because we are not using async parsing.
      const parsedHtml = marked.parse(markdownContent) as string;
      setHtmlContent(parsedHtml);
    }
  }, [markdownContent]);

  return (
    <>
    <style>{`
      .prose-custom h1, .prose-custom h2, .prose-custom h3 {
        color: #67e8f9; /* cyan-300 */
      }
      .prose-custom p, .prose-custom ul, .prose-custom ol, .prose-custom li, .prose-custom strong {
        color: #d1d5db; /* gray-300 */
      }
      .prose-custom a {
        color: #60a5fa; /* blue-400 */
      }
       .prose-custom a:hover {
        color: #93c5fd; /* blue-300 */
      }
      .prose-custom ul > li::before {
        background-color: #67e8f9; /* cyan-300 */
      }
    `}</style>
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-3">
        <DocumentTextIcon className="h-6 w-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white m-0">Meteorological Analysis Report</h2>
      </div>
      <div
        className="prose-custom max-w-none text-sm sm:text-base"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
    </>
  );
};

export default Report;
