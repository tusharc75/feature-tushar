import { RESOURCE_LABEL } from '../../constants/helpers';

const storedRoutes = localStorage.getItem('routes') ? JSON.parse(localStorage.getItem('routes')) : null;

const routes = {
  customerAccount: {
    title:
      storedRoutes && storedRoutes.customerAccount && storedRoutes.customerAccount.title
        ? storedRoutes.customerAccount?.title
        : RESOURCE_LABEL.customerAccount,
    path: '/customer-account'
  },
  customerAccountDetail: {
    title:
      storedRoutes && storedRoutes.customerAccount && storedRoutes.customerAccount.title
        ? storedRoutes.customerAccount?.title
        : RESOURCE_LABEL.customerAccount,
    path: '/customer-account/detail'
  },
  supplierAccount: {
    title:
      storedRoutes && storedRoutes.supplierAccount && storedRoutes.supplierAccount.title
        ? storedRoutes.supplierAccount?.title
        : RESOURCE_LABEL.account,
    path: '/supplier-account'
  },
  supplierAccountDetail: {
    title:
      storedRoutes && storedRoutes.supplierAccount && storedRoutes.supplierAccount.title
        ? storedRoutes.supplierAccount?.title
        : RESOURCE_LABEL.account,
    path: '/supplier-account/detail'
  },
  customerContact: {
    title:
      storedRoutes && storedRoutes.customerContact && storedRoutes.customerContact.title
        ? storedRoutes.customerContact?.title
        : RESOURCE_LABEL.customerContact,
    path: '/customer-contact'
  },
  customerContactDetail: {
    title:
      storedRoutes && storedRoutes.customerContact && storedRoutes.customerContact.title
        ? storedRoutes.customerContact?.title
        : RESOURCE_LABEL.customerContact,
    path: '/customer-contact/detail'
  },
  supplierContact: {
    title:
      storedRoutes && storedRoutes.supplierContact && storedRoutes.supplierContact.title
        ? storedRoutes.supplierContact?.title
        : RESOURCE_LABEL.contact,
    path: '/supplier-contact'
  },
  supplierContactDetail: {
    title:
      storedRoutes && storedRoutes.supplierContact && storedRoutes.supplierContact.title
        ? storedRoutes.supplierContact?.title
        : RESOURCE_LABEL.contact,
    path: '/supplier-contact/detail'
  },
  lead: {
    title: storedRoutes && storedRoutes.lead && storedRoutes.lead.title ? storedRoutes.lead?.title : RESOURCE_LABEL.lead,
    path: '/lead',
    data: {}
  },
  resourceLogs: {
    title:
      storedRoutes && storedRoutes.resourceLogs && storedRoutes.resourceLogs.title ? storedRoutes.resourceLogs?.title : RESOURCE_LABEL.resourceLogs,
    path: '/resource-logs',
    data: {}
  },
  leadDetail: {
    title: storedRoutes && storedRoutes.lead && storedRoutes.lead.title ? storedRoutes.lead?.title : RESOURCE_LABEL.lead,
    path: '/lead/detail',
    data: {}
  },
  opportunity: {
    title: storedRoutes && storedRoutes.opportunity && storedRoutes.opportunity.title ? storedRoutes.opportunity?.title : RESOURCE_LABEL.opportunity,
    path: '/opportunity',
    data: {}
  },
  opportunityDetail: {
    title: storedRoutes && storedRoutes.opportunity && storedRoutes.opportunity.title ? storedRoutes.opportunity?.title : RESOURCE_LABEL.opportunity,
    path: '/opportunity/detail',
    data: {}
  },
  projectSales: {
    title:
      storedRoutes && storedRoutes.projectSales && storedRoutes.projectSales.title ? storedRoutes.projectSales?.title : RESOURCE_LABEL.projectSales,
    path: '/project-sales'
  },
  projectSalesDetail: {
    title:
      storedRoutes && storedRoutes.projectSales && storedRoutes.projectSales.title ? storedRoutes.projectSales?.title : RESOURCE_LABEL.projectSales,
    path: '/project-sales/detail'
  },
  user: {
    title: storedRoutes && storedRoutes.user && storedRoutes.user.title ? storedRoutes.user?.title : RESOURCE_LABEL.user,
    path: '/user',
    data: {}
  },
  userDetail: {
    title: storedRoutes && storedRoutes.user && storedRoutes.user.title ? storedRoutes.user?.title : RESOURCE_LABEL.user,
    path: '/user/detail',
    data: {}
  },
  entity: {
    title: storedRoutes && storedRoutes.entity && storedRoutes.entity.title ? storedRoutes.entity?.title : RESOURCE_LABEL.entity,
    path: '/entity',
    data: {}
  },
  entityDetail: {
    title: storedRoutes && storedRoutes.entity && storedRoutes.entity.title ? storedRoutes.entity?.title : RESOURCE_LABEL.entity,
    path: '/entity/detail',
    data: {}
  },
  role: {
    title: storedRoutes && storedRoutes.role && storedRoutes.role.title ? storedRoutes.role?.title : RESOURCE_LABEL.role,
    path: '/role',
    data: {}
  },
  roleDetail: {
    title: storedRoutes && storedRoutes.role && storedRoutes.role.title ? storedRoutes.role?.title : RESOURCE_LABEL.role,
    path: '/role/detail',
    data: {}
  },
  activity: {
    title: 'Activity',
    path: '/activity',
    data: {}
  },
  activityEmail: {
    title: storedRoutes && storedRoutes.email && storedRoutes.email.title ? storedRoutes.email?.title : RESOURCE_LABEL.email,
    path: '/email',
    data: {}
  },
  activityNote: {
    title: storedRoutes && storedRoutes.note && storedRoutes.note.title ? storedRoutes.note?.title : RESOURCE_LABEL.note,
    path: '/note',
    data: {}
  },
  doa: {
    title: storedRoutes && storedRoutes.doa && storedRoutes.doa.title ? storedRoutes.doa?.title : RESOURCE_LABEL.doa,
    path: '/doa'
  },
  product: {
    title: storedRoutes && storedRoutes.product && storedRoutes.product.title ? storedRoutes.product?.title : RESOURCE_LABEL.product,
    path: '/product'
  },
  productDetail: {
    title: storedRoutes && storedRoutes.product && storedRoutes.product.title ? storedRoutes.product?.title : RESOURCE_LABEL.product,
    path: '/product/detail'
  },
  formBuilder: {
    title: storedRoutes && storedRoutes.formBuilder && storedRoutes.formBuilder.title ? storedRoutes.formBuilder?.title : RESOURCE_LABEL.formBuilder,
    path: '/form-builder'
  },
  formBuilderResource: {
    title: 'Resource',
    path: '/:resource'
  },
  termsAndConditions: {
    title:
      storedRoutes && storedRoutes.termsAndConditions && storedRoutes.termsAndConditions.title
        ? storedRoutes.termsAndConditions?.title
        : RESOURCE_LABEL.termsAndConditions,
    path: '/terms-conditions'
  },
  profilePage: {
    title: 'Profile',
    path: '/profile'
  },
  priceTemplate: {
    title:
      storedRoutes && storedRoutes.priceTemplate && storedRoutes.priceTemplate.title
        ? storedRoutes.priceTemplate?.title
        : RESOURCE_LABEL.priceTemplate,
    path: '/price-template'
  },
  productBuilder: {
    title:
      storedRoutes && storedRoutes.productBuilder && storedRoutes.productBuilder.title
        ? storedRoutes.productBuilder?.title
        : RESOURCE_LABEL.productBuilder,
    path: '/product-builder'
  },
  brandConfiguration: {
    title: 'Brand Configuration',
    path: '/brand-configuration'
  },
  currencyConverter: {
    title:
      storedRoutes && storedRoutes.currencyConverter && storedRoutes.currencyConverter.title
        ? storedRoutes.currencyConverter?.title
        : RESOURCE_LABEL.currencyConverter,
    path: '/currency-converter'
  },
  productCategory: {
    title:
      storedRoutes && storedRoutes.productCategory && storedRoutes.productCategory.title
        ? storedRoutes.productCategory?.title
        : RESOURCE_LABEL.productCategory,
    path: '/product-category'
  },
  productCategoryDetail: {
    title:
      storedRoutes && storedRoutes.productCategory && storedRoutes.productCategory.title
        ? storedRoutes.productCategory?.title
        : RESOURCE_LABEL.productCategory,
    path: '/product-category/detail'
  },
  productTemplate: {
    title:
      storedRoutes && storedRoutes.productTemplate && storedRoutes.productTemplate.title
        ? storedRoutes.productTemplate?.title
        : RESOURCE_LABEL.productTemplate,
    path: '/product-template'
  },
  productInventory: {
    title:
      storedRoutes && storedRoutes.productInventory && storedRoutes.productInventory.title
        ? storedRoutes.productInventory?.title
        : RESOURCE_LABEL.productInventory,
    path: '/product-inventory'
  },
  serializedAsset: {
    title:
      storedRoutes && storedRoutes.serializedAsset && storedRoutes.serializedAsset.title
        ? storedRoutes.serializedAsset.title
        : RESOURCE_LABEL.serializedAsset,
    path: '/serialized-asset'
  },
  serializedAssetDetail: {
    title:
      storedRoutes && storedRoutes.serializedAsset && storedRoutes.serializedAsset.title
        ? storedRoutes.serializedAsset.title
        : RESOURCE_LABEL.serializedAsset,
    path: '/serialized-asset/detail'
  },
  equiptmentRentalMaster: {
    title:
      storedRoutes && storedRoutes.equiptmentRentalMaster && storedRoutes.equiptmentRentalMaster
        ? storedRoutes.equiptmentRentalMaster.title
        : RESOURCE_LABEL.equiptmentRentalMaster,
    path: '/equiptment-rental-master'
  },
  rentalManagement: {
    title:
      storedRoutes && storedRoutes.rentalManagement && storedRoutes.rentalManagement
        ? storedRoutes.rentalManagement.title
        : RESOURCE_LABEL.rentalManagement,
    path: '/rental-management'
  },
  rentalManagementDetail: {
    title:
      storedRoutes && storedRoutes.rentalManagement && storedRoutes.rentalManagement
        ? storedRoutes.rentalManagement.title
        : RESOURCE_LABEL.rentalManagement,
    path: '/rental-management/detail'
  },
  //Same name because handle old code issue
  quoteBuilder: {
    title: storedRoutes && storedRoutes.quoteBuilder && storedRoutes.quoteBuilder ? storedRoutes.quoteBuilder?.title : RESOURCE_LABEL.quoteBuilder,
    path: '/quotes'
  },
  quoteBuilderDetail: {
    title: storedRoutes && storedRoutes.quoteBuilder && storedRoutes.quoteBuilder ? storedRoutes.quoteBuilder?.title : RESOURCE_LABEL.quoteBuilder,
    path: '/quotes/detail'
  },
  quotes: {
    title: storedRoutes && storedRoutes.quoteBuilder && storedRoutes.quoteBuilder ? storedRoutes.quoteBuilder?.title : RESOURCE_LABEL.quoteBuilder,
    path: '/quotes'
  },
  quotesDetail: {
    title: storedRoutes && storedRoutes.quoteBuilder && storedRoutes.quoteBuilder ? storedRoutes.quoteBuilder?.title : RESOURCE_LABEL.quoteBuilder,
    path: '/quotes/detail'
  },
  quote: {
    title: storedRoutes && storedRoutes.quoteBuilder && storedRoutes.quoteBuilder ? storedRoutes.quoteBuilder?.title : RESOURCE_LABEL.quoteBuilder,
    path: '/quotes'
  },
  quoteDetail: {
    title: storedRoutes && storedRoutes.quoteBuilder && storedRoutes.quoteBuilder ? storedRoutes.quoteBuilder?.title : RESOURCE_LABEL.quoteBuilder,
    path: '/quotes/detail'
  },
  //
  budget: {
    title: storedRoutes && storedRoutes.budget && storedRoutes.budget ? storedRoutes.budget?.title : RESOURCE_LABEL.budget,
    path: '/budget'
  },
  budgetDetail: {
    title: storedRoutes && storedRoutes.budget && storedRoutes.budget ? storedRoutes.budget?.title : RESOURCE_LABEL.budget,
    path: '/budget/detail'
  },
  pricingCondition: {
    title:
      storedRoutes && storedRoutes.pricingCondition && storedRoutes.pricingCondition
        ? storedRoutes.pricingCondition?.title
        : RESOURCE_LABEL.pricingCondition,
    path: '/pricing-condition'
  },
  pricingConditionDetail: {
    title:
      storedRoutes && storedRoutes.pricingCondition && storedRoutes.pricingCondition
        ? storedRoutes.pricingCondition?.title
        : RESOURCE_LABEL.pricingCondition,
    path: '/pricing-condition/detail'
  },
  marketSegment: {
    title:
      storedRoutes && storedRoutes.marketSegment && storedRoutes.marketSegment ? storedRoutes.marketSegment?.title : RESOURCE_LABEL.marketSegment,
    path: '/market-segment'
  },
  marketSegmentDetail: {
    title:
      storedRoutes && storedRoutes.marketSegment && storedRoutes.marketSegment ? storedRoutes.marketSegment?.title : RESOURCE_LABEL.marketSegment,
    path: '/market-segment/detail'
  },
  quotePdfTemplate: {
    title:
      storedRoutes && storedRoutes.quotePdfTemplate && storedRoutes.quotePdfTemplate
        ? storedRoutes.quotePdfTemplate?.title
        : RESOURCE_LABEL.quotePdfTemplate,
    path: '/quote-pdf-template'
  },
  quotePdfTemplateDetail: {
    title:
      storedRoutes && storedRoutes.quotePdfTemplate && storedRoutes.quotePdfTemplate
        ? storedRoutes.quotePdfTemplate?.title
        : RESOURCE_LABEL.quotePdfTemplate,
    path: '/quote-pdf-template/detail'
  },
  attachment: {
    title: storedRoutes && storedRoutes.attachment && storedRoutes.attachment ? storedRoutes.attachment?.title : RESOURCE_LABEL.attachment,
    path: '/attachment'
  },
  calendar: {
    title: storedRoutes && storedRoutes.calendar && storedRoutes.calendar ? storedRoutes.calendar?.title : RESOURCE_LABEL.calendar,
    path: '/calendar'
  },
  reminder: {
    title: storedRoutes && storedRoutes.reminder && storedRoutes.reminder ? storedRoutes.reminder?.title : RESOURCE_LABEL.reminder,
    path: '/reminder'
  },
  DOARequest: {
    title: storedRoutes && storedRoutes.DOARequest && storedRoutes.DOARequest ? storedRoutes.DOARequest?.title : RESOURCE_LABEL.DOARequest,
    path: '/doa-request'
  },
  task: {
    title: storedRoutes && storedRoutes.task && storedRoutes.task ? storedRoutes.task?.title : RESOURCE_LABEL.task,
    path: '/task'
  },
  case: {
    title: storedRoutes && storedRoutes.case && storedRoutes.case ? storedRoutes.case?.title : RESOURCE_LABEL.case,
    path: '/case'
  },
  note: {
    title: storedRoutes && storedRoutes.note && storedRoutes.note ? storedRoutes.note?.title : RESOURCE_LABEL.note,
    path: '/note'
  },
  zone: {
    title: storedRoutes && storedRoutes.zone && storedRoutes.zone ? storedRoutes.zone?.title : RESOURCE_LABEL.zone,
    path: '/zone'
  },
  zoneDetail: {
    title: storedRoutes && storedRoutes.zone && storedRoutes.zone ? storedRoutes.zone?.title : RESOURCE_LABEL.zone,
    path: '/zone/detail'
  },
  warehouse: {
    title: storedRoutes && storedRoutes.warehouse && storedRoutes.warehouse.title ? storedRoutes.warehouse.title : RESOURCE_LABEL.warehouse,
    path: '/warehouse'
  },
  warehouseDetail: {
    title: storedRoutes && storedRoutes.warehouse && storedRoutes.warehouse.title ? storedRoutes.warehouse.title : RESOURCE_LABEL.warehouse,
    path: '/warehouse/detail'
  },
  deliveryTicket: {
    title:
      storedRoutes && storedRoutes.deliveryTicket && storedRoutes.deliveryTicket.title
        ? storedRoutes.deliveryTicket?.title
        : RESOURCE_LABEL.deliveryTicket,
    path: '/delivery-ticket'
  },
  deliveryTicketDetail: {
    title:
      storedRoutes && storedRoutes.deliveryTicket && storedRoutes.deliveryTicket.title
        ? storedRoutes.deliveryTicket?.title
        : RESOURCE_LABEL.deliveryTicket,
    path: '/delivery-ticket/detail'
  },
  repairJob: {
    title: storedRoutes && storedRoutes.repairJob && storedRoutes.repairJob.title ? storedRoutes.repairJob?.title : RESOURCE_LABEL.repairJob,
    path: '/repair-job'
  },
  repairJobDetail: {
    title: storedRoutes && storedRoutes.repairJob && storedRoutes.repairJob.title ? storedRoutes.repairJob?.title : RESOURCE_LABEL.repairJob,
    path: '/repair-job/detail'
  },
  salesOrder: {
    title: storedRoutes && storedRoutes.salesOrder && storedRoutes.salesOrder.title ? storedRoutes.salesOrder?.title : RESOURCE_LABEL.salesOrder,
    path: '/sales-order'
  },
  salesOrderDetail: {
    title: storedRoutes && storedRoutes.salesOrder && storedRoutes.salesOrder.title ? storedRoutes.salesOrder?.title : RESOURCE_LABEL.salesOrder,
    path: '/sales-order/detail'
  },
  packages: {
    title: storedRoutes && storedRoutes.packages && storedRoutes.packages.title ? storedRoutes.packages?.title : RESOURCE_LABEL.packages,
    path: '/packages'
  },
  packagesDetail: {
    title: storedRoutes && storedRoutes.packages && storedRoutes.packages.title ? storedRoutes.packages?.title : RESOURCE_LABEL.packages,
    path: '/packages/detail'
  },
  purchaseOrder: {
    title:
      storedRoutes && storedRoutes.purchaseOrder && storedRoutes.purchaseOrder.title
        ? storedRoutes.purchaseOrder?.title
        : RESOURCE_LABEL.purchaseOrder,
    path: '/purchase-order'
  },
  purchaseOrderDetail: {
    title:
      storedRoutes && storedRoutes.purchaseOrder && storedRoutes.purchaseOrder.title
        ? storedRoutes.purchaseOrder?.title
        : RESOURCE_LABEL.purchaseOrder,
    path: '/purchase-order/detail'
  },
  transferAsset: {
    title:
      storedRoutes && storedRoutes.transferAsset && storedRoutes.transferAsset.title
        ? storedRoutes.transferAsset?.title
        : RESOURCE_LABEL.transferAsset,
    path: '/transfer-asset'
  },
  transferAssetDetail: {
    title:
      storedRoutes && storedRoutes.transferAsset && storedRoutes.transferAsset.title
        ? storedRoutes.transferAsset?.title
        : RESOURCE_LABEL.transferAsset,
    path: '/transfer-asset/detail'
  },
  transferInventory: {
    title:
      storedRoutes && storedRoutes.transferInventory && storedRoutes.transferInventory.title
        ? storedRoutes.transferInventory?.title
        : RESOURCE_LABEL.transferInventory,
    path: '/transfer-inventory'
  },
  transferInventoryDetail: {
    title:
      storedRoutes && storedRoutes.transferInventory && storedRoutes.transferInventory.title
        ? storedRoutes.transferInventory?.title
        : RESOURCE_LABEL.transferInventory,
    path: '/transfer-inventory/detail'
  },
  address: {
    title: storedRoutes && storedRoutes.address && storedRoutes.address.title ? storedRoutes.address?.title : RESOURCE_LABEL.address,
    path: '/address'
  },
  addressDetail: {
    title: storedRoutes && storedRoutes.address && storedRoutes.address.title ? storedRoutes.address?.title : RESOURCE_LABEL.address,
    path: '/address/detail'
  },
  reports: {
    title: storedRoutes && storedRoutes.reports && storedRoutes.reports.title ? storedRoutes.reports?.title : 'Reports',
    path: '/reports'
  },
  scheduleReport: {
    title:
      storedRoutes && storedRoutes.scheduleReport && storedRoutes.scheduleReport.title
        ? storedRoutes.scheduleReport?.title
        : RESOURCE_LABEL.scheduleReport,
    path: '/schedule-report'
  },
  resourceCalendar: {
    title:
      storedRoutes && storedRoutes.resourceCalendar && storedRoutes.resourceCalendar.title
        ? storedRoutes.resourceCalendar?.title
        : 'Resource Calendar',
    path: '/resource-calendar'
  },
  planningCalendar: {
    title:
      storedRoutes && storedRoutes.planningCalendar && storedRoutes.planningCalendar.title
        ? storedRoutes.planningCalendar?.title
        : 'Planning Calendar',
    path: '/planning-calendar'
  },
  rentalPlanningCalendar: {
    title:
      storedRoutes && storedRoutes.rentalPlanningCalendar && storedRoutes.rentalPlanningCalendar.title
        ? storedRoutes.rentalPlanningCalendar?.title
        : 'Rental Planning Calendar',
    path: '/rental-planning-calendar'
  },
  eCommercePolicy: {
    title:
      storedRoutes && storedRoutes.eCommercePolicy && storedRoutes.eCommercePolicy.title ? storedRoutes.eCommercePolicy?.title : 'e-Commerce Policy',
    path: '/e-commerce-policy'
  },
  sublease: {
    title: storedRoutes && storedRoutes.sublease && storedRoutes.sublease.title ? storedRoutes.sublease?.title : RESOURCE_LABEL.sublease,
    path: '/sublease'
  },
  subleaseDetail: {
    title: storedRoutes && storedRoutes.sublease && storedRoutes.sublease.title ? storedRoutes.sublease?.title : RESOURCE_LABEL.sublease,
    path: '/sublease/detail'
  },
  wellMaster: {
    title: storedRoutes && storedRoutes.wellMaster && storedRoutes.wellMaster.title ? storedRoutes.wellMaster?.title : RESOURCE_LABEL.wellMaster,
    path: '/well-master'
  },
  wellMasterDetail: {
    title: storedRoutes && storedRoutes.wellMaster && storedRoutes.wellMaster.title ? storedRoutes.wellMaster?.title : RESOURCE_LABEL.wellMaster,
    path: '/well-master/detail'
  },
  bulkAssetCreation: {
    title:
      storedRoutes && storedRoutes.bulkAssetCreation && storedRoutes.bulkAssetCreation.title
        ? storedRoutes.bulkAssetCreation?.title
        : RESOURCE_LABEL.bulkAssetCreation,
    path: '/bulk-asset-creation'
  },
  bulkAssetCreationDetail: {
    title:
      storedRoutes && storedRoutes.bulkAssetCreation && storedRoutes.bulkAssetCreation.title
        ? storedRoutes.bulkAssetCreation?.title
        : RESOURCE_LABEL.bulkAssetCreation,
    path: '/bulk-asset-creation/detail'
  },
  pos: {
    title: storedRoutes && storedRoutes.pos && storedRoutes.pos.title ? storedRoutes.pos?.title : RESOURCE_LABEL.pos,
    path: '/erecs'
  },
  posProductDetail: {
    title: storedRoutes && storedRoutes.pos && storedRoutes.pos.title ? storedRoutes.pos?.title : RESOURCE_LABEL.pos,
    path: '/erecs/product'
  },
  repairType: {
    title: storedRoutes && storedRoutes.repairType && storedRoutes.repairType.title ? storedRoutes.repairType?.title : RESOURCE_LABEL.repairType,
    path: '/repair-type'
  },
  repairTypeDetail: {
    title: storedRoutes && storedRoutes.repairType && storedRoutes.repairType.title ? storedRoutes.repairType?.title : RESOURCE_LABEL.repairType,
    path: '/repair-type/detail'
  },

  storageLocation: {
    title:
      storedRoutes && storedRoutes.storageLocation && storedRoutes.storageLocation.title
        ? storedRoutes.storageLocation?.title
        : RESOURCE_LABEL.storageLocation,
    path: '/storage-location'
  },
  storageLocationDetail: {
    title:
      storedRoutes && storedRoutes.storageLocation && storedRoutes.storageLocation.title
        ? storedRoutes.storageLocation?.title
        : RESOURCE_LABEL.storageLocation,
    path: '/storage-location/detail'
  },

  cageManagement: {
    title:
      storedRoutes && storedRoutes.cageManagement && storedRoutes.cageManagement.title
        ? storedRoutes.cageManagement?.title
        : RESOURCE_LABEL.cageManagement,
    path: '/cage-management'
  },
  productAuction: {
    title:
      storedRoutes && storedRoutes.productAuction && storedRoutes.productAuction.title
        ? storedRoutes.productAuction?.title
        : RESOURCE_LABEL.productAuction,
    path: '/product-auction'
  },
  productAuctionDetail: {
    title:
      storedRoutes && storedRoutes.productAuction && storedRoutes.productAuction.title
        ? storedRoutes.productAuction?.title
        : RESOURCE_LABEL.productAuction,
    path: '/product-auction/detail'
  },
  inventoryToAsset: {
    title:
      storedRoutes && storedRoutes.InventoryToAsset && storedRoutes.InventoryToAsset.title
        ? storedRoutes.InventoryToAsset?.title
        : RESOURCE_LABEL.inventoryToAsset,
    path: '/inventory-to-asset'
  },
  importExport: {
    title:
      storedRoutes && storedRoutes.InventoryToAsset && storedRoutes.InventoryToAsset.title
        ? storedRoutes.InventoryToAsset?.title
        : RESOURCE_LABEL.importExport,
    path: '/import-export'
  },
  inventoryCycle: {
    title:
      storedRoutes && storedRoutes?.inventoryCycle && storedRoutes?.inventoryCycle.title
        ? storedRoutes?.inventoryCycle?.title
        : RESOURCE_LABEL.inventoryCycle,
    path: '/inventory-cycle'
  },
  inventoryCycleDetail: {
    title:
      storedRoutes && storedRoutes?.inventoryCycle && storedRoutes?.inventoryCycle?.title
        ? storedRoutes?.inventoryCycle?.title
        : RESOURCE_LABEL.inventoryCycle,
    path: '/inventory-cycle/detail'
  },
  cycleCountDetermination: {
    title:
      storedRoutes && storedRoutes?.cycleCountDetermination && storedRoutes?.cycleCountDetermination?.title
        ? storedRoutes?.cycleCountDetermination?.title
        : RESOURCE_LABEL.cycleCountDetermination,
    path: '/cycle-count-determination'
  },
  cycleCountPhysicalInventory: {
    title:
      storedRoutes && storedRoutes?.cycleCountPhysicalInventory && storedRoutes?.cycleCountPhysicalInventory?.title
        ? storedRoutes?.cycleCountPhysicalInventory?.title
        : RESOURCE_LABEL.cycleCountPhysicalInventory,
    path: '/cycle-count-physical-inventory'
  },
  quotation: {
    title: storedRoutes && storedRoutes.quotation && storedRoutes.quotation.title ? storedRoutes.quotation?.title : RESOURCE_LABEL.quotation,
    path: '/quotation'
  },
  quotationDetail: {
    title: storedRoutes && storedRoutes.quotation && storedRoutes.quotation.title ? storedRoutes.quotation?.title : RESOURCE_LABEL.quotation,
    path: '/quotation/detail'
  },
  serviceMaster: {
    title:
      storedRoutes && storedRoutes.serviceMaster && storedRoutes.serviceMaster.title
        ? storedRoutes.serviceMaster?.title
        : RESOURCE_LABEL.serviceMaster,
    path: '/service-master'
  },
  serviceMasterDetail: {
    title:
      storedRoutes && storedRoutes.serviceMaster && storedRoutes.serviceMaster.title
        ? storedRoutes.serviceMaster?.title
        : RESOURCE_LABEL.serviceMaster,
    path: '/service-master/detail'
  },
  leadTimeMaster: {
    title:
      storedRoutes && storedRoutes.leadTimeMaster && storedRoutes.leadTimeMaster.title
        ? storedRoutes.leadTimeMaster?.title
        : RESOURCE_LABEL.leadTimeMaster,
    path: '/lead-time-master'
  },
  leadTimeMasterDetail: {
    title:
      storedRoutes && storedRoutes.leadTimeMaster && storedRoutes.leadTimeMaster.title
        ? storedRoutes.leadTimeMaster?.title
        : RESOURCE_LABEL.leadTimeMaster,
    path: '/lead-time-master/detail'
  },
  repairOrder: {
    title: storedRoutes && storedRoutes.repairOrder && storedRoutes.repairOrder.title ? storedRoutes.repairOrder?.title : RESOURCE_LABEL.repairOrder,
    path: '/repair-order'
  },
  repairOrderDetail: {
    title: storedRoutes && storedRoutes.repairOrder && storedRoutes.repairOrder.title ? storedRoutes.repairOrder?.title : RESOURCE_LABEL.repairOrder,
    path: '/repair-order/detail'
  },
  productionOrder: {
    title:
      storedRoutes && storedRoutes.productionOrder && storedRoutes.productionOrder.title
        ? storedRoutes.productionOrder?.title
        : RESOURCE_LABEL.productionOrder,
    path: '/production-order'
  },
  productionOrderDetail: {
    title:
      storedRoutes && storedRoutes.productionOrder && storedRoutes.productionOrder.title
        ? storedRoutes.productionOrder?.title
        : RESOURCE_LABEL.productionOrder,
    path: '/production-order/detail'
  },
  fieldServiceOrder: {
    title:
      storedRoutes && storedRoutes.fieldServiceOrder && storedRoutes.fieldServiceOrder.title
        ? storedRoutes.fieldServiceOrder?.title
        : RESOURCE_LABEL.fieldServiceOrder,
    path: '/field-service-order'
  },
  fieldServiceOrderDetail: {
    title:
      storedRoutes && storedRoutes.fieldServiceOrder && storedRoutes.fieldServiceOrder.title
        ? storedRoutes.fieldServiceOrder?.title
        : RESOURCE_LABEL.fieldServiceOrder,
    path: '/field-service-order/detail'
  },
  workOrder: {
    title: storedRoutes && storedRoutes.workOrder && storedRoutes.workOrder.title ? storedRoutes.workOrder?.title : RESOURCE_LABEL.workOrder,
    path: '/work-order'
  },
  workOrderDetail: {
    title: storedRoutes && storedRoutes.workOrder && storedRoutes.workOrder.title ? storedRoutes.workOrder?.title : RESOURCE_LABEL.workOrder,
    path: '/work-order/detail'
  },
  invoice: {
    title: storedRoutes && storedRoutes.invoice && storedRoutes.invoice.title ? storedRoutes.invoice?.title : RESOURCE_LABEL.invoice,
    path: '/invoice'
  },
  invoiceDetail: {
    title: storedRoutes && storedRoutes.invoice && storedRoutes.invoice.title ? storedRoutes.invoice?.title : RESOURCE_LABEL.invoice,
    path: '/invoice/detail'
  },
  workOrderSupervisor: {
    title:
      storedRoutes && storedRoutes.workOrderSupervisor && storedRoutes.workOrderSupervisor.title
        ? storedRoutes.workOrderSupervisor?.title
        : RESOURCE_LABEL.workOrderSupervisor,
    path: '/work-order-supervisor'
  },
  workOrderTechnician: {
    title:
      storedRoutes && storedRoutes.workOrderTechnician && storedRoutes.workOrderTechnician.title
        ? storedRoutes.workOrderTechnician?.title
        : RESOURCE_LABEL.workOrderTechnician,
    path: '/work-order-technician'
  },
  frequentlyAskedQuestion: {
    title:
      storedRoutes && storedRoutes.frequentlyAskedQuestion && storedRoutes.frequentlyAskedQuestion.title
        ? storedRoutes.frequentlyAskedQuestion?.title
        : RESOURCE_LABEL.freqentlyAskedQuestion,
    path: '/frequently-asked-question'
  },
  frequentlyAskedQuestionDetail: {
    title:
      storedRoutes && storedRoutes.frequentlyAskedQuestion && storedRoutes.frequentlyAskedQuestion.title
        ? storedRoutes.frequentlyAskedQuestion?.title
        : RESOURCE_LABEL.freqentlyAskedQuestion,
    path: '/frequently-asked-question/detail'
  },
  blog: {
    title: storedRoutes && storedRoutes.blog && storedRoutes.blog.title ? storedRoutes.blog?.title : RESOURCE_LABEL.blog,
    path: '/blog'
  },
  blogDetail: {
    title: storedRoutes && storedRoutes.blog && storedRoutes.blog.title ? storedRoutes.blog?.title : RESOURCE_LABEL.blog,
    path: '/blog/detail'
  },
  eCommerceHome: {
    title:
      storedRoutes && storedRoutes.eCommerceHome && storedRoutes.eCommerceHome.title
        ? storedRoutes.eCommerceHome?.title
        : RESOURCE_LABEL?.eCommerceHome,
    path: '/e-commerce-home'
  },
  surveys: {
    title: storedRoutes && storedRoutes.surveys && storedRoutes.surveys.title ? storedRoutes.surveys?.title : RESOURCE_LABEL?.surveys,
    path: '/surveys'
  },
  surveysDetail: {
    title: storedRoutes && storedRoutes.surveys && storedRoutes.surveys.title ? storedRoutes.surveys?.title : RESOURCE_LABEL.surveys,
    path: '/surveys/detail'
  },
  contactUs: {
    title: storedRoutes && storedRoutes.contactUs && storedRoutes.contactUs.title ? storedRoutes.contactUs?.title : RESOURCE_LABEL?.contactUs,
    path: '/contact-us'
  },
  contactUsDetail: {
    title: storedRoutes && storedRoutes.contactUs && storedRoutes.contactUs.title ? storedRoutes.contactUs?.title : RESOURCE_LABEL?.contactUs,
    path: '/contact-us/detail'
  },
  supportTicket: {
    title:
      storedRoutes && storedRoutes.supportTicket && storedRoutes.supportTicket.title
        ? storedRoutes.supportTicket?.title
        : RESOURCE_LABEL?.supportTicket,
    path: '/support-ticket'
  },
  supportTicketDetail: {
    title:
      storedRoutes && storedRoutes.supportTicket && storedRoutes.supportTicket.title
        ? storedRoutes.supportTicket?.title
        : RESOURCE_LABEL?.supportTicket,
    path: '/support-ticket/detail'
  },
  demandOrder: {
    title: storedRoutes && storedRoutes.demandOrder && storedRoutes.demandOrder.title ? storedRoutes.demandOrder?.title : RESOURCE_LABEL.demandOrder,
    path: '/demand-order'
  },
  demandOrderDetail: {
    title: storedRoutes && storedRoutes.demandOrder && storedRoutes.demandOrder.title ? storedRoutes.demandOrder?.title : RESOURCE_LABEL.demandOrder,
    path: '/demand-order/detail'
  },
  employeeMaster: {
    title:
      storedRoutes && storedRoutes.employeeMaster && storedRoutes.employeeMaster.title
        ? storedRoutes.employeeMaster?.title
        : RESOURCE_LABEL?.employeeMaster,
    path: '/employee-master'
  },
  employeeMasterDetail: {
    title:
      storedRoutes && storedRoutes.employeeMaster && storedRoutes.employeeMaster.title
        ? storedRoutes.employeeMaster?.title
        : RESOURCE_LABEL?.employeeMaster,
    path: '/employee-master/detail'
  },
  competencyType: {
    title:
      storedRoutes && storedRoutes.competencyType && storedRoutes.competencyType.title
        ? storedRoutes.competencyType?.title
        : RESOURCE_LABEL.competencyType,
    path: '/competency-type'
  },
  competencyTypeDetail: {
    title:
      storedRoutes && storedRoutes.competencyType && storedRoutes.competencyType.title
        ? storedRoutes.competencyType?.title
        : RESOURCE_LABEL.competencyType,
    path: '/competency-type/detail'
  },
  technicianScheduler: {
    title:
      storedRoutes && storedRoutes.technicianScheduler && storedRoutes.technicianScheduler.title
        ? storedRoutes.technicianScheduler?.title
        : RESOURCE_LABEL.technicianScheduler,
    path: '/technician-scheduler'
  },
  irtTicket: {
    title: storedRoutes && storedRoutes.irtTicket && storedRoutes.irtTicket.title ? storedRoutes.irtTicket?.title : RESOURCE_LABEL.irtTicket,
    path: '/irt-ticket'
  },
  irtTicketDetail: {
    title: storedRoutes && storedRoutes.irtTicket && storedRoutes.irtTicket.title ? storedRoutes.irtTicket?.title : RESOURCE_LABEL.irtTicket,
    path: '/irt-ticket/detail'
  },
  purchaseRequisition: {
    title:
      storedRoutes && storedRoutes.purchaseRequisition && storedRoutes.purchaseRequisition.title
        ? storedRoutes.purchaseRequisition?.title
        : RESOURCE_LABEL.purchaseRequisition,
    path: '/purchase-requisition'
  },
  purchaseRequisitionDetail: {
    title:
      storedRoutes && storedRoutes.purchaseRequisition && storedRoutes.purchaseRequisition.title
        ? storedRoutes.purchaseRequisition?.title
        : RESOURCE_LABEL.purchaseRequisition,
    path: '/purchase-requisition/detail'
  },
  planning: {
    title: storedRoutes && storedRoutes.planning && storedRoutes.planning.title ? storedRoutes.planning?.title : RESOURCE_LABEL.planning,
    path: '/planning'
  },
  planningDetail: {
    title: storedRoutes && storedRoutes.planning && storedRoutes.planning.title ? storedRoutes.planning?.title : RESOURCE_LABEL.planning,
    path: '/planning/detail'
  },
  fieldTicket: {
    title: storedRoutes && storedRoutes.fieldTicket && storedRoutes.fieldTicket.title ? storedRoutes.fieldTicket?.title : RESOURCE_LABEL.fieldTicket,
    path: '/field-ticket'
  },
  fieldTicketDetail: {
    title: storedRoutes && storedRoutes.fieldTicket && storedRoutes.fieldTicket.title ? storedRoutes.fieldTicket?.title : RESOURCE_LABEL.fieldTicket,
    path: '/field-ticket/detail'
  },
  fieldServiceTechnician: {
    title:
      storedRoutes && storedRoutes.fieldServiceTechnician && storedRoutes.fieldServiceTechnician.title
        ? storedRoutes.fieldServiceTechnician?.title
        : RESOURCE_LABEL.fieldServiceTechnician,
    path: '/field-service-technician'
  },
  fleetDispatch: {
    title:
      storedRoutes && storedRoutes.fleetDispatch && storedRoutes.fleetDispatch.title
        ? storedRoutes.fleetDispatch?.title
        : RESOURCE_LABEL.fleetDispatch,
    path: '/fleet-dispatch'
  },
  fleetMaster: {
    title: storedRoutes && storedRoutes.fleetMaster && storedRoutes.fleetMaster.title ? storedRoutes.fleetMaster?.title : RESOURCE_LABEL.fleetMaster,
    path: '/fleet-master'
  },
  fleetMasterDetail: {
    title: storedRoutes && storedRoutes.fleetMaster && storedRoutes.fleetMaster.title ? storedRoutes.fleetMaster?.title : RESOURCE_LABEL.fleetMaster,
    path: '/fleet-master/detail'
  },
  job: {
    title: storedRoutes && storedRoutes.job && storedRoutes.job.title ? storedRoutes.job?.title : RESOURCE_LABEL.job,
    path: '/job'
  },
  jobDetail: {
    title: storedRoutes && storedRoutes.job && storedRoutes.job.title ? storedRoutes.job?.title : RESOURCE_LABEL.job,
    path: '/job/detail'
  },
  fleetReceiver: {
    title:
      storedRoutes && storedRoutes.fleetReceiver && storedRoutes.fleetReceiver.title
        ? storedRoutes.fleetReceiver?.title
        : RESOURCE_LABEL.fleetReceiver,
    path: '/fleet-receiver'
  },
  transactionLock: {
    title:
      storedRoutes && storedRoutes.transactionLock && storedRoutes.transactionLock.title
        ? storedRoutes.transactionLock?.title
        : RESOURCE_LABEL.transactionLock,
    path: '/transaction-lock'
  },
  transactionLockDetail: {
    title:
      storedRoutes && storedRoutes.transactionLock && storedRoutes.transactionLock.title
        ? storedRoutes.transactionLock?.title
        : RESOURCE_LABEL.transactionLock,
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
  }
};

export default routes;
