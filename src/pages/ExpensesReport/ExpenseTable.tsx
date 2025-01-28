import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TableFooter } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getUniqueCurrencies } from 'src/constants/helpers';
import { useEffect } from 'react';

const ExpenseTable = ({ selectedExpenses, removeExpenseField }) => {

  const totalAmount = selectedExpenses?.reduce((acc, row) => acc + parseFloat(row.totalAmount || 0), 0);
  
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} aria-label="spanning table">
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell align="center">Currency</TableCell>
            <TableCell align="center">Merchant</TableCell>
            <TableCell align="center">Category</TableCell>
            <TableCell align="center">Amount</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {selectedExpenses?.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.expenseNumber}</TableCell>
              <TableCell align="center">{row.currency}</TableCell>
              <TableCell align="center">{row.merchant}</TableCell>
              <TableCell align="center">{row.category}</TableCell>
              <TableCell align="center">{getUniqueCurrencies().find((d) => d.currencyCode === row.currency)?.symbolNative} {row.totalAmount}</TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    removeExpenseField(row.id);
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} align="left" style={{ fontSize:'15px',fontWeight: 'bold' }}>
              Total Amount
            </TableCell>
            <TableCell align="center" style={{ fontSize:'15px',fontWeight: 'bold' }}>
            {totalAmount.toFixed(2)}
            </TableCell>
            <TableCell align="center"></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default ExpenseTable;
