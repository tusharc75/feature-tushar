import { Box, Dialog } from "@material-ui/core";
import moment from "moment";
import { useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable from "src/components/CustomReactTable/CustomReactTable";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { dateTimeFormat, fieldTicket } from "src/constants/helpers";

function ViewLogs({ id, fieldTicketName, handleClose }) {

    const [fullScreen, setFullScreen] = useState(true);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);


    useEffect(() => {
        fetchColumn();
        fetchData();
    }, []);

    const fetchColumn = async () => {
        const column: any = [
            {
                accessor: 'date',
                Header: 'Date',
                // primaryField: true,
                width: 150,
                Cell: ({ row }) => {
                    return row?.original['date'] ? <p className="text-truncate">{moment(row?.original['date']).format(dateTimeFormat)}</p> : <NoDataCell />;
                }
            },
            {
                accessor: 'type',
                Header: 'Action',
                // primaryField: true,
                width: 150,
                Cell: ({ row }) => {
                    return row?.original['type'] ? <p className="text-truncate">{row?.original['type']}</p> : <NoDataCell />;
                }
            },
            {
                accessor: 'invoice',
                Header: 'Invoice',
                width: 200,
                Cell: ({ row }) => {
                    return row?.original['invoice'] ? (
                        <a className="link text-truncate" href={`${routes.invoiceDetail.path}/${row?.original['invoiceId']}`} target="_blank">
                            {row?.original['invoice']}
                        </a>
                    ) : (
                        <NoDataCell />
                    );
                }
            },
            {
                accessor: 'user',
                Header: 'User',
                width: 200,
                Cell: ({ row }) => {
                    return row?.original['user'] ? (
                        <a className="link text-truncate" href={`${routes.userDetail.path}/${row?.original['userId']}`} target="_blank">
                            {row?.original['user']}
                        </a>
                    ) : (
                        <NoDataCell />
                    );
                }
            },
            {
                accessor: 'comment',
                Header: 'Comment',
                width: 200,
                Cell: ({ row }) => {
                    return row?.original['comment'] ? <p className="text-truncate">{row?.original['comment']}</p> : <NoDataCell />;
                }
            }
        ];
        setColumns([...column]);
    };

    const fetchData = async () => {
        const { data } = await axiosInstance().get(`${fieldTicket.api}/view-logs/${id}`);
        data?.data.forEach(d => {
            const invoice = d?.invoice;
            const user = d?.user;
            d.invoice = invoice?.optionLabel
            d.invoiceId = invoice?.optionValue
            d.user = user?.optionLabel
            d.userId = user?.optionValue
        });
        setRowsData(data?.data);
    };

    return (
        <Dialog
            open
            fullScreen={fullScreen}
            maxWidth="md"
            fullWidth
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                    handleClose();
                }
            }}
        >
            <CustomDialogHeader
                title={`Logs - ${fieldTicketName}`}
                onClose={handleClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                }}
                showRequiredLabel={false}
                showManimizeMaximize={true}
            />
            <CustomDialogContent>
                {rowsData && columns ? (
                    <Box p={2}>
                        <Box zIndex={5} width={'100%'} height={'calc(100vh - 200px)'}>
                            <CustomReactTable
                                height={'calc(100vh - 200px)'}
                                columns={columns}
                                data={rowsData}
                                onSelect={() => { }}
                                childrenProperty="subRows"
                                uniqueKey="_id"
                                hideSelection={true}
                                hideExpander={true}
                                renderedFrom={'fieldTicket_logs'}
                                isClientSideGrid={true}
                            />
                        </Box>
                    </Box>
                ) : (
                    <Box p={2} height={500} bgcolor="white">
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </CustomDialogContent>
        </Dialog>
    );
}

export default ViewLogs;
