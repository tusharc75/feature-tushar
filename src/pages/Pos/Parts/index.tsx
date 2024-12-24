import { useState, useEffect, Fragment, useContext } from 'react';
import { Box, Paper, TableContainer, TableRow, TableCell, TableBody, Table, Typography } from '@mui/material';
import routes from '../../../components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import QtyButton from './../QuantityDialog/qtyButton';
import { Link } from 'react-router-dom';

const Parts = ({ product, warehouse, fetchCart, cart }) => {
  const toastConfig = useContext(CustomToastContext);
  const [parts, setParts] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [product, warehouse]);

  const fetchProduct = () => {
    axiosInstance()
      .get(`/pos/bom/${product}/${warehouse}`)
      .then(({ data: { data } }) => {
        setParts(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      {parts && parts?.length ? (
        <Fragment>
          <Box pb={3}>
            <Box mt={3} mb={3} border={1} borderColor="grey.100"></Box>
            <div className="w-100 my-3 mb-2">
              <h2>Parts</h2>
            </div>
            <TableContainer component={Paper}>
              <Table aria-label="simple table">
                <TableBody>
                  {parts?.map((row, index) => (
                    <TableRow key={row._id} className="p-3">
                      <TableCell component="th" scope="row" width="40%">
                        <Link className="cursor-pointer" to={`${routes.posProductDetail.path}/${row._id}/${warehouse}`}>
                          {row.productName}
                        </Link>
                      </TableCell>
                      <TableCell component="th" scope="row" width="20%">
                        {row?.availableInventory ? (
                          <Typography>Inventory-{row?.availableInventory}</Typography>
                        ) : (
                          <Typography>No inventory</Typography>
                        )}
                      </TableCell>
                      <TableCell component="th" scope="row" width="40%" align="right">
                        <QtyButton
                          product={row}
                          cart={cart}
                          warehouse={warehouse}
                          fetchCart={fetchCart}
                          onSucess={() => {
                            fetchProduct();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Fragment>
      ) : null}
    </Fragment>
  );
};

export default Parts;
