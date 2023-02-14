import { Box, Grid, makeStyles, Paper, TextField } from '@material-ui/core';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { dateTimeFormat } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function ServiceOrder() {


    const toastConfig = useContext(CustomToastContext);
    const [rowsData, setRowsData] = useState(null);
    const [selectedRecords, setSelectedRecords] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axiosInstance().get(`/technician-scheduler/un-assign-service`).then(({ data: { data } }) => {
            const rows: any = []
            data?.forEach((ele, index) => {
                const obj: any = {};
                obj.index = index + 1;
                obj._id = ele._id;
                obj.serviceOrderNumber = ele?.serviceOrderNumber
                obj.serviceName = ele?.service?.serviceName
                obj.competency = ele?.service?.competency?.map((e) => e?.optionLabel)?.toString();
                obj.customerAccount = ele?.customerAccount?.optionLabel;
                obj.estimateStartDate = ele?.service?.estimateStartDate
                obj.estimateEndDate = ele?.service?.estimateEndDate
                rows.push(obj);
            })
            setRowsData(rows)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const columns = [
        {
            accessor: 'index',
            Header: 'Index',
            width: 50,
            Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        },
        {
            accessor: 'serviceOrderNumber',
            Header: 'Service Order',
            width: 200,
            Cell: ({ row }) => <p className="text-truncate">{row.original.serviceOrderNumber}</p>,
        },
        {
            accessor: 'serviceName',
            Header: 'Service Name',
            width: 250,
            Cell: ({ row }) => <p className="text-truncate">{row.original.serviceName}</p>,
        },
        {
            accessor: 'competency',
            Header: 'Competency',
            width: 250,
            Cell: ({ row }) =>
                row.original["competency"] ? <p className="text-truncate">{row.original.competency}</p> : <NoDataCell />
        },
        {
            accessor: 'customerAccount',
            Header: 'Customer Account',
            width: 250,
            Cell: ({ row }) =>
                row.original["customerAccount"] ? <p className="text-truncate">{row.original.customerAccount}</p> : <NoDataCell />
        },
        {
            accessor: 'estimateStartDate',
            Header: 'Estimate Start Date',
            width: 200,
            Cell: ({ row }) =>
                row.original["estimateStartDate"] ?
                    <p className="text-truncate">{moment(row.original.estimateStartDate).format(dateTimeFormat)}</p> : <NoDataCell />
        },
        {
            accessor: 'estimateEndDate',
            Header: 'Estimate End Date',
            width: 200,
            Cell: ({ row }) =>
                row.original["estimateEndDate"] ?
                    <p className="text-truncate">{moment(row.original.estimateEndDate).format(dateTimeFormat)}</p> : <NoDataCell />
        },
    ];

    const height = ((window.innerHeight / 2) - 200)

    return (
        <Box pt={3} style={{ height: height }}>
            {columns && rowsData ? (
                <Box zIndex={5} width={'100%'} height={height}>
                    <CustomReactTable
                        height={`${height}px`}
                        columns={columns}
                        data={rowsData}
                        onSelect={setSelectedRecords}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                        hideAction={true}
                        renderedFrom={`service_order_technician`}
                        isClientSideGrid={true}
                        hideExpander={true}
                    />
                </Box>
            ) : (
                <Box p={2} height={height} bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            )}
        </Box>
    );
}

export default ServiceOrder;
