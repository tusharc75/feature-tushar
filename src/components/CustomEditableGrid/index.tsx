import { Box, Button, Dialog, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@material-ui/core';
import { useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { arrayToDropwdownOption, CustomDialogTransition, getObjKeysWithValues, getUniqueCurrencies, yupSchema } from 'src/constants/helpers';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomButton from '../Helpers/CustomButton';
import FormTypes from './FormTypes';
import DeleteIcon from '@material-ui/icons/Delete';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { FieldArray, Form, Formik, FormikProps } from 'formik';

const cellWidth = 250;

const CustomEditableGrid = ({ onClose, data, fields, currency, handleSave }) => {

    const [fullScreen, setFullScreen] = useState(true);
    const [rows, setRows] = useState([]);
    const [columns, setColummns] = useState([]);
    const formikRef = useRef<FormikProps<{ rows: any[] }>>();

    useEffect(() => {
        generateRows()
        generateColumnField()
    }, []);

    const generateRows = () => {
        const tempRows = data.map(d => {
            let tempFieldData = getObjKeysWithValues(d, fields)
            return { ...d, ...tempFieldData }
        })
        setRows(tempRows)
    };

    const generateColumnField = () => {
        let column = [];
        let _fields = JSON.parse(JSON.stringify(fields));
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
            // prevState[tempIndex][inputField] = value
            const values = { [inputField]: value }
            const calValues = autoCalculateSpecificFields(values, { ...values, ...prevState[tempIndex] }, fields)
            prevState[tempIndex] = { ...prevState[tempIndex], ...calValues }
            return [...prevState]
        });

    }

    function validate(values) {
        const errors = {};
        return errors;
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

                            {rows &&
                                <Formik
                                    initialValues={{ rows: rows }}
                                    enableReinitialize={true}
                                    innerRef={formikRef}
                                    validationSchema={yupSchema(fields)}
                                    validateOnMount
                                    validate={validate}
                                    onSubmit={() => { }}>
                                    {({ values,
                                        errors,
                                        touched,
                                        setFieldValue,
                                        submitForm,
                                    }) => (
                                        <>
                                            <Form>
                                                <Table aria-label="customized table">
                                                    <FieldArray
                                                        name="bulk_edit_element"
                                                        render={(arrayHelpers) => (
                                                            <div>
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
                                                                    {values.rows?.map((row: any, rowIndex: any) => (
                                                                        <TableRow key={rowIndex}>
                                                                            <TableCell width={cellWidth}>{row?.detail}</TableCell>
                                                                            {columns &&
                                                                                columns?.map((field: any, colIndex: any) => (
                                                                                    <TableCell width={cellWidth}>
                                                                                        <FormTypes
                                                                                            fieldData={field}
                                                                                            values={row}
                                                                                            currency={currency}
                                                                                            errors={errors}
                                                                                            touched={touched}
                                                                                            onChange={(inputField, val) => {
                                                                                                let tempValue = {
                                                                                                    ...values.rows[rowIndex],
                                                                                                    [inputField]: val
                                                                                                }
                                                                                                arrayHelpers.replace(rowIndex, tempValue);
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
                                                            </div>
                                                        )}
                                                    />
                                                </Table>
                                            </Form>

                                        </>
                                    )}
                                </Formik>}

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
