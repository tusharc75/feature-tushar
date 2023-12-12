import { Box, Button, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { Delete, ExpandMore } from '@material-ui/icons';
import { startCase, uniqBy } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { flattenArray } from 'src/constants/columns';
import { ASSET_STATUS, sublease, treeToFlatArray } from 'src/constants/helpers';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { fetch_sublease_product_fields } from 'src/components/Sublease/helper';
import { subleaseMessage } from 'src/constants/messageHelpers';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';


function SerializedAsset({ subleaseData, setNextStep, setNextStepToolTip, allowedToEdit, stepFullScreen, renderedFrom }) {
    const toastConfig = useContext(CustomToastContext);
    const { generateColumns } = useColumns();
    const { state, dispatch } = useTableReducer();
    const { dataRows, selectedRecords } = state;

    const [columns, setColumns] = useState(null);
    const [anchorActionEl, setAnchorActionEl] = useState(null);
    const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false);
    const [assetAssignedProduct, setAssetAssignedProduct] = useState([]);
    const [isAdding, setAdding] = useState(false);
    const [deleteData, setDeleteData] = useState([]);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        setNextStep(false);
        var data = await fetch_sublease_product_fields(subleaseData?.currency);
        data?.forEach((e) => {
            e.isColumnEditable = false;
        });
        const newColumns = generateColumns(renderedFrom, data, null, false, subleaseData?.currency);
        let coloum: any = [
            {
                accessor: 'index',
                Header: 'Index',
                width: 70,
                sticky: 'left',
                Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
                Footer: () => {
                    return <>Total</>;
                }
            },
            {
                accessor: 'type',
                Header: 'Type',
                sticky: isMobile || isTablet ? 'none' : 'left',
                disableFilters: true,
                width: 200,
                Cell: ({ row }) =>
                    row.original['type'] ? (
                        <p>
                            {row.original?.type === 'asset' && row.original?.isNonSerializeAsset ? 'Inventory' : `${startCase(row.original?.type)} `}
                        </p>
                    ) : (
                        <NoDataCell />
                    )
            },
            {
                accessor: 'detail',
                Header: 'Details',
                width: 300,
                disabled: true,
                Cell: ({ row }) => (
                    <div className="d-flex gap-2 align-items-center">
                        <p className="text-truncate" title={row.original.detail}>
                            {row.original.detail}
                        </p>
                        {(
                            <IconButton
                                size="small"
                                onClick={() => {
                                    if (row.original.type === 'service') {
                                        window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                                    } else if (row.original.type === 'product') {
                                        window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                                    } else if (row.original.type === 'asset') {
                                        window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                                    } else {
                                        window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                                    }
                                }}
                            >
                                <OpenInNewIcon fontSize="small" color="primary" />
                            </IconButton>
                        )}
                    </div>
                ),
            },
            {
                accessor: 'description',
                Header: 'Description',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
                }
            },
            {
                accessor: 'assets',
                Header: 'Asset Assigned',
                disableFilters: false,
                Cell: ({ row }) => getAssetAssignedValues(row)
            }
        ];
        coloum = [...coloum, ...newColumns];
        coloum.push({
            accessor: 'action',
            Header: 'Action',
            sticky: 'right',
            disableFilters: true,
            canDrag: false,
            Cell: ({ row }) => {
                return <div>
                    {
                        row.original?.type === 'asset' && (
                            <span className="d-flex align-items-center gap-2">
                                {allowedToEdit && row?.original?.canRemove && (
                                    <HtmlTooltip title={`Remove`}>
                                        <IconButton
                                            size="small"
                                            disabled={row.original.status !== ASSET_STATUS.reserved}
                                            onClick={() => {
                                                setShowConfirmBox(true);
                                                setDeleteData([row.original.inventory]);
                                            }}
                                        >
                                            <Delete fontSize="small" color={row.original.status !== ASSET_STATUS.reserved ? 'disabled' : 'error'} />
                                        </IconButton>
                                    </HtmlTooltip>
                                )}
                            </span>
                        )
                    }
                </div>
            }
        });
        setColumns(coloum);
        fetchRowData();
    };

    const getAssetAssignedValues = (row) => {
        if (row?.original?.type === 'asset' || row?.original?.assetQty === 0) {
            return ' N/A ';
        }
        return (
            <p>
                {row?.original?.assetAssignedQty} / {row?.original?.assetQty}
            </p>
        );
    };

    const checkProductInside = (item, material) => {
        if (item?.type === 'product') {
            return true;
        }
        const child = material?.filter(e => e.parentId === item?._id);
        if (child?.some(e => e?.type === 'product')) {
            return true;
        }
        if (child?.length) {
            for (var ele in child) {
                return checkProductInside(child[ele], material)
            }
        }
        else {
            return false
        }
    }

    const fetchRowData = async () => {
        dispatch({ type: 'loading', loading: true });
        dispatch({ type: 'selection', selectedRecords: [] });
        setNextStep(false);
        setNextStepToolTip(null);
        try {
            var data: any = [];

            const response = await axiosInstance().get(`${sublease.api}/productpackage/${subleaseData._id}`);
            data = response?.data?.data;

            const material = data.material;
            let rows = data.material.filter((e) => e.parentId === null)?.filter((ele) => checkProductInside(ele, material) === true);

            rows.forEach((parent, i) => {
                parent.index = i + 1;
                parent.detail = `${parent.type === 'service'
                    ? parent?.serviceDetail?.serviceName
                    : parent.type === 'product'
                        ? parent?.productDetail?.productName
                        : parent?.packageDetail?.packageName
                    }`;
                parent.description =
                    parent.type === 'service'
                        ? parent?.serviceDetail?.serviceDescription || ''
                        : parent.type === 'product'
                            ? parent?.productDetail?.productDescription || ''
                            : parent.type === 'package'
                                ? parent?.packageDetail?.packageDescription || ''
                                : '';
                parent.serializedProduct = parent.type === 'product' ? parent?.productDetail?.serializedProduct : false;
                parent.assetQty = parent.qty;
                parent.assetAssignedQty = parent.serializedProduct ? data.inventory?.filter((e) => e._id === parent._id).length : 0;
                parent.realAssetQty = parent.assetQty;
                parent.realAssetAssignedQty = parent.assetAssignedQty;
                parent.subRows = generateNestedData(data.material, data.inventory, parent);
                parent.assetQty =
                    parent.subRows.filter((d) => d.type !== 'asset').length === 0
                        ? parent.assetQty
                        : parent.subRows.filter((d) => d.type !== 'asset').reduce((sum, row) => row.assetQty + sum, 0) +
                        (parent.type === 'product' ? parent.assetQty : 0);
                parent.assetAssignedQty =
                    parent.subRows.filter((d) => d.type !== 'asset').length === 0
                        ? parent.assetAssignedQty
                        : parent.subRows.filter((d) => d.type !== 'asset').reduce((sum, row) => row.assetAssignedQty + sum, 0) +
                        (parent.type === 'product' ? parent?.subRows.filter((d) => d.type === 'asset')?.length : 0);
                parent.isValid = parent.serializedProduct
                    ? parent.assetAssignedQty === parent.assetQty
                        ? true
                        : false
                    : parent.subRows.length !== 0
                        ? parent.assetAssignedQty ===
                        parent.subRows.filter((d) => d.type !== 'asset' && d.serializedProduct).reduce((sum, row) => row.assetQty + sum, 0) ||
                        parent.subRows.every((d) => d.isValid)
                        : true;

                if (parent.subRows.length && parent.isValid) {
                    if (parent.subRows.every((d) => d.isValid)) {
                        parent.isValid = true;
                    } else {
                        parent.isValid = false;
                    }
                }
            });

            if (rows.every((d) => d.isValid)) {
                setNextStep(true)
                setNextStepToolTip(null)
            } else {
                setNextStep(false)
                setNextStepToolTip(subleaseMessage.assignAssets)
            }
            dispatch({ type: 'initialize', data: rows, count: rows?.length });
            dispatch({ type: 'loading', loading: false });
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const generateNestedData = (material, inventory, parent) => {
        const subRows: any = [];
        const inventory_result = inventory?.filter((e) => e._id === parent._id);
        inventory_result?.forEach((_inventory, k) => {
            subRows.push({
                ..._inventory,
                index: `${parent.index}.${k + 1}`,
                detail: _inventory?.assetNumber ? _inventory?.assetNumber : _inventory.inventoryDetail?.assetNumber,
                description: parent?.description,
                type: 'asset',
                isNonSerializeAsset: false,
                status: _inventory.inventoryDetail?.status,
                rentalAssetStatus: _inventory?.status,
                manualStatus: _inventory.inventoryDetail?.manualStatus,
                warehouse: _inventory.inventoryDetail?.warehouse,
                _id: _inventory.inventory,
                isValid: _inventory.inventoryDetail?.manualStatus === ASSET_STATUS.reserved ? false : true,
                canRemove: true
            });
        });

        const childProduct: any = material.filter((e) => e.parentId === parent._id);
        var assetQtySUM = 0;
        var assetAssignedQtySUM = 0;
        childProduct.forEach((_subRow, j) => {
            _subRow.index = parent.index + '.' + (j + 1);
            _subRow.detail =
                _subRow.type === 'service'
                    ? _subRow?.serviceDetail?.serviceName
                    : _subRow.type === 'product'
                        ? _subRow?.productDetail?.productName
                        : _subRow?.packageDetail?.packageName;
            _subRow.description =
                _subRow.type === 'service'
                    ? _subRow?.serviceDetail?.serviceDescription || ''
                    : _subRow.type === 'product'
                        ? _subRow?.productDetail?.productDescription || ''
                        : _subRow.type === 'package'
                            ? _subRow?.packageDetail?.packageDescription || ''
                            : '';
            _subRow.serializedProduct = _subRow.type === 'product' ? _subRow?.productDetail?.serializedProduct : false;
            _subRow.assetQty =
                _subRow.type === 'product' || _subRow.type === 'package'
                    ? parent.type === 'product' || parent.type === 'package'
                        ? _subRow.qty * parent.assetQty
                        : _subRow.qty * parent.qty
                    : 0;
            _subRow.assetAssignedQty = _subRow.serializedProduct ? inventory?.filter((e) => e._id === _subRow._id).length : 0;
            _subRow.realAssetQty = _subRow.type === 'product' || _subRow.type === 'package' ? _subRow.qty * parent.realAssetQty : 0;
            _subRow.realAssetAssignedQty = _subRow.assetAssignedQty;
            let tempSubRows = generateNestedData(material, inventory, _subRow);
            _subRow.subRows = tempSubRows;
            _subRow.assetQty =
                tempSubRows.filter((d) => d.type !== 'asset').length === 0
                    ? _subRow.assetQty
                    : tempSubRows.filter((d) => d.type !== 'asset').reduce((sum, row) => row.assetQty + sum, 0) +
                    (_subRow.type === 'product' ? _subRow.assetQty : 0);
            _subRow.isValid = _subRow.serializedProduct
                ? _subRow.assetAssignedQty === _subRow.assetQty
                    ? true
                    : false
                : tempSubRows?.filter((e) => e.type === 'asset')?.length === tempSubRows?.length
                    ? true
                    : _subRow.assetAssignedQty ===
                        tempSubRows.filter((d) => d.type !== 'asset' && d.serializedProduct).reduce((sum, row) => row.assetQty + sum, 0)
                        ? true
                        : false;
            subRows.push(_subRow);
            assetAssignedQtySUM += _subRow.serializedProduct ? _subRow.assetAssignedQty : 0;
        });

        parent.assetAssignedQty += assetAssignedQtySUM;
        parent.isValid = parent.serializedProduct || parent.type === 'package' ? (parent.assetAssignedQty === parent.assetQty ? true : false) : true;

        return subRows;
    };

    const handleAssignAssets = (assets) => {
        var data = [];
        assets.forEach((e) => {
            data.push({ _id: e?._id, inventory: e.asset });
        });
        if (data.length) {
            setAdding(true);
            axiosInstance()
                .post(`${sublease.api}/asset/${subleaseData._id}`, { assets: data })
                .then(({ data }) => {
                    setAddSerializedAssetDialog(false);
                    fetchRowData()
                    dispatch({ type: 'selection', selectedRecords: [] });
                    setAssetAssignedProduct([]);
                    setAdding(false);
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                })
                .catch((error) => {
                    setAdding(false);
                    toastConfig.setToastConfig(error);
                });
        }
    };

    const disableAssignSerializedAssets = () => {
        if (selectedRecords.length === 0) return true;
        const flatArray = treeToFlatArray(selectedRecords, 'subRows').filter(
            (f) => f.type === 'product' && f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty
        );
        return flatArray.length === 0;
    };

    const handleRemoveAsset = () => {
        axiosInstance()
            .put(`${sublease.api}/asset/${subleaseData._id}/remove`, { ids: deleteData })
            .then(() => {
                setDeleting(false);
                fetchRowData();
                setDeleteData(null);
                setShowConfirmBox(false);
            })
            .catch((error) => {
                setDeleting(false);
                toastConfig.setToastConfig(error);
                setDeleteData(null);
            });
    }

    const openActions = (event) => {
        setAnchorActionEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorActionEl(null);
    };


    return (
        <Fragment>
            {allowedToEdit && (
                <Box display="flex" justifyContent="flex-end" m={1}>
                    <Box display="flex" alignItems="center" justifyContent={'flex-end'} gridColumnGap={8} flex={1}>
                        <Box display="flex" gridGap={'8px'}>
                            <Button
                                variant="contained"
                                color="primary"
                                type="button"
                                size="small"
                                disabled={disableAssignSerializedAssets()}
                                onClick={() => {
                                    setAssetAssignedProduct(selectedRecords.filter((i) => i?.type === 'product' && i?.productDetail?.serializedProduct));
                                    setAddSerializedAssetDialog(true);
                                }}
                            >
                                {`Assign ${routes.serializedAsset.title}`}
                            </Button>
                            <Button
                                variant="outlined"
                                color="default"
                                className="new-dropdown-v1"
                                size="small"
                                onClick={openActions}
                                disabled={uniqBy(flattenArray(selectedRecords), '_id')?.filter((e) => e.type === 'asset')?.length === 0}
                                aria-controls="action-menu"
                                endIcon={<ExpandMore />}
                            >
                                Actions
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
                                        const inventories = uniqBy(flattenArray(selectedRecords), '_id')?.filter((e) => e.type === 'asset')?.map((e) => e.inventory);
                                        setShowConfirmBox(true);
                                        setDeleteData(inventories);
                                        closeActions();
                                    }}
                                >
                                    Delete
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Box>
                </Box>
            )}
            <Grid container spacing={2}>
                <Grid item xs={12} md={12} sm={12}>
                    {columns ? (
                        <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}>
                            <CustomReactTable
                                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                                columns={columns}
                                state={state}
                                dispatch={dispatch}
                                setWholeRowsCellColor={(rowData) => {
                                    if (!rowData.isValid) return 'error';
                                    return '';
                                }}
                                hideSelection={!allowedToEdit}
                                hideAction={false}
                                renderedFrom={renderedFrom}
                                isClientSideGrid={true}
                            />
                        </Box>
                    ) : (
                        <Box p={2} height={500}>
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
                </Grid>
            </Grid>

            {addSerializedAssetDialog && (
                <AssignSerializedAssetDialog
                    reference={'sublease'}
                    handleClose={() => {
                        setAddSerializedAssetDialog(false);
                        setAssetAssignedProduct([]);
                    }}
                    ids={flattenArray(dataRows)?.filter((e) => e.type === 'serializedAsset')?.map((e) => e.materialId)}
                    handleSucess={(rows) => {
                        handleAssignAssets(rows);
                    }}
                    referenceData={{
                        warehouse: subleaseData?.fromWarehouse?.optionValue
                    }}
                    isAssigning={isAdding}
                    selectedProducts={assetAssignedProduct?.map((i) => {
                        return { _id: i._id, product: i.materialId, productName: i.detail, qty: i.assetQty - i.assetAssignedQty };
                    })}
                />
            )}
            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to remove?`}
                    onClose={() => {
                        setShowConfirmBox(false);
                        setDeleteData([]);
                    }}
                    okBtnLoading={deleting}
                    onOk={handleRemoveAsset}
                />
            )}
        </Fragment>
    )
}

export default SerializedAsset;