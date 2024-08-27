import { Box, Button, Dialog, makeStyles, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition } from 'src/constants/helpers';

const useStyles = makeStyles((theme) => ({
  table: {
    borderCollapse: 'collapse',
    width: '100%'
  },
  th: {
    border: '1px solid #dddddd',
    textAlign: 'left',
    padding: '10px',
    minWidth: '250px'
  },
  thp: {
    border: '1px solid #dddddd',
    textAlign: 'left',
    padding: '0px 10px',
    minWidth: '350px'
  }
}));

const ImportedDataDialog = ({ handleClose, data, productCategory, productTemplate, onSuccess }) => {
  const classes = useStyles();

  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axiosInstance()
      .get(
        `/product?filterById=${JSON.stringify([
          { field: 'productCategory', term: productCategory },
          { field: 'productTemplate', term: productTemplate }
        ])}&filterType='and`
      )
      .then(({ data: { data } }) => {
        setProducts(data?.map((d) => d?.productName));
      });
  }, []);

  useEffect(() => {
    setRows(data?.slice(1));
  }, [data]);

  const handleSave = () => {
    onSuccess([data[0], ...rows]);
  };

  return (
    <Dialog open={true} onClose={handleClose} TransitionComponent={CustomDialogTransition} fullScreen={true} fullWidth maxWidth="md">
      <>
        <CustomDialogHeader title="Imported Data" onClose={handleClose} />
        <CustomDialogContent>
          <Box>
            <table className={classes.table}>
              <tr>
                {data[0]?.map((d) => {
                  return <th className={classes.th}>{d}</th>;
                })}
              </tr>
              {rows?.map((row, index) => (
                <tr key={index}>
                  {row?.map((r, i) => {
                    return i === 0 ? (
                      <td className={classes.thp}>
                        <Autocomplete
                          id="custom-import-product-description"
                          size="small"
                          fullWidth
                          options={products}
                          value={r}
                          onChange={(e, val) => {
                            setRows(
                              rows?.map((r, j) => {
                                if (index === j) {
                                  r[0] = val || '';
                                }
                                return r;
                              })
                            );
                          }}
                          renderInput={(params) => <TextField {...params} margin="dense" variant="outlined" />}
                        />
                      </td>
                    ) : (
                      <td className={classes.th}>{r}</td>
                    );
                  })}
                </tr>
              ))}
            </table>
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button color="primary" size="small" onClick={handleClose}>
            Cancel
          </Button>
          <CustomButton onClick={handleSave} variant="contained" color="primary" disabled={!rows?.every((r) => r[0])}>
            Save
          </CustomButton>
        </CustomDialogFooter>
      </>
    </Dialog>
  );
};

export default ImportedDataDialog;
