import { RESOURCE_LABEL, sidebarResource } from '../../constants/helpers';

const storedRoutes = localStorage.getItem('routes') ? JSON.parse(localStorage.getItem('routes')) : null;

const routes = {
  customerAccount: {
    path: '/customer-account'
  },
  customerAccountDetail: {
    path: '/customer-account/detail'
  },
  supplierAccount: {
    path: '/supplier-account'
  },
  supplierAccountDetail: {
    path: '/supplier-account/detail'
  },
  customerContact: {
    path: '/customer-contact'
  },
  customerContactDetail: {
    path: '/customer-contact/detail'
  },
  supplierContact: {
    path: '/supplier-contact'
  },
  supplierContactDetail: {
    path: '/supplier-contact/detail'
  },
  lead: {
    path: '/lead',
    data: {}
  },
  resourceLogs: {
    path: '/resource-logs',
    data: {}
  },
  leadDetail: {
    path: '/lead/detail',
    data: {}
  },
  opportunity: {
    path: '/opportunity',
    data: {}
  },
  opportunityDetail: {
    path: '/opportunity/detail',
    data: {}
  },
  projectSales: {
    path: '/project-sales'
  },
  projectSalesDetail: {
    path: '/project-sales/detail'
  },
  user: {
    path: '/user',
    data: {}
  },
  userDetail: {
    path: '/user/detail',
    data: {}
  },
  entity: {
    path: '/entity',
    data: {}
  },
  entityDetail: {
    path: '/entity/detail',
    data: {}
  },
  role: {
    path: '/role',
    data: {}
  },
  roleDetail: {
    path: '/role/detail',
    data: {}
  },
  activity: {
    title: 'Activity',
    path: '/activity',
    data: {}
  },
  activityEmail: {
    path: '/email',
    data: {}
  },
  activityNote: {
    path: '/note',
    data: {}
  },
  doa: {
    path: '/doa'
  },
  product: {
    path: '/product'
  },
  productDetail: {
    path: '/product/detail'
  },
  formBuilder: {
    path: '/form-builder'
  },
  formBuilderResource: {
    path: '/:resource'
  },
  forms: {
    path: '/forms'
  },
  formsDetail: {
    path: '/forms/detail'
  },
  termsAndConditions: {
    path: '/terms-and-conditions'
  },
  termsAndConditionsDetail: {
    path: '/terms-and-conditions/detail'
  },
  profilePage: {
    title: 'Profile',
    path: '/profile'
  },
  priceTemplate: {
    path: '/price-template'
  },
  priceTemplateDetail: {
    path: '/price-template'
  },
  productBuilder: {
    path: '/product-builder'
  },
  brandConfiguration: {
    title: 'Brand Configuration',
    path: '/brand-configuration'
  },
  currencyConverter: {
    path: '/currency-converter'
  },
  productCategory: {
    path: '/product-category'
  },
  productCategoryDetail: {
    path: '/product-category/detail'
  },
  productTemplate: {
    path: '/product-template'
  },
  productTemplateDetail: {
    path: '/product-template'
  },
  productInventory: {
    path: '/product-inventory'
  },
  packageInventory: {
    path: '/package-inventory'
  },
  serializedAsset: {
    path: '/serialized-asset'
  },
  serializedAssetsCertification: {
    path: '/serialized-assets-certification'
  },
  serializedAssetDetail: {
    path: '/serialized-asset/detail'
  },
  equiptmentRentalMaster: {
    path: '/equiptment-rental-master'
  },
  rentalManagement: {
    path: '/rental-management'
  },
  rentalManagementDetail: {
    path: '/rental-management/detail'
  },
  //Same name because handle old code issue
  quoteBuilder: {
    path: '/quotes'
  },
  quoteBuilderDetail: {
    path: '/quotes/detail'
  },
  quotes: {
    path: '/quotes'
  },
  quotesDetail: {
    path: '/quotes/detail'
  },
  quote: {
    path: '/quotes'
  },
  quoteDetail: {
    path: '/quotes/detail'
  },
  budget: {
    path: '/budget'
  },
  budgetDetail: {
    path: '/budget/detail'
  },
  pricingCondition: {
    path: '/pricing-condition'
  },
  pricingConditionDetail: {
    path: '/pricing-condition/detail'
  },
  marketSegment: {
    path: '/market-segment'
  },
  marketSegmentDetail: {
    path: '/market-segment/detail'
  },
  quotePdfTemplate: {
    path: '/quote-pdf-template'
  },
  quotePdfTemplateDetail: {
    path: '/quote-pdf-template/detail'
  },
  attachment: {
    path: '/attachment'
  },
  calendar: {
    path: '/calendar'
  },
  reminder: {
    path: '/reminder'
  },
  DOARequest: {
    path: '/doa-request'
  },
  task: {
    path: '/task'
  },
  case: {
    path: '/case'
  },
  note: {
    path: '/note'
  },
  zone: {
    path: '/zone'
  },
  zoneDetail: {
    path: '/zone/detail'
  },
  warehouse: {
    path: '/warehouse'
  },
  warehouseDetail: {
    path: '/warehouse/detail'
  },
  deliveryTicket: {
    path: '/delivery-ticket'
  },
  deliveryTicketDetail: {
    path: '/delivery-ticket/detail'
  },
  repairJob: {
    path: '/repair-job'
  },
  repairJobDetail: {
    path: '/repair-job/detail'
  },
  salesOrder: {
    path: '/sales-order'
  },
  salesOrderDetail: {
    path: '/sales-order/detail'
  },
  packages: {
    path: '/packages'
  },
  packagesDetail: {
    path: '/packages/detail'
  },
  purchaseOrder: {
    path: '/purchase-order'
  },
  purchaseOrderDetail: {
    path: '/purchase-order/detail'
  },
  transferAsset: {
    path: '/transfer-asset'
  },
  transferAssetDetail: {
    path: '/transfer-asset/detail'
  },
  transferInventory: {
    path: '/transfer-inventory'
  },
  transferInventoryDetail: {
    path: '/transfer-inventory/detail'
  },
  address: {
    path: '/address'
  },
  addressDetail: {
    path: '/address/detail'
  },
  reports: {
    path: '/reports'
  },
  scheduleReport: {
    path: '/schedule-report'
  },
  resourceCalendar: {
    path: '/resource-calendar'
  },
  planningCalendar: {
    path: '/planning-calendar'
  },
  rentalPlanningCalendar: {
    path: '/rental-planning-calendar'
  },
  eCommercePolicy: {
    path: '/e-commerce-policy'
  },
  sublease: {
    path: '/sublease'
  },
  subleaseDetail: {
    path: '/sublease/detail'
  },
  wellMaster: {
    path: '/well-master'
  },
  wellMasterDetail: {
    path: '/well-master/detail'
  },
  bulkAssetCreation: {
    path: '/bulk-asset-creation'
  },
  bulkAssetCreationDetail: {
    path: '/bulk-asset-creation/detail'
  },
  pos: {
    path: '/erecs'
  },
  posProductDetail: {
    path: '/erecs/product'
  },
  repairType: {
    path: '/repair-type'
  },
  repairTypeDetail: {
    path: '/repair-type/detail'
  },
  storageLocation: {
    path: '/storage-location'
  },
  storageLocationDetail: {
    path: '/storage-location/detail'
  },
  cageManagement: {
    path: '/cage-management'
  },
  productAuction: {
    path: '/product-auction'
  },
  productAuctionDetail: {
    path: '/product-auction/detail'
  },
  inventoryToAsset: {
    path: '/inventory-to-asset'
  },
  importExport: {
    path: '/import-export'
  },
  inventoryCycle: {
    path: '/inventory-cycle'
  },
  inventoryCycleDetail: {
    path: '/inventory-cycle/detail'
  },
  cycleCountDetermination: {
    path: '/cycle-count-determination'
  },
  cycleCountPhysicalInventory: {
    path: '/cycle-count-physical-inventory'
  },
  quotation: {
    path: '/quotation'
  },
  quotationDetail: {
    path: '/quotation/detail'
  },
  serviceMaster: {
    path: '/service-master'
  },
  serviceMasterDetail: {
    path: '/service-master/detail'
  },
  repairOrder: {
    path: '/repair-order'
  },
  repairOrderDetail: {
    path: '/repair-order/detail'
  },
  productionOrder: {
    path: '/production-order'
  },
  productionOrderDetail: {
    path: '/production-order/detail'
  },
  fieldServiceOrder: {
    path: '/field-service-order'
  },
  fieldServiceOrderDetail: {
    path: '/field-service-order/detail'
  },
  workOrder: {
    path: '/work-order'
  },
  workOrderDetail: {
    path: '/work-order/detail'
  },
  invoice: {
    path: '/invoice'
  },
  invoiceDetail: {
    path: '/invoice/detail'
  },
  workOrderSupervisor: {
    path: '/work-order-supervisor'
  },
  workOrderTechnician: {
    path: '/work-order-technician'
  },
  frequentlyAskedQuestion: {
    path: '/frequently-asked-question'
  },
  frequentlyAskedQuestionDetail: {
    path: '/frequently-asked-question/detail'
  },
  blog: {
    path: '/blog'
  },
  blogDetail: {
    path: '/blog/detail'
  },
  eCommerceHome: {
    path: '/e-commerce-home'
  },
  surveys: {
    path: '/surveys'
  },
  surveysDetail: {
    path: '/surveys/detail'
  },
  contactUs: {
    path: '/contact-us'
  },
  contactUsDetail: {
    path: '/contact-us/detail'
  },
  supportTicket: {
    path: '/support-ticket'
  },
  supportTicketDetail: {
    path: '/support-ticket/detail'
  },
  demandOrder: {
    path: '/demand-order'
  },
  demandOrderDetail: {
    path: '/demand-order/detail'
  },
  employeeMaster: {
    path: '/employee-master'
  },
  employeeMasterDetail: {
    path: '/employee-master/detail'
  },
  competencyType: {
    path: '/competency-type'
  },
  competencyTypeDetail: {
    path: '/competency-type/detail'
  },
  technicianScheduler: {
    path: '/technician-scheduler'
  },
  irtTicket: {
    path: '/irt-ticket'
  },
  irtTicketDetail: {
    path: '/irt-ticket/detail'
  },
  purchaseRequisition: {
    path: '/purchase-requisition'
  },
  purchaseRequisitionDetail: {
    path: '/purchase-requisition/detail'
  },
  planning: {
    path: '/planning'
  },
  planningDetail: {
    path: '/planning/detail'
  },
  fieldTicket: {
    path: '/field-ticket'
  },
  fieldTicketDetail: {
    path: '/field-ticket/detail'
  },
  fieldServiceTechnician: {
    path: '/field-service-technician'
  },
  fleetDispatch: {
    path: '/fleet-dispatch'
  },
  truckMaster: {
    path: '/truck-master'
  },
  truckMasterDetail: {
    path: '/truck-master/detail'
  },
  job: {
    path: '/job'
  },
  jobDetail: {
    path: '/job/detail'
  },
  fleetReceiver: {
    path: '/fleet-receiver'
  },
  transactionLock: {
    path: '/transaction-lock'
  },
  transactionLockDetail: {
    path: '/transaction-lock/detail'
  },
  wellNumber: {
    title: storedRoutes && storedRoutes.wellNumber && storedRoutes.wellNumber.title ? storedRoutes.wellNumber?.title : RESOURCE_LABEL.wellNumber,
    path: '/well-number'
  },
  wellNumberDetail: {
    title: storedRoutes && storedRoutes.wellNumber && storedRoutes.wellNumber.title ? storedRoutes.wellNumber?.title : RESOURCE_LABEL.wellNumber,
    path: '/well-number/detail'
  },
  planningView: {
    title: storedRoutes && storedRoutes.planningView && storedRoutes.planningView.title ? storedRoutes.planningView?.title : 'Planning View',
    path: '/planning-view'
  },
  taxMaster: {
    title: storedRoutes && storedRoutes.taxMaster && storedRoutes.taxMaster.title ? storedRoutes.taxMaster?.title : RESOURCE_LABEL.taxMaster,
    path: '/tax-master'
  },
  taxMasterDetail: {
    title: storedRoutes && storedRoutes.taxMaster && storedRoutes.taxMaster.title ? storedRoutes.taxMaster?.title : RESOURCE_LABEL.taxMaster,
    path: '/tax-master/detail'
  },
  competencies: {
    title:
      storedRoutes && storedRoutes.competencies && storedRoutes.competencies.title ? storedRoutes.competencies?.title : RESOURCE_LABEL.competencies,
    path: '/competencies'
  },
  competenciesDetail: {
    title:
      storedRoutes && storedRoutes.competencies && storedRoutes.competencies.title ? storedRoutes.competencies?.title : RESOURCE_LABEL.competencies,
    path: '/competencies/detail'
  },
  materialHandling: {
    title:
      storedRoutes && storedRoutes.materialHandling && storedRoutes.materialHandling.title
        ? storedRoutes.materialHandling?.title
        : RESOURCE_LABEL.materialHandling,
    path: '/material-handling'
  },
  padMaster: {
    title: storedRoutes && storedRoutes.padMaster && storedRoutes.padMaster.title ? storedRoutes.padMaster?.title : RESOURCE_LABEL.padMaster,
    path: '/pad-master'
  },
  padMasterDetail: {
    title: storedRoutes && storedRoutes.padMaster && storedRoutes.padMaster.title ? storedRoutes.padMaster?.title : RESOURCE_LABEL.padMaster,
    path: '/pad-master/detail'
  },
  driverMaster: {
    title:
      storedRoutes && storedRoutes.driverMaster && storedRoutes.driverMaster.title ? storedRoutes.driverMaster?.title : RESOURCE_LABEL.driverMaster,
    path: '/driver-master'
  },
  driverMasterDetail: {
    title:
      storedRoutes && storedRoutes.driverMaster && storedRoutes.driverMaster.title ? storedRoutes.driverMaster?.title : RESOURCE_LABEL.driverMaster,
    path: '/driver-master/detail'
  },
  trailerMaster: {
    title:
      storedRoutes && storedRoutes.trailerMaster && storedRoutes.trailerMaster.title
        ? storedRoutes.trailerMaster?.title
        : RESOURCE_LABEL.trailerMaster,
    path: '/trailer-master'
  },
  trailerMasterDetail: {
    title:
      storedRoutes && storedRoutes.trailerMaster && storedRoutes.trailerMaster.title
        ? storedRoutes.trailerMaster?.title
        : RESOURCE_LABEL.trailerMaster,
    path: '/trailer-master/detail'
  },
  iotDataPoints: {
    title:
      storedRoutes && storedRoutes.iotDataPoints && storedRoutes.iotDataPoints.title
        ? storedRoutes.iotDataPoints?.title
        : RESOURCE_LABEL.iotDataPoints,
    path: '/iot-data-points'
  },
  iotDataPointsDetail: {
    title:
      storedRoutes && storedRoutes.iotDataPoints && storedRoutes.iotDataPoints.title
        ? storedRoutes.iotDataPoints?.title
        : RESOURCE_LABEL.iotDataPoints,
    path: '/iot-data-points/detail'
  },
  iotChart: {
    title: storedRoutes && storedRoutes.iotChart && storedRoutes.iotChart?.title ? storedRoutes.iotChart?.title : RESOURCE_LABEL.iotChart,
    path: '/iot-chart'
  },
  iotChartDetail: {
    title: storedRoutes && storedRoutes.iotChart && storedRoutes.iotChart.title ? storedRoutes.iotChart.title : RESOURCE_LABEL.iotChart,
    path: '/iot-chart/detail'
  },
  sendOutboundMessage: {
    title:
      storedRoutes && storedRoutes.sendOutboundMessage && storedRoutes.sendOutboundMessage?.title
        ? storedRoutes.sendOutboundMessage?.title
        : RESOURCE_LABEL.sendOutboundMessage,
    path: '/send-outbound-message'
  },

  deviceTemplates: {
    title:
      storedRoutes && storedRoutes.deviceTemplates && storedRoutes.deviceTemplates?.title
        ? storedRoutes.deviceTemplates?.title
        : RESOURCE_LABEL.deviceTemplates,
    path: '/device-templates'
  },
  deviceTemplatesDetail: {
    title:
      storedRoutes && storedRoutes.deviceTemplates && storedRoutes.deviceTemplates.title
        ? storedRoutes.deviceTemplates?.title
        : RESOURCE_LABEL.deviceTemplates,
    path: '/device-templates/detail'
  },
  workStations: {
    title:
      storedRoutes && storedRoutes.workStations && storedRoutes.workStations?.title ? storedRoutes.workStations?.title : RESOURCE_LABEL.workStations,
    path: '/work-stations'
  },
  workStationsDetail: {
    title:
      storedRoutes && storedRoutes.workStations && storedRoutes.workStations.title ? storedRoutes.workStations?.title : RESOURCE_LABEL.workStations,
    path: '/work-stations/detail'
  },
  deviceTemplateAlert: {
    title:
      storedRoutes && storedRoutes.deviceTemplateAlert && storedRoutes.deviceTemplateAlert.title
        ? storedRoutes.deviceTemplateAlert?.title
        : RESOURCE_LABEL.deviceTemplateAlert,
    path: '/device-template-alert'
  },
  deviceTemplateAlertDetail: {
    title:
      storedRoutes && storedRoutes.deviceTemplateAlert && storedRoutes.deviceTemplateAlert.title
        ? storedRoutes.deviceTemplateAlert?.title
        : RESOURCE_LABEL.deviceTemplateAlert,
    path: '/device-template-alert/detail'
  },
  chartOfAccount: {
    title:
      storedRoutes && storedRoutes.chartOfAccount && storedRoutes.chartOfAccount?.title
        ? storedRoutes.chartOfAccount?.title
        : RESOURCE_LABEL.chartOfAccount,
    path: '/chart-of-account'
  },
  chartOfAccountDetail: {
    title:
      storedRoutes && storedRoutes.chartOfAccount && storedRoutes.chartOfAccount.title
        ? storedRoutes.chartOfAccount?.title
        : RESOURCE_LABEL.chartOfAccount,
    path: '/chart-of-account/detail'
  },
  creditMemo: {
    title: storedRoutes && storedRoutes.creditMemo && storedRoutes.creditMemo?.title ? storedRoutes.creditMemo?.title : RESOURCE_LABEL.creditMemo,
    path: '/credit-memo'
  },
  userDownloadRequest: {
    title: RESOURCE_LABEL.userDownloadRequest,
    path: '/user-download-request'
  },
  creditMemoDetail: {
    title: storedRoutes && storedRoutes.creditMemo && storedRoutes.creditMemo.title ? storedRoutes.creditMemo?.title : RESOURCE_LABEL.creditMemo,
    path: '/credit-memo/detail'
  },
  generateInvoice: {
    title:
      storedRoutes && storedRoutes.generateInvoice && storedRoutes.generateInvoice.title
        ? storedRoutes.generateInvoice?.title
        : RESOURCE_LABEL.generateInvoice,
    path: '/generate-invoice'
  },
  rentalManagementInvoice: {
    title:
      storedRoutes && storedRoutes.rentalManagementInvoice && storedRoutes.rentalManagementInvoice
        ? storedRoutes.rentalManagementInvoice.title
        : RESOURCE_LABEL.rentalManagementInvoice,
    path: '/rental-management-invoice'
  },
  repairOrderInvoice: {
    title:
      storedRoutes && storedRoutes.repairOrderInvoice && storedRoutes.repairOrderInvoice.title
        ? storedRoutes.repairOrderInvoice?.title
        : RESOURCE_LABEL.repairOrderInvoice,
    path: '/repair-order-invoice'
  },
  subleaseInvoice: {
    title:
      storedRoutes && storedRoutes.subleaseInvoice && storedRoutes.subleaseInvoice.title
        ? storedRoutes.subleaseInvoice?.title
        : RESOURCE_LABEL.subleaseInvoice,
    path: '/sublease-invoice'
  },
  fieldTicketInvoice: {
    title:
      storedRoutes && storedRoutes.fieldTicketInvoice && storedRoutes.fieldTicketInvoice.title
        ? storedRoutes.fieldTicketInvoice?.title
        : RESOURCE_LABEL.fieldTicketInvoice,
    path: '/field-ticket-invoice'
  },
  payrollPolicy: {
    title:
      storedRoutes && storedRoutes.payrollPolicy && storedRoutes.payrollPolicy.title
        ? storedRoutes.payrollPolicy?.title
        : RESOURCE_LABEL.payrollPolicy,
    path: '/payroll-policy'
  },
  payrollPolicyDetail: {
    title:
      storedRoutes && storedRoutes.payrollPolicy && storedRoutes.payrollPolicy.title
        ? storedRoutes.payrollPolicy?.title
        : RESOURCE_LABEL.payrollPolicy,
    path: '/payroll-policy/detail'
  },
  triggerNotificationMaster: {
    path: '/trigger-notification-master'
  },
  triggerNotificationMasterDetail: {
    path: '/trigger-notification-master/detail'
  },
  triggerNotificationHistory: {
    path: '/trigger-notification-history'
  },
  userAttendance: {
    path: '/user-attendance'
  },
  dataList: {
    title: storedRoutes && storedRoutes.dataList && storedRoutes.dataList.title ? storedRoutes.dataList?.title : RESOURCE_LABEL.dataList,
    path: '/data-lists'
  },
  dataListitems: {
    title:
      storedRoutes && storedRoutes.dataListitems && storedRoutes.dataListitems.title
        ? storedRoutes.dataListitems?.title
        : RESOURCE_LABEL.dataListitems,
    path: '/data-lists/data-list-items'
  },
  deals: {
    title: storedRoutes && storedRoutes.deals && storedRoutes.deals.title ? storedRoutes.deals?.title : sidebarResource.deals,
    path: '/deals'
  },
  dealDetail: {
    title: storedRoutes && storedRoutes.deals && storedRoutes.deals.title ? storedRoutes.deals?.title : sidebarResource.deals,
    path: '/deals/detail'
  },
  serializedAssetStatusChangeRequest: {
    title:
      storedRoutes && storedRoutes.serializedAssetStatusChangeRequest && storedRoutes.serializedAssetStatusChangeRequest.title
        ? storedRoutes.serializedAssetStatusChangeRequest?.title
        : RESOURCE_LABEL.serializedAssetStatusChangeRequest,
    path: '/serialized-asset-status-change-request'
  },
  units: {
    path: '/units'
  },
  unitDetail: {
    path: '/units/detail'
  },
  workOrderPlanning: {
    path: '/work-order-planning'
  },
  resourceDoaRequest: {
    path: '/resource-doa-request'
  },
  subcontractAssembly: {
    path: '/subcontract-assembly'
  },
  subcontractAssemblyDetail: {
    path: '/subcontract-assembly/detail'
  },
  managedPackages: {
    path: '/managed-packages'
  },
  managedPackagesDetail: {
    path: '/managed-packages/detail'
  },
  integration: {
    title: storedRoutes && storedRoutes.integration && storedRoutes.integration?.title ? storedRoutes.integration?.title : RESOURCE_LABEL.integration,
    path: '/integration'
  },
  equiptAi: {
    title: storedRoutes && storedRoutes.equiptAi && storedRoutes.equiptAi?.title ? storedRoutes.equiptAi?.title : RESOURCE_LABEL.equiptAi,
    path: '/equipt-ai'
  },
  trainAiModel: {
    title:
      storedRoutes && storedRoutes.trainAiModel && storedRoutes.trainAiModel?.title ? storedRoutes.trainAiModel?.title : RESOURCE_LABEL.trainAiModel,
    path: '/train-ai-model'
  },
  workSpace: {
    title: storedRoutes && storedRoutes.workSpace && storedRoutes.workSpace?.title ? storedRoutes.workSpace?.title : RESOURCE_LABEL.workSpace,
    path: '/work-space'
  },
  workflow: {
    title: storedRoutes && storedRoutes.workflow && storedRoutes.workflow?.title ? storedRoutes.workflow?.title : RESOURCE_LABEL.workflow,
    path: '/workflow'
  },
  workflowDetail: {
    title: storedRoutes && storedRoutes.workflow && storedRoutes.workflow?.title ? storedRoutes.workflow?.title : RESOURCE_LABEL.workflow,
    path: '/workflow/:id'
  },
  workflowReport: {
    title:
      storedRoutes && storedRoutes.workflowReport && storedRoutes.workflowReport?.title
        ? storedRoutes.workflowReport?.title
        : RESOURCE_LABEL.workflowReport,
    path: '/workflow-report'
  },
  workflowReportDetail: {
    title:
      storedRoutes && storedRoutes.workflowReport && storedRoutes.workflowReport?.title
        ? storedRoutes.workflowReport?.title
        : RESOURCE_LABEL.workflowReport,
    path: '/workflow-report/detail'
  },
  assemblyOrder: {
    title:
      storedRoutes && storedRoutes.assemblyOrder && storedRoutes.assemblyOrder.title
        ? storedRoutes.assemblyOrder?.title
        : RESOURCE_LABEL.assemblyOrder,
    path: '/assembly-order'
  },
  assemblyOrderDetail: {
    title:
      storedRoutes && storedRoutes.assemblyOrder && storedRoutes.assemblyOrder.title
        ? storedRoutes.assemblyOrder?.title
        : RESOURCE_LABEL.assemblyOrder,
    path: '/assembly-order/detail'
  },
  workAutomation: {
    path: '/work-automation'
  },
  workAutomationDetail: {
    path: '/work-automation/detail'
  }
};

export default routes;