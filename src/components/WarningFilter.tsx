import { Checkbox, FormControlLabel, FormGroup, Menu, MenuItem } from '@mui/material';
import { Close } from '@material-ui/icons';
import { ReactNode, memo, useState } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import { ThemeButton } from 'src/components/Helpers/Buttons';

type WarningFilterProps = {
  warnings: {
    warningFilter: number;
    icon: ReactNode;
    title: string;
    label: string;
    isVisible: boolean | undefined;
  }[];
  checkedFilter: null | number;
  setCheckedFilter: (value: null | number) => void;
};

const WarningFilter = ({ warnings, checkedFilter, setCheckedFilter }: WarningFilterProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <span className="relative">
        <span className={`absolute -left-[3px] -top-[3px] z-10 flex h-[6px] w-[6px] ${checkedFilter ? '' : 'sr-only'}`}>
          <span className="absolute -left-[3px] -top-[3px] inline-flex h-3 w-3 animate-ping rounded-full bg-sky-400 opacity-75"></span>
          <span className="inline-flex h-full  w-full rounded-full bg-sky-500"></span>
        </span>
        <ThemeButton
          size="small"
          tooltip="Filter data by warnings"
          variant="outlined"
          iconForMobile={<BiFilterAlt />}
          startIcon={<BiFilterAlt />}
          onClick={handleClick}
        >
          Warnings
        </ThemeButton>
      </span>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <h6 className="px-2 py-2 text-center text-[16px] font-semibold [border-bottom:1px_solid_var(--common-border-color)]">
          Filter Items by warning
        </h6>
        <FormGroup>
          {warnings.map((w) => (
            <MenuItem key={w.warningFilter} dense>
              <FormControlLabel
                value="end"
                control={
                  <Checkbox
                    color="primary"
                    checked={checkedFilter === w.warningFilter}
                    name={`${w.warningFilter}`}
                    onChange={(e) => {
                      const isChecked = checkedFilter === w.warningFilter ? null : w.warningFilter;
                      setCheckedFilter(isChecked);
                    }}
                  />
                }
                label={w.label}
                labelPlacement="end"
              />
            </MenuItem>
          ))}
        </FormGroup>
        {checkedFilter && (
          <div className={`px-2 py-2 [border-top:1px_solid_var(--common-border-color)]`}>
            <ThemeButton
              iconForMobile={<Close />}
              startIcon={<Close />}
              onClick={() => {
                setCheckedFilter(null);
              }}
            >
              Clear all filters
            </ThemeButton>
          </div>
        )}
      </Menu>
    </>
  );
};

export default memo(WarningFilter);
