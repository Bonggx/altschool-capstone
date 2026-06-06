import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Toolbar from "./Toolbar";

// Props that the Editor component accepts
interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function Editor({
  content,
  onChange,
  placeholder = "Tell your story...",
}: EditorProps) {
  // Initializes the Tiptap editor with all the extensions needed
  const editor = useEditor({
    extensions: [
      // StarterKit includes bold, italic, headings, lists, code blocks, etc.
      StarterKit,
      // Image extension lets authors embed images in their posts
      Image.configure({ inline: false, allowBase64: true }),
      // Link extension makes URLs clickable in the editor
      Link.configure({ openOnClick: false, autolink: true }),
      // Placeholder shows hint text when the editor is empty
      Placeholder.configure({ placeholder }),
    ],
    content,
    // Fire onChange every time the editor content changes
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar renders formatting buttons above the editor */}
      <Toolbar editor={editor} />
      {/* The actual editable content area */}
      <div className="px-6 py-4 prose max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
