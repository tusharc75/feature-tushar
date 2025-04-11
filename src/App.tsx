import { CssBaseline } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import queryString from 'query-string';
import { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import CustomIntro from 'src/components/CustomIntro';
import ForceUpdatePopup from 'src/components/ForceUpdatePopup';
import CustomMessageDialog from 'src/components/MessageDialog';
import { VITE_APP_ENV } from 'src/config';
import prebuildData from 'src/prebuild/prebuildData.json';
import { registerSW } from 'virtual:pwa-register';
import axiosInstance from './axios/axiosInstance';
import CustomToaster from './components/Helpers/CustomToast';
import RecordDeletedDialog from './components/Helpers/RecordDeletedDialog';
import routes from './components/Helpers/Routes';
import PrivateRoute from './components/PrivateRoute';
import ScreenOrientationOverlay from './components/ScreenMessages/ScreenOrientationOverlay';
import ColorModeProvider from './constants/AppConfig';
import { compareVersions, customerAccount, customerContact, handleHardReload, supplierAccount, supplierContact } from './constants/helpers';
import ErrorBoundaryComponent from './ErrorBoundary';
import { SET_SELECTED_ENTITY, SET_USER } from './StateProvider/actionTypes';
import { CustomChatNotificationCountContext } from './StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import { CustomNotificationCountContext } from './StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomToastContext } from './StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from './StateProvider/OfflineContext/OfflineContext';
import { useData } from './StateProvider/Provider';

const AssemblyOrder = lazy(() => import('src/pages/AssemblyOrder'));
const AssemblyOrderDetail = lazy(() => import('src/pages/AssemblyOrder/AssemblyOrderDetail'));
const LoginMFA = lazy(() => import('src/pages/Auth/LoginMFA'));
const EquiptAi = lazy(() => import('src/pages/EquiptAi'));
const TrainAiModel = lazy(() => import('src/pages/EquiptAi/TrainAiModel'));
const ExpenseApproval = lazy(() => import('src/pages/ExpenseApproval'));
const Expenses = lazy(() => import('src/pages/Expenses'));
const ExpenseDetailsPage = lazy(() => import('src/pages/Expenses/ExpenseDetail'));
const ExpenseReport = lazy(() => import('src/pages/ExpensesReport'));
const ExpenseReportDetailsPage = lazy(() => import('src/pages/ExpensesReport/ExpenseReportDetail'));
const Integration = lazy(() => import('src/pages/Integration'));
const PackageCategory = lazy(() => import('src/pages/PackageCategory'));
const PackageCategoryDetail = lazy(() => import('src/pages/PackageCategory/PackageCategoryDetail'));
const PackageInventory = lazy(() => import('src/pages/PackageInventory'));
const ProductTypes = lazy(() => import('src/pages/ProductTypes'));
const ProductTypesDetail = lazy(() => import('src/pages/ProductTypes/ProductTypesDetail'));
const ReportsCenter = lazy(() => import('src/pages/Reports'));
const ResourceDoaRequestDetail = lazy(() => import('src/pages/ResourceDoaRequest/ResourceDoaRequestDetail'));
const ScheduleAndDispatch = lazy(() => import('src/pages/ScheduleAndDispatch'));
const ScheduleMaintenance = lazy(() => import('src/pages/ScheduleMaintenance'));
const SerializedAssetStatusChangeRequestDetail = lazy(
  () => import('src/pages/SerializedAsset/SerializedAssetStatusChangeRequest/SerializedAssetStatusChangeRequestDetail')
);
const SerializedPackages = lazy(() => import('src/pages/SerializedPackages'));
const SerializedPackagesDetail = lazy(() => import('src/pages/SerializedPackages/SerializedPackagesDetail'));
const ServiceCategory = lazy(() => import('src/pages/ServiceCategory'));
const ServiceCategoryDetail = lazy(() => import('src/pages/ServiceCategory/ServiceCategoryDetail'));
const SubcontractAssembly = lazy(() => import('src/pages/SubcontractAssembly'));
const SubcontractAssemblyDetail = lazy(() => import('src/pages/SubcontractAssembly/SubcontractAssemblyDetail'));
const WorkFlow = lazy(() => import('src/pages/WorkFlow'));
const CreateWorkFlow = lazy(() => import('src/pages/WorkFlow/CreateWorkFlow'));
const WorkFlowReport = lazy(() => import('src/pages/workFlowReport'));
const WorkFlowReportDetail = lazy(() => import('src/pages/workFlowReport/workFlowReportDetails'));
const WorkSpace = lazy(() => import('src/pages/WorkSpace'));
const AccountDetailPage = lazy(() => import('./pages/Account/AccountDetailPage'));
const Account = lazy(() => import('./pages/Account/index'));
const Activity = lazy(() => import('./pages/Activity'));
const Activitydemo = lazy(() => import('./pages/Activity/activitydemo'));
const Attachments = lazy(() => import('./pages/Activity/Attachments'));
const Calender = lazy(() => import('./pages/Activity/Calendar'));
const Email = lazy(() => import('./pages/Activity/Email'));
const Note = lazy(() => import('./pages/Activity/Note'));
const Address = lazy(() => import('./pages/Address'));
const AddressDetailPage = lazy(() => import('./pages/Address/AddressDetailPage'));
const AzureLogin = lazy(() => import('./pages/Auth/AzureLogin'));
const AzureSSOError = lazy(() => import('./pages/Auth/AzureSSOError'));
const AzureSSOLogin = lazy(() => import('./pages/Auth/AzureSSOLogin'));
const ForgetPassword = lazy(() => import('./pages/Auth/ForgetPassword'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Logout = lazy(() => import('./pages/Auth/Logout'));
const PasswordSetup = lazy(() => import('./pages/Auth/PasswordSetup'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/Blog/BlogDetail'));
const BOMTable = lazy(() => import('./pages/BOM'));
const BrandConfiguration = lazy(() => import('./pages/BrandConfiguration'));
const Budget = lazy(() => import('./pages/Budget'));
const BudgetDetail = lazy(() => import('./pages/Budget/BudgetDetail'));
const BulkAssetCreation = lazy(() => import('./pages/BulkAssetCreation'));
const BulkAssetCreationDetailsPage = lazy(() => import('./pages/BulkAssetCreation/BulkAssetCreationDetailsPage'));
const CageManagement = lazy(() => import('./pages/CageManagement'));
const ChartOfAccount = lazy(() => import('./pages/ChartOfAccount'));
const ChartOfAccountDetail = lazy(() => import('./pages/ChartOfAccount/ChartOfAccountDetail'));
const Competencies = lazy(() => import('./pages/Competencies'));
const CompetenciesDetail = lazy(() => import('./pages/Competencies/CompetenciesDetail'));
const CompetencyType = lazy(() => import('./pages/CompetencyType'));
const CompetencyTypeDetail = lazy(() => import('./pages/CompetencyType/CompetencyTypeDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const ContactDetailPage = lazy(() => import('./pages/Contact/ContactDetailPage'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const ContactUsDetail = lazy(() => import('./pages/ContactUs/ContactUsDetail'));
const ConvertInventory = lazy(() => import('./pages/ConvertInventory'));
const CreditMemo = lazy(() => import('./pages/CreditMemo'));
const CreditMemoDetail = lazy(() => import('./pages/CreditMemo/CreditMemoDetail'));
const CurrencyConverter = lazy(() => import('./pages/CurrencyConverter'));
const CycleCountDetermination = lazy(() => import('./pages/CycleCountDetermination'));
const CycleCountPhysicalInventory = lazy(() => import('./pages/CycleCountPhysicalInventory'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardsList = lazy(() => import('./pages/DashboardBuilder'));
const DashboardBuilder = lazy(() => import('./pages/DashboardBuilder/DashboardManager'));
const DataList = lazy(() => import('./pages/DataList'));
const DataListDetail = lazy(() => import('./pages/DataList/dataListdetail'));
const Deals = lazy(() => import('./pages/Deals'));
const DealDetail = lazy(() => import('./pages/Deals/dealDetail'));
const CustomerSign = lazy(() => import('./pages/DeliveryTicket/CustomerSign'));
const DeliveryTicketDetailsPage = lazy(() => import('./pages/DeliveryTicket/DeliveryTicketDetailPage'));
const DeliveryTicket = lazy(() => import('./pages/DeliveryTicket/index'));
const DemandOrder = lazy(() => import('./pages/DemandOrder'));
const DemandOrderDetails = lazy(() => import('./pages/DemandOrder/DemandOrderDetails'));
const DeviceTemplates = lazy(() => import('./pages/DeviceTemplates'));
const DeviceTemplatesDetails = lazy(() => import('./pages/DeviceTemplates/DeviceTemplatesDetails'));
const DeviceTemplatesAlert = lazy(() => import('./pages/DeviceTemplatesAlert'));
const DeviceTemplateAlertDetail = lazy(() => import('./pages/DeviceTemplatesAlert/DeviceTemplateAlertDetail'));
const DOARequest = lazy(() => import('./pages/DOA'));
const DOAapproval = lazy(() => import('./pages/DOA/DOAApproval'));
const DOAApprovalQuotation = lazy(() => import('./pages/DOA/DOAApprovalQuotation'));
const Doa = lazy(() => import('./pages/DoaSetup'));
const DriverMaster = lazy(() => import('./pages/DriverMaster'));
const DriverMasterDetail = lazy(() => import('./pages/DriverMaster/DriverMasterDetail'));
const DynamicForm = lazy(() => import('./pages/DynamicForm'));
const DynamicFormDetail = lazy(() => import('./pages/DynamicForm/DynamicFormDetail'));
const EcommerceHome = lazy(() => import('./pages/EcommerceHome'));
const EcommercePolicy = lazy(() => import('./pages/EcommercePolicy'));
const EmployeeMaster = lazy(() => import('./pages/EmployeeMaster'));
const EmployeeMasterDetail = lazy(() => import('./pages/EmployeeMaster/EmployeeMasterDetail'));
const Entity = lazy(() => import('./pages/Entity'));
const EntityDetailPage = lazy(() => import('./pages/Entity/EntityDetailPage'));
const FieldServiceOrder = lazy(() => import('./pages/FieldServiceOrder'));
const FieldServiceOrderDetailsPage = lazy(() => import('./pages/FieldServiceOrder/FieldServiceOrderDetailsPage'));
const FieldServiceTechnician = lazy(() => import('./pages/FieldServiceTechnician'));
const FieldTicket = lazy(() => import('./pages/FieldTicket'));
const FieldTicketDetail = lazy(() => import('./pages/FieldTicket/FieldTicketDetail'));
const FleetDispatch = lazy(() => import('./pages/FleetDispatch'));
const FleetReceiver = lazy(() => import('./pages/FleetReceiver'));
const FormBuilder = lazy(() => import('./pages/FormBuilder'));
const CreateFormBuilder = lazy(() => import('./pages/FormBuilder/CreateFormBuilder'));
const FrequentlyAskedQuestion = lazy(() => import('./pages/FrequentlyAskedQuestion'));
const FrequencyAskedQuestionDetail = lazy(() => import('./pages/FrequentlyAskedQuestion/FrequencyAskedQuestionDetail'));
const GenerateInvoice = lazy(() => import('./pages/GenerateInvoice'));
const Home = lazy(() => import('./pages/Home'));
const ImportExport = lazy(() => import('./pages/ImportExport'));
const InventoryCycle = lazy(() => import('./pages/InventoryCycle'));
const InventoryCycleDetailPage = lazy(() => import('./pages/InventoryCycle/InventoryCycleDetailPage'));
const Invoice = lazy(() => import('./pages/Invoice'));
const InvoiceDetails = lazy(() => import('./pages/Invoice/InvoiceDetails'));
const IotChart = lazy(() => import('./pages/IotChart'));
const IotDataPoints = lazy(() => import('./pages/IotDataPoints'));
const IotDataPointsDetail = lazy(() => import('./pages/IotDataPoints/IotDataPointsDetail'));
const IrtTicket = lazy(() => import('./pages/IrtTicket'));
const IrtTicketDetail = lazy(() => import('./pages/IrtTicket/IrtTicketDetail'));
const Job = lazy(() => import('./pages/Job'));
const JobDetail = lazy(() => import('./pages/Job/JobDetail'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadDetailsPage = lazy(() => import('./pages/Leads/LeadDetailsPage'));
const MarketSegment = lazy(() => import('./pages/MarketSegment'));
const MarketSegmentDetail = lazy(() => import('./pages/MarketSegment/MarketSegmentDetail'));
const MaterialHandling = lazy(() => import('./pages/MaterialHandling'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const OpportunityDetailsPage = lazy(() => import('./pages/Opportunities/OpportunityDetailsPage'));
const PackageList = lazy(() => import('./pages/Packages'));
const PackageDetails = lazy(() => import('./pages/Packages/PackageDetails'));
const PadMaster = lazy(() => import('./pages/PadMaster'));
const PadMasterDetail = lazy(() => import('./pages/PadMaster/PadMasterDetail'));
const PayrollPolicy = lazy(() => import('./pages/PayrollPolicy'));
const PayrollPolicyDetail = lazy(() => import('./pages/PayrollPolicy/PayrollPolicyDetail'));
const Planning = lazy(() => import('./pages/Planning'));
const PlanningDetail = lazy(() => import('./pages/Planning/PlanningDetail'));
const PlanningCalendar = lazy(() => import('./pages/PlanningCalendar'));
const PlanningView = lazy(() => import('./pages/PlanningView'));
const Pos = lazy(() => import('./pages/Pos'));
const PosProductDetails = lazy(() => import('./pages/Pos/ProductDetails'));
const PriceTemplate = lazy(() => import('./pages/PriceTemplate'));
const CreatePriceTemplate = lazy(() => import('./pages/PriceTemplate/CreatePriceTemplate'));
const PricingConditions = lazy(() => import('./pages/PricingConditions'));
const PricingConditionsDetails = lazy(() => import('./pages/PricingConditions/PricingConditionsDetails'));
const Product = lazy(() => import('./pages/Product'));
const ProductDetailsPage = lazy(() => import('./pages/Product/ProductDetailsPage'));
const ProductAuction = lazy(() => import('./pages/productAuction'));
const ProductAuctionDetailsPage = lazy(() => import('./pages/productAuction/ProductAuctionDetailsPage'));
const ProductBuilder = lazy(() => import('./pages/ProductBuilder'));
const CreateProductBuilder = lazy(() => import('./pages/ProductBuilder/CreateProductBuilder'));
const ProductCategory = lazy(() => import('./pages/ProductCategory'));
const ProductCategoryDetailPage = lazy(() => import('./pages/ProductCategory/ProductCategoryDetailPage'));
const InventoryProduct = lazy(() => import('./pages/ProductInventory'));
const ProductionOrder = lazy(() => import('./pages/ProductionOrder'));
const ProductionOrderDetails = lazy(() => import('./pages/ProductionOrder/ProductionOrderDetails'));
const ProductTemplate = lazy(() => import('./pages/ProductTemplate'));
const CreateProductTemplate = lazy(() => import('./pages/ProductTemplate/CreateProductTemplate'));
const UserProfilePage = lazy(() => import('./pages/ProfilePage/index'));
const ProjectSales = lazy(() => import('./pages/ProjectSales'));
const ProjectSalesDetails = lazy(() => import('./pages/ProjectSales/ProjectSalesDetails'));
const PublicRoutePage = lazy(() => import('./pages/PublicRoutePage'));
const PurchaseOrder = lazy(() => import('./pages/PurchaseOrder'));
const PurchaseOrderDetailsPage = lazy(() => import('./pages/PurchaseOrder/PurchaseOrderDetailsPage'));
const PurchaseRequisition = lazy(() => import('./pages/PurchaseRequisition'));
const PurchaseRequisitionDetail = lazy(() => import('./pages/PurchaseRequisition/PurchaseRequisitionDetail'));
const Quotation = lazy(() => import('./pages/Quotation'));
const QuotationDetails = lazy(() => import('./pages/Quotation/QuotationDetails'));
const QuoteApproval = lazy(() => import('./pages/Quote-Approval'));
const QuoteBuilderCombined = lazy(() => import('./pages/QuoteBuilderCombined'));
const QuoteDetail = lazy(() => import('./pages/QuoteBuilderCombined/QuoteDetail/index'));
const QuotePdfTemplate = lazy(() => import('./pages/QuotePdfTemplate'));
const CreateNewQuotePdfTemplate = lazy(() => import('./pages/QuotePdfTemplate/NewCreateQuotePdfTemplate'));
const Reminder = lazy(() => import('./pages/Reminder'));
const RentalManagement = lazy(() => import('./pages/RentalManagement'));
const RentalManagementDetailsPage = lazy(() => import('./pages/RentalManagement/RentalManagementDetailsPage'));
const RepairJob = lazy(() => import('./pages/RepairJob'));
const RepairJobDetails = lazy(() => import('./pages/RepairJob/RepairJobDetails'));
const RepairOrder = lazy(() => import('./pages/RepairOrder'));
const RepairOrderDetails = lazy(() => import('./pages/RepairOrder/RepairOrderDetails'));
const RepairType = lazy(() => import('./pages/RepairType'));
const RepairTypeDetailsPage = lazy(() => import('./pages/RepairType/RepairTypeDetailsPage'));
const CustomReport = lazy(() => import('./pages/ReportCustom'));
const ResourceCalendar = lazy(() => import('./pages/ResourceCalender'));
const ResourceCalendarData = lazy(() => import('./pages/ResourceCalender/ResourceCalendar'));
const ResourceDoaRequest = lazy(() => import('./pages/ResourceDoaRequest'));
const ResourceLogs = lazy(() => import('./pages/ResourceLogs'));
const Roles = lazy(() => import('./pages/Role'));
const RoleDetailsPage = lazy(() => import('./pages/Role/RoleDetailsPage'));
const SalesOrder = lazy(() => import('./pages/SalesOrder'));
const SalesOrderDetails = lazy(() => import('./pages/SalesOrder/SalesOrderDetails'));
const ScheduleReport = lazy(() => import('./pages/ScheduleReport'));
const SendOutboundMessage = lazy(() => import('./pages/SendOutboundMessage'));
const SerializedAsset = lazy(() => import('./pages/SerializedAsset'));
const SerializedAssetDetailsPage = lazy(() => import('./pages/SerializedAsset/SerializedAssetDetailsPage'));
const SerializedAssetStatusChangeRequest = lazy(() => import('./pages/SerializedAsset/SerializedAssetStatusChangeRequest'));
const SerializedAssetsCertification = lazy(() => import('./pages/SerializedAssetsCertification'));
const SerializedAssetInspection = lazy(() => import('./pages/SerializedAssetsInspection'));
const ServiceMaster = lazy(() => import('./pages/ServiceMaster'));
const ServiceMasterDetailsPage = lazy(() => import('./pages/ServiceMaster/ServiceMasterDetailsPage'));
const StorageLocation = lazy(() => import('./pages/StorageLocation'));
const StorageLocationDetailsPage = lazy(() => import('./pages/StorageLocation/StorageLocationDetailsPage'));
const Sublease = lazy(() => import('./pages/Sublease'));
const SubleaseDetailsPage = lazy(() => import('./pages/Sublease/SubleaseDetailsPage'));
const SupportTicket = lazy(() => import('./pages/SupportTicket'));
const SupportTicketDetail = lazy(() => import('./pages/SupportTicket/SupportTicketDetail'));
const Survey = lazy(() => import('./pages/Surveys'));
const SurveysDetail = lazy(() => import('./pages/Surveys/SurveysDetail'));
const TaxMaster = lazy(() => import('./pages/TaxMaster'));
const TaxMasterDetail = lazy(() => import('./pages/TaxMaster/TaxMasterDetail'));
const TechnicianScheduler = lazy(() => import('./pages/TechnicianScheduler'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const TermsAndConditionDetail = lazy(() => import('./pages/TermsAndConditions/TermsAndConditionDetail'));
const TrailerMaster = lazy(() => import('./pages/TrailerMaster'));
const TrailerMasterDetail = lazy(() => import('./pages/TrailerMaster/TrailerMasterDetail'));
const TransactionLock = lazy(() => import('./pages/TransactionLock'));
const TransactionLockDetail = lazy(() => import('./pages/TransactionLock/TransactionLockDetail'));
const TransferAsset = lazy(() => import('./pages/TransferAssets/Index'));
const TransferAssetDetailPage = lazy(() => import('./pages/TransferAssets/TransferAssetDetailPage'));
const TransferInventory = lazy(() => import('./pages/TransferInventory'));
const TransferInventoryDetailPage = lazy(() => import('./pages/TransferInventory/TransferInventoryDetailPage'));
const TriggerNotificationHistory = lazy(() => import('./pages/TriggerNotificationHistory'));
const TriggerNotificationMaster = lazy(() => import('./pages/TriggerNotificationMaster'));
const TriggerNotificationMasterDetail = lazy(() => import('./pages/TriggerNotificationMaster/TriggerNotificationMasterDetail'));
const TruckMaster = lazy(() => import('./pages/TruckMaster'));
const TruckMasterDetail = lazy(() => import('./pages/TruckMaster/TruckMasterDetail'));
const Units = lazy(() => import('./pages/Units'));
const UnitDetail = lazy(() => import('./pages/Units/UnitDetail'));
const User = lazy(() => import('./pages/User'));
const UserDetailsPage = lazy(() => import('./pages/User/UserDetailsPage'));
const UserAttendance = lazy(() => import('./pages/UserAttendance'));
const UserDownloadRequest = lazy(() => import('./pages/UserDownloadRequest'));
const UserManual = lazy(() => import('./pages/UserManual'));
const Warehouse = lazy(() => import('./pages/Warehouse'));
const WarehouseDetailsPage = lazy(() => import('./pages/Warehouse/WarehouseDetailsPage'));
const WellMaster = lazy(() => import('./pages/WellMaster'));
const WellMasterDetailsPage = lazy(() => import('./pages/WellMaster/WellMasterDetailsPage'));
const WellNumber = lazy(() => import('./pages/WellNumber'));
const WellNumberDetail = lazy(() => import('./pages/WellNumber/WellNumberDetail'));
const WorkOrder = lazy(() => import('./pages/WorkOrder'));
const WorkOrderDetails = lazy(() => import('./pages/WorkOrder/WorkOrderDetails'));
const WorkOrderPlanning = lazy(() => import('./pages/WorkOrderPlanning'));
const WorkOrderSupervisor = lazy(() => import('./pages/WorkOrderSupervisor'));
const WorkOrderTechnician = lazy(() => import('./pages/WorkOrderTechnician'));
const WorkStations = lazy(() => import('./pages/WorkStations'));
const WorkStationsDetail = lazy(() => import('./pages/WorkStations/WorkStationsDetail'));
const Zone = lazy(() => import('./pages/zone'));
const ZoneDetailPage = lazy(() => import('./pages/zone/ZoneDetailPage'));

const DesktopDM = lazy(() => import('src/components/DesktopDM'));

var notificationInterval: any = null;

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerSW();
    }
  }, []);

  const toast = useContext(CustomToastContext);

  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState({ open: false, data: null });

  const { isOffline } = useContext(CustomOfflineContext);
  const {
    state: { user, permissions, resources },
    dispatch
  }: any = useData();

  const handleCloseUpdateModal = () => {
    handleHardReload();
    setIsUpdateModalOpen({ open: false, data: null });
  };

  const handleVersion = (data: any) => {
    const apiResult = compareVersions(data?.version, prebuildData?.version);
    // If the new version is the same as the stored version, return early.
    if (apiResult === 0) return;

    // If the new version is greater than or less than the current version, open the update modal.
    if (apiResult === 1 || apiResult === -1) {
      setIsUpdateModalOpen({ open: true, data: data });
    }
  };

  useEffect(() => {
    try {
      if (!isOffline) {
        getNotification();
        getChatNotification();
      }
      if (isOffline) {
        if (notificationInterval) {
          clearInterval(notificationInterval);
        }
      } else {
        notificationInterval = setInterval(async () => {
          await getNotification();
        }, 60000);
      }
    } catch (e) {}
    return () => {
      clearInterval(notificationInterval);
    };
  }, [isOffline]);

  const getNotification = async () => {
    if (localStorage.getItem('token') && !isOffline) {
      await axiosInstance()
        .get(`/user/notification/unseen`)
        .then(({ data: { frontendReloadRequired, count, versionData } }) => {
          if (count > 0) {
            notification.setCount(count);
          }

          // check for version change
          if (VITE_APP_ENV !== 'local') {
            if (versionData?.version) {
              handleVersion(versionData);
            }
          }
          if (frontendReloadRequired) {
            // dispatch({ type: USER_LOADING, payload: true });
            axiosInstance()
              .get('/user/me')
              .then(({ data: response }) => {
                const { data } = response;
                dispatch({ type: SET_USER, payload: data });
                let prevSelectedEntity = localStorage.getItem('selectedEntity');
                if (prevSelectedEntity && prevSelectedEntity !== 'null') {
                  dispatch({
                    type: SET_SELECTED_ENTITY,
                    payload: prevSelectedEntity
                  });
                } else if (data?.role?.selectedEntity?._id) {
                  dispatch({
                    type: SET_SELECTED_ENTITY,
                    payload: data.role.selectedEntity._id
                  });
                }
                // dispatch({ type: USER_LOADING, payload: false });
              })
              .catch((err) => {
                localStorage.setItem('token', '');
                // dispatch({ type: USER_LOADING, payload: false });
              });
          }
        })
        .catch((error) => {
          // toast.setToastConfig(error);
        });
    }
  };

  const getChatNotification = async () => {
    if (localStorage.getItem('token') && !isOffline) {
      await axiosInstance()
        .get(`/user/user-notification/unseen`)
        .then(({ data: { count } }) => {
          if (count > 0) {
            chatNotification.setCount(count);
          }
        });
    }
  };

  const conditionalRedirect = (Comp, location) => {
    let redirectToAnotherScreen = null;
    if (location && location.search) {
      const parsedParams = queryString.parse(location.search);
      if (parsedParams.redirect) {
        redirectToAnotherScreen = parsedParams.redirect;
      }
    }

    return !user ? (
      <Suspense fallback={null}>
        <Comp />
      </Suspense>
    ) : (
      <Redirect
        to={{
          pathname: redirectToAnotherScreen
            ? redirectToAnotherScreen.includes('?')
              ? redirectToAnotherScreen.split('?')[0]
              : redirectToAnotherScreen
            : '/',
          state: { from: location }
        }}
      />
    );
  };

  return (
    <ColorModeProvider>
      <CssBaseline />
      <AnimatePresence initial={false} exitBeforeEnter>
        <ErrorBoundaryComponent>
          <Switch>
            <Route exact path="/login/mfa" render={({ location }) => conditionalRedirect(LoginMFA, location)} />
            <Route
              // exact
              path="/login"
              render={({ location }) => conditionalRedirect(Login, location)}
            />
            <Route
              // exact
              path="/office365/login"
              render={({ location }) => conditionalRedirect(AzureLogin, location)}
            />
            <Route
              // exact
              path="/sso-login-error"
              render={({ location }) => conditionalRedirect(AzureSSOError, location)}
            />
            <Route
              // exact
              path="/sso-login"
              render={({ location }) => conditionalRedirect(AzureSSOLogin, location)}
            />
            <Route exact path="/create-password" render={({ location }) => conditionalRedirect(PasswordSetup, location)} />
            <Route exact path="/forget-password" render={({ location }) => conditionalRedirect(ForgetPassword, location)} />
            <Route exact path="/reset-password" render={({ location }) => conditionalRedirect(ResetPassword, location)} />

            <PrivateRoute exact path="/">
              <Home />
            </PrivateRoute>
            <PrivateRoute exact path="/logout">
              <Logout />
            </PrivateRoute>
            <PrivateRoute exact path={routes.lead.path}>
              <Leads />
            </PrivateRoute>
            <PrivateRoute exact path={routes.resourceLogs.path}>
              <ResourceLogs />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.leadDetail.path}/:id`}>
              <LeadDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.opportunity.path}>
              <Opportunities />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.opportunityDetail.path}/:id`}>
              <OpportunityDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.doa.path}>
              <Doa />
            </PrivateRoute>
            <PrivateRoute exact path="/add-doa">
              <Doa />
            </PrivateRoute>
            <PrivateRoute key="customer-account" exact path={routes.customerAccount.path}>
              <Account account={customerAccount} />
            </PrivateRoute>
            <PrivateRoute key="customer-account-edit" exact path={`${routes.customerAccountDetail.path}/:id`}>
              <AccountDetailPage
                account={customerAccount}
                contact={customerContact}
                accountBreadcrumb={{ ...routes.customerAccount, title: resources?.customerAccount?.titlePlural }}
              />
            </PrivateRoute>
            <PrivateRoute key="customer-contact" exact path={routes.customerContact.path}>
              <Contact contact={customerContact} account={customerAccount} />
            </PrivateRoute>
            <PrivateRoute key="customer-contact-edit" exact path={`${routes.customerContactDetail.path}/:id`}>
              <ContactDetailPage
                account={customerAccount}
                contact={customerContact}
                contactBreadcrumb={{ ...routes.customerContact, title: resources?.customerContact?.titlePlural }}
              />
            </PrivateRoute>
            <PrivateRoute key="supplier-account" exact path={routes.supplierAccount.path}>
              <Account account={supplierAccount} />
            </PrivateRoute>
            <PrivateRoute key="supplier-account-edit" exact path={`${routes.supplierAccountDetail.path}/:id`}>
              <AccountDetailPage
                account={supplierAccount}
                contact={supplierContact}
                accountBreadcrumb={{ ...routes.supplierAccount, title: resources?.supplierAccount?.titlePlural }}
              />
            </PrivateRoute>
            <PrivateRoute key="supplier-contact" exact path={routes.supplierContact.path}>
              <Contact contact={supplierContact} account={supplierAccount} />
            </PrivateRoute>
            <PrivateRoute key="supplier-contact-edit" exact path={`${routes.supplierContactDetail.path}/:id`}>
              <ContactDetailPage
                account={supplierAccount}
                contact={supplierContact}
                contactBreadcrumb={{ ...routes.supplierContact, title: resources?.supplierContact?.titlePlural }}
              />
            </PrivateRoute>
            <PrivateRoute key="project-sales" exact path={routes.projectSales.path}>
              <ProjectSales />
            </PrivateRoute>
            <PrivateRoute key="project-sales-details" exact path={`${routes.projectSalesDetail.path}/:id`}>
              <ProjectSalesDetails />
            </PrivateRoute>
            <PrivateRoute exact path="/user">
              <User />
            </PrivateRoute>
            <PrivateRoute exact path="/user-manual*" userManual={true}>
              <UserManual />
            </PrivateRoute>
            <PrivateRoute exact path="/profile">
              <UserProfilePage profileBreadCrumbs={routes.profilePage} />
            </PrivateRoute>
            <PrivateRoute exact path="/brand-configuration">
              <BrandConfiguration />
            </PrivateRoute>
            <PrivateRoute exact path="/user/detail/:id">
              <UserDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path="/entity">
              <Entity />
            </PrivateRoute>
            <PrivateRoute exact path="/entity/detail/:id">
              <EntityDetailPage />
            </PrivateRoute>
            <PrivateRoute exact path="/role">
              <Roles />
            </PrivateRoute>
            <PrivateRoute exact path="/role/detail/:id">
              <RoleDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path="/activity">
              <Activitydemo />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productInventory.path}>
              <InventoryProduct />
            </PrivateRoute>
            <PrivateRoute exact path={routes.activityEmail.path}>
              <Email />
            </PrivateRoute>
            <PrivateRoute exact path={routes.note.path}>
              <Note />
            </PrivateRoute>
            <PrivateRoute exact path={routes.attachment.path}>
              <Attachments />
            </PrivateRoute>
            <PrivateRoute exact path={routes.calendar.path}>
              <Calender />
            </PrivateRoute>
            <PrivateRoute exact path={routes.reminder.path}>
              <Reminder />
            </PrivateRoute>
            <PrivateRoute path={routes.case.path}>
              <Activity type="case" />
            </PrivateRoute>
            <PrivateRoute path={routes.task.path}>
              <Activity type="task" />
            </PrivateRoute>
            <PrivateRoute exact path={routes.product.path}>
              <Product />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productDetail.path + '/:id'}>
              <ProductDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.serializedAsset.path}>
              <SerializedAsset />
            </PrivateRoute>
            <PrivateRoute exact path={routes.serializedAssetInspection.path}>
              <SerializedAssetInspection />
            </PrivateRoute>
            <PrivateRoute exact path={routes.serializedAssetsCertification.path}>
              <SerializedAssetsCertification />
            </PrivateRoute>
            <PrivateRoute exact path={routes.serializedAssetDetail.path + '/:id'}>
              <SerializedAssetDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.rentalManagement.path}>
              <RentalManagement />
            </PrivateRoute>
            <PrivateRoute exact path={routes.rentalManagementDetail.path + '/:id'}>
              <RentalManagementDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.sublease.path}>
              <Sublease />
            </PrivateRoute>
            <PrivateRoute exact path={routes.subleaseDetail.path + '/:id'}>
              <SubleaseDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productCategory.path}>
              <ProductCategory />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productCategoryDetail.path + '/:id'}>
              <ProductCategoryDetailPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productTemplate.path}>
              <ProductTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productTemplate.path + '/:id'}>
              <CreateProductTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={routes.quotePdfTemplate.path}>
              <QuotePdfTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.quotePdfTemplateDetail.path}/:id`}>
              <CreateNewQuotePdfTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={routes.formBuilder.path}>
              <FormBuilder />
            </PrivateRoute>
            <PrivateRoute exact path={routes.zone.path}>
              <Zone />
            </PrivateRoute>
            <PrivateRoute exact path={routes.zoneDetail.path + '/:id'}>
              <ZoneDetailPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.formBuilder.path}${routes.formBuilderResource.path}`}>
              <CreateFormBuilder />
            </PrivateRoute>
            <PrivateRoute exact path={routes.termsAndConditions.path}>
              <TermsAndConditions />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.termsAndConditionsDetail.path}/:id`}>
              <TermsAndConditionDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.priceTemplate.path}>
              <PriceTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={routes.priceTemplate.path + '/:id'}>
              <CreatePriceTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productBuilder.path}>
              <ProductBuilder />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productBuilder.path + '/:id'}>
              <CreateProductBuilder />
            </PrivateRoute>
            <PrivateRoute exact path={routes.currencyConverter.path}>
              <CurrencyConverter />
            </PrivateRoute>
            <PrivateRoute exact path={routes.warehouse.path}>
              <Warehouse />
            </PrivateRoute>
            <PrivateRoute exact path={routes.warehouseDetail.path + '/:id'}>
              <WarehouseDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.quoteBuilderDetail.path}/:id`}>
              <QuoteDetail />
            </PrivateRoute>
            <PrivateRoute exact path={'/dashboards'}>
              <Dashboard />
            </PrivateRoute>
            <Route exact path={'/quote-approval/:id'}>
              <QuoteApproval />
            </Route>
            <PrivateRoute exact path={routes.DOARequest.path}>
              <DOARequest />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.DOARequest.path}/:id`}>
              <DOAapproval />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.DOARequest.path}/quotation/:id`}>
              <DOAApprovalQuotation />
            </PrivateRoute>
            <PrivateRoute exact path={routes.quoteBuilder.path}>
              <QuoteBuilderCombined />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.productDetail.path}/:id/bom`}>
              <BOMTable />
            </PrivateRoute>
            <PrivateRoute exact path={routes.budget.path}>
              <Budget />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.budgetDetail.path}/:id`}>
              <BudgetDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.pricingCondition.path}>
              <PricingConditions />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.pricingCondition.path}/detail/:id`}>
              <PricingConditionsDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.marketSegment.path}>
              <MarketSegment />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.marketSegment.path}/detail/:id`}>
              <MarketSegmentDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.deliveryTicket.path}>
              <DeliveryTicket />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.deliveryTicket.path}/detail/:id`}>
              <DeliveryTicketDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.repairJob.path}>
              <RepairJob />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.repairJobDetail.path}/:id`}>
              <RepairJobDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.salesOrder.path}>
              <SalesOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.salesOrderDetail.path}/:id`}>
              <SalesOrderDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.invoice.path}>
              <Invoice />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.invoiceDetail.path}/:id`}>
              <InvoiceDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.packages.path}>
              <PackageList />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.packagesDetail.path}/:id`}>
              <PackageDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.purchaseOrder.path}>
              <PurchaseOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.purchaseOrderDetail.path}/:id`}>
              <PurchaseOrderDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.transferAsset.path}>
              <TransferAsset />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.transferAssetDetail.path}/:id`}>
              <TransferAssetDetailPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.transferInventory.path}>
              <TransferInventory />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.transferInventoryDetail.path}/:id`}>
              <TransferInventoryDetailPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.address.path}`}>
              <Address />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.addressDetail.path}/:id`}>
              <AddressDetailPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.reports.path}*`}>
              <ReportsCenter />
            </PrivateRoute>
            <PrivateRoute exact path={`/custom-report`}>
              <CustomReport />
            </PrivateRoute>
            <PrivateRoute exact path={`/schedule-report`}>
              <ScheduleReport />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.resourceCalendar.path}`}>
              <ResourceCalendar />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.resourceCalendar.path}/:resource`}>
              <ResourceCalendarData />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.eCommercePolicy.path}`}>
              <EcommercePolicy />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.wellMaster.path}`}>
              <WellMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.wellMasterDetail.path}/:id`}>
              <WellMasterDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.bulkAssetCreation.path}`}>
              <BulkAssetCreation />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.bulkAssetCreationDetail.path}/:id`}>
              <BulkAssetCreationDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.repairType.path}`}>
              <RepairType />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.repairTypeDetail.path}/:id`}>
              <RepairTypeDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes?.pos?.path}`}>
              <Pos />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes?.posProductDetail?.path}/:id/:warehouseId`}>
              <PosProductDetails />
            </PrivateRoute>
            <PrivateRoute exact path={'/dashboard-master/:id'}>
              <DashboardBuilder />
            </PrivateRoute>
            <PrivateRoute exact path={'/dashboard-master'}>
              <DashboardsList />
            </PrivateRoute>
            <Route exact path={'/customer-sign/:id'}>
              <CustomerSign />
            </Route>
            <PrivateRoute exact path={`${routes.cageManagement.path}`}>
              <CageManagement />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.productAuction.path}`}>
              <ProductAuction />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.productAuctionDetail.path}/:id`}>
              <ProductAuctionDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.inventoryToAsset.path}>
              <ConvertInventory />
            </PrivateRoute>
            <PrivateRoute exact path={routes.importExport.path}>
              <ImportExport />
            </PrivateRoute>
            <PrivateRoute exact path={routes.inventoryCycle.path}>
              <InventoryCycle />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.inventoryCycleDetail.path}/:id`}>
              <InventoryCycleDetailPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.cycleCountDetermination.path}>
              <CycleCountDetermination />
            </PrivateRoute>
            <PrivateRoute exact path={routes.cycleCountPhysicalInventory.path}>
              <CycleCountPhysicalInventory />
            </PrivateRoute>
            <PrivateRoute exact path={routes.quotation.path}>
              <Quotation />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.quotationDetail.path}/:id`}>
              <QuotationDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.serviceMaster.path}>
              <ServiceMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.serviceMasterDetail.path}/:id`}>
              <ServiceMasterDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes?.repairOrder?.path}>
              <RepairOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes?.repairOrderDetail?.path}/:id`}>
              <RepairOrderDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes?.productionOrder?.path}>
              <ProductionOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes?.productionOrderDetail?.path}/:id`}>
              <ProductionOrderDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes?.fieldServiceOrder?.path}>
              <FieldServiceOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes?.fieldServiceOrderDetail?.path}/:id`}>
              <FieldServiceOrderDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes?.workOrder?.path}>
              <WorkOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes?.workOrderDetail?.path}/:id`}>
              <WorkOrderDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.workOrderSupervisor.path}>
              <WorkOrderSupervisor />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workOrderTechnician.path}`}>
              <WorkOrderTechnician />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.frequentlyAskedQuestion.path}`}>
              <FrequentlyAskedQuestion />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.frequentlyAskedQuestionDetail.path}/:id`}>
              <FrequencyAskedQuestionDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.blog.path}`}>
              <Blog />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.blogDetail.path}/:id`}>
              <BlogDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.eCommerceHome.path}>
              <EcommerceHome />
            </PrivateRoute>
            <PrivateRoute exact path={routes.surveys.path}>
              <Survey />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.surveysDetail.path}/:id`}>
              <SurveysDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.contactUs.path}>
              <ContactUs />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.contactUsDetail.path}/:id`}>
              <ContactUsDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.supportTicket.path}>
              <SupportTicket />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.supportTicketDetail.path}/:id`}>
              <SupportTicketDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.demandOrder.path}>
              <DemandOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.demandOrderDetail.path}/:id`}>
              <DemandOrderDetails />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.expenses.path}`}>
              <Expenses />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.expensesDetail.path}/:id`}>
              <ExpenseDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.expenseReport.path}`}>
              <ExpenseReport />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.expenseReportDetail.path}/:id`}>
              <ExpenseReportDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.expenseApproval.path}`}>
              <ExpenseApproval />
            </PrivateRoute>
            <PrivateRoute exact path={routes.employeeMaster.path}>
              <EmployeeMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.employeeMasterDetail.path}/:id`}>
              <EmployeeMasterDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.competencyType.path}`}>
              <CompetencyType />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.competencyTypeDetail.path}/:id`}>
              <CompetencyTypeDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.technicianScheduler.path}`}>
              <TechnicianScheduler />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.irtTicket.path}`}>
              <IrtTicket />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.irtTicketDetail.path}/:id`}>
              <IrtTicketDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.purchaseRequisition.path}`}>
              <PurchaseRequisition />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.purchaseRequisitionDetail.path}/:id`}>
              <PurchaseRequisitionDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.planning.path}`}>
              <Planning />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.planningDetail.path}/:id`}>
              <PlanningDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.planningCalendar.path}`}>
              <PlanningCalendar />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.fieldTicket.path}`}>
              <FieldTicket />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.fieldTicketDetail.path}/:id`}>
              <FieldTicketDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.fieldServiceTechnician.path}`}>
              <FieldServiceTechnician />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.fleetDispatch.path}`}>
              <FleetDispatch />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.truckMaster.path}`}>
              <TruckMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.truckMasterDetail.path}/:id`}>
              <TruckMasterDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.job.path}`}>
              <Job />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.jobDetail.path}/:id`}>
              <JobDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.fleetReceiver.path}`}>
              <FleetReceiver />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.storageLocation.path}`}>
              <StorageLocation />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes?.storageLocationDetail?.path}/:id`}>
              <StorageLocationDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.transactionLock.path}`}>
              <TransactionLock />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.transactionLockDetail.path}/:id`}>
              <TransactionLockDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.wellNumber.path}`}>
              <WellNumber />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.wellNumberDetail.path}/:id`}>
              <WellNumberDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.planningView.path}`}>
              <PlanningView />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.taxMaster.path}`}>
              <TaxMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.taxMasterDetail.path}/:id`}>
              <TaxMasterDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.competencies.path}`}>
              <Competencies />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.competenciesDetail.path}/:id`}>
              <CompetenciesDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.materialHandling.path}`}>
              <MaterialHandling />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.padMaster.path}`}>
              <PadMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.padMasterDetail.path}/:id`}>
              <PadMasterDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.driverMaster.path}`}>
              <DriverMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.driverMasterDetail.path}/:id`}>
              <DriverMasterDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.trailerMaster.path}`}>
              <TrailerMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.trailerMasterDetail.path}/:id`}>
              <TrailerMasterDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.iotDataPoints.path}`}>
              <IotDataPoints />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.iotDataPointsDetail.path}/:id`}>
              <IotDataPointsDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.iotChart.path}`}>
              <IotChart />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.iotChartDetail.path}/:id`}>
              <SerializedAssetDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.sendOutboundMessage.path}`}>
              <SendOutboundMessage />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.deviceTemplates.path}`}>
              <DeviceTemplates />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.deviceTemplatesDetail.path}/:id`}>
              <DeviceTemplatesDetails />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workStations.path}`}>
              <WorkStations />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workStationsDetail.path}/:id`}>
              <WorkStationsDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.deviceTemplateAlert.path}`}>
              <DeviceTemplatesAlert />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.deviceTemplateAlertDetail.path}`}>
              <DeviceTemplateAlertDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.chartOfAccount.path}`}>
              <ChartOfAccount />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.payrollPolicy.path}`}>
              <PayrollPolicy />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.payrollPolicyDetail.path}/:id`}>
              <PayrollPolicyDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.triggerNotificationMaster.path}`}>
              <TriggerNotificationMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.triggerNotificationMasterDetail.path}/:id`}>
              <TriggerNotificationMasterDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.chartOfAccountDetail.path}/:id`}>
              <ChartOfAccountDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.creditMemo.path}`}>
              <CreditMemo />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.creditMemoDetail.path}/:id`}>
              <CreditMemoDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.generateInvoice.path}`}>
              <GenerateInvoice />
            </PrivateRoute>
            <PrivateRoute exact path={routes.subleaseInvoice.path}>
              <GenerateInvoice resourceRendered="sublease" />
            </PrivateRoute>
            <PrivateRoute exact path={routes.dataList.path}>
              <DataList />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.dataList.path}/:id`}>
              <DataListDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.userDownloadRequest.path}>
              <UserDownloadRequest />
            </PrivateRoute>
            <PrivateRoute exact path={routes?.repairOrderInvoice?.path}>
              <GenerateInvoice resourceRendered="repairOrder" />
            </PrivateRoute>
            <PrivateRoute exact path={routes.rentalManagementInvoice.path}>
              <GenerateInvoice resourceRendered="rentalManagement" />
            </PrivateRoute>
            <PrivateRoute exact path={routes.fieldTicketInvoice.path}>
              <GenerateInvoice resourceRendered="fieldTicket" />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.triggerNotificationHistory.path}`}>
              <TriggerNotificationHistory />
            </PrivateRoute>
            <PrivateRoute exact path={routes.userAttendance.path}>
              <UserAttendance />
            </PrivateRoute>
            <PrivateRoute exact path={routes.deals.path}>
              <Deals />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.dealDetail.path}/:id`}>
              <DealDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.serializedAssetStatusChangeRequest.path}`}>
              <SerializedAssetStatusChangeRequest />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.serializedAssetStatusChangeRequestDetail.path}/:id`}>
              <SerializedAssetStatusChangeRequestDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.units.path}>
              <Units />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.unitDetail.path}/:id`}>
              <UnitDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.workOrderPlanning.path}>
              <WorkOrderPlanning />
            </PrivateRoute>
            <PrivateRoute exact path={routes.resourceDoaRequest.path}>
              <ResourceDoaRequest />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.resourceDoaRequestDetail.path}/:id`}>
              <ResourceDoaRequestDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.subcontractAssembly.path}>
              <SubcontractAssembly />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.subcontractAssemblyDetail.path}/:id`}>
              <SubcontractAssemblyDetail />
            </PrivateRoute>
            <PrivateRoute exact path={routes.serializedPackages.path}>
              <SerializedPackages />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.serializedPackagesDetail.path}/:id`}>
              <SerializedPackagesDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.integration.path}`}>
              <Integration />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.trainAiModel.path}`}>
              <TrainAiModel />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.equiptAi.path}`}>
              <EquiptAi />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workSpace.path}`}>
              <WorkSpace />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workflow.path}`}>
              <WorkFlow />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workflow.path}/:id`}>
              <CreateWorkFlow />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workflowReport.path}`}>
              <WorkFlowReport />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workflowReportDetail.path}/:id`}>
              <WorkFlowReportDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.assemblyOrder.path}`}>
              <AssemblyOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.assemblyOrderDetail.path}/:id`}>
              <AssemblyOrderDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.packageInventory.path}`}>
              <PackageInventory />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.scheduleAndDispatch.path}`}>
              <ScheduleAndDispatch />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.productTypes.path}`}>
              <ProductTypes />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.productTypesDetail.path}/:id`}>
              <ProductTypesDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.packageCategory.path}`}>
              <PackageCategory />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.packageCategoryDetail.path}/:id`}>
              <PackageCategoryDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.serviceCategory.path}`}>
              <ServiceCategory />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.serviceCategoryDetail.path}/:id`}>
              <ServiceCategoryDetail />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.schedulingMaintenance.path}`}>
              <ScheduleMaintenance />
            </PrivateRoute>
            <Route exact path={'/public/:id'}>
              <PublicRoutePage />
            </Route>
            <PrivateRoute exact path={`/:route`}>
              <DynamicForm />
            </PrivateRoute>
            <PrivateRoute exact path={`/:route/detail/:id`}>
              <DynamicFormDetail />
            </PrivateRoute>
            <Route path="*" component={NotFound} />
          </Switch>
          <ScreenOrientationOverlay displayOn="portrait" device="tablet" />
          <ScreenOrientationOverlay displayOn="landscape" device="mobile" />
          <CustomIntro />
          <Suspense fallback={null}>{user && <DesktopDM />}</Suspense>
        </ErrorBoundaryComponent>
      </AnimatePresence>

      {isUpdateModalOpen.open && <ForceUpdatePopup data={isUpdateModalOpen.data} onClose={handleCloseUpdateModal} />}
      {toast?.toastConfig?.open &&
        (!['notFoundError', 'productInventoryAlert'].includes(toast?.toastConfig?.type) ? (
          <CustomToaster
            type={toast.toastConfig.type}
            message={toast.toastConfig.message}
            open={toast.toastConfig.open}
            close={() => {
              toast.setToastConfig((prev) => ({ message: '', type: null, open: false }));
            }}
          />
        ) : toast.toastConfig.type === 'notFoundError' ? (
          <RecordDeletedDialog />
        ) : toast.toastConfig.type === 'productInventoryAlert' ? (
          <CustomMessageDialog
            open={toast.toastConfig.open}
            errorMessages={toast.toastConfig.data}
            onClose={() => {
              toast.setToastConfig((prev) => ({ message: '', type: null, open: false }));
            }}
            title={toast.toastConfig.message}
          />
        ) : (
          ''
        ))}
    </ColorModeProvider>
  );
}

export default App;
