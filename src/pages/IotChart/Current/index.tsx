import { Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@material-ui/core";
import { startCase } from "lodash";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { dateTimeFormat } from "src/constants/helpers";

export default function Current({ assetId }) {
    const toastConfig = useContext(CustomToastContext);

    const [dataPointData, setDataPointData] = useState(null)
    const [errorData, setErrorData] = useState(null)

    useEffect(() => {
        fetchData()
        fetchErrorData()
    }, [assetId])

    const fetchData = async () => {
        try {
            const { data: { data } } = await axiosInstance().get(`/report/iot/current-status?asset=${assetId}`);
            let tableData = data?.dataPointData?.map((data) => {
                const obj = {
                    ...data,
                    time: moment(data?.time).format(dateTimeFormat)
                }
                return obj;
            });

            setDataPointData(tableData)
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    }

    const fetchErrorData = async () => {
        try {
            const { data: { data } } = await axiosInstance().get(`/report/iot/asset-error-message?asset=${assetId}`);
            const tableData: any = []
            data?.sort((a, b) => moment(a.time).diff(moment(b.time)))?.forEach(e => {
                if (e.errorMessage) {
                    tableData.push({
                        ...e,
                        time: moment(e?.time).format(dateTimeFormat)
                    })
                }
            });
            setErrorData(tableData)
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    }

    return (
        <>
            {((dataPointData && dataPointData?.length) || (errorData && errorData?.length)) ?
                <Grid container spacing={2}>
                    <Grid item lg={8}>
                        <TableContainer id={`${Date.now()}`} style={{ height: 'calc(100vh - 200px)', width: 'auto' }}>
                            <Table stickyHeader id={'table_' + '1'} aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        {['fieldLabel', 'date', 'value'].map((_k: any, index) => (
                                            <TableCell key={_k + ' ' + index + 1} align='left'>
                                                {startCase(_k)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dataPointData?.map((data: any, index) => (
                                        <TableRow key={'row ' + index + 1}>
                                            {['fieldLabel', 'time', 'value'].map((k, i) => (
                                                <TableCell key={k} align='left'>
                                                    {data[k]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid item lg={4}>
                        <TableContainer id={`${Date.now()}`} style={{ height: 'calc(100vh - 200px)', width: 'auto' }}>
                            <Table stickyHeader id={'table_' + '1'} aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        {['alert'].map((_k: any, index) => (
                                            <TableCell key={_k + ' ' + index + 1} align='left'>
                                                {startCase(_k)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {errorData?.map((data: any, index) => (
                                        <TableRow key={'row ' + index + 1}>
                                            <TableCell key={'cell ' + index + 1} align='left'>
                                                {data?.errorMessage}<br />
                                                {data?.time}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>
                :
                <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            }
        </>
    )
}