import { useContext, useEffect, useState } from 'react';
import { Grid, ThemeProvider } from '@material-ui/core';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { theme } from './constants/AppConfig';
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
import PriceTemplate from './pages/PriceTemplate';
import CreatePriceTemplate from './pages/PriceTemplate/CreatePriceTemplate';
import ProductBuilder from './pages/ProductBuilder';
import CreateProductBuilder from './pages/ProductBuilder/CreateProductBuilder';
import BrandConfiguration from './pages/BrandConfiguration';
import QuoteApproval from './pages/Quote-Approval';
import QuoteDetail from './pages/QuoteBuilderCombined/QuoteDetail/index';
import DOARequest from './pages/DOA';
import CurrencyConverter from './pages/CurrencyConverter';
import Dashboard from './pages/Dashboard';
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
import NewDashboard from './pages/NewDashboard';
import NewDashboardTest from './pages/NewDashboard-Test';
import TransferInventory from './pages/TransferInventory';
import TransferInventoryDetailPage from './pages/TransferInventory/TransferInventoryDetailPage';
import Zone from './pages/zone';
import ZoneDetailPage from './pages/zone/ZoneDetailPage';
import { Button, Snackbar } from '@material-ui/core';
import * as serviceWorkerRegistration from 'src/serviceWorkerRegistration';
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
import ScheduleReport from './pages/ScheduleReport';

var notificationInterval: any = null;

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function App() {
  const [serviceWorkerData, setServiceWorkerData] = useState<{
    newVersionAvailable: boolean;
    waitingWorker: { [key: string]: any };
  }>({
    newVersionAvailable: false,
    waitingWorker: {}
  });

  const [refreshSnackBar, setRefreshSnackBar] = useState(false);

  const updateServiceWorker = () => {
    const { waitingWorker } = serviceWorkerData;
    localStorage.removeItem('newVersionAvailable');
    waitingWorker && waitingWorker.postMessage && waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setServiceWorkerData({ ...serviceWorkerData, newVersionAvailable: false });
    window.location.reload();
  };

  const onServiceWorkerUpdate = (registration) => {
    localStorage.setItem('newVersionAvailable', 'true');
    setRefreshSnackBar(true);
    setServiceWorkerData({
      waitingWorker: registration && registration.waiting,
      newVersionAvailable: true
    });
  };

  useEffect(() => {
    serviceWorkerRegistration.register({ onUpdate: onServiceWorkerUpdate });
  }, []);

  useEffect(() => {
    const newVersionAvailable = localStorage.getItem('newVersionAvailable');
    if (newVersionAvailable === 'true') setRefreshSnackBar(true);
  }, [setRefreshSnackBar]);

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
    if (!mappedEntities) {
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
    } catch (e) {}
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
      // <Suspense fallback={<div>Loading...</div>}>
      <Comp />
    ) : (
      // </Suspense>
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
    <ThemeProvider theme={theme}>
      <AnimatePresence initial={false} exitBeforeEnter>
        <ErrorBoundaryComponent>
          <Snackbar
            open={refreshSnackBar}
            autoHideDuration={null}
            onClose={(event, reason) => {
              if (reason === 'clickaway') return;
              setRefreshSnackBar(false);
            }}
          >
            <Alert
              onClose={() => {
                setRefreshSnackBar(false);
                updateServiceWorker();
              }}
              severity="success"
            >
              <div style={{ display: 'flex', width: '100%', alignItems: 'start', justifyContent: 'space-between', gap: 20 }}>
                <div style={{ flex: 1 }}>New Version of eQuip-T OM is available. Please refresh to get the latest changes.</div>
                <Button className="snackbar-button" size="medium" variant="contained" color="secondary" onClick={updateServiceWorker}>
                  Refresh
                </Button>
              </div>
            </Alert>
          </Snackbar>
          {/* <Switch location={location} key={location.key}> */}
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
              <Dashboard />
            </PrivateRoute>
            <PrivateRoute exact path="/logout">
              <Logout />
            </PrivateRoute>
            <PrivateRoute exact path={routes.lead.path}>
              <Leads />
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
            {/* <PrivateRoute exact path="/new-opp">
              <AddNewOpportunity />
            </PrivateRoute> */}
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
              <NewDashboard />
            </PrivateRoute>
            <PrivateRoute exact path={'/new-dashboard'}>
              <NewDashboardTest />
            </PrivateRoute>
            {/* <Route exact path={"/dashboards"}>
              <KpiDashboard />
            </Route>
            <Route exact path={"/dashboard/detail/:id"}>
              <EditDashboard edit={true} />
            </Route>
            <Route exact path={"/dashboard/:id"}>
              <EditDashboard edit={false} />
            </Route> */}
            {/* //Route available for customers to Accept Reject Quote */}
            <Route exact path={'/quote-approval/:id'}>
              <QuoteApproval />
            </Route>
            <PrivateRoute exact path={routes.DOARequest.path}>
              <DOARequest />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.DOARequest.path}/:id`}>
              <DOAapproval />
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
            <PrivateRoute exact path={routes.pricingCondition.path}>
              <PricingConditions />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.pricingCondition.path}/detail/:id`}>
              <PricingConditionsDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.marketSegment.path}>
              <MarketSegment />
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
            <PrivateRoute exact path="/new-dashboard">
              <NewDashboard />
            </PrivateRoute>
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
            <Route exact path={'/public/:id'}>
              <PublicRoutePage />
            </Route>
            <Route path="*" component={NotFound} />
            {/* <Route exact path="/crm/account" component={Account} /> */}
          </Switch>
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
      {/* {
        isOffline ?
          <OfflineStatusDialog /> : null
      } */}
    </ThemeProvider>
  );
}

export default App;
