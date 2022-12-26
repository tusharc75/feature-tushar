import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { Box, Grid, IconButton, Menu, MenuItem, Paper, Typography, Button, Tooltip } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { getLocalStorageArrayData, serviceMaster } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from '../../../StateProvider/Provider';
import { CheckboxRenderer, CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EditIcon from '@material-ui/icons/Edit';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { ExpandMore } from '@material-ui/icons';
import MangageDigitalDialog from './MangageDigitalDialog';
import routes from 'src/components/Helpers/Routes';

const Digital = ({ renderedFrom, productId }) => {

    const [digitalDialog, setDigitalDialog] = useState({ open: false, digitalId: '' });
    const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });

    const {
        state: { permissions, user, selectedEntity }
    }: any = useData();
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, pageSizes, search, filters, sorting, selectedRecords, limit, appendRows } = state;
    const toastConfig = useContext(CustomToastContext);
    const [anchorActionEl, setAnchorActionEl] = useState(null);
    const [columns, setColumns] = useState(null);

    const staticGridColumns = [
        { field: 'title', headerName: 'Title', show: true, cellRenderer: 'commonRenderer' },
        { field: 'type', headerName: 'Type', show: true, cellRenderer: 'commonRenderer' },
        { field: 'file', headerName: 'Files', show: true, cellRenderer: 'commonRenderer' },
        { field: 'key', headerName: 'Key', show: true, cellRenderer: 'commonRenderer' },
        { field: 'internal', headerName: 'Internal', show: true, cellRenderer: 'checkboxRenderer' },
        // { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        // { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];

    useEffect(() => {
        fetchDigitalData();
    }, [productId]);

    const fetchDigitalData = async () => {
        dispatch({ type: 'loading', loading: true });
        setColumns(null);
        axiosInstance()
            .get(`${routes.product.path}/${productId}/digital-product`)
            .then(({ data: { data } }) => {
                data?.forEach((e: any) => {
                    e.file = e?.file?.toString();
                });
                dispatch({
                    type: 'initialize',
                    data: data,
                    count: data.length
                });
                dispatch({ type: 'loading', loading: false });
                setColumns(staticGridColumns);
            })
            .catch((err) => {
                dispatch({ type: 'loading', loading: false });
                setColumns(staticGridColumns);
                toastConfig.setToastConfig(err);
            });
    };

    const handleDelete = () => {
        axiosInstance()
            .put(`${routes.product.path}/${productId}/digital-product/remove`, { ids: showConfirmBox.ids })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    message: data.message,
                    severity: 'success'
                });
                fetchDigitalData();
                setShowConfirmBox({ open: false, ids: null });
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const ActionsRenderer = (params) => (
        <>
            {' '}
            {permissions?.product?.isUpdate && (
                <>
                    <HtmlTooltip title="Edit">
                        <IconButton
                            aria-label="setting"
                            onClick={(e) => {
                                setDigitalDialog({ open: true, digitalId: params?.data?._id });
                            }}
                            size="small"
                        >
                            <EditIcon color="primary" fontSize="small" />
                        </IconButton>
                    </HtmlTooltip>
                    <HtmlTooltip title="Delete">
                        <IconButton
                            size="small"
                            aria-label="Clone"
                            onClick={() => {
                                setShowConfirmBox({ open: true, ids: [params?.data?._id] });
                            }}
                        >
                            <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                    </HtmlTooltip>
                </>
            )}
        </>
    );

    const frameworkComponents = {
        actionsRenderer: ActionsRenderer,
        checkboxRenderer: CheckboxRenderer,
        commonRenderer: CommonRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
    };

    const openActions = (event) => {
        setAnchorActionEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorActionEl(null);
    };
    

    return (
        <>
            {permissions?.product?.isUpdate && (
                <Box p={1}>
                    <Grid container>
                        <Grid item xs={6} md={6} sm={6}>
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    setDigitalDialog({ open: true, digitalId: '' });
                                }}
                            >
                                Add File/Key
                            </Button>
                        </Grid>
                        <Grid item xs={6} md={6} sm={6}>
                            <Box display={'flex'} justifyContent={'flex-end'}>
                                <Button
                                    variant="outlined"
                                    color="default"
                                    size="small"
                                    onClick={openActions}
                                    aria-controls="action-menu"
                                    disabled={selectedRecords.length === 0}
                                >
                                    Actions <ExpandMore />
                                </Button>
                                <Menu
                                    anchorEl={anchorActionEl}
                                    keepMounted
                                    getContentAnchorEl={null}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left'
                                    }}
                                    id="action-menu"
                                    open={Boolean(anchorActionEl)}
                                    onClose={closeActions}
                                >
                                    <MenuItem
                                        onClick={() => {
                                            closeActions();
                                            setShowConfirmBox({ open: true, ids: selectedRecords?.map((e) => e._id) });
                                        }}
                                    >
                                        Delete
                                    </MenuItem>
                                </Menu>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            )}
            {columns && frameworkComponents ? (
                <CustomAgGrid
                    allowSelection={permissions?.product?.isUpdate}
                    allowAction={permissions?.product?.isUpdate}
                    columns={columns}
                    dataRows={dataRows}
                    isClientSideGrid={true}
                    frameworkComponents={frameworkComponents}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={150}
                    loading={null}
                    renderedFrom={renderedFrom}
                    refreshGrid={fetchDigitalData}
                />
            ) : (
                <Box p={2} height={500} bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            )}
            {showConfirmBox.open && (
                <ConfirmationDialog
                    open={true}
                    message={`Are you sure you want to delete this step(s)?`}
                    okBtnLoading={false}
                    onClose={() => {
                        setShowConfirmBox({ open: false, ids: null });
                    }}
                    onOk={handleDelete}
                />
            )}
            {digitalDialog.open && (
                <MangageDigitalDialog
                    open={true}
                    digitalId={digitalDialog.digitalId}
                    onClose={() => setDigitalDialog({ open: false, digitalId: '' })}
                    productId={productId}
                    onSuccess={()=>{
                        setDigitalDialog({ open: false, digitalId: '' })
                        fetchDigitalData();
                    }} />
            )}
        </>
    );
};

export default Digital;
