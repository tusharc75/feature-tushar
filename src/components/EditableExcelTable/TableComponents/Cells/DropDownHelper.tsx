import { ArrowDropDown } from '@mui/icons-material';
import { CircularProgress, Popper, useAutocomplete, UseAutocompleteProps } from '@mui/material';
import { useRef } from 'react';
import { cn } from 'src/constants/helpers';

type DropDownHelperProps<Option, Multiple extends boolean, DisableClearable extends boolean, FreeSolo extends boolean> = UseAutocompleteProps<
  Option,
  Multiple,
  DisableClearable,
  FreeSolo
>;

const DropDownHelper = <Option, Multiple extends boolean = false, DisableClearable extends boolean = false, FreeSolo extends boolean = false>({
  options,
  loading = false,
  allowPointer,
  inputProps,
  ...props
}: DropDownHelperProps<Option, Multiple, DisableClearable, FreeSolo> & {
  loading?: boolean;
  allowPointer: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { getRootProps, getInputProps, getListboxProps, getOptionProps, groupedOptions, focused } = useAutocomplete({
    options: options,
    getOptionKey: (option) =>
      props.getOptionKey
        ? props.getOptionKey(option)
        : option['_id']
          ? option['_id']
          : option['optionValue']
            ? option['optionValue']
            : option['optionLabel']
              ? option['optionLabel']
              : props.getOptionLabel(option) || '',
    ...props
  });

  const hookInputProps = getInputProps();

  const mergedInputProps = {
    ...hookInputProps,
    ...inputProps,
    // Merge event handlers explicitly so both run
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      hookInputProps.onChange?.(e);
      inputProps?.onChange?.(e);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      hookInputProps.onBlur?.(e);
      inputProps?.onBlur?.(e);
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      hookInputProps.onFocus?.(e);
      inputProps?.onFocus?.(e);
    },
    ref: (node: HTMLInputElement) => {
      if (typeof hookInputProps.ref === 'function') {
        hookInputProps.ref(node);
      } else if (hookInputProps.ref) {
        (hookInputProps.ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
      // if (typeof inputProps?.ref === 'function') {
      //   inputProps.ref(node);
      // } else if (inputProps?.ref) {
      //   (inputProps.ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      // }
      inputRef.current = node;
    }
  };

  return (
    <>
      <div {...getRootProps()} className="absolute inset-0">
        <input
          className={cn(
            'absolute inset-0 min-w-0 bg-transparent  text-sm text-[currentcolor] outline-none',
            allowPointer ? '' : 'pointer-events-none',
            loading ? 'p-[4px_43px_4px_4px]' : 'p-[4px_27px_4px_4px]'
          )}
          placeholder={loading ? 'Loading...' : ''}
          {...mergedInputProps}
        />
        {loading && (
          <span className="absolute right-[25px] top-1/2 [transform:translateY(-50%)]">
            <CircularProgress size={16} />
          </span>
        )}
        <span className="pointer-events-none absolute right-2 top-[50%] [transform:translateY(-50%)]">
          <ArrowDropDown className={cn('transition-transform', focused ? '[transform:rotate(180deg)]' : '')} />
        </span>
      </div>

      <Popper open={groupedOptions.length > 0} anchorEl={inputRef.current}>
        {groupedOptions.length > 0 ? (
          <ul
            {...getListboxProps()}
            className={cn(
              'max-h-[200px] list-none overflow-y-auto border bg-[var(--dark-primary,white)] px-0 py-1',
              '[--selection-bg:theme(colors.blue.50)] dark:[--selection-bg:theme(colors.slate.800)]'
            )}
            ref={(node) => {
              if (node) {
                node.style.width = `${inputRef.current?.clientWidth}px`;
              }
            }}
          >
            {groupedOptions.map((option, index) => {
              const { key, ...optionProps } = getOptionProps({ option, index });
              return (
                <li
                  key={key}
                  {...optionProps}
                  style={{
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                  className="cursor-pointer hover:bg-gray-100 aria-[selected=true]:bg-[var(--selection-bg)] dark:hover:bg-gray-700"
                >
                  {props.getOptionLabel!(option) || ''}
                </li>
              );
            })}
          </ul>
        ) : null}
      </Popper>
    </>
  );
};

export default DropDownHelper;
