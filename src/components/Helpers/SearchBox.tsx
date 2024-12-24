import { Close } from '@mui/icons-material';
import React, { memo, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiSearch } from 'react-icons/fi';
import { cn, DebounceCallBack, debounceCallBack } from 'src/constants/helpers';

type SerachBoxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  width?: string;
  value?: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  fullWidth?: boolean;
};

function SearchBox({ onChange, value, size, width, placeholder, className, containerProps = {}, fullWidth, ...otherProps }: SerachBoxProps) {
  const [inputvalue, setInputValue] = useState<string>(value ?? '');
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
      }, 400);
    }
    const [debouncedTracker, _] = debounceRef.current;
    debouncedTracker(e);
  };

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
        <input
          autoComplete="off"
          id="search-input"
          title={'search'}
          value={inputvalue}
          onChange={onChangeWrapper}
          placeholder={placeholder || 'Search..'}
          type={isMobile || isTablet ? 'text' : 'search'}
          className={cn(
            `small-searchbar h-[32px] w-full min-w-0 flex-grow rounded-[4px] bg-transparent p-[10px_5px_10px_32px] shadow-none outline-transparent [border:1px_solid_var(--common-border-color)] placeholder:text-[#737373] focus-within:[outline:1px_solid_var(--new-theme-color)] focus:[outline:1px_solid_var(--new-theme-color)] dark:bg-[var(--dark-secondary)] dark:text-white sm:min-w-[150px] `,
            className,
            fullWidth ? 'w-full' : 'sm:max-w-[300px]',
            isMobile || isTablet ? 'pr-6' : ''
          )}
          {...otherProps}
        />
        {inputvalue && (
          <span
            className={cn('absolute right-[5px] cursor-pointer [top:50%] [transform:translateY(-50%)]', isMobile || isTablet ? 'block' : 'hidden')}
            onClick={(e) => {
              setInputValue('');
              onChangeWrapper({ ...e, target: { ...e.target, value: '' }, currentTarget: { ...e.currentTarget, value: '' } });
            }}
          >
            <Close className="!text-[18px]" />
          </span>
        )}
      </div>
    </>
  );
}

export default memo(SearchBox);
