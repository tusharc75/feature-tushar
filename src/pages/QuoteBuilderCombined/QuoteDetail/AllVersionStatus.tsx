import { IconButton, Tooltip } from '@material-ui/core';
import { useContext, useReducer, useState } from 'react'
import axiosInstance from '../../../axios/axiosInstance';
import { formatAmountWithCurrency, gridLoadingTimeout, isObjectEmpty } from '../../../constants/helpers';
import { Link } from "react-router-dom";
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useEffect } from 'react';
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CustomRenderCell from '../../../components/Helpers/CustomRenderCell';

const DOASteps = [
    {
        key: "New",
        label: "Product Builder",
    },
    {
        key: "Price Builder",
        label: "Price Builder",
    },
    {
        key: "Quote Builder",
        label: "Quote Builder",
    },
    {
        key: "DOA Process",
        label: "DOA Process",
    },
    {
        key: "Send To Customer",
        label: "Send To Customer",
    },
    {
        key: "End",
        label: "End",
    },
];

export default function AllVersionStatus({ quoteId, quoteData, quotePermissions, fetchQuoteData, handleChangeVersionFromAllVersion, handleCloneQuoteWithVersionFromAllVersion }) {

    const toastConfig = useContext(CustomToastContext);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, filters, pageSizes } = state;

    const [columns,] = useState([
        { field: "versionNumber", headerName: "Version #", show: true, width: 140, disabled: true,filter: false, cellRenderer: "nameRenderer" },
        { field: "status", headerName: "Status", show: true, cellRenderer: "nameRenderer" },
        { field: "processStatus", headerName: "Current Step", show: true, filter:false, cellRenderer: "nameRenderer" },
        { field: "comment", headerName: "Comment", show: true,filter: false, cellRenderer: "commonRenderer" },
        { field: "totalcost", headerName: "Total Cost", show: true, filter: false, cellRenderer: "commonRenderer" },
        { field: "totalSalesPrice", headerName: "Total Sales Price", show: true, filter: false, cellRenderer: "commonRenderer" },
    ]);
    const NameRenderer = params =>
        <span className="link"
            onClick={() => {
                fetchQuoteData(params.data.versionNumber);
                handleChangeVersionFromAllVersion(params.data.versionNumber);
            }}>
            <CustomRenderCell value={params?.value} />
        </span>
        ;

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
    }, [quoteId, filters]);

    const getVersionStatus = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance()
            .get(`/quote-builder/quote-hierarchy/${quoteId}`)
            .then(({ data: { data } }) => {
                if (!isObjectEmpty(filters)) {
                    data = data.versions.filter((item) => {
                        return item.status.toLowerCase().search(`${filters.status.filter}`.toLowerCase()) !== -1
                    });
                }
                const newData = isObjectEmpty(filters) ? data.versions.map((d, index) => {
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
                        processStatus: DOASteps.find(obj => obj.key === d.processStatus)?.label
                    };
                }) :
                    data.map((d, index) => {
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
                            processStatus: DOASteps.find(obj => obj.key === d.processStatus)?.label
                        };

                    })
                    ;

                dispatch({ type: "initialize", data: newData, count: newData.length });
                setTimeout(() => {
                    dispatch({ type: "loading", loading: false });
                }, gridLoadingTimeout);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
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
                    refreshGrid={getVersionStatus}
                />
        </div>
    )
}
