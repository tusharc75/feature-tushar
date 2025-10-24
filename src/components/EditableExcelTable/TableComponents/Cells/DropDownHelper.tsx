import { ArrowDropDown, Close } from '@mui/icons-material';
import { CircularProgress, Popper, useAutocomplete, UseAutocompleteProps } from '@mui/material';
import { useCallback, useRef } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const getOptionKey = useCallback(
    (option: Option) => {
      return props.getOptionKey
        ? props.getOptionKey(option)
        : option['_id']
          ? option['_id']
          : option['optionValue']
            ? option['optionValue']
            : option['optionLabel']
              ? option['optionLabel']
              : props.getOptionLabel(option) || '';
    },
    [props]
  );

  const { getRootProps, getInputProps, getListboxProps, getOptionProps, groupedOptions, focused, value, getTagProps } = useAutocomplete({
    options: options,
    getOptionKey: getOptionKey,
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
    }
  };

  const handleRemoveItem = useCallback(
    (option: Option) => {
      const key = getOptionKey(option);
      return (value as Option[]).filter((d) => getOptionKey(d) !== key);
    },
    [getOptionKey, value]
  );

  return (
    <>
      <div {...getRootProps()} className="absolute inset-0 flex overflow-hidden" ref={containerRef}>
        {props.multiple && (
          <div>
            {(value as Option[]).length > 0 && (
              <HtmlTooltip
                title={
                  <div className="p-2">
                    <ul className="flex list-none flex-wrap gap-2">
                      {(value as Option[])?.map((option, index) => {
                        const { key, ...itemProps } = getTagProps({ index });
                        return (
                          <li
                            key={key}
                            {...itemProps}
                            className="no-inherit flex max-w-fit items-center gap-1 rounded-full bg-slate-700 px-2 py-1 text-sm text-white dark:bg-[var(--dark-secondary)]"
                          >
                            {props.getOptionLabel!(option)}
                            <RippleButton
                              className="rounded-full bg-slate-500"
                              onClick={(e) => {
                                (props.onChange as any)?.(e as any, handleRemoveItem(option));
                              }}
                            >
                              <Close className="!size-[16px] text-white" />
                            </RippleButton>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                }
              >
                <p className="no-inherit pl-2 pt-2 text-xs">{(value as Option[]).length}&nbsp;item(s)</p>
              </HtmlTooltip>
            )}
          </div>
        )}
        <input
          className={cn(
            'h-full w-full min-w-0 bg-transparent  text-sm text-[currentcolor] outline-none',
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

      <Popper open={groupedOptions.length > 0} anchorEl={containerRef.current}>
        {groupedOptions.length > 0 ? (
          <ul
            {...getListboxProps()}
            className={cn(
              'max-h-[200px] list-none overflow-y-auto border bg-[var(--dark-primary,white)] px-0 py-1',
              '[--selection-bg:theme(colors.blue.50)] dark:[--selection-bg:theme(colors.slate.800)]'
            )}
            ref={(node) => {
              if (node) {
                node.style.width = `${containerRef.current?.clientWidth}px`;
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
