import { Schedule } from '@mui/icons-material';
import { Popover } from '@mui/material';
import React, { FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RemoveFromHistoryButton from 'src/components/Header/SearchBar/RemoveFromHistoryButton';
import { SearchKeyword } from 'src/components/Header/SearchBar/types';
import useSearchHistory from 'src/components/Header/SearchBar/useSearchHistory';

type ChildrenProps = {
  ref: React.MutableRefObject<HTMLElement | HTMLTextAreaElement>;
  onChange: (e?: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, value?: string) => void;
} & Partial<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>>;

type SearchDropDownListProps = {
  children: (props: ChildrenProps) => React.ReactNode;
};

const SearchDropDownList = ({ children }: SearchDropDownListProps) => {
  const inputRef = useRef<HTMLElement | HTMLTextAreaElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [inputValue, setInputValue] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const to = (e.relatedTarget as HTMLElement) || document.activeElement;
    if (popoverRef.current?.contains(to) || to.contains(popoverRef.current)) return;
    setTimeout(() => setAnchorEl(null), 100);
  }, []);

  const handleChange = useCallback((e?: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, value?: string) => {
    const newValue = e?.target.value || value || '';
    setInputValue(newValue);
  }, []);

  return (
    <>
      {children({
        ref: inputRef,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onChange: handleChange
      })}
      <RenderList anchorEl={anchorEl} setAnchorEl={setAnchorEl} inputValue={inputValue} ref={popoverRef} />
    </>
  );
};

export default SearchDropDownList;

type RenderListProps = {
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement>>;
  inputValue: string;
};

const RenderList = React.forwardRef<HTMLDivElement, RenderListProps>(({ anchorEl, setAnchorEl, inputValue }, ref) => {
  const { historyKeywords, handleSetHistoryKeyword, handleRemoveItemFromHistory, handleRemoveKeywordFromHistory } = useSearchHistory();
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeIndexRef = useRef(0);
  const filteredKeywords = useMemo(() => {
    if (inputValue === '') return historyKeywords;
    return historyKeywords.filter((d) => d.keyword.trim().toLowerCase().includes(inputValue.trim().toLowerCase()));
  }, [historyKeywords, inputValue]);

  const rect = useMemo(() => {
    const defaultData = {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0
    };
    return anchorEl?.getBoundingClientRect() || defaultData;
  }, [anchorEl]);

  useEffect(() => {
    handleSetHistoryKeyword(inputValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleClick = useCallback(
    (sel: SearchKeyword) => {
      const input = anchorEl as HTMLInputElement;

      // 1) grab the built-in HTMLInputElement .value setter
      const { set: nativeSetter } = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value') as PropertyDescriptor;
      nativeSetter.call(input, sel.keyword);

      // 3) emit a native input event that bubbles to React's handler
      input.dispatchEvent(new Event('input', { bubbles: true }));
      setAnchorEl(null);
      input.blur();
      setActiveIndex(-1);
      activeIndexRef.current = -1;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [anchorEl]
  );

  useEffect(() => {
    if (!anchorEl) return;
    const handleUpDown = (direction: 'up' | 'down') => {
      setActiveIndex((prev) => {
        let newVal = prev;
        if (direction === 'down') {
          if (prev < historyKeywords.length - 1) {
            newVal += 1;
          }
        } else {
          if (prev > 0) {
            newVal -= 1;
          }
        }
        activeIndexRef.current = newVal;
        return newVal;
      });
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          handleUpDown('up');
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          handleUpDown('down');
          break;
        }
        case 'Enter': {
          const sel = historyKeywords[activeIndexRef.current];
          if (sel) {
            handleClick(sel);
          }
          break;
        }
        default: {
          break;
        }
      }
    };

    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClick, anchorEl, historyKeywords]);

  return (
    <>
      <Popover
        open={Boolean(anchorEl) && filteredKeywords.length > 0}
        anchorEl={filteredKeywords.length > 0 ? anchorEl : null}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableAutoFocus
        disableEnforceFocus
        disableScrollLock
      >
        <div ref={ref}>
          <p className="mt-4 px-4 text-[14px] font-medium leading-[20px] text-gray-500">History</p>
          <ul className="list-none py-2" style={rect.width ? { minWidth: rect.width } : {}}>
            {filteredKeywords.map((d, i) => (
              <li
                key={d.timeStamp}
                className="group flex h-[36px] cursor-pointer list-none items-center justify-between gap-2 px-4 hover:bg-gray-100 data-[active=true]:bg-gray-100 dark:hover:bg-gray-900 dark:data-[active=true]:bg-gray-900"
                data-active={activeIndex === i}
                onClick={() => handleClick(d)}
                onMouseEnter={() => {
                  setActiveIndex(i);
                  activeIndexRef.current = i;
                }}
                onMouseLeave={() => {
                  setActiveIndex(-1);
                  activeIndexRef.current = i;
                }}
              >
                <div className="flex flex-grow items-center gap-3">
                  <Schedule style={{ fontSize: 16 }} />
                  <p className="line-clamp-1 text-[15px] font-medium text-[#232529] dark:text-white">{d.keyword}</p>
                </div>
                <span className="opacity-0 group-hover:opacity-100 group-[.Mui-focusVisible]:opacity-100">
                  <RemoveFromHistoryButton
                    item={d}
                    type="keyword"
                    handleRemoveItemFromHistory={handleRemoveItemFromHistory}
                    handleRemoveKeywordFromHistory={handleRemoveKeywordFromHistory}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Popover>
    </>
  );
});
