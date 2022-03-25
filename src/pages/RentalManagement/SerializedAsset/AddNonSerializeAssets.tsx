import React from 'react';
import {
  Dialog,
  Box,
  Button,
  Link,
  TextField,
  Theme,
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

interface DialogProps {
  closeDialog: () => void;
  products: any[];
  rentalId: string;
  warehouse: {
    address: string;
    optionLabel: string;
    optionValue: string;
  };
}

type TableContent = {
  ['id']: string;
  ['materialId']: string;
  ['product']: string;
  ['Sr No.']: string;
  ['Name']: string;
  ['Asset Number']: string;
};

const useClasses = makeStyles(() => ({
  table: {
    minWidth: 650
  },
  input: {
    display: 'none'
  }
}));

const AddNonSerializeAssets = ({ closeDialog, products, warehouse, rentalId }: DialogProps) => {
  const classes = useClasses();
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [productData, setProductData] = React.useState<TableContent[]>([]);
  const [tableData, setTableData] = React.useState<TableContent[]>([]);
  const [totalAssetRequired, setTotalAssetRequired] = React.useState(0);
  const [hasError, setHasError] = React.useState(null);
  const [isSubmitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!products) return;
    const totalQty = products.map((p: any) => p?.qty ?? 0).reduce((acc: number, val: number) => acc + val);
    const mappedTable: TableContent[] = [];
    products.forEach((p: any, index_1) => {
      [...Array(p?.qty).keys()].forEach((_, index_2) => {
        mappedTable.push({
          id: `${index_1 + 1}.${index_2 + 1}_${p?.materialId}`,
          materialId: p?.materialId,
          product: p?.productDetail?._id,
          ['Sr No.']: `${index_1 + 1}.${index_2 + 1}`,
          ['Name']: p?.detail,
          ['Asset Number']: ''
        });
      });
    });
    setTableData(mappedTable);
    setTotalAssetRequired(totalQty);
    setProductData(mappedTable);
  }, [products]);

  React.useEffect(() => {
    if (checkErrors() > 0) {
      setHasError(checkErrors());
    } else {
      setHasError(null);
    }
  }, [tableData]);

  const checkErrors = (): number => {
    const emptyField = tableData.filter((t) => !t['Asset Number']);
    return emptyField.length;
  };

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

  /**
   * Handle Export Excel File
   */
  const handleExport = () => {
    let json_data = [
      ...tableData.map((data: TableContent) => {
        delete data.id;
        delete data.materialId;
        delete data.product;
        return data;
      })
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

  /**
   * Handle import excel file
   * @param e Input Event
   */
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
            id: `${item[0]}_${foundProduct?.materialId}`,
            materialId: foundProduct?.materialId,
            product: foundProduct?.product,
            ['Sr No.']: item[0],
            ['Name']: item[1],
            ['Asset Number']: item[2]
          };

          return tableObj;
        });
        setTableData(tableContent as TableContent[]);
      }
    };
    reader.readAsBinaryString(f);
    e.target.value = null;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (hasError || !warehouse) return;

    setSubmitting(true);
    const dataToSubmit = {
      warehouse: warehouse?.optionValue,
      assets: tableData.map((t) => ({ _id: t.materialId, product: t.product, assetNumber: t['Asset Number'] }))
    };

    axiosInstance()
      .put(`${routes.rentalManagement.path}/${rentalId}/inventory/create-assets-non-serialized-product`, dataToSubmit)
      .then(() => {
        setSubmitting(false);
        closeDialog();
      })
      .catch((err) => {
        setSubmitting(false);
        setToastConfig(err);
      });
  };

  return (
    <Dialog open onClose={closeDialog} fullScreen>
      <CustomDialogHeader title="Add Non Serialize Assets" onClose={closeDialog} />
      <CustomDialogContent>
        <Box display="flex" flexDirection="column" component={'form'} onSubmit={handleSubmit}>
          <Box alignSelf={'flex-end'} mb={2}>
            <Button type="submit" variant="contained" size="small" color="primary" disabled={isSubmitting || Boolean(hasError)}>
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
            <Box>{hasError && <Typography>Remaining Assets ({hasError})</Typography>}</Box>
          </Box>
          <TableContainer component={Paper}>
            <Table className={classes.table} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <TableCell>Sr No.</TableCell>
                  <TableCell align="right">Name</TableCell>
                  <TableCell align="right">Asset Number</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((data: TableContent) => (
                  <TableRow key={data.id}>
                    <TableCell component="th" scope="row">
                      {data['Sr No.']}
                    </TableCell>
                    <TableCell align="right">{data['Name']}</TableCell>
                    <TableCell align="right">
                      <TextField
                        required
                        size="small"
                        variant="outlined"
                        placeholder="Asset Number"
                        value={data['Asset Number']}
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
