import React from 'react'
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import Chip from '@material-ui/core/Chip';
import { Link } from 'react-router-dom'
import routes from './../../components/Helpers/Routes';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    // root: {
    //     width: '100%',
    //     overflowX: 'auto'
    // },
    table: {
        minWidth: "150%"
    }
});


export default function AccountHierarchy({ data }) {
    const classes = useStyles();

    const minWidth = 170;

    const Row = ({ rowData, index }) => {
        const [open, setOpen] = React.useState(true);

        return <React.Fragment>
            <TableRow index={index}>
                <TableCell>
                    {
                        rowData.children && rowData.children.length > 0 ? <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                            {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                        </IconButton> : <IconButton></IconButton>
                    }
                </TableCell>
                <TableCell style={{ minWidth: rowData.children && rowData.children.length == 0 ? "" : minWidth }} component="th" scope="row">
                    <Link className="accountNameLink" to={`${routes.accountDetails.path}/${rowData._id}`}>
                        {rowData.accountName}
                    </Link>
                    {
                        rowData.current ? <Chip label="Current" size="small" className="ml-2" /> : ""
                    }
                </TableCell>
                <TableCell style={{ minWidth: rowData.children && rowData.children.length == 0 ? "" : minWidth }} align="center">{rowData.typeOfAccount?.optionLabel}</TableCell>
                <TableCell style={{ minWidth: rowData.children && rowData.children.length == 0 ? "" : minWidth }} align="center">{rowData.industry?.optionLabel}</TableCell>
                <TableCell style={{ minWidth: rowData.children && rowData.children.length == 0 ? "" : minWidth }} align="center">{rowData.typeOfBusiness}</TableCell>
                <TableCell style={{ minWidth: rowData.children && rowData.children.length == 0 ? "" : minWidth }} align="center">{rowData.parentAccount?.optionLabel}</TableCell>
                <TableCell style={{ minWidth: rowData.children && rowData.children.length == 0 ? "" : minWidth }} align="center">{rowData.phone}</TableCell>
            </TableRow>
            <TableRow>
                {
                    rowData.children && rowData.children.length > 0 &&
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7} className="pr-0">
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <TableContainer component={Paper}>
                                <Table aria-label="collapsible table" size="small">
                                    <TableHead>
                                        <TableRow style={{ visibility: "collapse" }}>
                                            <TableCell />
                                            <TableCell component="th">Account Name</TableCell>
                                            <TableCell align="center">Type</TableCell>
                                            <TableCell align="center">Industry</TableCell>
                                            <TableCell align="center">Type Of Business</TableCell>
                                            <TableCell align="center">Parent Account</TableCell>
                                            <TableCell align="center">Phone</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {
                                            rowData.children.map((row, index1) => {
                                                return <Row key={index1} rowData={row} index={index1} />
                                            })
                                        }
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Collapse>
                    </TableCell>
                }
            </TableRow>
        </React.Fragment>
    }

    return (
        <TableContainer component={Paper} style={{ width: "100%", overflowX: 'auto' }}>
            <Table aria-label="collapsible table" size="small" className={classes.table}>
                <TableHead>
                    <TableRow>
                        <TableCell />
                        <TableCell component="th">Account Name</TableCell>
                        <TableCell align="center">Type</TableCell>
                        <TableCell align="center">Industry</TableCell>
                        <TableCell align="center">Type Of Business</TableCell>
                        <TableCell align="center">Parent Account</TableCell>
                        <TableCell align="center">Phone</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {
                        data.map((row, index) => {
                            return <Row key={index} rowData={row} index={index} />
                        })
                    }
                </TableBody>
            </Table>
        </TableContainer>
    )
}
