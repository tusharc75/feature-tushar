import React,{useState} from 'react';
import { createStyles, makeStyles, useTheme, Theme } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Chip from '@material-ui/core/Chip';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      width: 800,
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    chip: {
      margin: 2,
    },
    noLabel: {
      marginTop: theme.spacing(3),
    },
  }),
);

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 800,
    },
  },
};

function getStyles(name: string, personName: readonly string[], theme: Theme) {
    return {
      fontWeight:
        personName.indexOf(name) === -1
          ? theme.typography.fontWeightRegular
          : theme.typography.fontWeightMedium,
    };
  }

const DashboardResources = ({dashboardList, dashboardName, setDashboardName, handleChange}) => {
    const classes = useStyles();
    const theme = useTheme();
  return (
    <TableContainer style={{ height: 400, minHeight: 400, paddingTop: 50 }}>
    <Table
        stickyHeader
        aria-label="policy"
        className="roles-table"
    >
        <TableHead>
            <TableRow>
                <TableCell>Dashboard</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
        <FormControl className={classes.formControl}>
        <Select
          aria-label="Please select the dashboards"
          labelId="demo-mutiple-chip-label"
          id="demo-mutiple-chip"
          multiple
          value={dashboardName}
          onChange={handleChange}
          input={<Input id="select-multiple-chip" />}
          renderValue={(selected) => (
            <div className={classes.chips}>
              {(selected as string[]).map((value) => (
                <Chip key={value} label={value} className={classes.chip} />
              ))}
            </div>
          )}
          MenuProps={MenuProps}
        >
          {dashboardList.map((name) => (
            <MenuItem key={name} value={name} style={getStyles(name, dashboardName, theme)}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
        </TableBody>
    </Table>
</TableContainer>
  )
}

export default DashboardResources;