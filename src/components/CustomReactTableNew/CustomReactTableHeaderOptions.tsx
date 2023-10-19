import { useEffect, useState } from 'react';
import { createStyles, withStyles, Theme, FormControlLabel, Switch, Typography, SwitchClassKey, SwitchProps } from '@material-ui/core';

interface Styles extends Partial<Record<SwitchClassKey, string>> {
  focusVisible?: string;
}
interface Props extends SwitchProps {
  classes: Styles;
}

const CustomSwitch = withStyles((theme: Theme) =>
  createStyles({
    root: {
      width: 37,
      height: 20,
      padding: 0,
      margin: `0 ${theme.spacing(1)}px 0 0`
    },
    switchBase: {
      padding: '2px',
      '&$checked': {
        transform: 'translateX(16px)',
        color: theme.palette.common.white,
        '& + $track': {
          backgroundColor: '#B7B7B7',
          opacity: 1,
          border: 'none'
        }
      },
      '&$focusVisible $thumb': {
        color: '#52d869',
        border: '6px solid #fff'
      },
      '&.Mui-disabled': {
        color: `${theme.palette.grey[100]} !important`
      }
    },
    thumb: {
      width: 16,
      height: 16
    },
    track: {
      borderRadius: 26 / 2,
      border: `1px solid ${theme.palette.grey[400]}`,
      backgroundColor: '#B7B7B7',
      opacity: 1,
      transition: theme.transitions.create(['background-color', 'border'])
    },
    checked: {},
    focusVisible: {}
  })
)(({ classes, ...props }: Props) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked
      }}
      {...props}
    />
  );
});

function CustomReactTableHeaderOptions({ renderedFrom = null, dispatchTable = null, showOnlyShowFilteredRecordSwitch = false, selectedRecords = 0 }) {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`${renderedFrom}_selected`);
    if (saved) {
      try {
        const initialValue = JSON.parse(saved);
        setDisableSelectionSwitch(selectedRecords === 0);
        if (initialValue?.length === 0 && checked) {
          setChecked(false);
          dispatchTable({
            type: 'showFilteredRecordsOnly'
          });
        }
      } catch {
        setDisableSelectionSwitch(true);
      }
    } else {
      setDisableSelectionSwitch(true);
    }
  }, [selectedRecords]);

  return (
    <>
      {showOnlyShowFilteredRecordSwitch && (
        <>
          <FormControlLabel
            value={checked}
            checked={checked}
            onChange={() => {
              setChecked(!checked);

              if (dispatchTable) {
                dispatchTable({
                  type: 'showFilteredRecordsOnly'
                });
              }
            }}
            className="show-only-selected-switch"
            control={<CustomSwitch disabled={disableSelectionSwitch} />}
            style={{ fontSize: '0.8rem', marginLeft: 0, padding: '0px 0 10px' }}
            label={<Typography style={{ fontWeight: 400 }}>Show Only Selected</Typography>}
            labelPlacement="end"
          />
        </>
      )}
    </>
  );
}

export default CustomReactTableHeaderOptions;
