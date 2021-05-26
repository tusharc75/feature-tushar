import React, { useEffect, useRef } from 'react';
import { Editor, RichUtils } from 'draft-js';
import "./RichEditorStyle.scss";
import {
  BsTypeBold,
  BsTypeItalic,
  BsTypeUnderline,
  BsListUl,
  BsListOl
} from "react-icons/bs"
import { MdFormatQuote } from "react-icons/md"
import { VscSymbolNamespace } from "react-icons/vsc"
import { IconButton, Tooltip } from "@material-ui/core"

export function RichTextEditor(props) {
  const { editorState, style, placeholder } = props;
  const editorRef = useRef(null);

  useEffect(() => {
    editorRef.current.focus();
  }, [])

  const onChange = editorState => {
    props.onChange('editorState', editorState);
  };

  const focus = () => editorRef.current.focus();

  const handleKeyCommand = command => {
    const { editorState } = props;
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      onChange(newState);
      return true;
    }
    return false;
  };

  const onTab = e => {
    const maxDepth = 4;
    onChange(RichUtils.onTab(e, props.editorState, maxDepth));
  };
  const toggleBlockType = blockType => {
    onChange(RichUtils.toggleBlockType(props.editorState, blockType));
  };
  const toggleInlineStyle = inlineStyle => {
    onChange(
      RichUtils.toggleInlineStyle(props.editorState, inlineStyle)
    );
  };


  let className = 'RichEditor-editor';
  const contentState = editorState.getCurrentContent();
  if (!contentState.hasText()) {
    if (contentState.getBlockMap().first().getType() !== 'unstyled') {
      className += ' RichEditor-hidePlaceholder';
    }
  }
  return (
    <div className="RichEditor-root" style={style ? { ...style } : null}>
      <div className="container">
        <BlockStyleControls
          editorState={editorState}
          onToggle={toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={toggleInlineStyle}
        />
      </div>
      <div className={className} onClick={focus}>
        <Editor
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
    padding: 2,
  },
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
  const onToggle = e => {
    e.preventDefault();
    props.onToggle(props.style);
  };
  return (
    <span className={className} onMouseDown={onToggle}>
      {
        props.icon ? <Tooltip title={props.label || ''}>
          <IconButton className="richTextEditorIconButton">{props.icon}</IconButton>
        </Tooltip>
          : props.label ? props.label : ""
      }
    </span>
  );
}

const BLOCK_TYPES = [
  { label: 'Huge', style: 'header-one' },
  { label: 'Large', style: 'header-two' },
  { label: 'Medium', style: 'header-three' },
  { label: 'Small', style: 'header-four' },
  // { label: 'H5', style: 'header-five' },
  // { label: 'H6', style: 'header-six' },
  { label: 'Code Block', style: 'code-block' },
  { label: 'Blockquote', icon: <MdFormatQuote className="richTextEditorIcons" />, style: 'blockquote' },
  { label: 'UL', icon: <BsListUl className="richTextEditorIcons" />, style: 'unordered-list-item' },
  { label: 'OL', icon: <BsListOl className="richTextEditorIcons" />, style: 'ordered-list-item' },
];

const BlockStyleControls = props => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map(type =>
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          icon={type.icon}
          onToggle={props.onToggle}
          style={type.style}
        />
      )}
    </div>
  );
};
const INLINE_STYLES = [
  { label: 'Bold', icon: <BsTypeBold className="richTextEditorIcons" />, style: 'BOLD' },
  { label: 'Italic', icon: <BsTypeItalic className="richTextEditorIcons" />, style: 'ITALIC' },
  { label: 'Underline', icon: <BsTypeUnderline className="richTextEditorIcons" />, style: 'UNDERLINE' },
  { label: 'Monospace', icon: <VscSymbolNamespace className="richTextEditorIcons" />, style: 'CODE' },
];
const InlineStyleControls = props => {
  const currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map(type =>
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
          icon={type.icon}
        />
      )}
    </div>
  );
};
