import React, { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, Dialog, FormControl, Grid, IconButton, TextField, TableBody, TableCell, TableHead, TableFooter, TableRow, TableContainer, Table, Typography } from '@material-ui/core';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomButton from '../../components/Helpers/CustomButton';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';


export const CustomImport = ({
    open,
    handleClose,
    resource,
    customImportHeader,
    templateImportHeader,
    file,
}) => {
    const toastConfig = useContext(CustomToastContext);
    const { setToastConfig } = useContext(CustomToastContext);
    const [keyValue, setKeyValue] = useState( () => {
        let _keyValue = [];
        customImportHeader.forEach( (_value) => {
            if(templateImportHeader.find((templateImportHeader) => templateImportHeader?.value === _value?.value) ? true : false){
                _keyValue = [..._keyValue, {templateImportHeader: _value?.value, customImportHeader: _value?.value}];
            }
        })
        return _keyValue; 
    });
    const handleCustomImport = () => {
        let body = {
            resource: resource,
            file: file,
            keyValue: keyValue,
        }
        axiosInstance()
        .post(`/import-export/custom-import/headers?resource=${resource}`, body)
        .then((res) => {
            toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: 'File uploaded successfully'
            });
        })
        .catch((err) => {
        });
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={() => handleClose()}
                TransitionComponent={CustomDialogTransition}
                fullScreen={isMobile || isTablet}
                fullWidth
                maxWidth="md"
            >
                <CustomDialogHeader
                    title="Match Custom Data Columns"
                    onClose={() => handleClose()}
                />
                <CustomDialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12}>
                            <Typography variant="body1" gutterBottom>
                                Please match the custom data columns with the template data columns from the dropdown.
                            </Typography>
                        </Grid>
                        {
                            templateImportHeader.length > 0 && (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                        <TableRow>
                                            <TableCell>Template Excel Header Columns    </TableCell>
                                            <TableCell align="right">Custom Excel Header Columns</TableCell>
                                        </TableRow>
                                        </TableHead>
                                        <TableBody>
                                        {templateImportHeader.map((_key) => (
                                            <TableRow
                                                key={_key?.value}
                                            >
                                            <TableCell component="th" scope="row"> {_key?.label} </TableCell>
                                            <TableCell align="right"> 
                                                <Autocomplete
                                                    id={_key?.value}
                                                    options={customImportHeader}
                                                    getOptionLabel={(option) => option?.label}
                                                    value={
                                                        customImportHeader.find((_value) => {
                                                            if(_value?.value === _key?.value){
                                                                // setKeyValue([...keyValue, {templateImportHeader: _key?.value, value: value?.value}]);
                                                                return true;
                                                            }
                                                            return null
                                                        })
                                                    }
                                                    onChange={(event, newValue) => {
                                                        setKeyValue([...keyValue, {templateImportHeader: _key?.value, customImportHeader: newValue?.value}])
                                                    }
                                                    }
                                                    renderInput={(params) => <TextField {...params} label="select Custom column" variant="outlined" />}
                                                />
                                            </TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )
                        }
                    </Grid>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <CustomButton
                        onClick={() => handleClose()}
                        variant="outlined"
                        color="secondary"
                    >
                        Cancel
                    </CustomButton>
                    <CustomButton
                        onClick={() => {
                            handleCustomImport();
                            // call api to import data
                        }
                        }
                        variant="contained"
                        color="secondary"
                    >
                        Import
                    </CustomButton>
                </CustomDialogFooter>
            </Dialog>
        </>
    );
};

