import React, { memo, useState } from 'react';
// import { Search } from '@material-ui/icons';
// import PropTypes from 'prop-types';
// import { isMobile, isTablet } from 'react-device-detect';
import { debounce } from 'lodash';
import { FiSearch } from 'react-icons/fi';

type SerachBoxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  width?: string;
  value: string;
};

function SearchBox({ onChange, value, size, width, placeholder, className, ...otherProps }: SerachBoxProps) {
  const [inputvalue, setInputValue] = useState<string>(value ?? '');

  const debouncedInputDispatch = debounce((e) => {
    onChange(e);
  }, 1000);

  const onChangeWrapper = (e) => {
    setInputValue(e.target.value);
    debouncedInputDispatch(e);
  };

  return (
    <>
      <div className="relative sm:max-w-[300px] sm:min-w-[200px] flex-grow max-h-[32px]">
        <FiSearch style={{ color: '#737373' }} className="absolute top-1/2 [transform:translateY(-50%)] left-[10px]" />
        <input
          title={'search'}
          value={inputvalue}
          onChange={onChangeWrapper}
          placeholder={placeholder || 'Search..'}
          type={'search'}
          className={`${className} sm:max-w-[300px] sm:min-w-[200px] w-full flex-grow small-searchbar bg-transparent dark:bg-[var(--dark-secondary)] shadow-none [border:1px_solid_var(--common-border-color)] focus:[outline:1px_solid_var(--new-theme-color)] focus-within:[outline:1px_solid_var(--new-theme-color)] dark:text-white outline-transparent rounded-[4px] placeholder:text-[#737373] h-[32px] p-[10px_5px_10px_32px] `}
          {...otherProps}
        />
      </div>
    </>
  );
}

export default memo(SearchBox);
