import { CalendarToday } from '@mui/icons-material';
import { Autocomplete, AutocompleteProps, Popover, TextField } from '@mui/material';
import { DateView } from '@mui/x-date-pickers';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import dayjs from 'dayjs';
import { find, isEqual } from 'lodash';
import MuiPhoneInput from 'material-ui-phone-number';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import DataList from 'src/components/CustomReactTable/TableComponents/DataList';
import { getCellValue } from 'src/components/CustomReactTable/utils';
import CurrencyAutocomplete from 'src/components/Helpers/CurrencyAutocomplete';
import { cn, dateFormat, dateTimeFormat, getUniqueCurrencies } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import * as yup from 'yup';
import { ValidateOptions } from 'yup/lib/types';

type YupSchema = Partial<yup.AnySchema> & { isValid: (value: any, options?: ValidateOptions<any>) => Promise<boolean> };

const validInputs = new Set([
  'singleLine',
  'multiLine',
  'email',
  'mobileNumber',
  'dropDown',
  'multiSelect',
  'date',
  'year',
  'dateTime',
  'number',
  'decimal',
  'currencyNumber',
  'percent',
  'radio',
  'name',
  'colorPicker',
  'url',
  'currency',
  'currencyAmount'
] as const);

const inputArray = Array.from(validInputs);

export type ValidInputType = (typeof inputArray)[number];

type InputProps = {
  columnDef: any;
  cell: any;
  row: any;
  cellValue: any;
  setCellValue: any;
  handleStopEditing: () => void;
  handleSubmit: () => void;
  validationSchema?: YupSchema;
};

const RenderTextInput = ({
  columnDef,
  row,
  cell,
  cellValue,
  setCellValue,
  handleSubmit,
  handleStopEditing,
  validationSchema,
  prefixIcon,
  suffixIcon,
  type = 'text',
  ...rest
}: InputProps & Partial<React.InputHTMLAttributes<HTMLInputElement>> & { prefixIcon?: React.ReactNode; suffixIcon?: React.ReactNode }) => {
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const invisibleContainerRef = useRef<HTMLDivElement>(null);

  const handleBlur = async () => {
    handleStopEditing();
    if (!isValid) return;

    if (getCellValue(cell) !== cellValue) {
      handleSubmit();
    }
  };

  const handleInput = async (value: string | number) => {
    setCellValue(value);
    const isValidValue = await validationSchema?.isValid?.(value);
    setIsValid(isValidValue);
  };

  return (
    <div
      className={cn(
        'shadow-0 relative flex w-full appearance-none items-center justify-start gap-1 rounded-md border bg-[transparent] px-[2px] py-[4px] outline-none focus-within:border-2 focus-within:border-theme dark:text-[white]',
        isValid ? '' : '!border-red-500 '
      )}
      onClick={() => {
        inputRef.current?.focus();
        if (type === 'color') {
          inputRef.current?.click();
        }
      }}
    >
      <div className="pointer-events-none absolute -z-10 opacity-0" ref={invisibleContainerRef}>
        {cellValue}
      </div>
      {prefixIcon}
      <input
        autoComplete="off"
        ref={inputRef}
        autoFocus
        id={`${cell.column.id}-input-${row.index || 0}`}
        type={type}
        className={cn(
          'hide-number-input-arrow min-w-0 flex-shrink flex-grow border-none bg-transparent px-[2px] py-[1px] text-inherit outline-none',
          type === 'color' ? 'cursor-pointer' : ''
        )}
        onBlur={() => handleBlur()}
        value={cellValue}
        onKeyDown={(e) => {
          const target = e.target as HTMLInputElement;
          if (e.key === 'Enter') {
            e.preventDefault();
            target.blur();
          }
        }}
        onChange={(e) => {
          let value: string | number = e.target.value;
          if (type === 'number' && value) {
            value = Number(value);
          }
          handleInput(value || '');
        }}
        {...rest}
      />
      {type === 'color' && <p>{cellValue}</p>}
      {suffixIcon}
    </div>
  );
};

const PhoneNumberInput = ({ cell, cellValue, columnDef, handleStopEditing, handleSubmit, row, setCellValue, validationSchema }: InputProps) => {
  const [isValid, setIsValid] = useState(true);

  const handleBlur = async () => {
    handleStopEditing();
    if (!isValid) return;

    if (getCellValue(cell) !== cellValue) {
      handleSubmit();
    }
  };

  const handleInput = async (val: string) => {
    const isValidValue = await validationSchema?.isValid?.(val);
    setIsValid(isValidValue);
    setCellValue(val);
  };

  return (
    <MuiPhoneInput
      defaultCountry={'us'}
      disableAreaCodes
      countryCodeEditable
      variant="outlined"
      fullWidth
      label={'Value'}
      onKeyDown={(e) => {
        const target = e.target as HTMLInputElement;
        if (e.key === 'Enter') {
          e.preventDefault();
          target.blur();
        }
      }}
      slotProps={{
        input: {
          autoComplete: 'off'
        }
      }}
      name={'value'}
      required
      margin="dense"
      size="small"
      value={cellValue}
      onChange={(val) => {
        handleInput(val);
      }}
      onBlur={handleBlur}
      error={!isValid}
    />
  );
};

const DropdownMultiSelectAndRadio = ({
  cell,
  cellValue,
  columnDef,
  handleStopEditing,
  handleSubmit,
  row,
  setCellValue,
  validationSchema
}: InputProps & Partial<AutocompleteProps<any, any, any, any>>) => {
  const [isValid, setIsValid] = useState(true);
  const [options, setOptions] = useState<any[]>();

  useEffect(() => {
    if (columnDef.lookup) {
      const lookupResource = columnDef.lookupResource === 'Quote' ? 'quoteBuilder' : columnDef.lookupResource;
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
        .then(({ data: { data } }) => {
          setOptions(data[lookupResource] || []);
        })
        .catch((error) => {
          console.error(error);
          setOptions([]);
        });
    } else {
      setOptions(columnDef?.option || []);
    }
  }, [columnDef]);

  const handleBlur = async () => {
    handleStopEditing();
    if (!isValid) return;
    if (
      (columnDef?.type === 'multiSelect' && !isEqual(getCellValue(cell), cellValue)) ||
      (['dropDown', 'radio'].includes(columnDef?.type) && getCellValue(cell) !== cellValue)
    ) {
      handleSubmit();
    }
  };

  const value = useMemo(() => {
    const emptyValue = { optionLabel: '', optionValue: '' };
    if (columnDef.type === 'multiSelect') {
      return options?.filter((d) => cellValue?.includes(d.optionValue)) || emptyValue;
    }
    return options?.find((d) => d.optionValue === cellValue) || emptyValue;
  }, [cellValue, options, columnDef]);

  const handleInput = async (value: string | string[]) => {
    const isValidValue = await validationSchema?.isValid?.(value);
    setIsValid(isValidValue);
    setCellValue(value);
  };

  return (
    <Autocomplete
      fullWidth
      loading={!options}
      multiple={columnDef?.type === 'multiSelect'}
      disableCloseOnSelect
      limitTags={2}
      onKeyDown={(e) => {
        const target = e.target as HTMLInputElement;
        if (e.key === 'Enter') {
          e.preventDefault();
          target.blur();
        }
      }}
      {...(columnDef?.type === 'multiSelect' ? { limitTags: 1 } : {})}
      size={'small'}
      selectOnFocus
      options={options ? options : []}
      getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
      value={value}
      onChange={(e, val) => {
        if (columnDef.type === 'multiSelect') {
          handleInput(val ? val?.map((v) => v?.optionValue) : []);
        } else {
          handleInput(val?.optionValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          id={`${cell.column.id}-input-${row.index || 0}`}
          autoFocus
          onBlur={() => {
            handleBlur();
          }}
        />
      )}
    />
  );
};

const DataListWrapper = ({ cell, cellValue, columnDef, handleStopEditing, handleSubmit, row, setCellValue, validationSchema }: InputProps) => {
  const handleBlur = async () => {
    handleStopEditing();

    const isValid = await validationSchema?.isValid?.(cellValue);
    if (!isValid) return;

    if (getCellValue(cell) !== cellValue) {
      handleSubmit();
    }
  };

  return <DataList columnDef={columnDef} cellValue={cellValue} setCellValue={setCellValue} cell={cell} onBlur={handleBlur} />;
};

const DateInput = ({ cell, cellValue, columnDef, handleStopEditing, handleSubmit, row, setCellValue, validationSchema }: InputProps) => {
  const [isValid, setIsValid] = useState(true);
  const [stateValue, setStateValue] = useState(cellValue ? dayjs.tz(cellValue) : dayjs.tz());
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>(null);

  const formatter = useMemo(() => {
    switch (columnDef.type as ValidInputType) {
      case 'date':
        return dateFormat;
      case 'dateTime':
        return dateTimeFormat;
      case 'year':
        return 'YYYY';
      default:
        return dateFormat;
    }
  }, [columnDef.type]);

  const views = useMemo((): DateView[] => {
    switch (columnDef.type as ValidInputType) {
      case 'date':
        return ['year', 'month', 'day'] as const;
      case 'year':
        return ['year'] as const;
      default:
        return ['year', 'month', 'day'] as const;
    }
  }, [columnDef.type]);

  const onAccept = async () => {
    setTimeout(() => {
      handleClose();
    }, 100);

    if (!isValid) return;
    if (getCellValue(cell) !== cellValue) {
      handleSubmit();
    }
  };

  const handleInput = async (value: dayjs.Dayjs) => {
    setStateValue(value);
    setCellValue(value ? value.utc().toISOString() : null);
    const isValidValue = await validationSchema?.isValid?.(value ? value.utc().toISOString() : null);
    setIsValid(isValidValue);
  };

  const handleClose = () => {
    handleStopEditing();
    setAnchorEl(null);
  };

  return (
    <>
      <button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        className={cn(
          'shadow-0 w-ful flex w-full cursor-pointer appearance-none items-center justify-between !border-b bg-[transparent] px-[2px] py-[4px] outline-[transparent]  focus-within:outline-[var(--new-theme-color)] dark:text-[white]',
          isValid ? '' : 'border-red-500 focus-within:outline-red-500'
        )}
      >
        {stateValue.format(formatter)}
        <CalendarToday fontSize="small" color="primary" />
      </button>
      <Popover
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        anchorEl={anchorEl}
        open={!!anchorEl}
      >
        {columnDef.type === 'dateTime' ? (
          <StaticDateTimePicker
            value={stateValue}
            {...(columnDef?.restrictFutureDate ? { maxDate: dayjs.tz(new Date()) } : {})}
            {...(columnDef?.restrictBackDate ? { minDate: dayjs.tz(new Date()) } : {})}
            onChange={handleInput}
            onAccept={onAccept}
            onClose={handleClose}
          />
        ) : (
          <StaticDatePicker
            views={views}
            value={stateValue}
            {...(columnDef?.restrictFutureDate ? { maxDate: dayjs.tz(new Date()) } : {})}
            {...(columnDef?.restrictBackDate ? { minDate: dayjs.tz(new Date()) } : {})}
            onChange={handleInput}
            onAccept={onAccept}
            onClose={handleClose}
          />
        )}
      </Popover>
    </>
  );
};

const CurrencyNumber = (props: InputProps) => {
  const {
    state: { user }
  }: any = useData();

  const currencyIcon = find(getUniqueCurrencies(), function (obj) {
    return obj.currencyCode === (user?.user?.brandCurrency || 'USD');
  });
  return <RenderTextInput {...props} prefixIcon={currencyIcon.symbolNative} type={'number'} />;
};

const RenderCurrencyAutoComplete = ({
  cell,
  cellValue,
  columnDef,
  handleStopEditing,
  handleSubmit,
  row,
  setCellValue,
  validationSchema
}: InputProps) => {
  const [isValid, setIsValid] = useState(true);

  const handleBlur = async () => {
    handleStopEditing();
    if (!isValid) return;

    if (getCellValue(cell) !== cellValue) {
      handleSubmit();
    }
  };

  const handleInput = async (value: string) => {
    setCellValue(value);
    const isValidValue = await validationSchema?.isValid?.(value);
    setIsValid(isValidValue);
  };

  return (
    <div className="w-full flex-grow">
      <CurrencyAutocomplete
        onKeyDown={(e) => {
          const target = e.target as HTMLInputElement;
          if (e.key === 'Enter') {
            e.preventDefault();
            target.blur();
          }
        }}
        textFieldParams={{
          onBlur: () => {
            handleBlur();
          }
        }}
        size="small"
        margin="none"
        required={true}
        value={cellValue}
        fullWidth={true}
        onChange={(e, val: any) => {
          handleInput(val && val.currencyCode ? val.currencyCode : '');
        }}
      />
    </div>
  );
};

// const EmptyField = ({ columnDef, handleStopEditing, row }: InputProps) => {
//   return (
//     <ClickAwayListener onClickAway={() => handleStopEditing()}>
//       <div></div>
//     </ClickAwayListener>
//   );
// };

const schemas: Partial<Record<ValidInputType, YupSchema>> = {
  name: yup.string(),
  colorPicker: yup.string().min(7),
  email: yup.string().email(),
  mobileNumber: yup.string().min(5),
  singleLine: yup.string().min(1),
  multiLine: yup.string().min(1),
  url: yup.string().url()
};

const decimalPlaceValidator = (decimalPlaces: number) =>
  yup
    .number()
    .typeError('Value must be a number')
    .test('decimal-places', `Must have no more than ${decimalPlaces} decimal place${decimalPlaces === 1 ? '' : 's'}`, (value) => {
      if (value === undefined || value === null) return true;
      const decimalPart = value.toString().split('.')[1];
      return !decimalPart || decimalPart.length <= decimalPlaces;
    });

export const RenderInputField = memo((props: InputProps) => {
  const validationSchema = schemas[props.columnDef.type] || { isValid: () => new Promise((resove) => resove(true)) };

  if (props.columnDef?.dataList && props.columnDef?.dataListId) {
    return <DataListWrapper {...props} />;
  }

  switch (props.columnDef.type as ValidInputType) {
    case 'singleLine':
    case 'multiLine':
    case 'name':
    case 'email':
    case 'url': {
      return <RenderTextInput {...props} validationSchema={validationSchema} />;
    }
    case 'colorPicker': {
      return <RenderTextInput {...props} validationSchema={validationSchema} type="color" />;
    }
    case 'currencyNumber': {
      return <CurrencyNumber {...props} validationSchema={validationSchema} />;
    }
    case 'number': {
      return <RenderTextInput {...props} validationSchema={validationSchema} type={'number'} />;
    }
    case 'percent': {
      return <RenderTextInput {...props} validationSchema={validationSchema} suffixIcon={'%'} />;
    }
    case 'decimal': {
      return <RenderTextInput {...props} validationSchema={decimalPlaceValidator(props.columnDef.decimalPlaces)} type={'number'} />;
    }
    case 'currencyAmount': {
      return <RenderTextInput {...props} validationSchema={decimalPlaceValidator(2)} type={'number'} />;
    }
    case 'mobileNumber': {
      return <PhoneNumberInput {...props} validationSchema={validationSchema} />;
    }
    case 'radio':
    case 'dropDown':
    case 'multiSelect': {
      return <DropdownMultiSelectAndRadio {...props} validationSchema={validationSchema} />;
    }
    case 'date':
    case 'dateTime':
    case 'year': {
      return <DateInput {...props} validationSchema={validationSchema} />;
    }
    case 'currency': {
      return <RenderCurrencyAutoComplete {...props} validationSchema={validationSchema} />;
    }
    default:
      return <RenderTextInput {...props} validationSchema={decimalPlaceValidator(props.columnDef.decimalPlaces)} type={'number'} />;
  }
});
