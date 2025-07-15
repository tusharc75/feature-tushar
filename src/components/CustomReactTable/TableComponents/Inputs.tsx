import { CalendarToday } from '@mui/icons-material';
import { Autocomplete, AutocompleteProps, ClickAwayListener, Popover, TextField } from '@mui/material';
import { DateView } from '@mui/x-date-pickers';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { StaticDateTimePicker } from '@mui/x-date-pickers/StaticDateTimePicker';
import dayjs from 'dayjs';
import { find, isEqual } from 'lodash';
import MuiPhoneInput from 'material-ui-phone-number';
import { memo, useEffect, useMemo, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import DataList from 'src/components/CustomReactTable/TableComponents/DataList';
import { getCellValue } from 'src/components/CustomReactTable/utils';
import { cn, dateFormat, dateTimeFormat, getUniqueCurrencies } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import * as yup from 'yup';
import { ValidateOptions } from 'yup/lib/types';

type YupSchema = Partial<yup.AnySchema> & { isValid: (value: any, options?: ValidateOptions<any>) => Promise<boolean> };

export const validInputs = new Set([
  'singleLine',
  'multiLine',
  'email',
  'mobileNumber',
  'dropDown',
  'multiSelect',
  'date',
  'year',
  'dateTime',
  'decimal',
  'currencyNumber',
  'percent',
  'radio',
  'name',
  'colorPicker',
  'url',
  'currency'
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

export const RenderTextInput = ({
  columnDef,
  row,
  cell,
  cellValue,
  setCellValue,
  handleSubmit,
  handleStopEditing,
  validationSchema = { isValid: () => new Promise((resove) => resove(true)) },
  prefixIcon,
  suffixIcon,
  ...rest
}: InputProps & Partial<React.InputHTMLAttributes<HTMLInputElement>> & { prefixIcon?: React.ReactNode; suffixIcon?: React.ReactNode }) => {
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
    const isValidValue = (await validationSchema?.isValid?.(cellValue)) || true;
    setIsValid(isValidValue);
  };

  return (
    <div
      className={cn(
        'shadow-0 flex w-full appearance-none items-center justify-between gap-1 !border-b bg-[transparent] px-[2px] py-[4px] outline-[transparent]  focus-within:outline-[var(--new-theme-color)] dark:text-[white]',
        isValid ? '' : 'border-red-500 focus-within:outline-red-500'
      )}
    >
      {prefixIcon}
      <input
        autoFocus
        id={`${cell.column.id}-input-${row.index || 0}`}
        type="text"
        className="flex-grow border-none outline-none"
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
          handleInput(e.target.value || '');
        }}
        {...rest}
      />
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
    console.log(val);
    setCellValue(val);
    const isValidValue = (await validationSchema?.isValid?.(cellValue)) || true;
    setIsValid(isValidValue);
  };

  return (
    <MuiPhoneInput
      defaultCountry={'us'}
      disableAreaCodes
      countryCodeEditable
      variant="outlined"
      fullWidth
      label={'Value'}
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

const DropdownAndMultiSelect = ({
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
      (columnDef?.type === 'dropDown' && getCellValue(cell) !== cellValue)
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
    setCellValue(value);
    const isValidValue = (await validationSchema?.isValid?.(cellValue)) || true;
    setIsValid(isValidValue);
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
          variant="standard"
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

    const isValid = (await validationSchema?.isValid?.(cellValue)) || true;
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
    const isValidValue = (await validationSchema?.isValid?.(cellValue)) || true;
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
  return <RenderTextInput {...props} prefixIcon={currencyIcon.symbolNative} />;
};

const schemas: Partial<Record<ValidInputType, YupSchema>> = {
  name: yup.string(),
  colorPicker: yup.string().min(7),
  email: yup.string().email(),
  mobileNumber: yup.string().min(8),
  singleLine: yup.string().min(1),
  multiLine: yup.string().min(10),
  url: yup.string().url()
};

export const RenderInputField = memo((props: InputProps) => {
  const validationSchema = schemas[props.columnDef.type];

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
    case 'currencyNumber': {
      return <CurrencyNumber {...props} validationSchema={validationSchema} />;
    }
    case 'percent': {
      return <RenderTextInput {...props} validationSchema={validationSchema} suffixIcon={'%'} />;
    }
    case 'mobileNumber': {
      return <PhoneNumberInput {...props} validationSchema={validationSchema} />;
    }
    case 'dropDown':
    case 'multiSelect': {
      return <DropdownAndMultiSelect {...props} validationSchema={validationSchema} />;
    }
    case 'date':
    case 'dateTime':
    case 'year': {
      return <DateInput {...props} validationSchema={validationSchema} />;
    }

    default:
      return <EmptyField {...props} validationSchema={validationSchema} />;
  }
});

const EmptyField = ({ columnDef, handleStopEditing, row }: InputProps) => {
  console.log({ row: row.original, col: columnDef });
  return (
    <ClickAwayListener onClickAway={() => handleStopEditing()}>
      <div></div>
    </ClickAwayListener>
  );
};
