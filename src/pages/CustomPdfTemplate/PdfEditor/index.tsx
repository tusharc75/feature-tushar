import { useEffect, useMemo, useRef, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { getFonts, getPlugins } from './plugin';
import { Template } from '@pdfme/common';
import { PLUGIN } from 'src/constants/helpers';
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
  const prevTemplateRef = useRef<Template | undefined>(template);
  const [isTableFieldFocused, setIsTableFieldFocused] = useState(false);
  const [selectedMultiValues, setSelectedMultiValues] = useState<string[]>([]);

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
    const designer = designerInstanceRef.current;
    const prevTemplate = prevTemplateRef.current;

    if (designer && template && prevTemplate && JSON.stringify(template) !== JSON.stringify(prevTemplate)) {
      const prevSchemas = prevTemplate.schemas[0] || {};
      const newSchemas = template.schemas[0] || {};
      const prevKeys = Object.keys(prevSchemas);
      const newKeys = Object.keys(newSchemas);

      const isStructuralChange = prevKeys.length !== newKeys.length;

      if (isStructuralChange) {
        designer.destroy();
        designerInstanceRef.current = new Designer({
          domContainer: containerRef.current,
          template: template,
          options: { zoomLevel: 1, sidebarOpen: true, font: fontObjects },
          plugins: plugins,
        });
        designerInstanceRef.current.onChangeTemplate((newTemplate: Template) => {
          if (onTemplateChange) {
            onTemplateChange(newTemplate);
          }
        });
      } else {
        designer.updateTemplate(template);
      }
    }

    prevTemplateRef.current = template;

  }, [template]);

  const insertText = (text: string) => {
    if (activeInputRef.current !== null) {
      const event = new CustomEvent('insert-variable', {
        detail: { value: text },
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
      savedRange.insertNode(document.createTextNode(text));
      savedRange.collapse(false);
    }
  };

  const closeDropdown = () => {
    setDropdownPos(null);
    setSelectedMultiValues([]);
    setSearchTerm('');
    setIsTableFieldFocused(false);
  };


  useEffect(() => {
    if (!containerRef.current || !fontsReady || designerInstanceRef.current) return;

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

    designerInstanceRef.current.onChangeTemplate((newTemplate: Template) => {
      if (onTemplateChange) {
        onTemplateChange(newTemplate);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdown();
      }
      if (e.key === '{') {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const textField = target.closest<HTMLElement>('[id^="text-"]');
        if (textField && textField.id === 'text-undefined') {
          setIsTableFieldFocused(true);
        }
        const rect = target.getBoundingClientRect?.();
        if (rect) {
          setSelectedMultiValues([]);
          setSearchTerm('');

          setDropdownPos({ x: rect.left - 75, y: rect.bottom - 250 });
          const sel = window.getSelection();
          const activeGrid = sel?.anchorNode?.parentElement?.closest(`[plugin-type=${PLUGIN.CUSTOM_TABLE}]`);
          if (activeGrid) {
            activeInputRef.current = e.target;
          } else {
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

  const handleVariableClick = (value: string) => {
    if (isTableFieldFocused) {
      setSelectedMultiValues(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      );
    } else {
      insertText(`{${value}}`);
      closeDropdown();
    }
  };

  const handleInsertMulti = () => {
    if (selectedMultiValues.length > 0) {
      const textToInsert = `{${selectedMultiValues.join(' || ')}}`;
      insertText(textToInsert);
    }
    closeDropdown();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownPos && !(e.target as HTMLElement).closest('[data-variable-dropdown]')) {
        closeDropdown();
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
          <div className="bg-white border border-gray-200 rounded-md shadow-md w-60 max-h-96 flex flex-col">
            <div className="p-2 flex items-center gap-2 border-b sticky top-0 bg-white">
              <input
                className="flex-grow p-2 rounded-md outline-none text-sm bg-white border border-gray-300"
                type="text"
                placeholder="Search variables..."
                value={searchTerm}
                onFocus={(e) => e.stopPropagation()}
                onChange={(e) => setSearchTerm(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              {selectedMultiValues.length > 0 && <>OR</>}
            </div>

            <div className="max-h-52 overflow-y-auto">
              {variables
                .filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((opt) => {
                  const isSelected = isTableFieldFocused && selectedMultiValues.includes(opt.value);
                  return (
                    <div
                      className={`p-2 text-sm hover:bg-gray-100 cursor-pointer whitespace-nowrap ${isSelected ? 'bg-blue-100' : ''}`}
                      key={opt.value}
                      title={opt.label}
                      data-variable-option
                      onClick={(e) => { e.preventDefault(); handleVariableClick(opt.value); }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {opt.label}
                    </div>
                  );
                })}
            </div>

            {isTableFieldFocused && (
              <div className="p-2 border-t">
                <button
                  className="w-full bg-blue-500 text-white text-sm p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                  onClick={handleInsertMulti}
                  disabled={selectedMultiValues.length === 0}
                >
                  Selected ({selectedMultiValues.length})
                </button>
              </div>
            )}
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