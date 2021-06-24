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
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import { ButtonGroup, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from "@material-ui/core";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

const ProductBuilderSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter name"),
});

const chartTypeOptions = ['Horizontal Bar', 'Vertical Bar', 'Pie Chart', 'Polar Chart', 'Doughnut', 'Line Chart', 'Scatter Chart'];
const chartTypeMenuOptionSelection = ['HorizontalBar', 'VerticalBar', 'Pie', 'Polar', 'Doughnut', 'Line', 'Scatter'];

const ChartDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose } = props;
    const { handleAddComponent } = props;
    const { KPIs } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ name: "", chartType: "HorizontalBar", kpi: KPIs[0] });
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [selectedIndexForKPI, setSelectedIndexForKPI] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [openKpiMenu, setOpenKpiMenu] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const history = useHistory();


    const handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number, menu: string) => {
        if (menu === "kpi") {
            setSelectedIndexForKPI(index);
            setOpenKpiMenu(false);
        } else {
            setSelectedIndex(index);
            setOpen(false);
        }

    }

    const handleToogleCommon = (menu: string) => {
        if (menu === "kpi") {
            setOpenKpiMenu((prevOpen) => !prevOpen);
        } else {
            setOpen((prevOpen) => !prevOpen);
        }
    }

    const handleDropDownCloseCommon = (event: React.MouseEvent<Document, MouseEvent>, menu: string) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }
        if (menu === "kpi") {
            setOpenKpiMenu(false);
        } else {
            setOpen(false);
        }
    }


    return (<Dialog
        maxWidth="sm"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
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
                                {/* <label htmlFor="email" style={{ display: 'block' }}>
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
                            </select> */}
                                <div>
                                    <div className="m-2">
                                        <span>
                                            <span className="p-2">KPI</span>
                                            <ButtonGroup size="small" variant="outlined" color="primary" ref={anchorRef} aria-label="small outlined button group">
                                                <Button >{KPIs[selectedIndexForKPI]}</Button>
                                                <Button
                                                    color="primary"
                                                    size="small"
                                                    aria-controls={openKpiMenu ? 'split-button-menu' : undefined}
                                                    aria-expanded={openKpiMenu ? 'true' : undefined}
                                                    aria-label="select merge strategy"
                                                    aria-haspopup="menu"
                                                    onClick={() => { handleToogleCommon("kpi") }}
                                                >
                                                    <ArrowDropDownIcon />
                                                </Button>
                                            </ButtonGroup>
                                            <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal >
                                                {({ TransitionProps, placement }) => (
                                                    <Grow
                                                        {...TransitionProps}
                                                        style={{
                                                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                                                        }}
                                                    >
                                                        <Paper>
                                                            <ClickAwayListener onClickAway={(event) => { handleDropDownCloseCommon(event, "kpi") }}>
                                                                <MenuList
                                                                    id="menu"
                                                                    style={{ backgroundColor: 'transparent', fontSize: '10px' }}
                                                                >
                                                                    {KPIs.map((option, index) => (
                                                                        <MenuItem
                                                                            key={option}
                                                                            selected={index === selectedIndexForKPI}
                                                                            onClick={(event) => {
                                                                                setFieldValue("kpi", option)
                                                                                handleMenuItemClick(event, index, "kpi")
                                                                            }}
                                                                            style={{ color: 'black' }}
                                                                        >
                                                                            {option}
                                                                        </MenuItem>
                                                                    ))}
                                                                </MenuList>
                                                            </ClickAwayListener>
                                                        </Paper>
                                                    </Grow>
                                                )}
                                            </Popper>
                                        </span>
                                    </div>
                                    <div className="m-2">
                                        <span>
                                            <span className="p-2">Chart Type</span>
                                            <ButtonGroup size="small" variant="outlined" color="primary" ref={anchorRef} aria-label="small outlined button group">
                                                <Button >{chartTypeOptions[selectedIndex]}</Button>
                                                <Button
                                                    color="primary"
                                                    size="small"
                                                    aria-controls={open ? 'split-button-menu' : undefined}
                                                    aria-expanded={open ? 'true' : undefined}
                                                    aria-label="select merge strategy"
                                                    aria-haspopup="menu"
                                                    onClick={() => { handleToogleCommon("chart") }}
                                                >
                                                    <ArrowDropDownIcon />
                                                </Button>
                                            </ButtonGroup>
                                            <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal >
                                                {({ TransitionProps, placement }) => (
                                                    <Grow
                                                        {...TransitionProps}
                                                        style={{
                                                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                                                        }}
                                                    >
                                                        <Paper>
                                                            <ClickAwayListener onClickAway={(event) => { handleDropDownCloseCommon(event, "chart") }}>
                                                                <MenuList
                                                                    id="menu"
                                                                    style={{ backgroundColor: 'transparent', fontSize: '10px' }}
                                                                >
                                                                    {chartTypeOptions.map((option, index) => (
                                                                        <MenuItem
                                                                            key={option}
                                                                            selected={index === selectedIndex}
                                                                            onClick={(event) => {
                                                                                setFieldValue("chartType", chartTypeMenuOptionSelection[index])
                                                                                handleMenuItemClick(event, index, "chart")
                                                                            }}
                                                                            style={{ color: 'black' }}
                                                                        >
                                                                            {option}
                                                                        </MenuItem>
                                                                    ))}
                                                                </MenuList>
                                                            </ClickAwayListener>
                                                        </Paper>
                                                    </Grow>
                                                )}
                                            </Popper>
                                        </span>
                                    </div>
                                </div>
                            </Box>

                        </Form>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button size="small" color="primary" onClick={handleClose}>Cancel</Button>
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