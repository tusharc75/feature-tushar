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
    <div className="relative h-screen w-full">
      <div ref={containerRef} className="h-full w-full relative overflow-hidden" />
      {dropdownPos && (
        <div
          className="absolute z-[10000] bg-white border border-gray-300 shadow-lg rounded-md"
          data-variable-dropdown
          style={{ top: dropdownPos.y, left: dropdownPos.x }}
        >
          <div className="bg-white border border-gray-200 rounded-md shadow-md w-52 max-h-82 ">
            <input
              className="sticky top-0 w-full p-2 rounded-md outline-none text-sm bg-white border border-gray-300"
              type="text"
              placeholder="Search variables..."
              value={searchTerm}
              onFocus={(e) => e.stopPropagation()}
              onChange={(e) => setSearchTerm(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="bg-white border border-gray-200 rounded-md shadow-md w-52 max-h-52 overflow-y-auto">
              {variables
                .filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((opt) => (
                  <div
                    className="p-2 text-sm hover:bg-gray-100 cursor-pointer whitespace-nowrap"
                    key={opt.value}
                    title={opt.label}
                    data-variable-option
                    onClick={(e) => { e.preventDefault(); handleSelect(opt.value); }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {opt.label}
                  </div>
                ))}
            </div>
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