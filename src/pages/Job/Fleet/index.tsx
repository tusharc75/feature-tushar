import { useState, useEffect, Fragment } from 'react';
import { Box, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import { dateTimeFormat } from '../../../constants/helpers';
import { isMobile } from 'react-device-detect';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';

const Fleet = ({ jobData, renderedFrom, setNextStep }) => {
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{row.original?.detail}</p>
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  row.original.type === 'asset'
                    ? window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`)
                    : window.open(`${routes.fleetMasterDetail.path}/${row.original.materialId}`);
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
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
        Cell: ({ row }) => (row.original.dispatchDate ? <p>{moment(row.original.dispatchDate).format(dateTimeFormat)}</p> : <NoDataCell />)
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
        Cell: ({ row }) => (row.original.receivedDate ? <p>{moment(row.original.receivedDate).format(dateTimeFormat)}</p> : <NoDataCell />)
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
    setRowsData(rows);
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

  return (
    <Fragment>
      <Box mt={1}>
        {columns && rowsData ? (
          <Box p="6px" zIndex={5} width={'100%'}>
            <CustomReactTable
              height={'calc(100vh - 395px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={() => {}}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={true}
              hideAction={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Fragment>
  );
};

export default Fleet;
