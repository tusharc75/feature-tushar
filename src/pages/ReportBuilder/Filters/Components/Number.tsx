import { TextField } from '@mui/material';

interface NumberProps {
  selectedField: any;
  filterValue: any;
  setFilterValue: (filterValue: any) => void;
}

const NumberComponent = ({
  selectedField,
  filterValue,
  setFilterValue
}: NumberProps) => {

  const isDecimal = selectedField?.type === 'decimal';

  const handleValueChange = (value: string) => {
    if (!value) {
      setFilterValue(null);
      return;
    }

    if (isDecimal) {
      const numValue = parseFloat(value);
      setFilterValue(isNaN(numValue) ? null : numValue);
    } else {
      const numValue = parseInt(value);
      setFilterValue(isNaN(numValue) ? null : numValue);
    }
  };

  return (
    <TextField
      required={true}
      size="small"
      type="number"
      label={`Enter ${selectedField?.fieldLabel}`}
      variant="outlined"
      fullWidth
      value={filterValue || ''}
      onChange={(e) => handleValueChange(e.target.value)}
      placeholder={`Enter ${selectedField?.fieldLabel?.toLowerCase()}...`}
      slotProps={{
        inputLabel: { shrink: true },
        input: {
          inputProps: {
            step: isDecimal ? 'any' : '1',
            min: selectedField?.minValue || undefined,
            max: selectedField?.maxValue || undefined
          }
        }
      }}
    />
  );
};

export default NumberComponent;
