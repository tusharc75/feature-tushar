import React, { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, Dialog, FormControl, Grid, IconButton, TextField } from '@material-ui/core';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomButton from '../Helpers/CustomButton';
import { Autocomplete } from '@material-ui/lab';
import { AiFillEdit } from 'react-icons/ai';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import ConfirmationDialog from '../Helpers/ConfirmationDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ViewDialog } from './ViewDialog';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export const PreviewDialog = ({
    type,
    handleClose,
    handleViewPdf,
    loadingType,
    loading,
    hideDetailButton,
    allColumn,
    resource,
    defaultColumns,
    columns,
    button1Title,
    button2Title
}) => {
    const toastConfig = useContext(CustomToastContext);

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [isViewDeleteConfirm, setIsViewDeleteConfirm] = useState({ open: false, id: null });
    const [selectedView, setSelectedView] = useState(null);
    const [views, setViews] = useState([]);
    const [showSaveViewDialog, setShowSaveViewDialog] = useState({ open: false, data: null });
    const [visibleColumnsPdf, setVisibleColumnsPdf] = useState([]);

    useEffect(() => {
        const temp =
            defaultColumns?.length > 0
                ? allColumn?.filter((e: any) => defaultColumns?.includes(e?.fieldName))?.map((e) => e.fieldLabel)
                : allColumn?.map((e) => e.fieldLabel);
        setVisibleColumnsPdf([...temp]);
    }, [columns]);

    useEffect(() => {
        fetchUserViews();
    }, []);

    const fetchUserViews = () => {
        axiosInstance()
            .get(`/pdf/view?resource=${resource}`)
            .then(({ data: { data } }) => {
                setViews(data);
                // if (data?.length && !selectedView) {
                //     handleSelectView(data[0])
                // }
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const handleDeleteView = () => {
        axiosInstance()
            .post(`/pdf/view/remove`, { _id: isViewDeleteConfirm.id })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
                fetchUserViews();
                setIsViewDeleteConfirm({ open: false, id: null });
                setSelectedView(null);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const handleSelectView = (data) => {
        setSelectedView(data);
        if (data && data.columns) {
            const columnsArray = data?.columns?.split(',')?.map((item) => item?.trim());
            setVisibleColumnsPdf(columnsArray);
        }
    }

    return (
        <>
            <Dialog
                open={true}
                aria-labelledby="customized-dialog-title"
                maxWidth="sm"
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        handleClose();
                    }
                }}
                fullWidth
                fullScreen={fullScreen || isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
            >
                <CustomDialogHeader
                    title={`Visible Columns in ${type}`}
                    onClose={() => {
                        handleClose();
                    }}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen((prevState) => !prevState);
                    }}
                    showManimizeMaximize={true}
                    showRequiredLabel={false}
                />
                <CustomDialogContent>
                    <Grid container justify="space-between" alignItems="center">
                        <Grid item style={{ padding: 5, marginTop: 10 }} xs={12} md={12} sm={12}>
                            <FormControl fullWidth>
                                <Box pb={5}>
                                    <Autocomplete
                                        fullWidth
                                        size="small"
                                        value={selectedView}
                                        onChange={(e, selectedOption) => {
                                            handleSelectView(selectedOption)
                                        }}
                                        getOptionLabel={(option) => option.name}
                                        renderOption={(option) => (
                                            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} width={'100%'}>
                                                <span style={{ width: 'calc(100% - 71px)' }}>{option?.name}</span>
                                                <Box>
                                                    <IconButton size="small" style={{ marginRight: '20px' }}>
                                                        <AiFillEdit />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => setIsViewDeleteConfirm({ open: true, id: option._id })}>
                                                        <RiDeleteBin6Fill />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        )}
                                        id="controllable-states-demo"
                                        options={views}
                                        renderInput={(params) => <TextField {...params} fullWidth label="Select View" variant="outlined" />}
                                    />
                                </Box>
                                <Autocomplete
                                    id="demo-mutiple-chip"
                                    fullWidth
                                    size="small"
                                    multiple
                                    value={visibleColumnsPdf}
                                    onChange={(e, val) => {
                                        if (
                                            val.includes('Select All') &&
                                            ['Select All', ...allColumn?.map((e) => e?.fieldLabel)].sort().toString() !== val.sort().toString()
                                        ) {
                                            setVisibleColumnsPdf(allColumn?.map((e) => e?.fieldLabel));
                                        } else if (['Select All', ...allColumn?.map((e) => e?.fieldLabel)].sort().toString() === val.sort().toString()) {
                                            setVisibleColumnsPdf([]);
                                        } else {
                                            setVisibleColumnsPdf(allColumn?.map((e) => e?.fieldLabel)?.filter((d) => val.includes(d)));
                                        }
                                    }}
                                    options={['Select All', ...allColumn?.map((e) => e?.fieldLabel)]}
                                    disableCloseOnSelect
                                    getOptionLabel={(option) => option}
                                    renderOption={(option, { selected }) => (
                                        <React.Fragment>
                                            <Checkbox
                                                icon={icon}
                                                checkedIcon={checkedIcon}
                                                style={{ marginRight: 8 }}
                                                checked={
                                                    ['Select All', ...allColumn?.map((e) => e?.fieldLabel)].sort().toString() ===
                                                        ['Select All', ...visibleColumnsPdf].sort().toString()
                                                        ? true
                                                        : selected
                                                }
                                            />
                                            {option}
                                        </React.Fragment>
                                    )}
                                    renderInput={(params) => <TextField {...params} variant="outlined" label={`Visible Columns in ${type}`} placeholder="Select" />}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <CustomButton
                        onClick={() => {
                            setShowSaveViewDialog({ open: true, data: selectedView });
                        }}
                        disabled={visibleColumnsPdf.length == 0}
                        size="small"
                        className="yellow-button"
                    >
                        {selectedView ? 'Update View' : 'Save View'}
                    </CustomButton>
                    <CustomButton
                        variant="contained"
                        className="no-shadow"
                        color="primary"
                        size="small"
                        loading={loadingType === 'Regular' || loading}
                        disabled={loadingType || visibleColumnsPdf?.length === 0}
                        onClick={(e) => {
                            handleViewPdf('Regular', visibleColumnsPdf);
                        }}
                    >
                        {button1Title}
                    </CustomButton>
                    {hideDetailButton ? null : (
                        <CustomButton
                            variant="contained"
                            color="primary"
                            className="no-shadow"
                            size="small"
                            loading={loadingType === 'Detail' || loading}
                            disabled={loadingType || visibleColumnsPdf?.length === 0}
                            onClick={(e) => {
                                handleViewPdf('Detail', visibleColumnsPdf);
                            }}
                        >
                            {button2Title}
                        </CustomButton>
                    )}
                </CustomDialogFooter>
            </Dialog>

            {isViewDeleteConfirm.open && (
                <ConfirmationDialog
                    open={true}
                    message={`Are you sure you want to delete ?`}
                    onClose={() => setIsViewDeleteConfirm({ open: false, id: null })}
                    onOk={handleDeleteView}
                />
            )}

            {showSaveViewDialog.open && (
                <ViewDialog
                    columns={visibleColumnsPdf}
                    resource={resource}
                    handleSucess={() => {
                        setShowSaveViewDialog({ open: false, data: null });
                        fetchUserViews();
                    }}
                    handleClose={() => {
                        setShowSaveViewDialog({ open: false, data: null });
                    }}
                    viewData={showSaveViewDialog.data}
                />
            )}
        </>
    );
};
