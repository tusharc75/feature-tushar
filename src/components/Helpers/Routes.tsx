import { RESOURCE_LABEL } from "../../constants/helpers";

const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;

const routes = {
  lead: {
    title: storedRoutes ? storedRoutes.lead?.title : RESOURCE_LABEL.lead,
    path: "/lead",
    data: {},
  },
  leadDetail: {
    title: storedRoutes ? storedRoutes.lead?.title : RESOURCE_LABEL.lead,
    path: "/lead/detail",
    data: {},
  },
  opportunity: {
    title: storedRoutes ? storedRoutes.opportunity?.title : RESOURCE_LABEL.opportunity,
    path: "/opportunity",
    data: {},
  },
  user: {
    title: storedRoutes ? storedRoutes.user?.title : RESOURCE_LABEL.user,
    path: "/user",
    data: {},
  },
  userDetail: {
    title: storedRoutes ? storedRoutes.user?.title : RESOURCE_LABEL.user,
    path: "/user/detail",
    data: {},
  },
  entity: {
    title: storedRoutes ? storedRoutes.entity?.title : RESOURCE_LABEL.entity,
    path: "/entity",
    data: {},
  },
  entityDetails: {
    title: storedRoutes ? storedRoutes.entity?.title : RESOURCE_LABEL.entity,
    path: "/entity/detail",
    data: {},
  },
  role: {
    title: storedRoutes ? storedRoutes.role?.title : RESOURCE_LABEL.role,
    path: "/role",
    data: {},
  },
  roleDetail: {
    title: storedRoutes ? storedRoutes.role?.title : RESOURCE_LABEL.role,
    path: "/role/detail",
    data: {},
  },
  opportunityDetail: {
    title: storedRoutes ? storedRoutes.opportunity?.title : RESOURCE_LABEL.opportunity,
    path: "/opportunity/detail",
    data: {},
  },
  activity: {
    title: "Activity",
    path: "/activity",
    data: {},
  },
  activityEmail: {
    title: storedRoutes ? storedRoutes.email?.title : RESOURCE_LABEL.email,
    path: "/email",
    data: {},
  },
  activityNote: {
    title: storedRoutes ? storedRoutes.note?.title : RESOURCE_LABEL.note,
    path: "/note",
    data: {},
  },
  customerAccount: {
    title: storedRoutes ? storedRoutes.customerAccount?.title : RESOURCE_LABEL.customerAccount,
    path: "/customer-account",
  },
  customerAccountDetail: {
    title: storedRoutes ? storedRoutes.customerAccount?.title : RESOURCE_LABEL.customerAccount,
    path: "/customer-account/detail",
  },
  supplierAccount: {
    title: storedRoutes ? storedRoutes.supplierAccount?.title : RESOURCE_LABEL.account,
    path: "/supplier-account",
  },
  supplierAccountDetail: {
    title: storedRoutes ? storedRoutes.supplierAccount?.title : RESOURCE_LABEL.account,
    path: "/supplier-account/detail",
  },
  customerContact: {
    title: storedRoutes ? storedRoutes.customerContact?.title : RESOURCE_LABEL.customerContact,
    path: "/customer-contact",
  },
  customerContactDetail: {
    title: storedRoutes ? storedRoutes.customerContact?.title : RESOURCE_LABEL.customerContact,
    path: "/customer-contact/detail",
  },
  supplierContact: {
    title: storedRoutes ? storedRoutes.supplierContact?.title : RESOURCE_LABEL.contact,
    path: "/supplier-contact",
  },
  supplierContactDetail: {
    title: storedRoutes ? storedRoutes.supplierContact?.title : RESOURCE_LABEL.contact,
    path: "/supplier-contact/detail",
  },
  //  need to see either we are using this doa or not
  doa: {
    title: RESOURCE_LABEL.doa,
    path: "/doa",
  },
  product: {
    title: storedRoutes ? storedRoutes.product?.title : RESOURCE_LABEL.product,
    path: "/product",
  },
  productDetail: {
    title: storedRoutes ? storedRoutes.product?.title : RESOURCE_LABEL.product,
    path: "/product/detail",
  },
  formBuilder: {
    title: storedRoutes ? storedRoutes.formBuilder?.title : RESOURCE_LABEL.formBuilder,
    path: "/form-builder",
  },
  formBuilderResource: {
    title: "Resource",
    path: "/:resource",
  },
  termsAndConditions: {
    title: storedRoutes ? storedRoutes.termsAndConditions?.title : RESOURCE_LABEL.termsAndConditions,
    path: "/terms-conditions",
  },
  profilePage: {
    title: "Profile",
    path: "/profile",
  },
  projectSales: {
    title: storedRoutes ? storedRoutes.projectSales?.title : RESOURCE_LABEL.projectStrategy,
    path: "/project-sales",
  },
  projectSalesDetail: {
    title: storedRoutes ? storedRoutes.projectSales?.title : RESOURCE_LABEL.projectStrategy,
    path: "/project-sales/detail",
  },
  priceTemplate: {
    title: storedRoutes ? storedRoutes.priceTemplate?.title : RESOURCE_LABEL.priceTemplate,
    path: "/price-template",
  },
  productBuilder: {
    title: storedRoutes ? storedRoutes.productBuilder?.title : RESOURCE_LABEL.productBuilder,
    path: "/product-builder",
  },
  brandConfiguration: {
    title: "Brand Configuration",
    path: "/brand-configuration",
  },
  currencyConverter: {
    title: storedRoutes ? storedRoutes.currencyConverter?.title : RESOURCE_LABEL.currencyConverter,
    path: "/currency-converter",
  },
  productCategory: {
    title: storedRoutes ? storedRoutes.productCategory?.title : RESOURCE_LABEL.productCategory,
    path: "/product-category",
  },
  productTemplate: {
    title: storedRoutes ? storedRoutes.productTemplate?.title : RESOURCE_LABEL.productTemplate,
    path: "/product-template",
  },
  productInventory: {
    title: (storedRoutes && storedRoutes.productInventory && storedRoutes.productInventory.title) ? storedRoutes.productInventory.title : RESOURCE_LABEL.productInventory,
    path: "/product-inventory",
  },
  productInventoryDetail: {
    title: (storedRoutes && storedRoutes.productInventory && storedRoutes.productInventory.title) ? storedRoutes.productInventory.title : RESOURCE_LABEL.productInventory,
    path: "/product-inventory/detail",
  },
  equipmentRentalMaster: {
    title: (storedRoutes && storedRoutes.equipmentRentalMaster && storedRoutes.equipmentRentalMaster) ? storedRoutes.equipmentRentalMaster.title : RESOURCE_LABEL.equipmentRentalMaster,
    path: "/equiptment-rental-master",
  },
  rentalManagement: {
    title: (storedRoutes && storedRoutes.rentalManagement && storedRoutes.rentalManagement) ? storedRoutes.rentalManagement.title : RESOURCE_LABEL.rentalManagement,
    path: "/rental-management",
  },
  quoteBuilder: {
    title: storedRoutes ? storedRoutes.quoteBuilder?.title : RESOURCE_LABEL.quoteBuilder,
    path: "/quotes",
  },
  quoteBuilderDetail: {
    title: storedRoutes ? storedRoutes.quoteBuilder?.title : RESOURCE_LABEL.quoteBuilder,
    path: "/quotes/detail",
  },
  budget: {
    title: storedRoutes ? storedRoutes.budget?.title : RESOURCE_LABEL.budget,
    path: "/budget",
  },
  marketSegment: {
    title: storedRoutes ? storedRoutes.marketSegment?.title : RESOURCE_LABEL.marketSegment,
    path: "/market-segment",
  },
  quotePdfTemplate: {
    title: storedRoutes ? storedRoutes.quotePdfTemplate?.title : RESOURCE_LABEL.quotePdfTemplate,
    path: "/quote-pdf-template",
  },
  quotePdfTemplateDetail: {
    title: storedRoutes ? storedRoutes.quotePdfTemplate?.title : RESOURCE_LABEL.quotePdfTemplate,
    path: "/quote-pdf-template/detail",
  },
  attachment: {
    title: storedRoutes ? storedRoutes.attachment?.title : RESOURCE_LABEL.attachment,
    path: "/attachment",
  },
  calendar: {
    title: storedRoutes ? storedRoutes.calendar?.title : RESOURCE_LABEL.calendar,
    path: "/calendar",
  },
  reminder: {
    title: storedRoutes ? storedRoutes.reminder?.title : RESOURCE_LABEL.reminder,
    path: "/reminder",
  },
  DOARequest: {
    title: storedRoutes ? storedRoutes.DOARequest?.title : RESOURCE_LABEL.DOARequest,
    path: "/doa-request",
  },
  task: {
    title: storedRoutes ? storedRoutes.task?.title : RESOURCE_LABEL.task,
    path: "/task",
  },
  case: {
    title: storedRoutes ? storedRoutes.case?.title : RESOURCE_LABEL.case,
    path: "/case",
  },
  note: {
    title: storedRoutes ? storedRoutes.note?.title : RESOURCE_LABEL.note,
    path: "/note",
  },
  productList: {
    title: "Products",
    path: "/product-list",
  },
  address: {
    title: (storedRoutes && storedRoutes.address && storedRoutes.address.title) ? storedRoutes.address.title : RESOURCE_LABEL.address,
    path: "/address",
  },
};

export default routes;
