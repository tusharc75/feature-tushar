import { Box, Button } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { dateTimeFormat } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { isMobile, isTablet } from 'react-device-detect';

function ProcessLogs({ onClose, logsData, productName }) {

    const [fullScreen, setFullScreen] = useState(true);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState([]);

    useEffect(() => {
        fetchColumn();
        fetchData();
    }, []);

    const fetchColumn = async () => {
        const column: any = [
            {
                accessor: 'qty',
                Header: 'Processed Qty',
                primaryField: true,
                width: 150,
                Cell: ({ row }) => {
                    return row?.original['qty'] ? <p className="text-truncate">{row?.original['qty']}</p> : <NoDataCell />;
                }
            },
            {
                accessor: 'user',
                Header: 'Processed By',
                width: 200,
                Cell: ({ row }) => {
                    return row?.original['user'] ?
                        <a className="link text-truncate" href={`${routes.userDetail.path}/${row?.original['userId']}`} target="_blank">
                            {row?.original['user']}
                        </a> : <NoDataCell />;
                }
            },
            {
                accessor: 'date',
                Header: 'Processed Date',
                width: 200,
                Cell: ({ row }) => {
                    return row?.original['date'] ? (
                        <p className="text-truncate">{moment(row?.original['date']).format(dateTimeFormat)}</p>
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

    const fetchData = () => {
        const data = [...logsData];
        data?.forEach((e) => {
            e.userId = e?.user?.optionValue;
            e.user = e?.user?.optionLabel;
        });
        setRowsData(data);
    };

    return (<Dialog
        open
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                onClose();
            }
        }}
    >
        <CustomDialogHeader
            title={`Process Logs - ${productName}`}
            onClose={onClose}
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
                            hideAction={true}
                            hideExpander={true}
                            renderedFrom={"workOrder_consumables_request_process_logs"}
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

export default ProcessLogs;
