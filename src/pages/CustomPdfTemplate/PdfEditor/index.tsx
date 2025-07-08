import { Suspense, useEffect, useRef } from 'react';
import { getPlugins } from './plugin';
import type { Template } from '@pdfme/common';
import type { Designer } from '@pdfme/ui';

interface PdfEditorProps {
  initialTemplate?: any;
  onTemplateChange?: (tpl: Template) => void;
  disabled: boolean;
}

const PdfEditorImpl = ({ initialTemplate, onTemplateChange, disabled }: PdfEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    // dynamically load the Designer class
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

    return () => {
      isMounted = false;
      designerRef.current?.destroy();
      designerRef.current = null;
    };
  }, []);

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

      {disabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(128, 128, 128, 0.3)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            pointerEvents: 'all',
            cursor: 'not-allowed'
          }}
        ></div>
      )}
    </div>
  );
};

const PdfEditor = (props: PdfEditorProps) => (
  <Suspense fallback={<>Loading...</>}>
    <PdfEditorImpl {...props} />
  </Suspense>
);

export default PdfEditor;
