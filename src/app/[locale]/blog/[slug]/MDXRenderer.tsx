"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export function MDXRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // ReactMarkdown already wraps fenced code in pre; style that wrapper once.
        pre: ({ children }) => (
          <pre className="border-border bg-muted/30 text-foreground overflow-x-auto rounded-lg border p-4">
            {children}
          </pre>
        ),
        code: ({ className, children }) => (
          <code className={`${className || ""} [overflow-wrap:anywhere]`}>
            {children}
          </code>
        ),
        // Make links open in new tab
        a: ({ children, href, ...props }) => (
          <a
            href={href}
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            {...props}
          >
            {children}
          </a>
        ),
        // Make images responsive
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary markdown-authored images, dimensions unknown
          <img
            src={src}
            alt={alt}
            className="border-border my-8 rounded-xl border"
          />
        ),
        // Style tables
        table: ({ children }) => (
          <div className="border-border my-6 overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">{children}</table>
          </div>
        ),
        th: ({ children, style }) => (
          <th
            style={style}
            className="border-border bg-muted/30 border-b px-4 py-2 text-left font-semibold"
          >
            {children}
          </th>
        ),
        td: ({ children, style }) => (
          <td style={style} className="border-border border-b px-4 py-2">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
