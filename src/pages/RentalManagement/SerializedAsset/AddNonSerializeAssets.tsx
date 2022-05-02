import React, { useEffect, useState, useContext } from 'react';
import {
  Dialog,
  Box,
  Button,
  Link,
  TextField,
  Table,
  TableHead,
  Paper,
  TableContainer,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@material-ui/core';
import { read, utils, writeFile } from 'xlsx';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { makeStyles, createStyles, withStyles } from '@material-ui/styles';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CircularProgress } from "@material-ui/core";
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { addAssetsInRental } from '../rentalOfflineHelper';

interface DialogProps {
  closeDialog: () => void;
  products: any[];
  referenceId: string;
  warehouse: string;
}

type TableContent = {
  ['id']: string;
  ['_id']: string;
  ['product']: string;
  ['serializedProduct']: boolean;
  ['srno']: string;
  ['Name']: string;
  ['Asset Number']: string;
};

const useClasses = makeStyles(() => ({
  table: {
    // minWidth: 650
  },
  input: {
    display: 'none'
  },
  tableContainer: {
    maxHeight: 600
  }
}));

const AddNonSerializeAssets = ({ closeDialog, products, warehouse, referenceId }: DialogProps) => {

  const classes = useClasses();
  const { setToastConfig } = useContext(CustomToastContext);
  const [productData, setProductData] = useState<TableContent[]>([]);
  const [tableData, setTableData] = useState<TableContent[]>([]);
  const [dataWithNumber, setDataWithNumber] = useState<TableContent[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    if (!products) return;
    const mappedTable: TableContent[] = [];
    products.forEach((p: any, index_1) => {
      [...Array(p?.qty).keys()].forEach((_, index_2) => {
        mappedTable.push({
          _id: p?._id,
          id: `${index_1 + 1}.${index_2 + 1}_${p?._id}`,
          product: p?.productDetail?._id,
          serializedProduct: p?.serializedProduct,
          ['srno']: `${index_1 + 1}.${index_2 + 1}`,
          ['Name']: p?.detail,
          ['Asset Number']: ''
        });
      });
    });
    setTableData(mappedTable);
    setProductData(mappedTable);
  }, [products]);

  useEffect(() => {
    setDataWithNumber(tableData.filter(t => t['Asset Number']))
  }, [tableData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTableData((prevState) =>
      prevState.map((data: TableContent) => {
        if (name === data.id) {
          data['Asset Number'] = value;
        }
        return data;
      })
    );
  };

  const handleExport = () => {
    let json_data = [
      ...tableData.map((data: TableContent) => ({
        'Sr No.': data['srno'],
        Name: data['Name'],
        'Asset Number': data['Asset Number']
      }))
    ];
    const header = ['Sr No.', 'Name', 'Asset Number'];

    const ws = utils.json_to_sheet(json_data);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, 'Non Serialized Assets.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files,
      f = files[0];
    let reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      let readedData = read(data, { type: 'binary' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const parsedData = utils.sheet_to_json(ws, { header: 1 });

      if (parsedData.length > 1) {

        let tableContent = parsedData.slice(1, parsedData.length);

        tableContent = tableContent.map((item) => {
          const foundProduct: TableContent = productData.find((p) => p['Name'] === item[1]);
          let tableObj: TableContent = {
            id: `${item[0]}_${foundProduct?._id}`,
            _id: foundProduct?._id,
            product: foundProduct?.product,
            serializedProduct: foundProduct?.serializedProduct,
            ['srno']: item[0],
            ['Name']: item[1],
            ["Asset Number"]: item[2]
          };
          return tableObj;
        });
        setTableData(tableContent as TableContent[]);
      }
    };
    reader.readAsBinaryString(f);
    e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const duplicates = dataWithNumber.filter((v1, i, a) => a.findIndex((v2) => v1['Asset Number'] === v2['Asset Number']) !== i);
    if (duplicates.length) {
      setToastConfig({
        open: true,
        message: "One or more asset numbers are same!",
        type: 'error'
      })
      return false;
    }
    else {
      if (isOffline) {
        setSubmitting(true);
        await addAssetsInRental(referenceId, dataWithNumber.map((t) => ({ _id: t._id, product: t.product, assetNumber: t['Asset Number'], serializedProduct: t.serializedProduct })))
        setSubmitting(false);
        closeDialog();
      }
      else {
        setSubmitting(true);
        const dataToSubmit = {
          warehouse: warehouse,
          assets: dataWithNumber.map((t) => ({ _id: t._id, product: t.product, assetNumber: t['Asset Number'] }))
        };
        axiosInstance()
          .post(`${routes.rentalManagement.path}/${referenceId}/inventory/create-non-serialized-assets`, dataToSubmit)
          .then(() => {
            setSubmitting(false);
            closeDialog();
          })
          .catch((err) => {
            setSubmitting(false);
            setToastConfig(err);
          });
      }
    }
  };

  return (
    <Dialog open onClose={closeDialog} fullScreen>
      <CustomDialogHeader
        title={isOffline ? `Assign ${routes.serializedAsset.title}` : `Create Non ${routes.serializedAsset.title}`}
        onClose={closeDialog}
      />
      <CustomDialogContent>
        <Box display="flex" flexDirection="column" component={'form'} onSubmit={handleSubmit}>
          <Box alignSelf={'flex-end'} mb={2}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              color="primary"
              endIcon={isSubmitting && <CircularProgress size={18} />}
              disabled={isSubmitting || dataWithNumber.length === 0}
            >
              Add
            </Button>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box mb={1} display="flex">
              <Box>
                <Link className="cursor-pointer" onClick={handleExport}>
                  Export to excel
                </Link>
              </Box>
              <Box ml={2}>
                <input accept="xlsx" className={classes.input} onChange={handleImport} id="import-file" multiple type="file" />
                <label htmlFor="import-file">
                  <Link className="cursor-pointer">Import from excel</Link>
                </label>
              </Box>
            </Box>
          </Box>
          <TableContainer className={classes.tableContainer} component={Paper}>
            <Table className={classes.table} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <TableCell>Sr.No.</TableCell>
                  <TableCell align="left">Product</TableCell>
                  <TableCell align="left">{isOffline ? "Asset Number" : "Serial Number"}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((data: TableContent) => (
                  <TableRow key={data.id}>
                    <TableCell component="th" scope="row">
                      {data['srno']}
                    </TableCell>
                    <TableCell align="left">{data['Name']}</TableCell>
                    <TableCell align="left">
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder={isOffline ? "Asset Number" : "Serial Number"}
                        value={data['Asset Number']}
                        autoComplete="off"
                        name={data.id}
                        onChange={handleChange}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddNonSerializeAssets;
