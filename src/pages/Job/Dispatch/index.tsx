import { useState, useEffect, Fragment } from 'react';
import { Box, IconButton } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { isMobile, isTablet } from 'react-device-detect';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { FiExternalLink } from 'react-icons/fi';
import { displayDateTime, sidebarResource } from 'src/constants/helpers';
import PreviewDownload from 'src/components/PreviewDownload';
import { useData } from 'src/StateProvider/Provider';

const Dispatch = ({ jobData, renderedFrom, setNextStep }) => {

  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        disabled: true,
        width: 300,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p>{row.original?.detail}</p>
            <IconButton
              size="small"
              onClick={() => {
                row.original.type === 'asset'
                  ? window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`)
                  : window.open(`${routes.truckMaster.path}/${row.original.materialId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 100,
        Cell: ({ row }) => (row.original.status ? <p>{row.original.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'dispatchBy',
        Header: 'Dispatched By',
        width: 200,
        Cell: ({ row }) => (row.original.dispatchBy ? <p>{row.original.dispatchBy}</p> : <NoDataCell />)
      },
      {
        accessor: 'dispatchDate',
        Header: 'Dispatched Date',
        width: 200,
        Cell: ({ row }) => (row.original.dispatchDate ? <p>{displayDateTime(row.original.dispatchDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'dispatchComment',
        Header: 'Dispatched Comment',
        width: 200,
        Cell: ({ row }) => (row.original.dispatchComment ? <p>{row.original.dispatchComment}</p> : <NoDataCell />)
      },
      {
        accessor: 'receivedBy',
        Header: 'Received By',
        width: 200,
        Cell: ({ row }) => (row.original.receivedBy ? <p>{row.original.receivedBy}</p> : <NoDataCell />)
      },
      {
        accessor: 'receivedDate',
        Header: 'Received Date',
        width: 200,
        Cell: ({ row }) => (row.original.receivedDate ? <p>{displayDateTime(row.original.receivedDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'receiverComment',
        Header: 'Received Comment',
        width: 200,
        Cell: ({ row }) => (row.original.receiverComment ? <p>{row.original.receiverComment}</p> : <NoDataCell />)
      }
    ];
    setColumns(coloum);
    fetchJobData();
  };

  const fetchJobData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${routes.job.path}/material/${jobData._id}`);
    let fleetResponse = await axiosInstance().get(`${routes.job.path}/${jobData._id}/fleet-dispatch`);
    data = response?.data?.data;
    const fleet = fleetResponse?.data?.data;
    let rows = data?.material;
    rows?.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent?.serializedAssetDetail?.assetNumber;
      parent.status = parent?.serializedAssetDetail?.status;
      parent.subRows = generateNestedData(fleet, parent);
    });
    if (rows?.length) {
      setNextStep(true);
    } else {
      setNextStep(false);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.asset.optionValue === parent.materialId);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail = _subRow?.fleet?.optionLabel;
      _subRow.materialId = _subRow?.fleet?.optionValue;
      _subRow.dispatchBy = _subRow?.dispatchBy?.optionLabel;
      _subRow.receivedBy = _subRow?.receivedBy?.optionLabel;
      _subRow.hideSelection = false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const previewDownloadProps = {
    fileName: `${resources?.job?.titleSingular}-${jobData?.invoiceNumber}`,
    resource: sidebarResource.job,
    referenceId: jobData?._id,
    columns: columns,
    isSendEmail: false,
    defaultColumns: []
  };

  return (
    <Fragment>
      <PreviewDownload {...previewDownloadProps} />
      <Box mt={1}>
        {columns ? (
          <Box zIndex={5}>
            <CustomReactTable
              height={'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              refreshGrid={fetchJobData}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={true}
              expander={true}
              hideAction={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Fragment>
  );
};

export default Dispatch;
