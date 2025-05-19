import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { EditorProvider, useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import LeftSidebar from 'src/pages/WorkOrder/Diagram/ImageEditor/LeftSidebar';
import RightSidebar from 'src/pages/WorkOrder/Diagram/ImageEditor/RightSidebar';
import TUIImageEditor from 'tui-image-editor';

type EditorProps = {
  imageUrl: string;
  imageName: string;
  maxWidth: number;
  maxHeight: number;
};

export type EditorRef = {
  getInstance: () => TUIImageEditor;
};

export const validShapes = ['rect', 'circle', 'triangle'];

const EditorImpl = forwardRef<EditorRef, EditorProps>(({ imageUrl, imageName, maxHeight, maxWidth }, ref) => {
  const rootEl = useRef<HTMLDivElement>(null);
  const [editorInst, setInstance] = useState<TUIImageEditor | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_shape, setStore] = useEditorStore((state) => state.currentSelectedShapeType);

  useEffect(() => {
    let imageEditor: TUIImageEditor;
    if (rootEl.current) {
      imageEditor = new TUIImageEditor(rootEl.current, {
        cssMaxWidth: maxWidth,
        cssMaxHeight: maxHeight,
        selectionStyle: {
          cornerSize: 20,
          rotatingPointOffset: 70
        }
      });
      setInstance(imageEditor);
      imageEditor.loadImageFromURL(imageUrl, imageName).then((data, ...rest) => {
        // imageEditor.resizeCanvasDimension({ width: data.newWidth, height: data.newHeight });
        imageEditor?.clearUndoStack?.();
      });

      imageEditor.on('undoStackChanged', (undoStackLength) => {
        setStore({ undoStackLength });
      });
      imageEditor.on('redoStackChanged', (redoStackLength) => {
        setStore({ redoStackLength });
      });
      imageEditor.on('addText', (pos, ...rest) => {
        setStore({ newTextPosition: pos.originPosition });
      });
      imageEditor.on('click', (...args) => {
      });
      imageEditor.on('objectActivated', (obj) => {
        if (!obj) {
          setStore({ activeObjectId: null, currentSelectedShapeType: null, newTextPosition: null });
        } else {
          setStore({ activeObjectId: obj.id });
          if (validShapes.includes(obj.type)) {
            setStore({ currentSelectedShapeType: obj.type, newTextPosition: null });
          } else if (obj.type && obj.type === 'i-text') {
            setStore({ currentSelectedShapeType: obj.type, newTextPosition: null });
          } else {
            setStore({ currentSelectedShapeType: null, newTextPosition: null });
          }
        }
      });
    }
    return () => {
      imageEditor?.destroy();
      setInstance(null);
    };
  }, [imageUrl, imageName, maxWidth, maxHeight]);

  const getInstance = useCallback(() => {
    return editorInst;
  }, [editorInst]);

  useImperativeHandle(ref, () => ({
    getInstance
  }));

  return (
    <div style={{ width: maxWidth, height: maxHeight }} className="relative">
      <div ref={rootEl} style={{ width: maxWidth, height: maxHeight }} className="tui-image-editor flex items-center justify-center"></div>
      {editorInst && <LeftSidebar imageEditor={editorInst} />}
      {editorInst && <RightSidebar imageEditor={editorInst} />}
    </div>
  );
});

const Editor = forwardRef<EditorRef, EditorProps>((props, ref) => (
  <EditorProvider>
    <EditorImpl {...props} ref={ref} />
  </EditorProvider>
));

export default Editor;
