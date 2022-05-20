import React, { useState } from 'react';
import { createStyles, makeStyles, useTheme, Theme } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: 810,
            '& > * + *': {
                marginTop: theme.spacing(3),
            },
            paddingTop: 10,
        },
    }),
);





const DashboardResources = ({ dashboardList, dashboardName, setDashboardName }) => {
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
                <TableBody style={{paddingTop: 200}}>
                    <div className={classes.root}>
                        <Autocomplete
                            multiple
                            id="tags-outlined"
                            disableCloseOnSelect={true}
                            options={dashboardList}
                            getOptionLabel={(option:any) => option.name}
                            value={dashboardName}
                            onChange={(_event, newValue) => setDashboardName(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Select Types of Dashboard"
                                    placeholder="Dashboards"
                                />
                            )}
                        />
                    </div>
            </TableBody>
        </Table>
</TableContainer >
  )
}

export default DashboardResources;