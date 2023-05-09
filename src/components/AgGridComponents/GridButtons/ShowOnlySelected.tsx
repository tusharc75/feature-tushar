import React, { useState, useEffect } from 'react';
import { FormControlLabel, Theme, Typography, createStyles, withStyles } from '@material-ui/core';
import Switch, { SwitchClassKey, SwitchProps } from '@material-ui/core/Switch';

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
      // disableRipple
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

const ShowOnlySelected = ({ dispatch = null, renderedFrom = null, selectedRecords = [], style = {}, ...otherProps }) => {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`${renderedFrom}_selected`);
    if (saved) {
      try {
        const initialValue = JSON.parse(saved);
        setDisableSelectionSwitch(initialValue.length === 0);
      } catch {
        setDisableSelectionSwitch(true);
      }
    } else {
      setDisableSelectionSwitch(true);
    }
  }, [selectedRecords]);

  return (
    <FormControlLabel
      value={checked}
      checked={checked}
      {...otherProps}
      onChange={() => {
        setChecked(!checked);

        if (dispatch) {
          dispatch({
            type: 'showFilteredRecordsOnly'
          });
        }
      }}
      control={<CustomSwitch disabled={disableSelectionSwitch} />}
      style={{ fontSize: '0.8rem', marginLeft: 0, ...style }}
      label={<Typography style={{ fontWeight: 400 }}>Show Only Selected</Typography>}
      labelPlacement="end"
    />
  );
};

export default ShowOnlySelected;
