import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ExpenseTable = ({ selectedExpensesData, selectedExpenses, removeExpenseField }) => {

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
          {selectedExpensesData && (
            <TableRow key={selectedExpensesData._id}>
              <TableCell>{selectedExpensesData.expenseNumber}</TableCell>
              <TableCell align="center">{selectedExpensesData.currency}</TableCell>
              <TableCell align="center">{selectedExpensesData.merchant}</TableCell>
              <TableCell align="center">{selectedExpensesData.category}</TableCell>
              <TableCell align="center">{selectedExpensesData.totalAmount}</TableCell>
              <TableCell align="center">
                <IconButton size="small" aria-label="Delete" onClick={() => {removeExpenseField(selectedExpensesData.id)}}>
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell/>
            <TableCell align="left">Total Amount</TableCell>
            <TableCell align="right">{selectedExpensesData.totalAmount}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExpenseTable;
