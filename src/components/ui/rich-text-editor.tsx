"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-gray-200 text-gray-900"
          : "text-gray-500 hover:bg-gray-200 hover:text-gray-900",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:float-left before:text-gray-400 before:pointer-events-none before:h-0",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3 text-gray-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1",
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. when form resets with fetched data)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-black overflow-hidden bg-white",
        error && "border-red-500 focus-within:ring-red-500",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run() ?? undefined}
          active={editor?.isActive("bold") ?? false}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run() ?? undefined}
          active={editor?.isActive("italic") ?? false}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run() ?? undefined}
          active={editor?.isActive("bulletList") ?? false}
          title="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run() ?? undefined}
          active={editor?.isActive("orderedList") ?? false}
          title="Numbered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

/** Renders stored HTML safely in read-only contexts. */
export function RichTextDisplay({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  if (!html) return null;

  // If content is plain text (no HTML tags), wrap in a paragraph
  const isHtml = /<[a-z][\s\S]*>/i.test(html);
  const content = isHtml ? html : `<p>${html}</p>`;

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-gray-600 leading-relaxed",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2",
        "[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_strong]:font-semibold [&_em]:italic",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
