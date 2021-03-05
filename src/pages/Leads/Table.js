import React from 'react';
import { makeStyles, withStyles, useTheme } from "@material-ui/core/styles";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Checkbox,
    Avatar
} from "@material-ui/core";
import "./style.css";

const StyledTableRow = withStyles((theme) => ({
    root: {
        "&:nth-of-type(odd)": {
            backgroundColor: "#F9FAFA",
        },
    },
}))(TableRow);

const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

const useStyles = makeStyles((theme) => ({
    tableContainer: {
        padding: "30px 20px",
        marginTop: 20,
        height: "88vh",
    },

    table: {
        marginTop: 20,
    },
    lead: {
        display: "flex",
        alignItems: "center",
    },

    leadAvatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
        marginRight: 10,
    },
}));

export default function CustomizedTables() {
    const classes = useStyles();

    return (<>
        <Paper elevation={1}>
            <TableContainer className={classes.table}>
                <Table stickyHeader arial-lable="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    inputProps={{ "aria-label": "select all desserts" }}
                                />
                            </TableCell>
                            {[
                                "Lead Name",
                                "Company",
                                "Title",
                                "Lead Source",
                                "Phone Number",
                                "Owner",
                            ].map((item, i) => (
                                <TableCell key={i} align="left">
                                    {item}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            [1, 2, 3, 4, 5].map(i =>
                                <StyledTableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            inputProps={{ "aria-label": "select all desserts" }}
                                        />
                                    </TableCell>
                                    <StyledTableCell>
                                        <Box component="div" className={classes.lead}>
                                            <Avatar className={classes.leadAvatar}>A</Avatar>
                                            <Box component="div">
                                                <Typography variant="subtitle2">Ava Moore</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    ava@ppcollc.com
                            </Typography>
                                            </Box>
                                        </Box>
                                    </StyledTableCell>
                                    <StyledTableCell>Platinum Pipelines Co LLC</StyledTableCell>
                                    <StyledTableCell>Cast Accountant</StyledTableCell>
                                    <StyledTableCell>Web Download</StyledTableCell>
                                    <StyledTableCell>281-281-2345</StyledTableCell>
                                    <StyledTableCell>
                                        <Typography variant="subtitle2">Ava Moore</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Dec 7, 2020 11:44pm
                        </Typography>
                                    </StyledTableCell>
                                </StyledTableRow>
                            )
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
        <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={6}
            page={0}
            rowsPerPage={10}
            onChangePage={() => console.log("page changed")}
        />
    </>
    );
}
