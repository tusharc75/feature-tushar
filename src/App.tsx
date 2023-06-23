import { useContext, useEffect, useState } from 'react';
import { Grid, ThemeProvider, CssBaseline } from '@material-ui/core';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ColorModeProvider from './constants/AppConfig';
import { CustomToastContext } from './StateProvider/CustomToastContext/CustomToastContext';
import { CustomNotificationCountContext } from './StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import axiosInstance from './axios/axiosInstance';
import { CustomChatNotificationCountContext } from './StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import queryString from 'query-string';
import { SET_USER, SET_SELECTED_ENTITY } from './StateProvider/actionTypes';
import routes from './components/Helpers/Routes';
import { termsAndCondition, customerAccount, customerContact, supplierAccount, supplierContact } from './constants/helpers';
import CustomToaster from './components/Helpers/CustomToast';
import PrivateRoute from './components/PrivateRoute';
import { useData } from './StateProvider/Provider';
import ErrorBoundaryComponent from './ErrorBoundary';
import Login from './pages/Auth/Login';
import AzureLogin from './pages/Auth/AzureLogin';
import Leads from './pages/Leads';
import ResourceLogs from './pages/ResourceLogs';
import LeadDetailsPage from './pages/Leads/LeadDetailsPage';
import NewLead from './pages/Leads/NewLead';
import Opportunities from './pages/Opportunities';
import Doa from './pages/DoaSetup';
import Contact from './pages/Contact';
import Account from './pages/Account/index';
import AccountDetailPage from './pages/Account/AccountDetailPage';
import ContactDetailPage from './pages/Contact/ContactDetailPage';
import OpportunityDetailsPage from './pages/Opportunities/OpportunityDetailsPage';
import Activitydemo from './pages/Activity/activitydemo';
import Activity from './pages/Activity';
import Note from './pages/Activity/Note';
import Email from './pages/Activity/Email';
import Attachments from './pages/Activity/Attachments';
import Calender from './pages/Activity/Calendar';
import PasswordSetup from './pages/Auth/PasswordSetup';
import ForgetPassword from './pages/Auth/ForgetPassword';
import ProductCategory from './pages/ProductCategory';
import ProductCategoryDetailPage from './pages/ProductCategory/ProductCategoryDetailPage';
import ProductTemplate from './pages/ProductTemplate';
import CreateProductTemplate from './pages/ProductTemplate/CreateProductTemplate';
import User from './pages/User';
import Entity from './pages/Entity';
import EntityDetailPage from './pages/Entity/EntityDetailPage';
import UserDetailsPage from './pages/User/UserDetailsPage';
import ProjectSalesDetails from './pages/ProjectSales/ProjectSalesDetails';
import ProjectSales from './pages/ProjectSales';
import Roles from './pages/Role';
import RoleDetailsPage from './pages/Role/RoleDetailsPage';
import Product from './pages/Product';
import TermsAndConditions from './pages/TermsAndConditions';
import TermsAndConditionDetail from './pages/TermsAndConditions/TermsAndConditionDetail';
import PriceTemplate from './pages/PriceTemplate';
import CreatePriceTemplate from './pages/PriceTemplate/CreatePriceTemplate';
import ProductBuilder from './pages/ProductBuilder';
import CreateProductBuilder from './pages/ProductBuilder/CreateProductBuilder';
import BrandConfiguration from './pages/BrandConfiguration';
import QuoteApproval from './pages/Quote-Approval';
import QuoteDetail from './pages/QuoteBuilderCombined/QuoteDetail/index';
import DOARequest from './pages/DOA';
import CurrencyConverter from './pages/CurrencyConverter';
import Home from './pages/Home';
import FormBuilder from './pages/FormBuilder';
import CreateFormBuilder from './pages/FormBuilder/CreateFormBuilder';
import UserProfilePage from './pages/ProfilePage/index';
import DOAapproval from './pages/DOA/DOAApproval';
import QuoteBuilderCombined from './pages/QuoteBuilderCombined';
import Reminder from './pages/Reminder';
import ResetPassword from './pages/Auth/ResetPassword';
import NotFound from './pages/NotFound';
import MarketSegment from './pages/MarketSegment';
import Budget from './pages/Budget';
import CreateNewQuotePdfTemplate from './pages/QuotePdfTemplate/NewCreateQuotePdfTemplate';
import QuotePdfTemplate from './pages/QuotePdfTemplate';
import Warehouse from './pages/Warehouse';
import WarehouseDetailsPage from './pages/Warehouse/WarehouseDetailsPage';
import SerializedAsset from './pages/SerializedAsset';
import SerializedAssetsCertification from './pages/SerializedAssetsCertification';
import SerializedAssetDetailsPage from './pages/SerializedAsset/SerializedAssetDetailsPage';
import EquipmentRentalMaster from './pages/EquipmentRentalMaster';
import ProductDetailsPage from './pages/Product/ProductDetailsPage';
import RentalManagement from './pages/RentalManagement';
import RentalManagementDetailsPage from './pages/RentalManagement/RentalManagementDetailsPage';
import DeliveryTicket from './pages/DeliveryTicket/index';
import DeliveryTicketDetailsPage from './pages/DeliveryTicket/DeliveryTicketDetailPage';
import RecordDeletedDialog from './components/Helpers/RecordDeletedDialog';
import PricingConditions from './pages/PricingConditions';
import RepairJob from './pages/RepairJob';
import RepairJobDetails from './pages/RepairJob/RepairJobDetails';
import PricingConditionsDetails from './pages/PricingConditions/PricingConditionsDetails';
import SalesOrder from './pages/SalesOrder';
import SalesOrderDetails from './pages/SalesOrder/SalesOrderDetails';
import PackageList from './pages/Packages';
import PackageDetails from './pages/Packages/PackageDetails';
import BOMTable from './pages/BOM';
import PurchaseOrder from './pages/PurchaseOrder';
import PurchaseOrderDetailsPage from './pages/PurchaseOrder/PurchaseOrderDetailsPage';
import { entity } from './constants/helpers';
import TransferAsset from './pages/TransferAssets/Index';
import TransferAssetDetailPage from './pages/TransferAssets/TransferAssetDetailPage';
import Address from './pages/Address';
import AddressDetailPage from './pages/Address/AddressDetailPage';
import InventoryProduct from './pages/ProductInventory';
import Logout from './pages/Auth/Logout';
import { CustomOfflineContext } from './StateProvider/OfflineContext/OfflineContext';
import Report from './pages/Report';
import PurchaseOrderReport from './pages/Report/PurchaseOrder';
import ReportMaster from './pages/ReportMaster';
import CustomerSign from './pages/DeliveryTicket/CustomerSign';
import EcommercePolicy from './pages/EcommercePolicy';
import Sublease from './pages/Sublease';
import SubleaseDetailsPage from './pages/Sublease/SubleaseDetailsPage';
import Dashboard from './pages/Dashboard';
import TransferInventory from './pages/TransferInventory';
import TransferInventoryDetailPage from './pages/TransferInventory/TransferInventoryDetailPage';
import Zone from './pages/zone';
import ZoneDetailPage from './pages/zone/ZoneDetailPage';
import { Button, Snackbar } from '@material-ui/core';
import { registerSW } from "virtual:pwa-register";
import MuiAlert from '@material-ui/lab/Alert';
import WellMaster from './pages/WellMaster';
import DashboardBuilder from './pages/DashboardBuilder/DashboardManager';
import DashboardsList from './pages/DashboardBuilder';
import WellMasterDetailsPage from './pages/WellMaster/WellMasterDetailsPage';
import BulkAssetCreation from './pages/BulkAssetCreation';
import BulkAssetCreationDetailsPage from './pages/BulkAssetCreation/BulkAssetCreationDetailsPage';
import Pos from './pages/Pos';
import PosProductDetails from './pages/Pos/ProductDetails';
import RepairType from './pages/RepairType';
import RepairTypeDetailsPage from './pages/RepairType/RepairTypeDetailsPage';
import ResourceCalendar from './pages/ResourceCalender';
import ResourceCalendarData from './pages/ResourceCalender/ResourceCalendar';
import CageManagement from './pages/CageManagement';
import SerializedAssetTest from './pages/SerializedAsset-test';
import ProductAuction from './pages/productAuction';
import ProductAuctionDetailsPage from './pages/productAuction/ProductAuctionDetailsPage';
import ConvertInventory from './pages/ConvertInventory';
import PublicRoutePage from './pages/PublicRoutePage';
import ImportExport from './pages/ImportExport';
import ScheduleReport from './pages/ScheduleReport';
import InventoryCycle from './pages/InventoryCycle';
import InventoryCycleDetailPage from './pages/InventoryCycle/InventoryCycleDetailPage';
import CycleCountDetermination from './pages/CycleCountDetermination';
import CycleCountPhysicalInventory from './pages/CycleCountPhysicalInventory';
import Quotation from './pages/Quotation';
import QuotationDetails from './pages/Quotation/QuotationDetails';
import ServiceMaster from './pages/ServiceMaster';
import ServiceMasterDetailsPage from './pages/ServiceMaster/ServiceMasterDetailsPage';
import LeadTimeMaster from './pages/LeadTimeMaster';
import LeadTimeMasterDetails from './pages/LeadTimeMaster/LeadTimeMasterDetails';
import CustomReport from './pages/ReportCustom';
import CustomReports from './pages/ReportCustom/CustomReport';
import RepairOrder from './pages/RepairOrder';
import RepairOrderDetails from './pages/RepairOrder/RepairOrderDetails';
import WorkOrder from './pages/WorkOrder';
import WorkOrderDetails from './pages/WorkOrder/WorkOrderDetails';
import Invoice from './pages/Invoice';
import InvoiceDetails from './pages/Invoice/InvoiceDetails';
import WorkOrderSupervisor from './pages/WorkOrderSupervisor';
import WorkOrderTechnician from './pages/WorkOrderTechnician';
import FrequentlyAskedQuestion from './pages/FrequentlyAskedQuestion';
import FrequencyAskedQuestionDetail from './pages/FrequentlyAskedQuestion/FrequencyAskedQuestionDetail';
import Blog from './pages/Blog';
import BlogDetail from './pages/Blog/BlogDetail';
import EcommerceHome from './pages/EcommerceHome';
import Survey from './pages/Surveys';
import SurveysDetail from './pages/Surveys/SurveysDetail';
import ProductionOrder from './pages/ProductionOrder';
import ProductionOrderDetails from './pages/ProductionOrder/ProductionOrderDetails';
import ContactUs from './pages/ContactUs';
import ContactUsDetail from './pages/ContactUs/ContactUsDetail';
import SupportTicket from './pages/SupportTicket';
import SupportTicketDetail from './pages/SupportTicket/SupportTicketDetail';
import DemandOrder from './pages/DemandOrder';
import DemandOrderDetails from './pages/DemandOrder/DemandOrderDetails';
import FieldServiceOrder from './pages/FieldServiceOrder';
import FieldServiceOrderDetailsPage from './pages/FieldServiceOrder/FieldServiceOrderDetailsPage';
import EmployeeMaster from './pages/EmployeeMaster';
import EmployeeMasterDetail from './pages/EmployeeMaster/EmployeeMasterDetail';
import CompetencyType from './pages/CompetencyType';
import CompetencyTypeDetail from './pages/CompetencyType/CompetencyTypeDetail';
import TechnicianScheduler from './pages/TechnicianScheduler';
import BudgetDetail from './pages/Budget/BudgetDetail';
import MarketSegmentDetail from './pages/MarketSegment/MarketSegmentDetail';
import IrtTicket from './pages/IrtTicket';
import IrtTicketDetail from './pages/IrtTicket/IrtTicketDetail';
import PurchaseRequisition from './pages/PurchaseRequisition';
import PurchaseRequisitionDetail from './pages/PurchaseRequisition/PurchaseRequisitionDetail';
import Planning from './pages/Planning';
import PlanningDetail from './pages/Planning/PlanningDetail';
import PlanningCalendar from './pages/PlanningCalendar';
import RentalPlanningCalendar from './pages/RentalPlanningCalendar';
import FieldTicket from './pages/FieldTicket';
import FieldTicketDetail from './pages/FieldTicket/FieldTicketDetail';
import FieldServiceTechnician from './pages/FieldServiceTechnician';
import FleetDispatch from './pages/FleetDispatch';
import FleetMaster from './pages/FleetMaster';
import FleetMasterDetail from './pages/FleetMaster/FleetMasterDetail';
import Job from './pages/Job';
import JobDetail from './pages/Job/JobDetail';
import FleetReceiver from './pages/FleetReceiver';
import StorageLocationDetailsPage from './pages/StorageLocation/StorageLocationDetailsPage';
import StorageLocation from './pages/StorageLocation';
import TransactionLock from './pages/TransactionLock';
import TransactionLockDetail from './pages/TransactionLock/TransactionLockDetail';
import DOAApprovalQuotation from './pages/DOA/DOAApprovalQuotation';
import WellNumber from './pages/WellNumber';
import WellNumberDetail from './pages/WellNumber/WellNumberDetail';
import PlanningView from './pages/PlanningView';
import TaxMaster from './pages/TaxMaster';
import TaxMasterDetail from './pages/TaxMaster/TaxMasterDetail';
import DynamicForm from './pages/DynamicForm';
import DynamicFormDetail from './pages/DynamicForm/DynamicFormDetail';
import Competencies from './pages/Competencies';
import CompetenciesDetail from './pages/Competencies/CompetenciesDetail';
import MaterialHandling from './pages/MaterialHandling';
import ScreenOrientationOverlay from './components/ScreenOrientationOverlay';
import PadMaster from './pages/PadMaster';
import PadMasterDetail from './pages/PadMaster/PadMasterDetail';
import FieldJob from './pages/FieldJob';
import FieldJobDetail from './pages/FieldJob/FieldJobDetail';

var notificationInterval: any = null;

function App() {

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      registerSW();
    }
  }, []);

  const toast = useContext(CustomToastContext);
  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);
  const { isOffline } = useContext(CustomOfflineContext);
  let mappedEntities = JSON.parse(localStorage.getItem('mappedEntities'));

  const {
    state: { user },
    dispatch
  }: any = useData();
  const { entityApi } = entity;

  const history = useHistory();

  history.listen(() => {
    let isSlowInternetConnection = localStorage.getItem('slowInternetConnection');
    if (isSlowInternetConnection == 'true') {
      toast.setToastConfig({
        open: true,
        type: 'error',
        message: 'Slow or no internet connection.',
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right'
        }
      });
      localStorage.setItem('slowInternetConnection', 'false');
    }
  });

  useEffect(() => {
    if (!mappedEntities && localStorage.getItem('token')) {
      axiosInstance()
        .get(`${entityApi}`)
        .then(({ data: { data } }) => {
          let mappedEntities = [];
          if (data && data.length) {
            data.forEach((o) => {
              mappedEntities = [...mappedEntities, { optionLabel: o?.entityName, optionValue: o?._id }];
            });
          }
          localStorage.setItem('mappedEntities', JSON.stringify(mappedEntities));
        });
    }
  }, [mappedEntities]);

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
    } catch (e) { }
  }, [isOffline]);

  const getNotification = async () => {
    if (localStorage.getItem('token') && !isOffline) {
      await axiosInstance()
        .get(`/user/notification/unseen`)
        .then(({ data: { frontendReloadRequired, count } }) => {
          if (count > 0) {
            notification.setCount(count);
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
    if (user?.user?.customerContactId) {
      redirectToAnotherScreen = routes?.pos?.path;
    }

    return !user ? (
      <Comp />
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
            <PrivateRoute exact path="/new-lead">
              <NewLead />
            </PrivateRoute>
            <PrivateRoute exact path={routes.opportunity.path}>
              <Opportunities />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.opportunityDetail.path}/:id`}>
              <OpportunityDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path="/doa">
              <Doa />
            </PrivateRoute>
            <PrivateRoute exact path="/add-doa">
              <Doa />
            </PrivateRoute>
            {/* <PrivateRoute exact path="/">
            <CreateBrand />
          </PrivateRoute> */}
            {/* <PrivateRoute exact path="/contact/new">
              <CreateContact />
          </PrivateRoute>
          <PrivateRoute exact path="/contact/:id">
              <CreateContact />
          </PrivateRoute> */}
            <PrivateRoute key="customer-account" exact path={routes.customerAccount.path}>
              <Account account={customerAccount} accountBreadcrumb={routes.customerAccount} />
            </PrivateRoute>
            <PrivateRoute key="customer-account-edit" exact path={`${routes.customerAccountDetail.path}/:id`}>
              <AccountDetailPage account={customerAccount} contact={customerContact} accountBreadcrumb={routes.customerAccount} />
            </PrivateRoute>
            <PrivateRoute key="customer-contact" exact path={routes.customerContact.path}>
              <Contact contact={customerContact} account={customerAccount} contactBreadcrumb={routes.customerContact} />
            </PrivateRoute>
            <PrivateRoute key="customer-contact-edit" exact path={`${routes.customerContactDetail.path}/:id`}>
              <ContactDetailPage account={customerAccount} contact={customerContact} contactBreadcrumb={routes.customerContact} />
            </PrivateRoute>
            <PrivateRoute key="supplier-account" exact path={routes.supplierAccount.path}>
              <Account account={supplierAccount} accountBreadcrumb={routes.supplierAccount} />
            </PrivateRoute>
            <PrivateRoute key="supplier-account-edit" exact path={`${routes.supplierAccountDetail.path}/:id`}>
              <AccountDetailPage account={supplierAccount} contact={supplierContact} accountBreadcrumb={routes.supplierAccount} />
            </PrivateRoute>
            <PrivateRoute key="supplier-contact" exact path={routes.supplierContact.path}>
              <Contact contact={supplierContact} account={supplierAccount} contactBreadcrumb={routes.supplierContact} />
            </PrivateRoute>
            <PrivateRoute key="supplier-contact-edit" exact path={`${routes.supplierContactDetail.path}/:id`}>
              <ContactDetailPage account={supplierAccount} contact={supplierContact} contactBreadcrumb={routes.supplierContact} />
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
            <PrivateRoute exact path={routes.serializedAssetsCertification.path}>
              <SerializedAssetsCertification />
            </PrivateRoute>
            <PrivateRoute exact path={routes.serializedAsset.path + '-new'}>
              <SerializedAssetTest />
            </PrivateRoute>
            <PrivateRoute exact path={routes.serializedAssetDetail.path + '/:id'}>
              <SerializedAssetDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.equiptmentRentalMaster.path}>
              <EquipmentRentalMaster />
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
            <PrivateRoute exact path={termsAndCondition.route}>
              <TermsAndConditions termsAndConditionBreadcrumb={routes.termsAndConditions} />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.termsAndConditionsDetails.path}/:id`}>
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
            <PrivateRoute exact path={`${routes.reports.path}`}>
              <ReportMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.reports.path}/:resource`}>
              <Report />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.reports.path}/purchase-order-type/:type`}>
              <PurchaseOrderReport />
            </PrivateRoute>
            <PrivateRoute exact path={`/schedule-report`}>
              <ScheduleReport />
            </PrivateRoute>
            <PrivateRoute exact path={`/custom-report`}>
              <CustomReport />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.reports.path}/custom-report/:id`}>
              <CustomReports />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.rentalPlanningCalendar.path}`}>
              <RentalPlanningCalendar />
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
            <PrivateRoute exact path={`${routes.pos.path}`}>
              <Pos />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.posProductDetail.path}/:id/:warehouseId`}>
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
            <PrivateRoute exact path={routes.leadTimeMaster.path}>
              <LeadTimeMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.leadTimeMasterDetail.path}/:id`}>
              <LeadTimeMasterDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.repairOrder.path}>
              <RepairOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.repairOrderDetail.path}/:id`}>
              <RepairOrderDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productionOrder.path}>
              <ProductionOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.productionOrderDetail.path}/:id`}>
              <ProductionOrderDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.fieldServiceOrder.path}>
              <FieldServiceOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.fieldServiceOrderDetail.path}/:id`}>
              <FieldServiceOrderDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.workOrder.path}>
              <WorkOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.workOrderDetail.path}/:id`}>
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
            <PrivateRoute exact path={`${routes.fleetMaster.path}`}>
              <FleetMaster />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.fleetMasterDetail.path}/:id`}>
              <FleetMasterDetail />
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
            <PrivateRoute exact path={`${routes.storageLocationDetail.path}/:id`}>
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
            <PrivateRoute exact path={`${routes.fieldJob.path}`}>
              <FieldJob />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.fieldJobDetail.path}/:id`}>
              <FieldJobDetail />
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
        </ErrorBoundaryComponent>
      </AnimatePresence>
      {toast?.toastConfig?.open &&
        (['notFoundError'].some((s) => s !== toast?.toastConfig?.type) ? (
          <CustomToaster
            type={toast.toastConfig.type}
            message={toast.toastConfig.message}
            anchorOrigin={toast.toastConfig?.anchorOrigin || null}
            open={toast.toastConfig.open}
            close={() => {
              toast.setToastConfig({ open: false });
            }}
          />
        ) : toast.toastConfig.type === 'notFoundError' ? (
          <RecordDeletedDialog />
        ) : (
          ''
        ))}
    </ColorModeProvider>
  );
}

export default App;
