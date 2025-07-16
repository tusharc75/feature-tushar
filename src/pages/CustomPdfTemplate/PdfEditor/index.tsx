import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { getPlugins } from './plugin';
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
 
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number } | null>(null);
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
 
  const plugins = useMemo(() => getPlugins(variables), [variables]);
 
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
        const target = e.target as HTMLElement;
        const rect = target.getBoundingClientRect?.();
        if (rect) {
          setDropdownPos({ x: rect.left - 80, y: rect.bottom - 250 });
          setActiveElement(target);
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
  }, [noOfPages]);
 
  const handleSelect = (value: string) => {
    if (activeElement) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
 
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(`${value}}`));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
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
          overflow: 'hidden',
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
            borderRadius: '4px',
          }}
        >
          {variables.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                padding: '4px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem',
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {opt.label}
            </div>
          ))}
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
            cursor: 'not-allowed',
          }}
        />
      )}
    </div>
  );
};
 
export default PdfEditor;