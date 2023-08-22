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
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment
} from '@material-ui/core';
import { read, utils, writeFile } from 'xlsx';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { makeStyles, createStyles, withStyles } from '@material-ui/styles';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CircularProgress } from '@material-ui/core';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useAppTheme } from 'src/constants/AppConfig';
import { convertInventory, productInventory, sidebarResource } from '../../../constants/helpers';
import { Formik, Form, FieldArray, Field } from 'formik';
import CustomButton from 'src/components/Helpers/CustomButton';
import { FormatTextdirectionLToROutlined } from '@material-ui/icons';

const useClasses = makeStyles(() => ({
    table: {
        // minWidth: 650
    },
    input: {
        display: 'none'
    },
    tableContainer: {
         maxHeight: 'calc(100vh - 150px)'
    }
}));

type TableContent = {
    ['id']: string;
    ['_id']: string;
    ['product']: string;
    ['serializedProduct']: boolean;
    ['srno']: string;
    ['Name']: string;
    ['assetNumber']: string;
    ['assetNumberType']: 'Auto' | 'Manual';
};

const CustomAssetDialog = ({ parsedData, handleClose, handleSuccess }) => {
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setToastConfig } = useContext(CustomToastContext);

    const classes = useClasses();

    useEffect(() => {
        if (!parsedData || parsedData == null) return;

        const { products, qty } = parsedData;

        const mappedTable = products.flatMap((p, index_1) =>
            [...Array(qty).keys()].map((_, index_2) => ({
                _id: p?.id,
                id: `${index_1 + 1}.${index_2 + 1}_${p?.id}`,
                srno: `${index_1 + 1}.${index_2 + 1}`,
                Name: p?.productName,
                assetNumber: '',
                assetNumberType: 'Auto'
            }))
        );

        setTableData(mappedTable);

    }, [parsedData]);

    const handleFormSubmit = (values) => {
        const seenAssetNumbers = new Set();
        const duplicates = [];
    
        for (const data of values.tableData) {
            if (data.assetNumber !== '') {
                const assetNumber = data.assetNumber?.trim();
    
                if (seenAssetNumbers.has(assetNumber)) {
                    duplicates.push(data);
                } else {
                    seenAssetNumbers.add(assetNumber);
                }
            }
        }
    
        if (duplicates.length) {
            setToastConfig({
                open: true,
                message: 'One or more asset numbers are the same!',
                type: 'error'
            });
            // return false;
        } else {
            const updatedParsedData = {
                ...parsedData,
                products: parsedData.products.map((product) => {
                    const updatedProduct = { ...product };
                    const matchingTableData = values.tableData.find((data) => data._id === product.id);
        
                    if (matchingTableData && matchingTableData.assetNumberType === 'Manual') {
                        if (!updatedProduct.assetNumbers) {
                            updatedProduct.assetNumbers = [];
                        }
                        updatedProduct.assetNumbers.push(matchingTableData.assetNumber);
                    }
        
                    return updatedProduct;
                }),
            };
            setLoading(true);
            axiosInstance()
              .post(`${convertInventory.api}/convert-inventory-to-asset`, updatedParsedData)
              .then(({ data: { data } }) => {
                setLoading(false);
               setToastConfig({
                  open: true,
                  type: 'success',
                  message: `Convert Inventory to Asset Successfully`
                });
                handleSuccess();
                handleClose();
              })
              .catch((error) => {
                setLoading(false);
                setToastConfig(error);
              });
            
        }
    };
    
    const validateForm = (values) => {
        const errors = {};
    
        values.tableData.forEach((data, index) => {
            const assetNumberType = data.assetNumberType;
            const assetNumber = data.assetNumber;
    
            if (assetNumberType === 'Manual' && !assetNumber) {
                errors[`tableData.${index}.assetNumber`] = 'Asset Number is required';
            }
        });
    
        return errors;
    };
    

    return (
        <Dialog open onClose={handleClose} fullScreen>
            <CustomDialogHeader title={`Assign Asset Numbers`} onClose={handleClose} />
            <Formik
                initialValues={{ tableData }}
                onSubmit={handleFormSubmit}
                validate={validateForm}
                validateOnMount
            >
                {({ values, handleSubmit, setFieldValue, errors }) => (
                    <Form onSubmit={handleSubmit}>
                        <CustomDialogContent>
                            <Box display="flex" flexDirection="column">
                                <TableContainer className={classes.tableContainer} component={Paper}>
                                    <Table className={classes.table} aria-label="customized table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Index</TableCell>
                                                <TableCell align="left">Product Name</TableCell>
                                                <TableCell>Asset Number Type</TableCell>
                                                <TableCell align="left">{'Asset Number'}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <FieldArray name="tableData">
                                                {({ push }) => (
                                                    <>
                                                        {values.tableData.map((data, index) => (
                                                            <TableRow key={data.id} style={{ height: '40px' }}>
                                                                <TableCell component="th" scope="row">
                                                                    {data.srno}
                                                                </TableCell>
                                                                <TableCell align="left">{data.Name}</TableCell>
                                                                <TableCell align="left">
                                                                    <FormControl variant="outlined">
                                                                        <Field
                                                                            name={`tableData.${index}.assetNumberType`}
                                                                            as={Select}
                                                                            onChange={e => {
                                                                                setFieldValue(
                                                                                    `tableData.${index}.assetNumberType`,
                                                                                    e.target.value
                                                                                );
                                                                                if (e.target.value === 'Auto') {
                                                                                    setFieldValue(
                                                                                        `tableData.${index}.assetNumber`,
                                                                                        ''
                                                                                    );
                                                                                }
                                                                            }}
                                                                            style={{height:'40px', width: '250px', backgroundColor: 'white' }}
                                                                        >
                                                                            <MenuItem value="Auto">Auto</MenuItem>
                                                                            <MenuItem value="Manual">Manual</MenuItem>
                                                                        </Field>
                                                                    </FormControl>
                                                                </TableCell>
                                                                <TableCell align="left">
                                                                    <FormControl fullWidth>
                                                                        <TextField
                                                                            name={`tableData.${index}.assetNumber`}
                                                                            value={data.assetNumber}
                                                                            fullWidth
                                                                            // size="small"
                                                                            variant="outlined"
                                                                            placeholder= {data.assetNumberType === 'Auto' ? 'Auto Generate' : 'Asset Number'}
                                                                            autoComplete="off"
                                                                            disabled={data.assetNumberType === 'Auto'}
                                                                            InputProps={{
                                                                                style: {
                                                                                    background: data.assetNumberType === 'Auto' ? '#f0f0f0' : 'white',
                                                                                    width: '250px',
                                                                                    flex: '1',
                                                                                    borderRadius: 4,
                                                                                    ...(data.assetNumberType === 'Auto' ? { pointerEvents: 'none' } : {}),
                                                                                },
                                                                                startAdornment: (
                                                                                    <InputAdornment position="start">
                                                                                        {data.assetNumberType === 'Manual' && <span style={{ color: 'red' }}>*</span>}
                                                                                    </InputAdornment>
                                                                                ),
                                                                            }}
                                                                            helperText={errors[`tableData.${index}.assetNumber`]}
                                                                            error={Boolean(errors[`tableData.${index}.assetNumber`])}
                                                                            style={{ whiteSpace: 'nowrap' }}
                                                                            onChange={e => {
                                                                                const { value } = e.target;
                                                                                setFieldValue(
                                                                                    `tableData.${index}.assetNumber`,
                                                                                    value
                                                                                );
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </>
                                                )}
                                            </FieldArray>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Box alignSelf="flex-end" mb={2}>
                                <CustomButton type="submit" variant="contained" size="large" color="primary" disabled={loading} loading={loading}>
                                    Convert
                                </CustomButton>
                            </Box>
                        </CustomDialogFooter>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
};

export default CustomAssetDialog;
