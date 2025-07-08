import type { Template } from '@pdfme/common';
import type { Designer, Viewer } from '@pdfme/ui';
import { Suspense, useEffect, useRef } from 'react';
import { getPlugins } from './plugin';

interface PdfEditorProps {
  initialTemplate?: any;
  onTemplateChange?: (tpl: Template) => void;
  disabled: boolean;
}

const PdfEditorImpl = ({ initialTemplate, onTemplateChange, disabled }: PdfEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer>(null);
  const viewerRef = useRef<Viewer>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;
    // dynamically load the Designer class
    if (!disabled) {
      viewerRef.current?.destroy();
      viewerRef.current = null;
      import('@pdfme/ui').then(({ Designer }) => {
        if (!isMounted) return;
        designerRef.current = new Designer({
          domContainer: containerRef.current!,
          template: initialTemplate,
          options: { zoomLevel: 1, sidebarOpen: true },
          plugins: getPlugins()
        });
        designerRef.current.onChangeTemplate((newTpl: Template) => {
          onTemplateChange?.(newTpl);
        });
      });
    }

    return () => {
      isMounted = false;
      designerRef.current?.destroy();
      designerRef.current = null;
    };
  }, [disabled]);

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;
    if (disabled) {
      designerRef.current?.destroy();
      designerRef.current = null;
      import('@pdfme/ui').then(({ Viewer }) => {
        if (!isMounted) return;
        const inputsForPreview = initialTemplate?.schemas?.map((pageSchema) => {
          const pageInput = {};
          pageSchema.forEach((field) => {
            if (field.name && field.content !== undefined) {
              pageInput[field.name] = field.content;
            }
          });
          return pageInput;
        });
        const finalInputs = inputsForPreview?.length > 0 ? inputsForPreview : [{}];
        viewerRef.current = new Viewer({
          domContainer: containerRef.current!,
          template: initialTemplate,
          inputs: finalInputs,
          plugins: getPlugins()
        });
      });
    }
    return () => {
      isMounted = false;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [initialTemplate, disabled]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <div
        ref={containerRef}
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

const PdfEditor = (props: PdfEditorProps) => (
  <Suspense fallback={<>Loading...</>}>
    <PdfEditorImpl {...props} />
  </Suspense>
);

export default PdfEditor;
