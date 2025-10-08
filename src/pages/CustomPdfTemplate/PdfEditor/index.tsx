import { useEffect, useMemo, useRef, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { getFonts, getPlugins } from './plugin';
import { Template } from '@pdfme/common';
import { PLUGIN } from 'src/constants/helpers';
import { Autocomplete, TextField } from '@mui/material';
interface PdfEditorProps {
  template?: any;
  onTemplateChange?: (tpl: Template) => void;
  disabled: boolean;
  noOfPages: number;
  variables: any;
  resourceTables: any;
}

const PdfEditor = ({ template, onTemplateChange, disabled, noOfPages, variables, resourceTables }: PdfEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerInstanceRef = useRef<Designer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number } | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [fontObjects, setFontObjects] = useState({});
  const activeInputRef = useRef<EventTarget | null>(null);
  const plugins = useMemo(() => getPlugins(variables, resourceTables), [variables, resourceTables]);

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
      if (template) {
        designerInstanceRef.current.updateTemplate(template);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '{') {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const rect = target.getBoundingClientRect?.();
        if (rect) {
          setDropdownPos({ x: rect.left - 75, y: rect.bottom - 250 });
          const sel = window.getSelection();
          const activeGrid = sel?.anchorNode?.parentElement?.closest(`[plugin-type=${PLUGIN.CUSTOM_TABLE}]`);
          if (activeGrid) {
            activeInputRef.current = e.target;
          }
          else {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              setSavedRange(selection.getRangeAt(0).cloneRange());
            }
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
    if (activeInputRef.current !== null) {
      const event = new CustomEvent('insert-variable', {
        detail: { value: `{${value}}` },
        bubbles: true,
        cancelable: true,
      });
      activeInputRef.current.dispatchEvent(event);
      activeInputRef.current = null;
    }
    else if (savedRange) {
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
    <div className="relative h-screen w-full">
      <div ref={containerRef} className="h-full w-full relative overflow-hidden" />
      {dropdownPos && (
        <div
          className="absolute z-[10000] bg-white border border-gray-300 shadow-lg rounded-md"
          data-variable-dropdown
          style={{ top: dropdownPos.y, left: dropdownPos.x }}
        >
          <div className="bg-white border border-gray-200 rounded-md shadow-md w-80 p-2">
            <Autocomplete
              disablePortal
              options={variables}
              fullWidth
              getOptionLabel={(option: any) => option.label}
              onChange={(event, newValue) => {
                if (newValue) {
                  handleSelect(newValue?.value);
                }
              }}
              onMouseDown={(e) => e.preventDefault()}
              renderInput={(params) => <TextField
                {...params}
                size='small'
                onMouseDown={(e) => e.preventDefault()}
                label="Variables"
              />}
            />
          </div>
        </div>
      )}

      {disabled && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-30 z-[9999] flex justify-center items-center text-white text-lg font-bold pointer-events-auto cursor-not-allowed" />
      )}
    </div>
  );
};

export default PdfEditor;
