import { Box, Dialog, IconButton } from '@material-ui/core';
import { camelCase, orderBy } from 'lodash';
import startCase from 'lodash/startCase';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { ACTIVITY_RESOURCE, CHILD_RESOURCE, CustomDialogTransition, MATERIAL_TYPE, sidebarResource, workOrder } from 'src/constants/helpers';
import Diagram from '../Diagram';
import ServiceStepsData from './ServiceStepsData';
import { FiExternalLink } from 'react-icons/fi';

let renderedFrom = `${camelCase(sidebarResource?.workOrder)}_version`;

const Versions = ({ workOrderId, workOrderData, handleClose }) => {
  const [tabValue, setTabValue] = useState(0);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(workOrderData?.versions[workOrderData?.versions?.length - 1]?._id);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(workOrderData?.versions?.length);
  const [servicesData, setServicesData] = useState([]);
  const [stepData, setStepData] = useState([]);

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

    let childFields = await fetch_child_resource_fields(CHILD_RESOURCE.workOrderProduct, workOrderData?.currency, true);
    let newColumns = generateColumns(null, childFields, null, false, workOrderData?.currency || 'USD');

    columns = [...columns, ...newColumns];

    childFields = await fetch_child_resource_fields(CHILD_RESOURCE.workOrderService, workOrderData?.currency, true);
    newColumns = generateColumns(null, childFields, null, false, workOrderData?.currency || 'USD');

    columns = [...columns, ...newColumns];

    const cols: any = [
      {
        accessor: 'index',
        Header: 'Index',
        disabled: true,
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'type',
        Header: 'Type',
        disabled: true,
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{startCase(row?.original?.type) || <NoDataCell />}</p>
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        disabled: true,
        width: 250,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate">{row.original.detail}</p>
            {[MATERIAL_TYPE.product, MATERIAL_TYPE.service, MATERIAL_TYPE.package].includes(row?.original?.type) && (
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
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
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
        accessor: 'unit',
        Header: 'Unit',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.unit || <NoDataCell />}</p>
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.status || <NoDataCell />}</p>
      },
      {
        accessor: 'serviceStatus',
        Header: 'Result',
        Cell: ({ row }) => (row?.original['serviceStatus'] ? <h5> {row?.original?.serviceStatus}</h5> : <NoDataCell />)
      },
      {
        accessor: 'assignedUsers',
        Header: 'Assigned Technician',
        width: 200,
        Cell: ({ row }) =>
          row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
            <div>
              {row?.original['assignedUsers']?.map((e, i) => {
                return i === row?.original['assignedUsers'].length - 1 ? (
                  <a
                    className="link text-truncate [flex-grow:0_!important]"
                    target="_blank"
                    href={`${routes.userDetail.path}/${e.optionValue}`}
                    rel="noreferrer"
                  >
                    {e?.optionLabel}
                  </a>
                ) : (
                  <>
                    <a
                      className="link text-truncate [flex-grow:0_!important]"
                      target="_blank"
                      href={`${routes.userDetail.path}/${e.optionValue}`}
                      rel="noreferrer"
                    >
                      {e?.optionLabel},
                    </a>
                    &nbsp;
                  </>
                );
              })}
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'assignedWorkStations',
        Header: 'Assigned Work Station',
        Cell: ({ row }) =>
          row?.original['assignedWorkStations'] && row?.original['assignedWorkStations']?.length ? (
            <div>
              {row?.original['assignedWorkStations']?.map((e, i) => {
                return i === row?.original['assignedWorkStations'].length - 1 ? (
                  <a
                    className="link text-truncate [flex-grow:0_!important]"
                    target="_blank"
                    href={`${routes.workStationsDetail.path}/${e.optionValue}`}
                    rel="noreferrer"
                  >
                    {e?.optionLabel}
                  </a>
                ) : (
                  <>
                    <a
                      className="link text-truncate [flex-grow:0_!important]"
                      target="_blank"
                      href={`${routes.workStationsDetail.path}/${e.optionValue}`}
                      rel="noreferrer"
                    >
                      {e?.optionLabel},
                    </a>
                    &nbsp;
                  </>
                );
              })}
            </div>
          ) : (
            <NoDataCell />
          )
      }
    ];
    setColumns([...cols, ...columns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const {
      data: { data }
    } = await axiosInstance().get(`${workOrder.api}/${workOrderId}/version/${selectedVersion}`);

    setServicesData(data?.data);
    setStepData(data?.stepData);

    let rows = data?.data?.filter((e) => e?.parentId == null);
    rows?.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent?.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceName
          : parent?.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productName
            : parent?.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageName
              : '';
      parent.description =
        parent?.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceDescription
          : parent?.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productDescription
            : parent?.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription
              : '';
      parent.subRows = generateNestedData(data?.data, parent);
    });

    dispatch({ type: 'initialize', data: rows, count: rows?.length || 0 });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    var subRows: any = material.filter((e) => e?.parentId === parent?._id);
    subRows = orderBy(subRows, ['type'], ['desc']);
    subRows?.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + (index + 1);
      _subRow.detail =
        _subRow?.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceName
          : _subRow?.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productName
            : _subRow?.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageName
              : '';
      _subRow.description =
        _subRow?.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription
          : _subRow?.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription
            : _subRow?.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription
              : '';
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Dialog
        open
        fullScreen
        maxWidth="md"
        TransitionComponent={CustomDialogTransition}
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
      >
        <CustomDialogHeader title={`Versions - ${workOrderData?.workOrderNumber}`} onClose={handleClose} showRequiredLabel={false} />
        <CustomDialogContent isFooterPresent={false}>
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
                    if (selectedVersion !== v?._id) setSelectedVersion(v?._id);
                    setSelectedVersionNumber(i + 1);
                  }}
                  style={{ display: 'inline-block' }}
                  bgcolor={v?._id === selectedVersion ? 'var(--dark-primary, var(--primary))' : 'var(--dark-secondary, transparent)'}
                  color={v?._id === selectedVersion && 'white'}
                >
                  {`Version - ${i + 1}`}
                </Box>
              ))}
          </Box>
          <Box mb={2} />
          <Box className="detail-container-v1">
            <CustomTabs value={tabValue} onChange={handleMainTabChange}>
              <CustomTab label={'Services'} value={0} />
              <CustomTab label={'Steps Data'} value={1} />
              <CustomTab label={'Drawings'} value={2} />
            </CustomTabs>
            <TabPanel value={tabValue} index={0}>
              {columns ? (
                <Box zIndex={5} width={'100%'}>
                  <CustomReactTable
                    height={'calc(100vh - 300px)'}
                    columns={columns}
                    state={state}
                    dispatch={dispatch}
                    hideSelection={true}
                    refreshGrid={fetchData}
                    hideAction={true}
                    renderedFrom={renderedFrom}
                    isClientSideGrid={true}
                    expander={true}
                  />
                </Box>
              ) : (
                <Box p={2} height={500}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <ServiceStepsData stepsData={stepData} servicesData={servicesData?.filter((s) => s.type === MATERIAL_TYPE.service)} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <Diagram
                resource={ACTIVITY_RESOURCE.workOrder}
                referenceId={workOrderId}
                currentVersion={selectedVersionNumber}
                fromVersions={true}
                workOrderData={workOrderData}
              />
            </TabPanel>
          </Box>
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default Versions;
