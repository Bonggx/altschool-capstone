import { Editor } from "@tiptap/react";
import { supabase } from "../../lib/supabase";

interface ToolbarProps {
  editor: Editor | null;
}

// A single toolbar button that stays active when the format is applied
function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent the editor from losing focus when clicking toolbar buttons
        e.preventDefault();
        onClick(e);
      }}
      title={title}
      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-brand-100 text-brand-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  // Handles image upload to Supabase Storage and inserts it into the editor
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("post-images")
      .upload(fileName, file);

    if (error) {
      console.error("Image upload failed:", error.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(data.path);
    editor.chain().focus().setImage({ src: publicUrl }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50">

      {/* Bold */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>

      {/* Inline code */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code"
      >
        {"<>"}
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Heading 1 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>

      {/* Heading 2 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>

      {/* Heading 3 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Bullet list */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        • List
      </ToolbarButton>

      {/* Numbered list */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        1. List
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        ❝
      </ToolbarButton>

      {/* Code block */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code block"
      >
        {"{ }"}
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Image upload — triggers a hidden file input */}
      <label
        className="p-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-colors"
        title="Insert image"
      >
        🖼
        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </label>

    </div>
  );
}
