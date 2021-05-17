import React, { useRef, useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import routes from "../../components/Helpers/Routes";
import BarChartIcon from '@material-ui/icons/BarChart';


const ProductBuilderSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter name"),
});


const ChartDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose } = props;
    const {handleAddComponent} =props;
    const {KPIs} =props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ name: "",chartType:"HorizontalBar",kpi:KPIs[0] });
    const history = useHistory();

    

    return (<Dialog
        maxWidth="sm"
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
    >
        <Formik
            enableReinitialize={true}
            initialValues={initialData}
            validationSchema={ProductBuilderSchema}
            validateOnMount
            onSubmit={handleAddComponent}>
            {({ values,
                errors,
                touched,
                setFieldValue,
                submitForm,
            }) => (
                <Fragment>
                    <CustomDialogHeader title={"Add new Chart Component"} onClose={handleClose}></CustomDialogHeader>
                    <CustomDialogContent>
                        <Form autoComplete="off" autoCorrect="off" noValidate >
                            <Box p={1}>
                                <TextField
                                    variant="outlined"
                                    type="text"
                                    label="Title"
                                    required={true}
                                    name="name"
                                    fullWidth
                                    margin="dense"
                                    value={values["name"]}
                                    error={touched["name"] && Boolean(errors["name"])}
                                    helperText={touched["name"] && errors["name"]}
                                    onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
                                />
                            </Box>
                            <Box>
                            <label htmlFor="email" style={{ display: 'block' }}>
                                KPI
                            </label>
                            <select
                                name="KPI"
                                value={values["kpi"]}
                                style={{ display: 'block' }}
                                onChange={(e) => setFieldValue("kpi", e.target.value)}
                            >
                                {KPIs.map((kpi) => <option key={kpi} value={kpi}>{kpi}</option>)}
                            </select>
                            </Box>
                            <Box>
                            <label htmlFor="email" style={{ display: 'block' }}>
                                Chart Type
                            </label>
                            <select
                                name="Chart Tyoe"
                                value={values["chartType"]}
                                style={{ display: 'block' }}
                                onChange={(e) => setFieldValue("chartType", e.target.value.trimStart())}
                            >
                                <option value="HorizontalBar">Horizontal Bar</option>
                                <option value="VerticalBar">Vertical Bar</option>
                                <option value="Pie">Pie Chart</option>
                                <option value="Polar">Polar Chart</option>
                                <option value="Doughnut">Doughnut</option>
                                <option value="Line">Line Chart</option>
                                <option value="Scatter">Scatter Chart</option>
                            </select>
                            </Box>
                            
                        </Form>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button color="primary" onClick={handleClose}>Cancel</Button>
                        <CustomButton
                            loading={loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                            onClick={submitForm}
                        > Save</CustomButton>
                    </CustomDialogFooter>
                </Fragment>
            )}
        </Formik>
    </Dialog>
    );
}

export default ChartDialog;