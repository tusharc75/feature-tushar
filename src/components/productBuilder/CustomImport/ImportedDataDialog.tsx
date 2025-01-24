import { Delete } from '@mui/icons-material';
import { Box, CircularProgress, Dialog, IconButton, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Fragment, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn, CustomDialogTransition } from 'src/constants/helpers';

const cellClassName =
  'w-[220px] max-w-[220px] p-[10px] text-left [border-bottom:1px_solid_var(--common-border-color)] [border-right:1px_solid_var(--common-border-color)]';
const indexStickyClassName = 'sticky sm:left-0 z-10 w-[var(--index-col-size)] bg-[var(--dark-primary,white)]';
const descriptionStickyClassName = 'sticky sm:left-[var(--index-col-size)] z-10 bg-[var(--dark-primary,white)]';
const actionStickyClassName = 'sticky right-0 z-10 bg-[var(--dark-primary,white)]';

const ImportedDataDialog = ({ handleClose, data, productCategory, productTemplate, onSuccess }) => {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState(null);

  useEffect(() => {
    let query = `/product`;
    if (productCategory) {
      query += `?filterById=${JSON.stringify([
        { field: 'productCategory', term: productCategory },
        { field: 'productTemplate', term: productTemplate }
      ])}&filterType="and"`;
    }
    axiosInstance()
      .get(query)
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
                <th className={cn(cellClassName, ' top-0 min-w-0 max-w-[var(--index-col-size)]', actionStickyClassName)}>Action</th>
              </tr>
              {rows?.map((row, index) => (
                <tr key={index}>
                  <td className={cn(cellClassName, `sticky left-0 z-[1] bg-[--dark-secondary,white]`)} style={{ minWidth: '100px' }}>
                    {index + 1}
                  </td>
                  {row?.map((r, i) => {
                    return i === 0 ? (
                      <td className={cn(cellClassName, `min-w-[350px] p-[0_10px]`, descriptionStickyClassName, 'z-[1]')}>
                        <Autocomplete
                          id="custom-import-product-description"
                          size="small"
                          fullWidth
                          options={products || []}
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
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              margin="dense"
                              variant="outlined"
                              size="small"
                              slotProps={{
                                input: {
                                  ...params.InputProps,
                                  endAdornment: (
                                    <Fragment>
                                      {!products ? <CircularProgress color="inherit" size={20} /> : null}
                                      {params.InputProps.endAdornment}
                                    </Fragment>
                                  )
                                }
                              }}
                            />
                          )}
                        />
                      </td>
                    ) : (
                      <td title={r} className={`${cellClassName} text-truncate`}>
                        {r}
                      </td>
                    );
                  })}
                  <td className={cn(cellClassName, actionStickyClassName, 'z-[1]')} style={{ minWidth: '100px' }}>
                    <IconButton
                      size="small"
                      aria-label="delete"
                      onClick={() => {
                        const _rows = [...rows];
                        _rows.splice(index, 1);
                        setRows([..._rows]);
                      }}
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </table>
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton buttonType="transparent" onClick={handleClose}>
            Cancel
          </ThemeButton>
          <ThemeButton onClick={handleSave} buttonType="theme" disabled={!rows?.every((r) => r[0])}>
            Submit
          </ThemeButton>
        </CustomDialogFooter>
      </>
    </Dialog>
  );
};

export default ImportedDataDialog;
