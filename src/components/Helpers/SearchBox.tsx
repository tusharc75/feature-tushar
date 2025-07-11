import { Close } from '@mui/icons-material';
import React, { forwardRef, memo, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiSearch } from 'react-icons/fi';
import SearchDropDownList from 'src/components/Header/SearchBar/SearchDropDownList';
import { cn, DebounceCallBack, debounceCallBack } from 'src/constants/helpers';

type SerachBoxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  width?: string;
  value?: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  fullWidth?: boolean;
  debounceTime?: number;
};

function SearchBox(
  { onChange, value, size, width, placeholder, className, containerProps = {}, fullWidth, debounceTime = 400, ...otherProps }: SerachBoxProps,
  ref: any
) {
  const [inputvalue, setInputValue] = useState<string>('');
  const { className: containerClassName, ...restOfContainerProps } = containerProps;
  const debounceRef = useRef<DebounceCallBack>(null);

  const onChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (!value) {
      onChange(e);
      return;
    }
    if (!debounceRef.current) {
      debounceRef.current = debounceCallBack((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
      }, debounceTime);
    }
    const [debouncedTracker] = debounceRef.current;
    debouncedTracker(e);
  };

  useEffect(() => {
    setInputValue(value ? value : '');
  }, [value]);

  return (
    <>
      <div
        className={cn(
          `relative max-h-[32px] min-w-0 flex-shrink flex-grow sm:min-w-[150px]`,
          fullWidth ? 'w-full' : 'sm:max-w-[300px]',
          containerClassName
        )}
        {...restOfContainerProps}
      >
        <FiSearch style={{ color: '#737373' }} className="absolute left-[10px] top-1/2 [transform:translateY(-50%)]" />
        <SearchDropDownList>
          {({ ref: dropDownRef, onChange, ...rest }) => (
            <>
              <input
                autoComplete="off"
                ref={(node) => {
                  if (typeof ref === 'function') {
                    ref(node);
                  } else if (ref) {
                    ref.current = node;
                  }
                  if (node) {
                    dropDownRef.current = node;
                  } else {
                    dropDownRef.current = null;
                  }
                }}
                id="search-input"
                title={'search'}
                value={inputvalue}
                onChange={(e) => {
                  onChangeWrapper(e);
                  onChange(e);
                }}
                placeholder={placeholder || 'Search..'}
                type={'text'}
                className={cn(
                  `small-searchbar h-[32px] w-full min-w-0 flex-grow rounded-[4px] bg-transparent p-[10px_5px_10px_32px] text-[13px] shadow-none outline-transparent [border:1px_solid_var(--common-border-color)] placeholder:text-[#737373] focus-within:[outline:1px_solid_var(--new-theme-color)] focus:[outline:1px_solid_var(--new-theme-color)] dark:bg-[var(--dark-secondary)] dark:text-white sm:min-w-[150px] `,
                  className,
                  fullWidth ? 'w-full' : 'sm:max-w-[300px]',
                  isMobile || isTablet ? 'pr-6' : ''
                )}
                {...otherProps}
                {...rest}
              />
              {inputvalue && (
                <span
                  className={cn('absolute right-[5px] cursor-pointer [top:50%] [transform:translateY(-50%)]')}
                  onClick={(e) => {
                    const payload = Object.assign(e, { target: { ...e.target, value: '' } as any, currentTarget: { ...e.currentTarget, value: '' } });
                    e.stopPropagation();
                    setInputValue('');
                    onChangeWrapper(payload as any);
                    onChange(undefined, '');
                  }}
                >
                  <Close className="!text-[18px]" />
                </span>
              )}
            </>
          )}
        </SearchDropDownList>
      </div>
    </>
  );
}

export default memo(forwardRef<HTMLInputElement, SerachBoxProps>(SearchBox));
