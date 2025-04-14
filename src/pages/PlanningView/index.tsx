import { Box, IconButton } from '@mui/material';
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
import { AddOutlined } from '@mui/icons-material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ManageServiceOrderDialog from 'src/pages/FieldServiceOrder/ManageServiceOrder';
import ManageRentalManagementDialog from 'src/pages/RentalManagement/ManageRental';
import ManagePlanning from 'src/pages/Planning/ManagePlanning';
import ManageDemandOrderDialog from 'src/pages/DemandOrder/ManageDemandOrderDialog';
import ManageProductionOrder from 'src/pages/ProductionOrder/ManageProductionOrder';
import ManagePurchaseRequisition from 'src/pages/PurchaseRequisition/ManagePurchaseRequisition';
import ManagePurchaseOrder from 'src/pages/PurchaseOrder/ManagePurchaseOrder';
import ManageRepairJob from 'src/pages/RepairJob/ManageRepairJob';
import ManageSublease from 'src/pages/Sublease/ManageSublease';
import CreateProjectSales from 'src/pages/ProjectSales/CreateProjectSales';
import ManageQuotationDialog from 'src/pages/Quotation/ManageQuotationDialog';
import ManageAssemblyOrder from 'src/pages/AssemblyOrder/ManageAssemblyOrder';

function PlanningView() {
  const {
    state: { user, permissions, resources, selectedEntity }
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
  const [createDialog, setCreateDialog] = useState(false);
  const ref: any = useRef();

  const PLANNING_RESOURCE = [
    {
      key: 'rentalManagement',
      resource: sidebarResource.rentalManagement,
      title: resources?.rentalManagement?.titlePlural,
      path: routes.rentalManagementDetail.path,
      fieldName: 'rentalJobName',
      start: 'startDate',
      end: 'endDate'
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
    },
    {
      key: 'employeeMaster',
      resource: sidebarResource.employeeMaster,
      title: resources?.employeeMaster?.titlePlural,
      path: routes.employeeMasterDetail.path,
      fieldName: 'technician',
      start: 'startDate',
      end: 'endDate'
    },
    {
      key: 'assemblyOrder',
      resource: sidebarResource.assemblyOrder,
      title: resources?.assemblyOrder?.titlePlural,
      path: routes.assemblyOrderDetail.path,
      fieldName: 'assemblyOrderNumber',
      start: 'createDate',
      end: 'estimateCompleteDate'
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
      setCreateDialog(false);
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
              afterImportCompleted={() => { }}
              onExportToExcelSuccess={() => { }}
              additionalParams={queryString}
              onlyExport={true}
            />
          )}
        </Box>
        <Box className={`detail-container-v1`}>
          <div className="absolute right-0 top-0 flex justify-end gap-1 ">
            {selectedResource && permissions[selectedResource?.key]?.isCreate &&
              ![sidebarResource.product, sidebarResource.employeeMaster, sidebarResource.serializedAsset]?.includes(selectedResource?.resource) && (
                <ThemeButton
                  className="mr-2"
                  buttonType="theme"
                  id={'add-button'}
                  onClick={(e) => {
                    setCreateDialog(true);
                  }}
                  startIcon={<AddOutlined />}
                >
                  Create
                </ThemeButton>
              )}
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
                <RefreshIcon fontSize="small" color="primary" />
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
              ref={ref}
            />
          )}
        </Box>
      </Box>
      {createDialog && selectedResource?.resource === sidebarResource?.rentalManagement && (
        <ManageRentalManagementDialog
          isClone={false}
          open={createDialog}
          rentalManagementId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isAutomated={true}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.planning && (
        <ManagePlanning
          isClone={false}
          id={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.demandOrder && (
        <ManageDemandOrderDialog
          isClone={false}
          open={createDialog}
          demandOrderId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.productionOrder && (
        <ManageProductionOrder
          isClone={false}
          productionOrderId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.purchaseRequisition && (
        <ManagePurchaseRequisition
          isClone={false}
          id={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.purchaseOrder && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          currency={user?.entity?.find((d) => d._id === selectedEntity)?.currency}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.repairJob && (
        <ManageRepairJob
          isClone={false}
          repairJobId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          referenceType={sidebarResource.planningView}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.sublease && (
        <ManageSublease
          isClone={false}
          subleaseId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.projectSales && (
        <CreateProjectSales
          open={createDialog}
          isClone={false}
          projectSalesId={false}
          close={() => setCreateDialog(false)}
          fetchData={() => { }}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.fieldServiceOrder && (
        <ManageServiceOrderDialog
          isClone={false}
          serviceOrderId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          open={createDialog}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.quotation && (
        <ManageQuotationDialog
          isClone={false}
          open={createDialog}
          quotationId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource?.assemblyOrder && (
        <ManageAssemblyOrder
          isClone={false}
          assemblyOrderId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => {
            onClickRefreshIcon();
          }}
          isRedirectTodetailPage={false}
        />
      )}
    </>
  );
}

export default PlanningView;
