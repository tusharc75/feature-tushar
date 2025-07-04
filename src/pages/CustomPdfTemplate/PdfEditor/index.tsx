import { useEffect, useRef } from 'react';
import { Designer } from '@pdfme/ui';
import { getPlugins } from './plugin';
import { Template } from '@pdfme/common';

interface PdfEditorProps {
  template?: any;
  onTemplateChange?: (tpl: Template) => void;
  disabled: boolean;
}

const PdfEditor = ({ template, onTemplateChange, disabled }: PdfEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerInstanceRef = useRef<Designer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!designerInstanceRef.current) {
      designerInstanceRef.current = new Designer({
        domContainer: containerRef.current,
        template: template,
        options: {
          zoomLevel: 1,
          sidebarOpen: true
        },
        plugins: getPlugins()
      });

      designerInstanceRef.current.onChangeTemplate((newTemplate) => {
        if (onTemplateChange) {
          onTemplateChange(newTemplate);
        }
      });
    }

    return () => {
      if (designerInstanceRef.current) {
        designerInstanceRef.current.destroy();
        designerInstanceRef.current = null;
      }
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
          overflow: 'hidden',
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
            cursor: 'not-allowed',
          }}
        >
        </div>
      )}
    </div>
  );
};

export default PdfEditor;
