import React, { useEffect, useState, useContext } from 'react';
import {
    Dialog,
    Box,
    TextField,
    Table,
    TableHead,
    Paper,
    TableContainer,
    TableBody,
    TableCell,
    TableRow,
    FormControl,
    Select,
    MenuItem,
    Link
} from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { makeStyles } from '@material-ui/styles';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { convertInventory } from '../../../constants/helpers';
import { Formik, Form, FieldArray, Field } from 'formik';
import CustomButton from 'src/components/Helpers/CustomButton';
import { read, utils, writeFile } from 'xlsx';
import {
    serializedAsset
} from '../../../constants/helpers';
import Loader from 'src/components/Loader';

const useClasses = makeStyles(() => ({
    table: {
        // minWidth: 650
    },
    input: {
        display: 'none'
    },
    tableContainer: {
        maxHeight: 'calc(100vh - 125px)',
        boxShadow: 'none'
    },
}));

const CustomAssetDialog = ({ parsedData, handleClose, handleSuccess }) => {
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setToastConfig } = useContext(CustomToastContext);
    const [loadingTable, setLoadingTable] = useState(false);
    const [isAssetTypePresent, setIsAssetTypePresent] = useState(false);

    const classes = useClasses();

    useEffect(() => {
        if (!parsedData || parsedData == null) return;

        setLoadingTable(true);
        axiosInstance()
            .get(`/field?resource=${serializedAsset.resource}`)
            .then(({ data: { data } }) => {
                const foundData = data.find((d) => d?.fieldData?.fieldName === "assetNumberType");
                if (foundData) {
                    setIsAssetTypePresent(true);
                }

                const { products, qty } = parsedData;
                const mappedTable = products.flatMap((p, index_1) =>
                    [...Array(qty).keys()].map((_, index_2) => ({
                        _id: p?.id,
                        id: `${index_1 + 1}.${index_2 + 1}_${p?.id}`,
                        srno: `${index_1 + 1}.${index_2 + 1}`,
                        Name: p?.productName,
                        assetNumber: '',
                        assetNumberType: !foundData ? 'Manual' : 'Auto'
                    }))
                );

                setTableData(mappedTable);

                setLoadingTable(false);

            }).catch((err) => {
                setLoadingTable(false);
                setToastConfig(err);
            })



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

    const handleExport = (values) => {
        const errors = validateForm(values);
        if (Object.keys(errors)?.length >= 1) {
            setToastConfig({
                open: true,
                type: 'error',
                message: `Please fill all the fields`
            });
        }
        else {

            let json_data = values.tableData.map((data) => {
                const rowData = {
                    'Index': data['srno'],
                    Name: data['Name'],
                    'Asset Number': data.assetNumberType === 'Auto' ? 'Auto Generated' : data.assetNumber,
                };

                if (isAssetTypePresent) {
                    rowData['Asset Number Type'] = data.assetNumberType;
                }

                return isAssetTypePresent
                    ? {
                        'Index': rowData['Index'],
                        Name: rowData['Name'],
                        'Asset Number Type': rowData['Asset Number Type'],
                        'Asset Number': rowData['Asset Number'],
                    }
                    : rowData;
            });


            let header = [];

            if (isAssetTypePresent) {
                header = ['Index', 'Name', 'Asset Number Type', 'Asset Number'];
            }
            else {
                header = ['Index', 'Name', 'Asset Number'];
            }

            const ws = utils.json_to_sheet(json_data);
            if (header.length) {
                utils.sheet_add_aoa(ws, [header]);
            }
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, 'Sheet1');
            writeFile(wb, 'Inventory to Asset.xlsx');
        }
    };


    const handleImport = (e: React.ChangeEvent<HTMLInputElement>, setValues, values) => {

        e.preventDefault();
        const files = e.target.files,
            f = files[0];
        let reader = new FileReader();
        reader.onload = function (e) {
            const data = e.target.result;
            let readedData = read(data, { type: 'binary' });
            const wsname = readedData.SheetNames[0];
            const ws = readedData.Sheets[wsname];
            const dataParse = utils.sheet_to_json(ws, { header: 1 });
            if (dataParse.length > 1) {
                dataParse.splice(0, 1);
                let option = [];
                dataParse?.forEach((row) => {
                    let rowInsert = {};
                    if (isAssetTypePresent) {

                        if (row[0] && row[1] && row[2]) {
                            rowInsert['srno'] = row[0]?.toString();
                            rowInsert['product'] = row[1]?.toString();
                            rowInsert['assetNumberType'] = row[2]?.toString();
                            rowInsert['assetNumber'] = row[2]?.toString() === "Manual" ? row[3]?.toString() : '';
                            option.push(rowInsert);
                        }
                    }
                    else {
                        if (row[0] && row[1] && row[2]) {
                            rowInsert['srno'] = row[0]?.toString();
                            rowInsert['product'] = row[1]?.toString();
                            rowInsert['assetNumber'] = row[2]?.toString();
                            option.push(rowInsert);
                        }
                    }
                });
                const updatedTableData = values.tableData.map((existingData) => {
                    const matchingRow = option.find((foundRows) =>
                        existingData.srno === foundRows.srno && existingData.Name === foundRows.product
                    );

                    if (matchingRow && isAssetTypePresent) {
                        return {
                            ...existingData,
                            assetNumber: matchingRow.assetNumber,
                            assetNumberType: matchingRow.assetNumberType,
                        };
                    }

                    else if (matchingRow) {
                        return {
                            ...existingData,
                            assetNumber: matchingRow.assetNumber
                        };
                    }

                    return existingData; // Preserve rows where there is no matchingRow
                });

                setValues((prevState) => ({
                    ...prevState,
                    tableData: updatedTableData,
                }));

            }
        };
        reader.readAsBinaryString(f);
        e.target.value = null;
    };


    return (
        <Dialog open onClose={handleClose} fullScreen>

            {loadingTable ? (
                <>
                    <CustomDialogHeader title={`Assign Asset Numbers`} onClose={handleClose} />
                    <CustomDialogContent style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader />
                    </CustomDialogContent>
                </>

            ) : (
                <Formik
                    initialValues={{ tableData }}
                    onSubmit={handleFormSubmit}
                    validate={validateForm}
                    validateOnMount
                >
                    {({ values, handleSubmit, setFieldValue, errors, setValues }) => (
                        <Form onSubmit={handleSubmit}>
                            <CustomDialogHeader title={`Assign Asset Numbers`} onClose={handleClose} />
                            <CustomDialogContent>

                                <Box display="flex" flexDirection="column" style={{ minHeight: 'calc(100vh - 125px)' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" style={{ marginTop: '20px' }}>
                                        <Box mb={1} display="flex">
                                            <Box>
                                                <Link className="cursor-pointer" onClick={() => handleExport(values)}>
                                                    Export to excel
                                                </Link>
                                            </Box>
                                            <Box ml={2}>
                                                <input accept="xlsx" className={classes.input} onChange={(e) => handleImport(e, setValues, values)} id="import-file" multiple type="file" />
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
                                                    <TableCell>Index</TableCell>
                                                    <TableCell align="left">Product Name</TableCell>
                                                    {(isAssetTypePresent) && (<TableCell>Asset Number Type</TableCell>)}
                                                    <TableCell align="left">{'Asset Number'}</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <FieldArray name="tableData">
                                                    {({ push }) => (
                                                        <>
                                                            {values.tableData.map((data, index) => (
                                                                <TableRow key={data.id} style={{ height: '100px' }}>
                                                                    <TableCell component="th" scope="row">
                                                                        {data.srno}
                                                                    </TableCell>
                                                                    <TableCell align="left">{data.Name}</TableCell>
                                                                    {(isAssetTypePresent) &&
                                                                        (<TableCell align="left">
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
                                                                                    style={{ height: '40px', width: '250px', }}
                                                                                    MenuProps={{
                                                                                        anchorOrigin: {
                                                                                            vertical: 'bottom',
                                                                                            horizontal: 'left',
                                                                                        },
                                                                                        transformOrigin: {
                                                                                            vertical: 'top',
                                                                                            horizontal: 'left',
                                                                                        },
                                                                                        getContentAnchorEl: null,
                                                                                    }}
                                                                                >
                                                                                    <MenuItem value="Auto">Auto</MenuItem>
                                                                                    <MenuItem value="Manual">Manual</MenuItem>
                                                                                </Field>

                                                                            </FormControl>
                                                                        </TableCell>)}
                                                                    <TableCell align="left">
                                                                        <FormControl fullWidth>
                                                                            <TextField
                                                                                name={`tableData.${index}.assetNumber`}
                                                                                value={data.assetNumber}
                                                                                fullWidth
                                                                                variant="outlined"
                                                                                placeholder={data.assetNumberType === 'Auto' ? 'Auto Generate' : 'Asset Number'}
                                                                                autoComplete="off"
                                                                                disabled={data.assetNumberType === 'Auto'}
                                                                                InputProps={{
                                                                                    style: {
                                                                                        height: '40px',
                                                                                        width: '250px',
                                                                                    },
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
                            <div style={{ marginTop: 'auto' }}>
                                <CustomDialogFooter >

                                    <CustomButton type="submit" variant="contained" color="primary" disabled={loading} loading={loading}>
                                        Convert
                                    </CustomButton>

                                </CustomDialogFooter>
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </Dialog>
    );
};

export default CustomAssetDialog;
