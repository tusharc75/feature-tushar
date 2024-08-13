import { Close } from '@material-ui/icons';
import React, { memo, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiSearch } from 'react-icons/fi';
import { cn } from 'src/constants/helpers';
import { useDebounce } from 'src/hooks';

type SerachBoxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  width?: string;
  value: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
};

function SearchBox({ onChange, value, size, width, placeholder, className, containerProps = {}, ...otherProps }: SerachBoxProps) {
  const [inputvalue, setInputValue] = useState<string>(value ?? '');
  const [event, setEvent] = useState<React.ChangeEvent<HTMLInputElement>>();
  const { className: containerClassName, ...restOfContainerProps } = containerProps;
  const debouncedEvent = useDebounce(event, 800);

  const onChangeWrapper = (e) => {
    setInputValue(e.target.value);
    setEvent(e);
  };

  useEffect(() => {
    if (debouncedEvent) {
      onChange(debouncedEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedEvent]);

  return (
    <>
      <div
        className={`relative max-h-[32px] min-w-0 flex-shrink flex-grow sm:min-w-[150px] sm:max-w-[300px] ${containerClassName}`}
        {...restOfContainerProps}
      >
        <FiSearch style={{ color: '#737373' }} className="absolute left-[10px] top-1/2 [transform:translateY(-50%)]" />
        <input
          id="search-input"
          title={'search'}
          value={inputvalue}
          onChange={onChangeWrapper}
          placeholder={placeholder || 'Search..'}
          type={isMobile || isTablet ? 'text' : 'search'}
          className={cn(
            `small-searchbar h-[32px] w-full min-w-0 flex-grow rounded-[4px] bg-transparent p-[10px_5px_10px_32px] shadow-none outline-transparent [border:1px_solid_var(--common-border-color)] placeholder:text-[#737373] focus-within:[outline:1px_solid_var(--new-theme-color)] focus:[outline:1px_solid_var(--new-theme-color)] dark:bg-[var(--dark-secondary)] dark:text-white sm:min-w-[150px] sm:max-w-[300px]`,
            className,
            isMobile || isTablet ? 'pr-6' : ''
          )}
          {...otherProps}
        />
        {value && (
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
