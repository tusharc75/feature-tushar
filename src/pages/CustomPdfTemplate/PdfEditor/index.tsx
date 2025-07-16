import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { getPlugins } from './plugin';
import { Template } from '@pdfme/common';
import { Autocomplete, TextField } from '@mui/material';

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
  const savedRangeRef = useRef<Range | null>(null);

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
        e.preventDefault();
        const target = e.target as HTMLElement;
        const rect = target.getBoundingClientRect?.();
        if (rect) {
          setDropdownPos({ x: rect.left - 80, y: rect.bottom - 200 });
          setActiveElement(target);
        }
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          savedRangeRef.current = selection.getRangeAt(0).cloneRange();
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
    const variableTag = `{${value}}`;
    const range = savedRangeRef.current;
    if (range) {
      range.deleteContents();
      range.insertNode(document.createTextNode(variableTag));
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      const activeEl = activeElement;
      if (activeEl) {
        const event = new Event('input', { bubbles: true });
        activeEl.dispatchEvent(event);
      }
      setDropdownPos(null);
      savedRangeRef.current = null;
    } else {
      console.warn('No saved range to insert variable');
    }
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
          <Autocomplete
            disablePortal
            options={variables}
            getOptionLabel={(option: { label: string; value: string }) => option.label}
            onChange={(_, value) => { handleSelect(value.value) }}
            renderInput={(params) => <TextField {...params} label="Select a movie" variant="outlined" />}
            style={{ width: 300 }}
          />
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