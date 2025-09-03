import { Box } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { useCardReducer } from 'src/components/CardColTimeline';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useTableReducer } from 'src/components/CustomReactTable';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import ManageAssemblyOrder from 'src/pages/AssemblyOrder/ManageAssemblyOrder';
import ManageDemandOrderDialog from 'src/pages/DemandOrder/ManageDemandOrderDialog';
import ManageServiceOrderDialog from 'src/pages/FieldServiceOrder/ManageServiceOrder';
import ManagePlanning from 'src/pages/Planning/ManagePlanning';
import GanttView, { GantttViewRef } from 'src/pages/PlanningView/GanttView';
import TopRightButtons from 'src/pages/PlanningView/TopRightButtons';
import { PlanningResource, usePlanningResource } from 'src/pages/PlanningView/usePlanningResource';
import ManageProductionOrder from 'src/pages/ProductionOrder/ManageProductionOrder';
import CreateProjectSales from 'src/pages/ProjectSales/CreateProjectSales';
import ManagePurchaseOrder from 'src/pages/PurchaseOrder/ManagePurchaseOrder';
import ManagePurchaseRequisition from 'src/pages/PurchaseRequisition/ManagePurchaseRequisition';
import ManageQuotationDialog from 'src/pages/Quotation/ManageQuotationDialog';
import ManageRentalManagementDialog from 'src/pages/RentalManagement/ManageRental';
import ManageRepairJob from 'src/pages/RepairJob/ManageRepairJob';
import ManageSubcontractAssembly from 'src/pages/SubcontractAssembly/ManageSubcontractAssembly';
import ManageSublease from 'src/pages/Sublease/ManageSublease';
import CalendarView from './Calendar';
import ListView from './List';
import { DateSelectArg } from '@fullcalendar/core';
import CreatePlanningDialog from 'src/pages/PlanningView/CreatePlanningDialog';

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
  const resourceList = usePlanningResource();
  const [selectedResource, setSelectedResource] = useState<PlanningResource>(null);
  const [queryString, setQueryString] = useState(null);
  const [selectedRange, setSelectedRange] = useState<DateSelectArg | null>(null);

  const [view, setView] = useState<'calendar' | 'list' | 'gantt'>('calendar');
  const [createDialog, setCreateDialog] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [resourcePolicy, setResourcePolicy] = useState(null);

  const isProductSelected = selectedResource?.resource === sidebarResource.product;

  const productIDs = queryString?.split('&')?.find(q => q?.includes('product='))?.split('=')[1]?.split(',') || [];

  const ref: any = useRef();
  const ganttRef = useRef<GantttViewRef>();

  useEffect(() => {
    fetchPolicy();
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
    if (ganttRef.current) {
      ganttRef.current?.fetchData();
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.planningView}`);
      if (data) {
        setResourcePolicy(data?.policy);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if ([sidebarResource.product, sidebarResource.employeeMaster]?.includes(selectedResource?.resource) && view === 'list') {
      setView('calendar');
    } else if (view === 'gantt' && selectedResource?.resource !== sidebarResource.product) {
      setView('calendar');
    }
  }, [selectedResource, view]);

  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1 ">
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
          {view === 'calendar' && (
            <CalendarView
              topRightSlot={
                <TopRightButtons
                  isProductSelected={isProductSelected}
                  onClickRefreshIcon={onClickRefreshIcon}
                  resetSelectedRecords={resetSelectedRecords}
                  selectedResource={selectedResource}
                  setCreateDialog={setCreateDialog}
                  setView={setView}
                  view={view}
                />
              }
              setSelectedRange={setSelectedRange}
              resourceList={resourceList}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              setQueryString={setQueryString}
              ref={ref}
              resourcePolicy={resourcePolicy}
            />
          )}
          {view === 'list' && (
            <ListView
              topRightSlot={
                <TopRightButtons
                  isProductSelected={isProductSelected}
                  onClickRefreshIcon={onClickRefreshIcon}
                  resetSelectedRecords={resetSelectedRecords}
                  selectedResource={selectedResource}
                  setCreateDialog={setCreateDialog}
                  setView={setView}
                  view={view}
                />
              }
              resourceList={resourceList}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              setQueryString={setQueryString}
              ref={ref}
            />
          )}
          {view === 'gantt' && (
            <GanttView
              topRightSlot={
                <TopRightButtons
                  isProductSelected={isProductSelected}
                  onClickRefreshIcon={onClickRefreshIcon}
                  resetSelectedRecords={resetSelectedRecords}
                  selectedResource={selectedResource}
                  setCreateDialog={setCreateDialog}
                  setView={setView}
                  view={view}
                />
              }
              ref={ganttRef}
              resourceList={resourceList}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
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
      {selectedRange && <CreatePlanningDialog onClose={() => setSelectedRange(null)} selectedRange={selectedRange} productIDs={productIDs} />}
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
      {createDialog && selectedResource?.resource === sidebarResource?.subcontractAssembly && (
        <ManageSubcontractAssembly
          isClone={false}
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
