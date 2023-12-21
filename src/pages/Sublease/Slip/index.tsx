import { Box, Grid, IconButton } from '@material-ui/core';
import { startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { MATERIAL_TYPE, SUBLEASE_STATUS, sidebarResource, sublease } from 'src/constants/helpers';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { fetch_sublease_product_fields } from 'src/components/Sublease/helper';
import PreviewDownload from 'src/components/PreviewDownload';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';


function Slip({ subleaseData, stepFullScreen, renderedFrom, statusNames, updateStatus }) {

    const toastConfig = useContext(CustomToastContext);
    const { generateColumns } = useColumns();
    const { state, dispatch } = useTableReducer();
    const [columns, setColumns] = useState(null);

    useEffect(() => {
        if (
            statusNames.findIndex((s) => s.optionLabel === SUBLEASE_STATUS.readyToInvoice) >
            statusNames.findIndex((s) => s.optionLabel === subleaseData?.status)
        ) {
            if (![SUBLEASE_STATUS.closed, SUBLEASE_STATUS.completed].includes(subleaseData?.status)) {
                updateStatus(SUBLEASE_STATUS.readyToInvoice);
            }
        }
    }, []);

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
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
                width: 100,
                Cell: ({ row }) =>
                    row.original['type'] ? (
                        <p>
                            {`${startCase(row.original?.type)}`}
                        </p>
                    ) : (
                        <NoDataCell />
                    )
            },
            {
                accessor: 'detail',
                Header: 'Details',
                width: 200,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div className="d-flex gap-2 align-items-center">
                        <p className="text-truncate" title={row.original.detail}>
                            {row.original.detail}
                        </p>
                        {(<IconButton
                            size="small"
                            onClick={() => {
                                if (row.original.type === MATERIAL_TYPE.product) {
                                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                                } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                                    window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                                } else if (row.original.type === MATERIAL_TYPE.package) {
                                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                                }
                            }}
                        >
                            <OpenInNewIcon fontSize="small" color="primary" />
                        </IconButton>)}
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
            }
        ];
        coloum = [...coloum, ...newColumns];
        setColumns(coloum);
        fetchRowData();
    };

    const fetchRowData = async () => {
        try {
            dispatch({ type: 'loading', loading: true });
            dispatch({ type: 'selection', selectedRecords: [] });
            var data: any = [];
            const response = await axiosInstance().get(`${sublease.api}/productpackage/${subleaseData._id}`);
            data = response?.data?.data;
            let rows = data.material.filter((e) => !e.parentId)
            rows.forEach((parent, i) => {
                parent.index = i + 1;
                parent.detail = `${parent.type === MATERIAL_TYPE.product
                    ? parent?.productDetail?.productName
                    : parent.type === MATERIAL_TYPE.package ?
                        parent?.packageDetail?.packageName : ''}`;
                parent.description = parent.type === MATERIAL_TYPE.product
                    ? parent?.productDetail?.productDescription || ''
                    : parent.type === MATERIAL_TYPE.package
                        ? parent?.packageDetail?.packageDescription || ''
                        : '';
                parent.subRows = generateNestedData(data.material, data.inventory, parent);
            });
            dispatch({ type: 'initialize', data: rows, count: rows?.length });
            dispatch({ type: 'loading', loading: false });
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const generateNestedData = (material, inventory, parent) => {
        const subRows: any = [];
        const assets = inventory?.filter((e) => e._id === parent._id);
        assets?.forEach((_inventory, k) => {
            subRows.push({
                ..._inventory,
                index: `${parent.index}.${k + 1}`,
                detail: _inventory?.assetNumber ? _inventory?.assetNumber : _inventory.inventoryDetail?.assetNumber,
                description: parent?.description,
                type: MATERIAL_TYPE.serializedAsset,
                _id: _inventory.inventory,
            });
        });
        material.filter((e) => e.parentId === parent._id)?.forEach((_subRow, j) => {
            _subRow.index = parent.index + '.' + (j + 1);
            _subRow.detail = _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.productName : _subRow?.packageDetail?.packageName;
            _subRow.description = _subRow.type === MATERIAL_TYPE.product
                ? _subRow?.productDetail?.productDescription || ''
                : _subRow.type === MATERIAL_TYPE.package
                    ? _subRow?.packageDetail?.packageDescription || ''
                    : '';
            _subRow.subRows = generateNestedData(material, inventory, _subRow);;
            subRows.push(_subRow);
        });
        return subRows;
    };

    return (
        <Fragment>
            <Box display="flex" justifyContent="flex-start" m={1}>
                <PreviewDownload
                    fileName={`${routes.sublease.title}-${subleaseData?.subleaseName}`}
                    resource={sidebarResource.sublease}
                    referenceId={subleaseData._id}
                    columns={columns}
                    isSendEmail={true}
                    defaultColumns={[
                        'index',
                        'type',
                        'detail',
                        'description',
                        'qty',
                    ]}
                />
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={12} md={12} sm={12}>
                    {columns ? (
                        <Box zIndex={5}>
                            <CustomReactTable
                                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                                columns={columns}
                                state={state}
                                dispatch={dispatch}
                                refreshGrid={fetchRowData}
                                hideSelection={true}
                                hideAction={true}
                                renderedFrom={renderedFrom}
                                isClientSideGrid={true}
                                expander={true}
                            />
                        </Box>
                    ) : (
                        <Box p={2} height={500}>
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Fragment>
    )
}

export default Slip;