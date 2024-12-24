import { Fragment, useEffect, useState } from 'react';
import { createStyles, Theme, FormControlLabel, Switch, Typography, SwitchClassKey, SwitchProps } from '@mui/material';
import { withStyles } from '@mui/styles';

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

function ShowFilteredRecordsOnly({ dispatchTable, showOnlyShowFilteredRecordSwitch, selectedRecords }) {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (selectedRecords === 0) {
      if (checked) {
        setChecked(false);
        dispatchTable({
          type: 'showFilteredRecordsOnly'
        });
        dispatchTable({ type: 'pageChange', page: 0 });
      }
      setDisableSelectionSwitch(true);
    } else {
      setDisableSelectionSwitch(false);
    }
  }, [selectedRecords]);

  return (
    <Fragment>
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
                dispatchTable({ type: 'pageChange', page: 0 });
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
    </Fragment>
  );
}

export default ShowFilteredRecordsOnly;
