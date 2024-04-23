import { Box } from '@material-ui/core';
import queryString from 'query-string';
import React, { useEffect, useState } from 'react';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import CalendarView from './Calendar';
import ListView from './List';

const PLANNING_RESOURCE = [
  {
    key: 'rentalManagement',
    resource: sidebarResource.rentalManagement,
    title: routes.rentalManagementDetail.title,
    path: routes.rentalManagementDetail.path,
    fieldName: 'rentalJobName',
    start: 'estimateStartDate',
    end: 'estimateEndDate'
  },
  {
    key: 'planning',
    resource: sidebarResource.planning,
    title: routes.planningDetail.title,
    path: routes.planningDetail.path,
    fieldName: 'planningNumber',
    start: 'startDate',
    end: 'endDate'
  },
  {
    key: 'demandOrder',
    resource: sidebarResource.demandOrder,
    title: routes.demandOrderDetail.title,
    path: routes.demandOrderDetail.path,
    fieldName: 'demandOrderNumber',
    start: 'createDate',
    end: 'estimateDeliveryDate'
  },
  {
    key: 'productionOrder',
    resource: sidebarResource.productionOrder,
    title: routes.productionOrderDetail.title,
    path: routes.productionOrderDetail.path,
    fieldName: 'productionOrderNumber',
    start: 'createDate',
    end: 'estimateDeliveryDate'
  },
  {
    key: 'purchaseRequisition',
    resource: sidebarResource.purchaseRequisition,
    title: routes.purchaseRequisitionDetail.title,
    path: routes.purchaseRequisitionDetail.path,
    fieldName: 'purchaseRequisitionNumber',
    start: 'createDate',
    end: 'estimateDeliveryDate'
  },
  {
    key: 'purchaseOrder',
    resource: sidebarResource.purchaseOrder,
    title: routes.purchaseOrderDetail.title,
    path: routes.purchaseOrderDetail.path,
    fieldName: 'purchaseOrderNumber',
    start: 'purchaseOrderDate',
    end: 'deliveryDate'
  },
  {
    key: 'repairJob',
    resource: sidebarResource.repairJob,
    title: routes.repairJobDetail.title,
    path: routes.repairJobDetail.path,
    fieldName: 'repairJobName',
    start: 'startDate',
    end: 'expectedCompletionDate'
  },
  {
    key: 'sublease',
    resource: sidebarResource.sublease,
    title: routes.subleaseDetail.title,
    path: routes.subleaseDetail.path,
    fieldName: 'subleaseName',
    start: 'estimateStartDate',
    end: 'estimateEndDate'
  },
  {
    key: 'projectSales',
    resource: sidebarResource.projectSales,
    title: routes.projectSalesDetail.title,
    path: routes.projectSalesDetail.path,
    fieldName: 'projectName',
    start: 'startDate',
    end: 'endDate'
  },
  {
    key: 'fieldServiceOrder',
    resource: sidebarResource.fieldServiceOrder,
    title: routes.fieldServiceOrderDetail.title,
    path: routes.fieldServiceOrderDetail.path,
    fieldName: 'fieldServiceOrderNumber',
    start: 'estimateStartDate',
    end: 'estimateEndDate'
  },
  {
    key: 'quotation',
    resource: sidebarResource.quotation,
    title: routes.quotationDetail.title,
    path: routes.quotationDetail.path,
    fieldName: 'quotationNumber',
    start: 'estimateStartDate',
    end: 'estimateEndDate'
  },
  {
    key: 'serializedAsset',
    resource: sidebarResource.serializedAsset,
    title: routes.serializedAsset.title,
    path: routes.serializedAssetDetail.path,
    fieldName: 'assetNumber',
    start: 'estimateStartDate',
    end: 'estimateEndDate'
  }
];

function PlanningView() {
  const {
    state: { permissions }
  }: any = useData();

  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [resourceList, setResourceList] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    const options: any = [];
    PLANNING_RESOURCE?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push({ ...item, title: routes[item.key] ? routes[item.key]?.title : item.title });
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

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={[{ title: routes.planningView.title, path: routes.planningView.path }]} />
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <CustomTabs value={tabValue} onChange={handleMainTabChange}>
            <CustomTab index={0}>
              <FaWpforms className="mr-1" fontSize="inherit" /> Calendar
            </CustomTab>
            <CustomTab index={1}>
              <BiFoodMenu className="mr-1" fontSize="inherit" /> List
            </CustomTab>
          </CustomTabs>
          <TabPanel value={tabValue} index={0}>
            <CalendarView resourceList={resourceList} selectedResource={selectedResource} setSelectedResource={setSelectedResource} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <ListView resourceList={resourceList} selectedResource={selectedResource} setSelectedResource={setSelectedResource} />
          </TabPanel>
        </Box>
      </Box>
    </>
  );
}

export default PlanningView;
