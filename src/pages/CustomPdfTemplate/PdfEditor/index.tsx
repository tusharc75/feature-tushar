import { useEffect, useMemo, useRef, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { getFonts, getPlugins } from './plugin';
import { Template } from '@pdfme/common';

interface PdfEditorProps {
  template?: any;
  onTemplateChange?: (tpl: Template) => void;
  disabled: boolean;
  noOfPages: number;
  variables: any;
}

const PdfEditor = ({ template, onTemplateChange, disabled, noOfPages, variables }: PdfEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerInstanceRef = useRef<Designer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number } | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [fontObjects, setFontObjects] = useState({});

  const plugins = useMemo(() => getPlugins(variables), [variables]);

  useEffect(() => {
    const loadFonts = async () => {
      const loadedFonts = await getFonts();
      setFontObjects(loadedFonts);
      setFontsReady(true);
    };

    loadFonts();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !fontsReady) return;

    if (!designerInstanceRef.current) {
      designerInstanceRef.current = new Designer({
        domContainer: containerRef.current,
        template: template,
        options: {
          zoomLevel: 1,
          sidebarOpen: true,
          font: fontObjects
        },
        plugins: plugins
      });

      designerInstanceRef.current.onChangeTemplate((newTemplate) => {
        if (onTemplateChange) {
          onTemplateChange(newTemplate);
        }
      });
    } else {
      if (template && designerInstanceRef.current.getTemplate() !== template) {
        designerInstanceRef.current.onChangeTemplate(template);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '{') {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const rect = target.getBoundingClientRect?.();
        if (rect) {
          setDropdownPos({ x: rect.left - 75, y: rect.bottom - 250 });
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0).cloneRange());
          }
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown, true);

    return () => {
      container.removeEventListener('keydown', handleKeyDown, true);
      if (designerInstanceRef.current) {
        designerInstanceRef.current.destroy();
        designerInstanceRef.current = null;
      }
    };
  }, [noOfPages, plugins, fontsReady]);

  const handleSelect = (value: string) => {
    if (savedRange) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRange);
      savedRange.deleteContents();
      savedRange.insertNode(document.createTextNode(`{${value}}`));
      savedRange.collapse(false);
    }
    setDropdownPos(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownPos && !(e.target as HTMLElement).closest('[data-variable-dropdown]')) {
        setDropdownPos(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownPos]);

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

      {dropdownPos && (
        <div
          data-variable-dropdown
          style={{
            position: 'absolute',
            top: dropdownPos.y,
            left: dropdownPos.x,
            backgroundColor: 'white',
            border: '1px solid gray',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 10000,
            padding: '4px 0',
            borderRadius: '4px'
          }}
        >
          <div
            style={{
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              width: 200,
              maxHeight: 200,
              overflowY: 'auto'
            }}
          >
            <input
              type="text"
              placeholder="Search variables..."
              value={searchTerm}
              onFocus={(e) => e.stopPropagation()}
              onChange={(e) => setSearchTerm(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '6px 10px',
                boxSizing: 'border-box',
                border: 'none',
                borderBottom: '1px solid #eee',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
            {variables
              .filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((opt) => (
                <div
                  key={opt.value}
                  data-variable-option
                  onClick={(e) => { e.preventDefault(); handleSelect(opt.value); }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    padding: '4px 12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9rem'
                  }}
                >
                  {opt.label}
                </div>
              ))}
          </div>
        </div>
      )}

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
        />
      )}
    </div>
  );
};

export default PdfEditor;