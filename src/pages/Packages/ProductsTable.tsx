import { FC, useEffect } from 'react';
import { Paper, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import Loader from '../../components/Loader';

type TableProps = {
  products: {
    product: {
      _id: string;
      productName: string;
    };
    qty: number;
  }[];
  loading: boolean;
};

const ProductsTable: FC<TableProps> = ({ products, loading }) => {

  return (
    <div>
      <TableContainer style={{ maxHeight: 400 }} component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="h6" color="textPrimary">
                  Product(s)
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h6" color="textPrimary">
                  Qty
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((row) => (
              <TableRow key={row?.product._id}>
                <TableCell>{row?.product.productName}</TableCell>
                <TableCell align="right">{row?.qty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Paper>
        {loading ? (
          <Loader minHeight={200} text="Loading..." />
        ) : (
          products.length === 0 && (
            <Box width={'100%'} minHeight={200} textAlign="center" p={5}>
              <Typography>No Products</Typography>
            </Box>
          )
        )}
      </Paper>
    </div>
  );
};

export default ProductsTable;
