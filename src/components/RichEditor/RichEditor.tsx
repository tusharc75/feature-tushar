import Editor from '@draft-js-plugins/editor';
import createImagePlugin from '@draft-js-plugins/image';
import { IconButton } from '@mui/material';
import Typography from '@mui/material/Typography';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import { AtomicBlockUtils, EditorState, Modifier, RichUtils } from 'draft-js';
import { useContext, useEffect, useRef, useState } from 'react';
import { BsFillImageFill, BsListOl, BsListUl, BsTypeBold, BsTypeItalic, BsTypeUnderline } from 'react-icons/bs';
import { MdFormatQuote } from 'react-icons/md';
import { VscSymbolNamespace } from 'react-icons/vsc';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { imageUploadMaxSize } from '../../constants/helpers';
import HtmlTooltip from '../CustomTooltipTitle';
import './RichEditorStyle.scss';
import { useAppTheme } from 'src/constants/AppConfig';

const imagePlugin = createImagePlugin();
const plugins = [imagePlugin];

export function RichTextEditor(props) {
  const { editorState, style, placeholder } = props;
  const [themeColor] = useAppTheme();
  const editorRef = useRef(null);

  useEffect(() => {
    editorRef.current.focus();
  }, []);

  const onChange = (editorState) => {
    props.onChange('editorState', editorState);
  };

  const focus = () => editorRef.current.focus();

  const handleKeyCommand = (command) => {
    const { editorState } = props;
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      onChange(newState);
      return true;
    }
    return false;
  };

  const onTab = (e) => {
    const maxDepth = 4;
    onChange(RichUtils.onTab(e, props.editorState, maxDepth));
  };
  const toggleBlockType = (blockType) => {
    onChange(RichUtils.toggleBlockType(props.editorState, blockType));
  };
  const toggleInlineStyle = (inlineStyle) => {
    onChange(RichUtils.toggleInlineStyle(props.editorState, inlineStyle));
  };

  let className = 'RichEditor-editor';
  const contentState = editorState.getCurrentContent();
  if (!contentState.hasText()) {
    if (contentState.getBlockMap().first().getType() !== 'unstyled') {
      className += ' RichEditor-hidePlaceholder';
    }
  }

  const handleReturn = (e) => {
    if (e.shiftKey) {
      props.onChange('editorState', RichUtils.insertSoftNewline(editorState));
      return 'handled';
    }
    return 'not-handled';
  };

  return (
    <div className="RichEditor-root" style={style ? { ...style } : null}>
      <div className="container">
        <BlockStyleControls editorState={editorState} onToggle={toggleBlockType} onChange={onChange} />
        <InlineStyleControls editorState={editorState} onToggle={toggleInlineStyle} />
      </div>
      <div className={className} onClick={focus} key={themeColor}>
        {/* <Editor
          blockStyleFn={getBlockStyle}
          customStyleMap={styleMap}
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          onChange={onChange}
          onTab={onTab}
          placeholder={placeholder || ''}
          // ref="editor"
          ref={editorRef}
          spellCheck={true}
          handleReturn={handleReturn}
        /> */}
        <Editor
          editorState={editorState}
          onChange={onChange}
          plugins={plugins}
          ref={editorRef}
          handleKeyCommand={handleKeyCommand}
          spellCheck={true}
          placeholder={placeholder || ''}
          onTab={onTab}
          customStyleMap={styleMap}
          blockStyleFn={getBlockStyle}
          init={{
            skin: themeColor === 'dark' ? 'oxide-dark' : 'oxide',
            content_css: themeColor === 'dark' ? 'dark' : 'default'
          }}
        />
      </div>
    </div>
  );
}
// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2
  }
};
function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote':
      return 'RichEditor-blockquote';
    default:
      return null;
  }
}

function StyleButton(props) {
  let className = 'RichEditor-styleButton';
  if (props.active) {
    className += ' RichEditor-activeButton';
  }
  const onToggle = (e) => {
    e.preventDefault();
    props.onToggle(props.style);
  };
  return (
    <span className={className} onMouseDown={onToggle}>
      {props.icon ? (
        <HtmlTooltip title={props.label || ''}>
          <IconButton className="richTextEditorIconButton">{props.icon}</IconButton>
        </HtmlTooltip>
      ) : props.label ? (
        <HtmlTooltip title={props?.message || ''}>
          <span> {props.label}</span>
        </HtmlTooltip>
      ) : (
        ''
      )}
    </span>
  );
}

const BlockStyleControls = (props) => {
  const { editorState, onChange } = props;
  const selection = editorState.getSelection();
  const blockType = editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType();
  const toastConfig = useContext(CustomToastContext);
  const [isUploading, setUploading] = useState(false);

  const insertImage = (editorState, source) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('image', 'IMMUTABLE', { src: source });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity
    });
    return AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' ');
  };

  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      if (file.size > imageUploadMaxSize.size) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: `Image must be less than ${imageUploadMaxSize.text} size`
        });
      } else {
        getImageUrl(file);
      }
    }
  };

  const getImageUrl = (file) => {
    let formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    axiosInstance()
      .post('/user/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(({ data }) => {
        const newEditorState = insertImage(editorState, data.fileUrl);
        onChange(newEditorState);
        setUploading(false);
      })
      .catch((err) => {
        setUploading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const alignText = (alignment) => {
    const currentContent = editorState.getCurrentContent();
    const selection = editorState.getSelection();

    if (selection.getEndOffset() - selection.getStartOffset() === 0) {
      const textWithEntity = Modifier.insertText(currentContent, selection, `[${alignment}]***Enter Text Here***[/${alignment}]`, null);
      onChange(EditorState.push(editorState, textWithEntity, 'insert-characters'));
    }
  };

  const BLOCK_TYPES = [
    { label: 'Huge', style: 'header-one', message: 'Heading Huge' },
    { label: 'Large', style: 'header-two', message: 'Heading Large' },
    { label: 'Medium', style: 'header-three', message: 'Heading Medium' },
    { label: 'Small', style: 'header-four', message: 'Heading Small' },
    // { label: 'H5', style: 'header-five' },
    // { label: 'H6', style: 'header-six' },
    // { label: 'Code Block', style: 'code-block', message: "Code-block" },
    {
      label: 'Left',
      style: '',
      icon: (
        <FormatAlignLeftIcon
          fontSize="small"
          onClick={() => {
            alignText('left');
          }}
        />
      )
    },
    {
      label: 'Center',
      style: '',
      icon: (
        <FormatAlignCenterIcon
          fontSize="small"
          onClick={() => {
            alignText('center');
          }}
        />
      )
    },
    {
      label: 'Right',
      style: '',
      icon: (
        <FormatAlignRightIcon
          fontSize="small"
          onClick={() => {
            alignText('right');
          }}
        />
      )
    },
    {
      label: 'Image',
      icon: (
        <>
          {isUploading ? (
            <Typography variant="subtitle2">Uploading</Typography>
          ) : (
            <>
              <label htmlFor="avatar">
                <IconButton style={{ marginBottom: '2px' }} title="Add picture" size="small" aria-label="upload picture" component="span">
                  <BsFillImageFill size={18} color="black" />
                  <input
                    disabled={isUploading}
                    id="avatar"
                    name="avatar"
                    onChange={handleUploadImage}
                    accept="image/x-png,image/gif,image/jpeg"
                    style={{
                      opacity: '0',
                      position: 'absolute',
                      zIndex: -1
                    }}
                    onClick={(e: any) => (e.target.value = null)}
                    type="file"
                  />
                </IconButton>
              </label>
            </>
          )}
        </>
      ),
      style: ''
    },
    { label: 'Blockquote', icon: <MdFormatQuote className="richTextEditorIcons" />, style: 'blockquote' },
    { label: 'UL', icon: <BsListUl className="richTextEditorIcons" />, style: 'unordered-list-item' },
    { label: 'OL', icon: <BsListOl className="richTextEditorIcons" />, style: 'ordered-list-item' }
  ];
  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          message={type.message ?? ''}
          icon={type.icon}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};
const INLINE_STYLES = [
  { label: 'Bold', icon: <BsTypeBold className="richTextEditorIcons" />, style: 'BOLD' },
  { label: 'Italic', icon: <BsTypeItalic className="richTextEditorIcons" />, style: 'ITALIC' },
  { label: 'Underline', icon: <BsTypeUnderline className="richTextEditorIcons" />, style: 'UNDERLINE' },
  { label: 'Monospace', icon: <VscSymbolNamespace className="richTextEditorIcons" />, style: 'CODE' }
];
const InlineStyleControls = (props) => {
  const currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div className="RichEditor-controls custom-controls">
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
          icon={type.icon}
        />
      ))}
    </div>
  );
};
