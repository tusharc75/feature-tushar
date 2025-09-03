import { useMemo } from 'react';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';

export type PlanningResource = {
  key: string;
  resource: string;
  title: any;
  path: string;
  fieldName: string;
  start: string;
  end: string;
};

export const usePlanningResource = () => {
  const {
    state: { resources, permissions }
  }: any = useData();

  const PLANNING_RESOURCE = useMemo(() => {
    const data: PlanningResource[] = [
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
        key: sidebarResource.planning.toLowerCase(),
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
        key: 'repairOrder',
        resource: sidebarResource.repairOrder,
        title: resources?.repairOrder?.titlePlural,
        path: routes.repairOrderDetail.path,
        fieldName: 'repairOrderNumber',
        start: 'createDate',
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
      },
      {
        key: 'subcontractAssembly',
        resource: sidebarResource.subcontractAssembly,
        title: resources?.subcontractAssembly?.titlePlural,
        path: routes.subcontractAssemblyDetail.path,
        fieldName: 'subcontractAssemblyNumber',
        start: 'createDate',
        end: 'expectedDeliveryDate'
      }
    ];

    const options: PlanningResource[] = [];
    data?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead) {
        options.push(item);
      }
    });
    return options;
  }, [
    permissions,
    resources?.assemblyOrder?.titlePlural,
    resources?.demandOrder?.titlePlural,
    resources?.employeeMaster?.titlePlural,
    resources?.fieldServiceOrder?.titlePlural,
    resources?.planning?.titlePlural,
    resources?.product?.titlePlural,
    resources?.productionOrder?.titlePlural,
    resources?.projectSales?.titlePlural,
    resources?.purchaseOrder?.titlePlural,
    resources?.purchaseRequisition?.titlePlural,
    resources?.quotation?.titlePlural,
    resources?.rentalManagement?.titlePlural,
    resources?.repairJob?.titlePlural,
    resources?.repairOrder?.titlePlural,
    resources?.serializedAsset?.titlePlural,
    resources?.subcontractAssembly?.titlePlural,
    resources?.sublease?.titlePlural
  ]);

  return PLANNING_RESOURCE;
};
