import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Box } from "@material-ui/core"

function RichTextEditor({ value, label, name, setFieldValue }) {

    const editorRef = useRef(null);
    const [isUpdate, setIsUpdate] = React.useState(true);

    return (
        <Box>
            {label}
            <Editor
                id={name}
                onInit={(evt, editor) => editorRef.current = editor}
                initialValue={isUpdate && value}
                onChange={(content: any) => {
                    setIsUpdate(false)
                    setFieldValue(name, content?.level?.content)
                }}
                init={{
                    height: "150px",
                    width: "100%",
                    table_default_attributes: {
                        border: '0'
                    },
                    block_formats: 'Paragraph=p;Header 1=h1;Header 2=h2;Header 3=h3',
                    font_formats: 'Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;AkrutiKndPadmini=Akpdmi-n',
                    plugins: [
                        'advlist autolink lists link charmap print preview anchor ',
                        ' searchreplace visualblocks code fullscreen  ',
                        'insertdatetime media table paste code wordcount'
                    ],
                    menubar: true,
                    toolbar: 'fullscreen | undo redo | formatselect  | ' +
                        'bold italic backcolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent ',
                    content_style: '* { padding: 0; margin: 0; box-sizing: border-box; } body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                }}
            />
        </Box>
    )
}

export default RichTextEditor;
