import { Box, IconButton } from '@material-ui/core';
import { FormatListNumbered } from '@material-ui/icons';
import DateRangeIcon from '@material-ui/icons/DateRange';
import RefreshIcon from '@material-ui/icons/Refresh';
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

function PlanningView() {
  const {
    state: { permissions, resources }
  }: any = useData();

  const history = useHistory();

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
            <CustomBreadCrumbs routes={[{ title: routes.planningView.title, path: routes.planningView.path }]} />
          </Box>
          {view === 'calendar' && selectedResource && selectedResource?.resource === sidebarResource.product && (
            <ImportExportLinks
              permissions={permissions?.planningView}
              module={routes.planningView.title}
              api={routes.planningView.path}
              afterImportCompleted={() => { }}
              onExportToExcelSuccess={() => { }}
              additionalParams={queryString}
              onlyExport={true}
            />
          )}
        </Box>
        <Box className={`detail-container-v1`}>
          <div className="absolute right-[25px] top-[25px] flex justify-end gap-1 max-md:right-[15px] max-md:top-[15px] ">
            <HtmlTooltip title={`Refresh`} arrow placement="top" enterTouchDelay={0}>
              <IconButton size="small" aria-label="Clone" onClick={onClickRefreshIcon}>
                <RefreshIcon color="primary" />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title={'Calendar View'} placement="top" arrow enterTouchDelay={0}>
              <span>
                <IconButton size="small" onClick={() => setView('calendar')} disabled={view === 'calendar'}>
                  <DateRangeIcon color={view === 'calendar' ? 'disabled' : 'primary'} />
                </IconButton>
              </span>
            </HtmlTooltip>
            <HtmlTooltip title={'List View'} placement="top" arrow enterTouchDelay={0}>
              <span>
                <IconButton size="small" onClick={() => setView('table')} disabled={view === 'table'}>
                  <FormatListNumbered color={view === 'table' ? 'disabled' : 'primary'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </div>
          {view === 'calendar' ? (
            <CalendarView
              resourceList={resourceList}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              setQueryString={setQueryString}
              ref={ref}
            />
          ) : (
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
