import { Box, IconButton } from '@mui/material';
import { FormatListNumbered } from '@mui/icons-material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import CalendarView from './Calendar';
import ListView from './List';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { FaRegCalendar } from 'react-icons/fa';
import { useTableReducer } from 'src/components/CustomReactTable';
import { useCardReducer } from 'src/components/CardColTimeline';

function PlanningView() {
  const {
    state: { permissions, resources }
  }: any = useData();

  const history = useHistory();
  const { dispatch } = useCardReducer();
  const { dispatch: tableDispatch } = useTableReducer();
  const resetSelectedRecords = () => {
    dispatch({ type: 'selection', selectedRecords: [] });
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  const [resourceList, setResourceList] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [queryString, setQueryString] = useState(null);

  const [view, setView] = useState('calendar');
  const ref: any = useRef();

  const PLANNING_RESOURCE = [
    {
      key: 'rentalManagement',
      resource: sidebarResource.rentalManagement,
      title: resources?.rentalManagement?.titlePlural,
      path: routes.rentalManagementDetail.path,
      fieldName: 'rentalJobName',
      start: 'estimateStartDate',
      end: 'estimateEndDate'
    },
    {
      key: 'planning',
      resource: sidebarResource.planning,
      title: resources?.planning?.titlePlural,
      path: routes.planningDetail.path,
      fieldName: 'planningNumber',
      start: 'startDate',
      end: 'endDate'
    },
    {
      key: 'demandOrder',
      resource: sidebarResource.demandOrder,
      title: resources?.demandOrder?.titlePlural,
      path: routes.demandOrderDetail.path,
      fieldName: 'demandOrderNumber',
      start: 'createDate',
      end: 'estimateDeliveryDate'
    },
    {
      key: 'productionOrder',
      resource: sidebarResource.productionOrder,
      title: resources?.productionOrder?.titlePlural,
      path: routes?.productionOrderDetail?.path,
      fieldName: 'productionOrderNumber',
      start: 'createDate',
      end: 'estimateDeliveryDate'
    },
    {
      key: 'purchaseRequisition',
      resource: sidebarResource.purchaseRequisition,
      title: resources?.purchaseRequisition?.titlePlural,
      path: routes.purchaseRequisitionDetail.path,
      fieldName: 'purchaseRequisitionNumber',
      start: 'createDate',
      end: 'estimateDeliveryDate'
    },
    {
      key: 'purchaseOrder',
      resource: sidebarResource.purchaseOrder,
      title: resources?.purchaseOrder?.titlePlural,
      path: routes.purchaseOrderDetail.path,
      fieldName: 'purchaseOrderNumber',
      start: 'purchaseOrderDate',
      end: 'deliveryDate'
    },
    {
      key: 'repairJob',
      resource: sidebarResource.repairJob,
      title: resources?.repairJob?.titlePlural,
      path: routes.repairJobDetail.path,
      fieldName: 'repairJobName',
      start: 'startDate',
      end: 'expectedCompletionDate'
    },
    {
      key: 'sublease',
      resource: sidebarResource.sublease,
      title: resources?.sublease?.titlePlural,
      path: routes.subleaseDetail.path,
      fieldName: 'subleaseName',
      start: 'estimateStartDate',
      end: 'estimateEndDate'
    },
    {
      key: 'projectSales',
      resource: sidebarResource.projectSales,
      title: resources?.projectSales?.titlePlural,
      path: routes.projectSalesDetail.path,
      fieldName: 'projectName',
      start: 'startDate',
      end: 'endDate'
    },
    {
      key: 'fieldServiceOrder',
      resource: sidebarResource.fieldServiceOrder,
      title: resources?.fieldServiceOrder?.titlePlural,
      path: routes?.fieldServiceOrderDetail?.path,
      fieldName: 'fieldServiceOrderNumber',
      start: 'estimateStartDate',
      end: 'estimateEndDate'
    },
    {
      key: 'quotation',
      resource: sidebarResource.quotation,
      title: resources?.quotation?.titlePlural,
      path: routes?.quotationDetail.path,
      fieldName: 'quotationNumber',
      start: 'estimateStartDate',
      end: 'estimateEndDate'
    },
    {
      key: 'serializedAsset',
      resource: sidebarResource.serializedAsset,
      title: resources?.serializedAsset?.titlePlural,
      path: routes.serializedAssetDetail.path,
      fieldName: 'assetNumber',
      start: 'estimateStartDate',
      end: 'estimateEndDate'
    },
    {
      key: 'product',
      resource: sidebarResource.product,
      title: resources?.product?.titlePlural,
      path: routes.productDetail.path,
      fieldName: 'productName',
      start: 'estimateStartDate',
      end: 'estimateEndDate'
    }
  ];

  useEffect(() => {
    const options: any = [];
    PLANNING_RESOURCE?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead) {
        options.push(item);
      }
    });
    setResourceList(options);
  }, []);

  useEffect(() => {
    const resource = history?.location?.state?.resource;
    if (resource && resourceList?.find((_r) => _r?.resource === resource)) {
      setSelectedResource(resourceList?.find((_r) => _r?.resource === resource));
    }
  }, [resourceList, history?.location?.state?.resource]);

  const onClickRefreshIcon = () => {
    if (ref?.current) {
      ref?.current?.fetchData();
    }
  };

  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={[{ title: resources?.planningView?.titlePlural, path: routes.planningView.path }]} />
          </Box>
          {view === 'calendar' && selectedResource && selectedResource?.resource === sidebarResource.product && (
            <ImportExportLinks
              permissions={permissions?.planningView}
              module={resources?.planningView?.titlePlural}
              api={routes.planningView.path}
              afterImportCompleted={() => {}}
              onExportToExcelSuccess={() => {}}
              additionalParams={queryString}
              onlyExport={true}
            />
          )}
        </Box>
        <Box className={`detail-container-v1`}>
          <div className="absolute right-[25px] top-[25px] flex justify-end gap-1 max-md:right-[15px] max-md:top-[15px]">
            <IconButtonTabs
              onItemClick={resetSelectedRecords}
              items={
                [
                  {
                    value: 'list',
                    icon: <TfiLayoutListThumbAlt />,
                    tooltip: 'List View'
                  },
                  {
                    value: 'calendar',
                    icon: <FaRegCalendar />,
                    tooltip: 'Calendar View'
                  }
                ] as const
              }
              setValue={setView}
              value={view}
            />
            <HtmlTooltip title={'Refresh'}>
              <IconButton style={{ width: 32, height: 32 }} size="small" onClick={onClickRefreshIcon}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </div>
          {view === 'calendar' && (
            <CalendarView
              resourceList={resourceList}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              setQueryString={setQueryString}
              ref={ref}
            />
          )}
          {view === 'list' && (
            <ListView
              resourceList={resourceList}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              setQueryString={setQueryString}
            />
          )}
        </Box>
      </Box>
    </>
  );
}

export default PlanningView;
