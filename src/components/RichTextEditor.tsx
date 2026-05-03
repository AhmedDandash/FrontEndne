'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 260,
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8c8c8c',
        fontSize: 13,
      }}
    >
      ...
    </div>
  ),
});


interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: number;
  dir?: 'rtl' | 'ltr';
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
  height = 260,
  dir = 'ltr',
}: Props) {
  return (
    <div
      style={{ direction: dir }}
      className={`rich-editor-wrapper${readOnly ? ' rich-editor-readonly' : ''}`}
    >
      <style>{`
        .rich-editor-wrapper .ql-container {
          min-height: ${height}px;
          font-size: 14px;
          border-radius: 0 0 6px 6px;
        }
        .rich-editor-wrapper .ql-toolbar {
          display: none;
        }
        .rich-editor-wrapper .ql-container {
          border-radius: 6px;
          border-top: 1px solid #d9d9d9;
        }
        .rich-editor-wrapper .ql-editor {
          min-height: ${height}px;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        modules={{ toolbar: false }}
      />
    </div>
  );
}
