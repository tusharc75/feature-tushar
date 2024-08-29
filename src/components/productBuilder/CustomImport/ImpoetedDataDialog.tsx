import { Box, Button, Dialog, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { cn, CustomDialogTransition } from 'src/constants/helpers';

const cellClassName = 'w-[220px] max-w-[220px] p-[10px] text-left [border:1px_solid_var(--common-border-color)]';
const indexStickyClassName = 'sticky sm:left-0 z-10 w-[var(--index-col-size)] bg-[var(--dark-primary,white)]';
const descriptionStickyClassName = 'sticky sm:left-[var(--index-col-size)] z-10 bg-[var(--dark-primary,white)]';

const ImportedDataDialog = ({ handleClose, data, productCategory, productTemplate, onSuccess }) => {
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
          <Box className="max-h-[calc(100vh-140px)] min-h-[600px] overflow-auto [border:1px_solid_var(--common-border-color)]">
            <table className={'w-full border-separate border-spacing-0 [--index-col-size:100px]'}>
              <tr>
                <th className={cn(cellClassName, ' top-0 min-w-0 max-w-[var(--index-col-size)]', indexStickyClassName)}>Index</th>
                {data[0]?.map((d) => {
                  return (
                    <th
                      title={d}
                      className={cn(
                        cellClassName,
                        `text-truncate sticky top-0 bg-[var(--dark-primary,white)]`,
                        d === 'PRODUCT DESCRIPTION' && descriptionStickyClassName
                      )}
                    >
                      {d} {d === 'PRODUCT DESCRIPTION' && <span style={{ color: '#dc3545' }}>*</span>}
                    </th>
                  );
                })}
              </tr>
              {rows?.map((row, index) => (
                <tr key={index}>
                  <td className={cn(cellClassName, indexStickyClassName)} style={{ minWidth: '100px' }}>
                    {index + 1}
                  </td>
                  {row?.map((r, i) => {
                    return i === 0 ? (
                      <td className={cn(cellClassName, 'min-w-[350px] p-[0_10px]', descriptionStickyClassName)}>
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
                      <td title={r} className={`${cellClassName} text-truncate`}>
                        {r}
                      </td>
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
            Submit
          </CustomButton>
        </CustomDialogFooter>
      </>
    </Dialog>
  );
};

export default ImportedDataDialog;
