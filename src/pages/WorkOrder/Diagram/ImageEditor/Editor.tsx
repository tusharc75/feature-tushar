import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useEditorStore } from 'src/pages/WorkOrder/Diagram/ImageEditor/EditorStore';
import LeftSidebar from 'src/pages/WorkOrder/Diagram/ImageEditor/LeftSidebar';
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

const validShapes = ['rect', 'circle', 'triangle', 'icon', 'text'];

const Editor = forwardRef<EditorRef, EditorProps>(({ imageUrl, imageName, maxHeight, maxWidth }, ref) => {
  const rootEl = useRef<HTMLDivElement>(null);
  const [editorInst, setInstance] = useState<TUIImageEditor | null>(null);
  const [_, setStore] = useEditorStore((state) => state.undoStackLength);

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
      imageEditor.on('addText', (pos) => {
        imageEditor.addText('Double Click', {
          position: pos.originPosition
        });
      });
      imageEditor.on('objectActivated', (obj) => {
        setStore({ activeObject: obj.id });
        if (validShapes.includes(obj.type)) {
          setStore({ currentSelectedShapeType: obj.type });
        } else {
          setStore({ currentSelectedShapeType: null });
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
    </div>
  );
});

export default Editor;
