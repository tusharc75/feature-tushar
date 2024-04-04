import React, { memo, useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
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
        className={`relative sm:max-w-[300px] sm:min-w-[150px] min-w-0 flex-grow flex-shrink max-h-[32px] ${containerClassName}`}
        {...restOfContainerProps}
      >
        <FiSearch style={{ color: '#737373' }} className="absolute top-1/2 [transform:translateY(-50%)] left-[10px]" />
        <input
          title={'search'}
          value={inputvalue}
          onChange={onChangeWrapper}
          placeholder={placeholder || 'Search..'}
          type={'search'}
          className={`${className} sm:max-w-[300px] sm:min-w-[150px] min-w-0 w-full flex-grow small-searchbar bg-transparent dark:bg-[var(--dark-secondary)] shadow-none [border:1px_solid_var(--common-border-color)] focus:[outline:1px_solid_var(--new-theme-color)] focus-within:[outline:1px_solid_var(--new-theme-color)] dark:text-white outline-transparent rounded-[4px] placeholder:text-[#737373] h-[32px] p-[10px_5px_10px_32px] `}
          {...otherProps}
        />
      </div>
    </>
  );
}

export default memo(SearchBox);
