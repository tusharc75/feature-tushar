import { IconButton, Tooltip, Typography } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid'
import React, { useContext, useReducer, useState } from 'react'
import axiosInstance from '../../../axios/axiosInstance';
import CustomDataGridNoDataFound from '../../../components/Helpers/CustomDataGridNoDataFound'
import { formatAmountWithCurrency, gridLoadingTimeout } from '../../../constants/helpers';
import { Link } from "react-router-dom";
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useEffect } from 'react';
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import FileCopyIcon from '@material-ui/icons/FileCopy';

export default function AllVersionStatus({ quoteId, quoteData, quotePermissions, fetchQuoteData, handleChangeVersionFromAllVersion, handleCloneQuoteWithVersionFromAllVersion }) {

    const toastConfig = useContext(CustomToastContext);
    const [loadingVersions, setLoadingVersions] = useState(true);
    const [gridApi, setGridApi] = useState(null);
    const [columnApi, setColumnApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const [versionStatusData, setVersionStatusData] = useState({
        columns: [
            {
                field: "versionNumber",
                headerName: "Version #",
                flex: 0.5,
                renderCell: (params: any) => (
                    <Link
                        title={params.value}
                        className="text-truncate link"
                        onClick={() => {
                            fetchQuoteData(params.value);
                            handleChangeVersionFromAllVersion(params.value);
                        }}
                    >
                        {params.value}
                    </Link>
                ),
            },
            {
                field: "status",
                headerName: "Status",
                flex: 1,
                renderCell: (params: any) => (
                    <Link
                        title={params.value}
                        className="text-truncate link"
                        onClick={() => {
                            handleChangeVersionFromAllVersion(params.row.versionNumber);
                            fetchQuoteData(params.row.versionNumber);
                        }}
                    >
                        {params.value}
                    </Link>
                ),
            },
            {
                field: "comment",
                headerName: "Comment",
                flex: 1,
                renderCell: (params: any) => (
                    <Typography title={params.value} className="text-truncate">{params.value}</Typography>
                ),
            },
            {
                field: "processStatus", headerName: "Conclusion", flex: 1,
                renderCell: (params: any) => (
                    <Typography
                        title={params.value}
                    >
                        {params.value}
                    </Typography>
                ),
            },
            { field: "totalcost", headerName: "Total Cost", flex: 0.5 },
            {
                field: "totalSalesPrice",
                headerName: "Total Sales Price",
                flex: 0.5,
            },
        ],
        data: [],
    });
    const [columns,] = useState([
        { field: "versionNumber", headerName: "Version #", show: true, width: 140, disabled: true, cellRenderer: "nameRenderer" },
        { field: "status", headerName: "Status", show: true, cellRenderer: "nameRenderer" },
        { field: "processStatus", headerName: "Conclusion", show: true, cellRenderer: "nameRenderer" },
        { field: "comment", headerName: "Comment", show: true, cellRenderer: "commonRenderer" },
        { field: "totalcost", headerName: "Total Cost", show: true, cellRenderer: "commonRenderer" },
        { field: "totalSalesPrice", headerName: "Total Sales Price", show: true, cellRenderer: "commonRenderer" },
    ]);
    const NameRenderer = params => <Link
        title={params.value}
        className="text-truncate link"
        onClick={() => {
            fetchQuoteData(params.data.versionNumber);
            handleChangeVersionFromAllVersion(params.data.versionNumber);
        }}
    >
        {params.value}
    </Link>;

    const ActionsRenderer = params => <>

        {quotePermissions?.isCreate ?

            <Tooltip title="Clone quote with versions">
                <IconButton
                    size="small"
                    aria-label="clone version"
                    onClick={() => {
                        handleCloneQuoteWithVersionFromAllVersion(params.data.versionNumber)
                    }}
                >
                    <FileCopyIcon fontSize="small" color="primary" />
                </IconButton>
            </Tooltip>
            :
            <Tooltip className="cursor-stop" title={`You don't have permission to clone`}>
                <IconButton size="small" aria-label="clone version">
                    <FileCopyIcon fontSize="small" color="primary" />
                </IconButton>
            </Tooltip>
        }
    </>
    const frameworkComponents = {
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
        actionsRenderer: ActionsRenderer
    };

    useEffect(() => {
        if (quoteId) {
            getVersionStatus()
        }
    }, [quoteId]);

    const getVersionStatus = () => {
        setLoadingVersions(true);
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance()
            .get(`/quote-builder/quote-hierarchy/${quoteId}`)
            .then(({ data: { data } }) => {
                const newData = data.versions.map((d, index) => {
                    return {
                        ...d,
                        id: index + 1,
                        comment: d.comment ? d.comment : "",
                        totalcost: formatAmountWithCurrency(
                            quoteData?.currency,
                            d.productData.totalCost
                        ).fullFormatAmount,
                        totalSalesPrice: formatAmountWithCurrency(
                            quoteData?.currency,
                            d.productData.totalSalesPrice
                        ).fullFormatAmount,
                    };
                });

                setVersionStatusData((prevState) => {
                    return {
                        ...prevState,
                        data: newData,
                    };
                });
                dispatch({ type: "initialize", data: newData, count: newData.length });
                setTimeout(() => {
                    dispatch({ type: "loading", loading: false });
                }, gridLoadingTimeout);
                setLoadingVersions(false);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                setLoadingVersions(false);
                dispatch({ type: "loading", loading: false });

            });
    };

    return (
        <div style={{ maxHeight: 500, width: "100%" }} className="mt-2">
            <CustomAgGrid
                columns={columns}
                dataRows={dataRows}
                frameworkComponents={frameworkComponents}
                setGridApi={setGridApi}
                dispatch={dispatch}
                rowCount={rowCount}
                limit={limit}
                pageSizes={pageSizes}
                page={page}
                actionWidth={150}
                allowSelection={false}
                loading={loading}
            />
        </div>
    )
}
