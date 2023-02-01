import { Box, Button, Dialog, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { arrayToDropwdownOption, CustomDialogTransition, getObjKeysWithValues } from 'src/constants/helpers';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomButton from '../Helpers/CustomButton';
import FormTypes from './FormTypes';

const CustomEditableGrid = ({ onClose, data, fields, currency, handleSave }) => {

    const [fullScreen, setFullScreen] = useState(true);
    const [rows, setRows] = useState([]);

    useEffect(() => {
        const tempRows = data.map(d => {
            let tempFieldData = getObjKeysWithValues(d, fields)
            return { ...d, ...tempFieldData }
        })
        setRows(tempRows)
    }, []);

    const updateData = (row, inputField, value) => {
        setRows((prevState) => {
            let tempIndex = prevState.findIndex((obj => obj._id === row._id));
            prevState[tempIndex][inputField] = value
            return [...prevState]
        });

    }


    return (
        <Dialog
            maxWidth="md"
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
            fullWidth
        >
            <CustomDialogHeader
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
                title={"Inventory States"}
                onClose={onClose}
            />
            <CustomDialogContent>
                <div className="p-3">
                    {data && data.length ?
                        <TableContainer component={Paper}>
                            <Table aria-label="customized table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={200}>Details</TableCell>
                                        {fields &&
                                            fields?.map((field: any, index: any) => (
                                                <TableCell width={300} >{field.type === 'currencyAmount' ? field.fieldLabel + ' ' + currency : field?.fieldLabel}</TableCell>
                                            ))}
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows &&
                                        rows?.map((row: any, index: any) => (
                                            <TableRow key={index}>
                                                <TableCell>{row?.detail}</TableCell>
                                                {fields &&
                                                    fields?.map((field: any, index: any) => (
                                                        <TableCell>
                                                            <FormTypes
                                                                {...field}
                                                                fieldData={field}
                                                                values={row}
                                                                label={field.type === 'currencyAmount' ? field.fieldLabel + ' ' + currency : field?.fieldLabel}
                                                                name={field.type === 'currencyAmount' ? field.fieldName + '_' + currency.toLowerCase() : field.fieldName}
                                                                type={field.type}
                                                                options={field.fieldName === 'unit' ? arrayToDropwdownOption(row?.[`${row.type}Detail`].unit) :
                                                                    field.fieldName === 'pricingMethod' ? arrayToDropwdownOption(row?.[`${row.type}Detail`].pricingMethod) :
                                                                        field.option}
                                                                required={field.required}
                                                                currency={currency}
                                                                onChange={(inputField, val) => {
                                                                    updateData(row, inputField, val)
                                                                }}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    ))}
                                                <TableCell>
                                                    <Button
                                                        variant={"contained"}
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => {
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        : <Box
                            p={2}
                            height={500}
                            bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>}
                </div>
            </CustomDialogContent>
            <CustomDialogFooter>
                <Button
                    size="small"
                    color="primary"
                    onClick={onClose}
                >{"Close"}</Button>
                <CustomButton
                    loading={false}
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={() => { handleSave(rows) }}
                > Save
                </CustomButton>
            </CustomDialogFooter>
        </Dialog>
    );
};

export default CustomEditableGrid;
