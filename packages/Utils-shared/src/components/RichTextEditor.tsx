import type React from "react";
import { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { Locale } from "../locale";
import { resolveLocale } from "../locale";
import { useComponentTranslations } from "./translations";

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "align",
  "direction",
  "link",
  "image",
];

function buildModules(richText: ReturnType<typeof useComponentTranslations>["richText"]) {
  return {
    toolbar: [
      [{ header: [1, 2, false] }],
      [
        { bold: richText.bold },
        { italic: richText.italic },
        { underline: richText.underline },
        { strike: richText.strike },
        { blockquote: richText.blockquote },
      ],
      [
        { list: "ordered", label: richText.orderedList },
        { list: "bullet", label: richText.bulletList },
        { indent: "-1", label: richText.indentLess },
        { indent: "+1", label: richText.indentMore },
      ],
      [
        { align: "" },
        { align: "right", label: richText.alignRight },
        { align: "center", label: richText.alignCenter },
        { align: "justify", label: richText.alignJustify },
      ],
      [{ direction: "rtl", label: richText.rtl }],
      ["link", "image"],
      ["clean"],
    ],
  };
}

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Language for toolbar and placeholder (default: "en"). */
  lang?: Locale | null;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  lang,
}: RichTextEditorProps): React.ReactElement {
  const t = useComponentTranslations(lang);
  const placeholderText = placeholder ?? t.richTextPlaceholder;
  const locale = resolveLocale(lang);
  const modules = useMemo(() => buildModules(t.richText), [locale]);
  const isRtl = locale === "ar";
  return (
    <ReactQuill
      value={value}
      onChange={onChange}
      theme="snow"
      placeholder={placeholderText}
      style={{
        direction: isRtl ? "rtl" : "ltr",
        fontFamily: isRtl ? "'Amiri', serif" : "inherit",
        overflow: "unset",
        marginBottom: "80px",
      }}
      formats={formats}
      modules={modules}
    />
  );
}
