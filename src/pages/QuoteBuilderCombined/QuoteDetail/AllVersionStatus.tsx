import { Typography } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid'
import React, { useContext, useState } from 'react'
import axiosInstance from '../../../axios/axiosInstance';
import CustomDataGridNoDataFound from '../../../components/Helpers/CustomDataGridNoDataFound'
import { formatAmountWithCurrency } from '../../../constants/helpers';
import { Link } from "react-router-dom";
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useEffect } from 'react';

export default function AllVersionStatus({ quoteId, quoteData, fetchQuoteData, handleChangeVersionFromAllVersion}) {

    const toastConfig = useContext(CustomToastContext);
    const [loadingVersions, setLoadingVersions] = useState(true);
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
                    <Typography title={params.value}>{params.value}</Typography>
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

    useEffect(() => {
        if (quoteId ) {
            getVersionStatus()
        }
      }, [quoteId]);

    const getVersionStatus = () => {
        setLoadingVersions(true);
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
                setLoadingVersions(false);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                setLoadingVersions(false);
            });
    };

    return (
        <div style={{ maxHeight: 500, width: "100%" }} className="mt-2">
            <DataGrid
                components={{
                    NoRowsOverlay: CustomDataGridNoDataFound,
                }}
                loading={loadingVersions}
                autoHeight
                density="compact"
                rows={loadingVersions ? [] : versionStatusData.data}
                columns={versionStatusData.columns}
                disableSelectionOnClick
                disableMultipleSelection
                disableColumnFilter
                hideFooter
            />
        </div>
    )
}
