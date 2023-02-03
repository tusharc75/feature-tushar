import { Box, Button, Dialog, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { arrayToDropwdownOption, CustomDialogTransition, getObjKeysWithValues, getUniqueCurrencies } from 'src/constants/helpers';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomButton from '../Helpers/CustomButton';
import FormTypes from './FormTypes';
import DeleteIcon from '@material-ui/icons/Delete';

const cellWidth = 250;

const CustomEditableGrid = ({ onClose, data, fields, currency, handleSave }) => {

    const [fullScreen, setFullScreen] = useState(true);
    const [rows, setRows] = useState([]);
    const [columns, setColummns] = useState([]);

    useEffect(() => {
        const tempRows = data.map(d => {
            let tempFieldData = getObjKeysWithValues(d, fields)
            return { ...d, ...tempFieldData }
        })
        setRows(tempRows)
        generateColumnField()
    }, [fields]);

    const generateColumnField = () => {
        let column = [];
        let _fields = fields;
        _fields.forEach((ele) => {
            if (ele.type === 'currencyAmount') {
                ele.fieldLabel = ele.fieldLabel + ' ' + currency
                ele.fieldName = ele.fieldName + '_' + currency.toLowerCase()
                column.push(ele)
            }
            else {
                column.push(ele)
            }
        });
        setColummns(column)
    };

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
                showManimizeMaximize={false}
                showRequiredLabel={false}
                title={`Bulk Edit `}
                onClose={onClose}
            />
            <CustomDialogContent>
                <div className="p-3">
                    {data && data.length ?
                        <TableContainer component={Paper}>
                            <Table aria-label="customized table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={cellWidth}>Details</TableCell>
                                        {columns &&
                                            columns?.map((field: any, index: any) => (
                                                <TableCell width={cellWidth} >{field?.fieldLabel}</TableCell>
                                            ))}
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows &&
                                        rows?.map((row: any, index: any) => (
                                            <TableRow key={index}>
                                                <TableCell width={cellWidth}>{row?.detail}</TableCell>
                                                {columns &&
                                                    columns?.map((field: any, index: any) => (
                                                        <TableCell width={cellWidth}>
                                                            <FormTypes
                                                                fieldData={field}
                                                                values={row}
                                                                currency={currency}
                                                                onChange={(inputField, val) => {
                                                                    updateData(row, inputField, val)
                                                                }}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    ))}
                                                <TableCell>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Delete"
                                                            onClick={() => {
                                                            }}
                                                        >
                                                            <DeleteIcon color="error" />
                                                        </IconButton>
                                                    </Tooltip>

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
