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
            <TableCell align="center">
              <IconButton size="small" aria-label="Delete" onClick={() => {removeExpenseField(row.id)}}>
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
  );
};

export default ExpenseTable;
