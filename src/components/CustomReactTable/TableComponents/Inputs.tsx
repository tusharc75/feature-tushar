import { useEffect, useMemo, useState } from 'react';
import { getCellValue } from 'src/components/CustomReactTable/utils';
import { cn } from 'src/constants/helpers';
import * as yup from 'yup';
import { ValidateOptions } from 'yup/lib/types';
import MuiPhoneInput from 'material-ui-phone-number';
import { Autocomplete, AutocompleteProps, ClickAwayListener, TextField } from '@mui/material';
import { isEqual } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import DataList from 'src/components/CustomReactTable/TableComponents/DataList';

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
  ...rest
}: InputProps & Partial<React.InputHTMLAttributes<HTMLInputElement>>) => {
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
    <input
      autoFocus
      id={`${cell.column.id}-input-${row.index || 0}`}
      type="text"
      onBlur={() => handleBlur()}
      value={cellValue}
      onKeyDown={(e) => {
        const target = e.target as HTMLInputElement;
        if (e.key === 'Enter') {
          e.preventDefault();
          target.blur();
        }
      }}
      className={cn(
        'shadow-0 w-full appearance-none !border-b bg-[transparent] px-[2px] py-[4px] outline-[transparent]  focus-within:outline-[var(--new-theme-color)] dark:text-[white]',
        isValid ? '' : 'border-red-500 focus-within:outline-red-500'
      )}
      onChange={(e) => {
        handleInput(e.target.value || '');
      }}
      {...rest}
    />
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

const schemas: Partial<Record<ValidInputType, YupSchema>> = {
  name: yup.string(),
  colorPicker: yup.string().min(7),
  email: yup.string().email(),
  mobileNumber: yup.string().min(8),
  singleLine: yup.string().min(1),
  multiLine: yup.string().min(10),
  url: yup.string().url()
};

export const RenderInputField = (props: InputProps) => {
  const validationSchema = schemas[props.columnDef.type];

  if (props.columnDef?.dataList && props.columnDef?.dataListId) {
    return <DataListWrapper {...props} />;
  }

  switch (props.columnDef.type as ValidInputType) {
    case 'singleLine':
    case 'multiLine':
    case 'name':
      return <RenderTextInput {...props} validationSchema={validationSchema} />;
    case 'email': {
      return <RenderTextInput {...props} validationSchema={validationSchema} />;
    }
    case 'mobileNumber': {
      return <PhoneNumberInput {...props} validationSchema={validationSchema} />;
    }
    case 'dropDown':
    case 'multiSelect': {
      return <DropdownAndMultiSelect {...props} validationSchema={validationSchema} />;
    }
    default:
      return <EmptyField {...props} validationSchema={validationSchema} />;
  }
};

const EmptyField = ({ columnDef, handleStopEditing, row }: InputProps) => {
  console.log({ row: row.original, col: columnDef });
  return (
    <ClickAwayListener onClickAway={() => handleStopEditing()}>
      <div></div>
    </ClickAwayListener>
  );
};
