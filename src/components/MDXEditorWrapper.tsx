import React from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  tablePlugin,
  linkPlugin,
  linkDialogPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  ListsToggle,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

interface MDXEditorWrapperProps {
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export const MDXEditorWrapper: React.FC<MDXEditorWrapperProps> = ({
  markdown,
  onChange,
  readOnly = false,
  placeholder = "Ketik konten RPP / modul ajar dalam format Markdown di sini...",
}) => {
  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
      <MDXEditor
        markdown={markdown || ""}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        contentEditableClassName="prose max-w-none p-4 min-h-[220px] focus:outline-none text-slate-800 text-sm leading-relaxed"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          tablePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex items-center gap-1 flex-wrap border-b border-slate-200 bg-slate-50/80 p-2 text-xs">
                <UndoRedo />
                <div className="h-4 w-px bg-slate-300 mx-1" />
                <BlockTypeSelect />
                <div className="h-4 w-px bg-slate-300 mx-1" />
                <BoldItalicUnderlineToggles />
                <div className="h-4 w-px bg-slate-300 mx-1" />
                <ListsToggle />
                <div className="h-4 w-px bg-slate-300 mx-1" />
                <CreateLink />
                <InsertTable />
              </div>
            ),
          }),
        ]}
      />
    </div>
  );
};
