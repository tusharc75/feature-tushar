import { Checkbox, FormControlLabel } from '@mui/material';

interface CheckboxProps {
  filterValue: any;
  setFilterValue: (filterValue: any) => void;
}

const CheckboxComponent = ({ filterValue, setFilterValue }: CheckboxProps) => {
  return (
    <div className="flex flex-col gap-2">
      <FormControlLabel
        control={<Checkbox size="small" checked={filterValue === true} onChange={(e) => setFilterValue(e?.target?.checked ? true : null)} />}
        label={<span className="text-sm font-medium text-[--primary-text]">Yes</span>}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={filterValue === false} onChange={(e) => setFilterValue(e?.target?.checked ? false : null)} />}
        label={<span className="text-sm font-medium text-[--primary-text]">No</span>}
      />
    </div>
  );
};

export default CheckboxComponent;
