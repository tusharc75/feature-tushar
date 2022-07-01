import { Grid } from '@material-ui/core';
import React, { useState, useReducer, useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableContainer from '@material-ui/core/TableContainer';
import { styled } from '@material-ui/core/styles';
import moment from 'moment';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.type === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary
}));

const BidsPage = ({ bids, fetchData }) => {
  // const [columns, setColumns] = useState([{ headerName: 'User' }, { headerName: 'Amount' }, { headerName: 'Date' }]);
  const [rows, setRows] = useState(bids);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [gridApi, setGridApi] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;

  const columns = [
    { headerName: 'User', field: 'userName', cellRenderer:(u) => {
      return u.value
    }  },
    { headerName: 'Amount', field: 'amount' },
    { headerName: 'Date', field: 'date', cellRenderer: (d) => moment(d.value).format('DD/MM/YYYY HH:MM:SS') }
  ]

 


  return (
    <div className='ag-theme-alpine'>
      <CustomAgGrid
        columns={columns}
        dataRows={rows}
        frameworkComponents={frameWorkComponent}
        setGridApi={fetchData}
        dispatch={dispatch}
        rowCount={rowCount}
        limit={limit}
        pageSizes={pageSizes}
        page={page}
        allowAction={false}
        loading={false}
        showOnlyShowFilteredRecordSwitch={true}
      />
    </div>
  );
};

export default BidsPage;
