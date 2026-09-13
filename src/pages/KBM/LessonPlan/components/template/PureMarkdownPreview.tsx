import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";

interface PureMarkdownPreviewProps {
  content: string;
}

export const PureMarkdownPreview: React.FC<PureMarkdownPreviewProps> = ({ content }) => {
  if (!content || !content.trim()) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs min-h-95 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-white space-y-2">
        <FileText className="w-8 h-8 text-slate-300 mb-1" />
        <span className="font-semibold text-slate-500">Preview Tampilan Kosong</span>
        <span className="text-slate-400 max-w-xs leading-relaxed">
          Ketik atau buat struktur template RPP pada Editor Markdown di sebelah kiri untuk melihat hasil preview.
        </span>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-2xs font-sans min-h-95 markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }: any) => (
            <h1 className="text-xl font-extrabold text-indigo-950 border-b border-indigo-100 pb-2 mb-3 mt-2">{children}</h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-lg font-bold text-slate-900 mb-2 mt-4">{children}</h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-base font-bold text-indigo-900 mb-2 mt-3">{children}</h3>
          ),
          h4: ({ children }: any) => (
            <h4 className="text-sm font-bold text-slate-800 mb-2 mt-2">{children}</h4>
          ),
          h5: ({ children }: any) => (
            <h5 className="text-xs font-semibold text-slate-700 mb-1.5 mt-2">{children}</h5>
          ),
          h6: ({ children }: any) => (
            <h6 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 mt-2">{children}</h6>
          ),
          p: ({ children }: any) => (
            <p className="text-sm text-slate-700 leading-relaxed mb-2.5">{children}</p>
          ),
          ul: ({ children }: any) => (
            <ul className="list-disc pl-5 space-y-1.5 my-2.5 text-slate-700 text-sm">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal pl-5 space-y-1.5 my-2.5 text-slate-700 text-sm">{children}</ol>
          ),
          li: ({ children }: any) => (
            <li className="leading-relaxed">{children}</li>
          ),
          strong: ({ children }: any) => (
            <strong className="font-bold text-slate-900">{children}</strong>
          ),
          em: ({ children }: any) => (
            <em className="italic text-slate-800">{children}</em>
          ),
          // Dukungan underline via tag HTML <u>
          u: ({ children }: any) => (
            <u className="underline underline-offset-2 text-slate-900">{children}</u>
          ),
          code: ({ children, className }: any) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-slate-100 rounded-lg p-3 overflow-x-auto my-3">
                  <code className="text-indigo-700 font-mono text-[11px]">{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[11px]">{children}</code>
            );
          },
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-indigo-300 text-slate-600 bg-indigo-50/50 px-4 py-2 rounded-r-lg my-3 not-italic">
              {children}
            </blockquote>
          ),
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }: any) => (
            <thead className="bg-slate-100">{children}</thead>
          ),
          tbody: ({ children }: any) => (
            <tbody className="bg-white divide-y divide-slate-100">{children}</tbody>
          ),
          tr: ({ children }: any) => (
            <tr>{children}</tr>
          ),
          th: ({ children }: any) => (
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-200 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-100 last:border-r-0">
              {children}
            </td>
          ),
          hr: () => <hr className="border-slate-200 my-4" />,
          a: ({ href, children }: any) => (
            <a href={href} className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
