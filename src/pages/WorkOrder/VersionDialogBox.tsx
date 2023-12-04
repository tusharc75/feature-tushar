import { Box, Dialog, IconButton } from '@material-ui/core';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, workOrder } from 'src/constants/helpers';
import { generateCustomTableColumns } from 'src/constants/columns';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import startCase from 'lodash/startCase';
import { isMobile } from 'react-device-detect';

const Versions = ({ workOrderId, workOrderData, handleClose }) => {
  const [fullScreen, setFullScreen] = useState(true);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(workOrderData?.versions[0]?._id);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (selectedVersion) {
      fetchData();
    }
  }, [selectedVersion]);

  const fetchFields = async () => {
    let columns = [];

    let response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.workOrderProduct}`);
    let childFields = response?.data?.data || [];
    childFields = CURReplaceByCurrencySingle(childFields, workOrderData?.currency || 'USD');
    let newColumns = generateCustomTableColumns(childFields, workOrderData?.currency || 'USD');

    columns = [...columns, ...newColumns];

    response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.workOrderService}`);
    childFields = response?.data?.data || [];
    childFields = CURReplaceByCurrencySingle(childFields, workOrderData?.currency || 'USD');
    newColumns = generateCustomTableColumns(childFields, workOrderData?.currency || 'USD');

    columns = [...columns, ...newColumns];

    const cols: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{startCase(row?.original?.type) || <NoDataCell />}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        width: 250,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="text-truncate">{row.original.detail}</p>
            {[MATERIAL_TYPE.product, MATERIAL_TYPE.service, MATERIAL_TYPE.package].includes(row?.original?.type) && (
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === MATERIAL_TYPE.service) {
                      window.open(`${routes.serviceMasterDetail.path}/${row?.original?.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.product) {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.package) {
                      window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                    }
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            )}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 250,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.description || <NoDataCell />}</p>
      },
      {
        accessor: 'qty',
        Header: 'Quantity',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
      },
      {
        accessor: 'order',
        Header: 'Order',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.order || <NoDataCell />}</p>
      },
      {
        accessor: 'consumedQty',
        Header: 'Consumed Qty',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.consumedQty || <NoDataCell />}</p>
      },
      {
        accessor: 'requestedQty',
        Header: 'Requested Qty',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.requestedQty || <NoDataCell />}</p>
      },
      {
        accessor: 'unit',
        Header: 'Unit',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.unit || <NoDataCell />}</p>
      },
      {
        accessor: 'pricingMethod',
        Header: 'Pricing Method',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.pricingMethod || <NoDataCell />}</p>
      }
    ];
    setColumns([...cols, ...columns]);
  };

  const fetchData = async () => {
    const version = await axiosInstance().get(`${workOrder.api}/get-version-detail/${workOrderId}/${selectedVersion}`);
    const versionData = version.data.data;

    const material = versionData[0]?.material || [];

    material?.forEach((parent, i) => {
      parent.index = i + 1;
      parent.unit = parent?.detail?.unit?.join(', ') || '';
      parent.pricingMethod = parent?.detail?.pricingMethod?.join(', ') || '';
      parent.description =
        parent?.type === MATERIAL_TYPE.service
          ? parent?.detail?.serviceDescription
          : parent?.type === MATERIAL_TYPE.product
          ? parent?.detail?.productDescription
          : parent?.type === MATERIAL_TYPE.package
          ? parent?.detail?.packageDescription
          : '';
      parent.materialId = parent?.detail?._id;
      parent.detail =
        parent?.type === MATERIAL_TYPE.service
          ? parent?.detail?.serviceName
          : parent?.type === MATERIAL_TYPE.product
          ? parent?.detail?.productName
          : parent?.type === MATERIAL_TYPE.package
          ? parent?.detail?.packageName
          : '';
    });
    setRowsData(material);
  };

  return (
    <>
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
          title={`Versions - ${workOrderData?.workOrderNumber}`}
          onClose={handleClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showRequiredLabel={false}
          showManimizeMaximize={true}
        />
        <CustomDialogContent>
          <Box width={'100%'} display="flex" flexWrap="wrap">
            {workOrderData?.versions &&
              workOrderData?.versions?.map((v: any, i) => (
                <Box
                  m={0.5}
                  p={1}
                  border={1}
                  className="cursor-pointer"
                  borderColor="var(--common-border-color)"
                  onClick={() => {
                    if (selectedVersion !== v?._id) {
                      setRowsData(null);
                      setSelectedVersion(v?._id);
                    }
                  }}
                  style={{ display: 'inline-block' }}
                  bgcolor={v?._id === selectedVersion ? 'var(--dark-primary, var(--primary))' : 'var(--dark-secondary, transparent)'}
                  color={v?._id === selectedVersion && 'white'}
                >
                  {`Version - ${i + 1}`}
                </Box>
              ))}
          </Box>
          {rowsData && columns ? (
            <Box zIndex={5} width={'100%'} mt={2}>
              <CustomReactTable
                height={'calc(100vh - 200px)'}
                columns={columns}
                data={rowsData}
                onSelect={() => {}}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={true}
                hideAction={true}
                renderedFrom={'workOrder_versions'}
                isClientSideGrid={true}
                hideExpander={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default Versions;
