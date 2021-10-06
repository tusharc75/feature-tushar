import { useContext, useEffect, useState, lazy } from "react";
import { ThemeProvider } from "@material-ui/core";
import ReactGA from "react-ga";
import { Redirect, Route, Switch, useHistory } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { theme } from "./constants/AppConfig";
import { CustomToastContext } from "./StateProvider/CustomToastContext/CustomToastContext";
import { CustomNotificationCountContext } from "./StateProvider/CustomNotificationCountContext/CustomNotificationCountContext";
import axiosInstance from "./axios/axiosInstance";
import { TRACKING_ID } from "./config";
import { CustomChatNotificationCountContext } from "./StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext";
import queryString from "query-string";
import {
  SET_USER,
  SET_SELECTED_ENTITY,
} from "./StateProvider/actionTypes";
import routes from "./components/Helpers/Routes";
import {
  termsAndCondition,
  customerAccount,
  customerContact,
  supplierAccount,
  supplierContact,
} from "./constants/helpers";
import CustomToaster from "./components/Helpers/CustomToast";
import PrivateRoute from "./components/PrivateRoute";
import { useData } from "./StateProvider/Provider";
import ErrorBoundaryComponent from "./ErrorBoundary"
import OfflineStatusDialog from "./components/Helpers/OfflineStatusDialog";
import Login from "./pages/Auth/Login";
import AzureLogin from "./pages/Auth/AzureLogin";
import Leads from "./pages/Leads";
import LeadDetailsPage from "./pages/Leads/LeadDetailsPage";
import NewLead from "./pages/Leads/NewLead";
import Opportunities from "./pages/Opportunities";
import Doa from "./pages/DoaSetup";
import Contact from "./pages/Contact";
import Account from "./pages/Account/index";
import AccountDetailPage from "./pages/Account/AccountDetailPage";
import ContactDetailPage from "./pages/Contact/ContactDetailPage";
import OpportunityDetailsPage from "./pages/Opportunities/OpportunityDetailsPage";
import Activitydemo from "./pages/Activity/activitydemo";
import Activity from "./pages/Activity";
import Note from "./pages/Activity/Note";
import Email from "./pages/Activity/Email";
import Attachments from "./pages/Activity/Attachments";
import Calender from "./pages/Activity/Calendar";
import PasswordSetup from "./pages/Auth/PasswordSetup";
import ForgetPassword from "./pages/Auth/ForgetPassword";
import ProductCategory from "./pages/ProductCategory";
import ProductTemplate from "./pages/ProductTemplate";
import CreateProductTemplate from "./pages/ProductTemplate/CreateProductTemplate";
import User from "./pages/User";
import Entity from "./pages/Entity";
import EntityDetailPage from "./pages/Entity/EntityDetailPage";
import UserDetailsPage from "./pages/User/UserDetailsPage";
import ProjectSalesDetails from "./pages/ProjectSales/ProjectSalesDetails";
import ProjectSales from "./pages/ProjectSales";
import Roles from "./pages/Role";
import RoleDetailsPage from "./pages/Role/RoleDetailsPage";
import Product from "./pages/Product";
import TermsAndConditions from "./pages/TermsAndConditions";
import PriceTemplate from "./pages/PriceTemplate";
import CreatePriceTemplate from "./pages/PriceTemplate/CreatePriceTemplate";
import ProductBuilder from "./pages/ProductBuilder";
import CreateProductBuilder from "./pages/ProductBuilder/CreateProductBuilder";
import BrandConfiguration from "./pages/BrandConfiguration";
import QuoteApproval from "./pages/Quote-Approval";
import QuoteDetail from "./pages/QuoteBuilderCombined/QuoteDetail/index";
import DOARequest from "./pages/DOA";
import CurrencyConverter from "./pages/CurrencyConverter";
import Dashboard from "./pages/Dashboard";
import KpiDashboards from "./pages/KpiDashboard/Dashboard";
import FormBuilder from "./pages/FormBuilder";
import CreateFormBuilder from "./pages/FormBuilder/CreateFormBuilder";
import UserProfilePage from "./pages/ProfilePage/index";
import DOAapproval from "./pages/DOA/DOAApproval";
import QuoteBuilderCombined from "./pages/QuoteBuilderCombined";
import Reminder from "./pages/Reminder";
import ResetPassword from "./pages/Auth/ResetPassword";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import ProductDetails from "./pages/Products/ProductDetails";
import MarketSegment from "./pages/MarketSegment";
import Budget from "./pages/Budget";
import CreateNewQuotePdfTemplate from "./pages/QuotePdfTemplate/NewCreateQuotePdfTemplate";
import QuotePdfTemplate from "./pages/QuotePdfTemplate";
import MyOwnCart from "./components/ProductList/MyCart/MyOwnCart";
import Warehouse from "./pages/Warehouse";
import ProductInventory from "./pages/ProductInventory";
import EquipmentRentalMaster from "./pages/EquipmentRentalMaster";
import ProductInventoryDetailsPage from "./pages/ProductInventory/ProductInventoryDetailsPage";
import ProductDetailsPage from "./pages/Product/ProductDetailsPage";
import RentalManagement from "./pages/RentalManagement";
import RentalManagementDetailsPage from "./pages/RentalManagement/RentalManagementDetailsPage";
import DeliveryTicket from "./pages/DeliveryTicket/index"
import DeliveryTicketDetailsPage from "./pages/DeliveryTicket/DeliveryTicketDetailPage"
import RecordDeletedDialog from "./components/Helpers/RecordDeletedDialog";
import PricingConditions from "./pages/PricingConditions";
import RepairJob from "./pages/RepairJob";
import RepairJobDetails from "./pages/RepairJob/RepairJobDetails";
import ReceivingTicket from "./pages/ReceivingTicket";
import ReceivingTicketDetails from "./pages/ReceivingTicket/ReceivingTicketDetails";
import PricingConditionsDetailsPage from "./pages/PricingConditions/PricingConditionsDetailsPage";
import SalesOrder from "./pages/SalesOrderCreation";
import SalesOrderDetails from "./pages/SalesOrderCreation/SalesOrderDetails";
import PackageList from "./pages/Packages";
import PackageDetails from "./pages/Packages/PackageDetails";
import IdleTimer from "./IdleTimer";

function App() {
  const toast = useContext(CustomToastContext);
  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);
  const [isOffline, setIsOffline] = useState(false);

  const {
    state: { user },
    dispatch,
  }: any = useData();

  const history = useHistory();

  history.listen(() => {
    let isSlowInternetConnection = localStorage.getItem("slowInternetConnection")
    if (isSlowInternetConnection == "true") {
      toast.setToastConfig({
        open: true, type: "error", message: "Slow or no internet connection.",
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        }
      });
      localStorage.setItem("slowInternetConnection", "false")
    }
  });
  // ReactGA.initialize(TRACKING_ID);

  window.addEventListener('load', function (e) {
    //@ts-ignore
    if (navigator.onLine) {
      if (isOffline) setIsOffline(false)
    }
    else {
      setIsOffline(true);
    }
  }, false);

  window.addEventListener('online', function (e) {
    if (isOffline) setIsOffline(false)
  }, false);

  window.addEventListener('offline', function (e) {
    const pathnames = history.location.pathname.split("/").filter((x) => x);

    if (!(history.location.pathname === "/" || [
      "rental-management"
    ].indexOf(pathnames[0]) >= 0)) {
      setIsOffline(true);
    }
  }, false);

  const getNotification = async () => {
    if (localStorage.getItem("token")) {
      await axiosInstance()
        .get(`/user/notification/unseen`)
        .then(({ data: { frontendReloadRequired, count } }) => {
          if (count > 0) {
            notification.setCount(count);
          }

          if (frontendReloadRequired) {
            // dispatch({ type: USER_LOADING, payload: true });
            axiosInstance()
              .get("/user/me")
              .then(({ data: response }) => {
                const { data } = response;
                dispatch({ type: SET_USER, payload: data });
                let prevSelectedEntity = localStorage.getItem("selectedEntity");
                if (prevSelectedEntity && prevSelectedEntity !== "null") {
                  dispatch({
                    type: SET_SELECTED_ENTITY,
                    payload: prevSelectedEntity,
                  });
                } else if (data?.role?.selectedEntity?._id) {
                  dispatch({
                    type: SET_SELECTED_ENTITY,
                    payload: data.role.selectedEntity._id,
                  });
                }
                // dispatch({ type: USER_LOADING, payload: false });
              })
              .catch((err) => {
                localStorage.setItem("token", "");
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
    if (localStorage.getItem("token")) {
      if (!isOffline) {
        await axiosInstance()
          .get(`/user/user-notification/unseen`)
          .then(({ data: { count } }) => {
            if (count > 0) {
              chatNotification.setCount(count);
            }
          });
      }
    }
  };

  useEffect(() => {
    try {
      if (!isOffline) {
        getNotification();
        getChatNotification();
        history.listen((location, action) => {
          ReactGA.set({ page: location.pathname });
          ReactGA.pageview(location.pathname);
        });
        setInterval(async () => {
          await getNotification();
        }, 60000);
      }
    } catch (e) { }

  }, []);

  const conditionalRedirect = (Comp, location) => {
    let redirectToAnotherScreen = null;
    if (location && location.search) {
      const parsedParams = queryString.parse(location.search);
      if (parsedParams.redirect) {
        redirectToAnotherScreen = parsedParams.redirect;
      }
    }

    return !user ? (
      // <Suspense fallback={<div>Loading...</div>}>
      <Comp />
      // </Suspense>
    ) : (
      <Redirect
        to={{
          pathname: redirectToAnotherScreen ? redirectToAnotherScreen : "/",
          state: { from: location },
        }}
      />
    );
  };

  return (

    <ThemeProvider theme={theme}>
      <AnimatePresence initial={false} exitBeforeEnter>
        <ErrorBoundaryComponent>
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
            <Route
              exact
              path="/create-password"
              render={({ location }) =>
                conditionalRedirect(PasswordSetup, location)
              }
            />
            <Route
              exact
              path="/forget-password"
              render={({ location }) =>
                conditionalRedirect(ForgetPassword, location)
              }
            />
            <Route
              exact
              path="/reset-password"
              render={({ location }) =>
                conditionalRedirect(ResetPassword, location)
              }
            />
            <PrivateRoute exact path="/">
              <Dashboard />
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
              <Account
                account={customerAccount}
                accountBreadcrumb={routes.customerAccount}
              />
            </PrivateRoute>
            <PrivateRoute
              key="customer-account-edit"
              exact
              path={`${routes.customerAccountDetail.path}/:id`}
            >
              <AccountDetailPage
                account={customerAccount}
                contact={customerContact}
                accountBreadcrumb={routes.customerAccount}
              />
            </PrivateRoute>
            <PrivateRoute key="customer-contact" exact path={routes.customerContact.path}>
              <Contact
                contact={customerContact}
                account={customerAccount}
                contactBreadcrumb={routes.customerContact}
              />
            </PrivateRoute>
            <PrivateRoute
              key="customer-contact-edit"
              exact
              path={`${routes.customerContactDetail.path}/:id`}
            >
              <ContactDetailPage
                account={customerAccount}
                contact={customerContact}
                contactBreadcrumb={routes.customerContact}
              />
            </PrivateRoute>
            <PrivateRoute key="supplier-account" exact path={routes.supplierAccount.path}>
              <Account
                account={supplierAccount}
                accountBreadcrumb={routes.supplierAccount}
              />
            </PrivateRoute>
            <PrivateRoute
              key="supplier-account-edit"
              exact
              path={`${routes.supplierAccountDetail.path}/:id`}
            >
              <AccountDetailPage
                account={supplierAccount}
                contact={supplierContact}
                accountBreadcrumb={routes.supplierAccount}
              />
            </PrivateRoute>
            <PrivateRoute key="supplier-contact" exact path={routes.supplierContact.path}>
              <Contact
                contact={supplierContact}
                account={supplierAccount}
                contactBreadcrumb={routes.supplierContact}
              />
            </PrivateRoute>
            <PrivateRoute
              key="supplier-contact-edit"
              exact
              path={`${routes.supplierContactDetail.path}/:id`}
            >
              <ContactDetailPage
                account={supplierAccount}
                contact={supplierContact}
                contactBreadcrumb={routes.supplierContact}
              />
            </PrivateRoute>
            <PrivateRoute
              key="project-sales"
              exact
              path={routes.projectSales.path}
            >
              <ProjectSales />
            </PrivateRoute>
            <PrivateRoute
              key="project-sales-details"
              exact
              path={`${routes.projectSalesDetail.path}/:id`}
            >
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
            <PrivateRoute exact path={routes.productDetail.path + "/:id"}>
              <ProductDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productInventory.path}>
              <ProductInventory />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productInventoryDetail.path + "/:id"}>
              <ProductInventoryDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.equiptmentRentalMaster.path}>
              <EquipmentRentalMaster />
            </PrivateRoute>
            <PrivateRoute exact path={routes.rentalManagement.path}>
              <RentalManagement />
            </PrivateRoute>
            <PrivateRoute exact path={routes.rentalManagementDetail.path + "/:id"}>
              <RentalManagementDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productCategory.path}>
              <ProductCategory />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productTemplate.path}>
              <ProductTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productTemplate.path + "/:id"}>
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
            <PrivateRoute
              exact
              path={`${routes.formBuilder.path}${routes.formBuilderResource.path}`}
            >
              <CreateFormBuilder />
            </PrivateRoute>
            <PrivateRoute exact path={termsAndCondition.route}>
              <TermsAndConditions
                termsAndConditionBreadcrumb={routes.termsAndConditions}
              />
            </PrivateRoute>
            <PrivateRoute exact path={routes.priceTemplate.path}>
              <PriceTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={routes.priceTemplate.path + "/:id"}>
              <CreatePriceTemplate />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productBuilder.path}>
              <ProductBuilder />
            </PrivateRoute>
            <PrivateRoute exact path={routes.productBuilder.path + "/:id"}>
              <CreateProductBuilder />
            </PrivateRoute>
            <PrivateRoute exact path={routes.currencyConverter.path}>
              <CurrencyConverter />
            </PrivateRoute>
            <PrivateRoute exact path={routes.address.path}>
              <Warehouse />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.quoteBuilderDetail.path}/:id`}>
              <QuoteDetail />
            </PrivateRoute>
            <Route exact path={"/dashboards"}>
              <KpiDashboards />
            </Route>
            {/* <Route exact path={"/dashboards"}>
              <KpiDashboard />
            </Route>
            <Route exact path={"/dashboard/detail/:id"}>
              <EditDashboard edit={true} />
            </Route>
            <Route exact path={"/dashboard/:id"}>
              <EditDashboard edit={false} />
            </Route> */}
            //Route available for customers to Accept Reject Quote
            <Route exact path={"/quote-approval/:id"}>
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
            <PrivateRoute exact path="/product-list">
              <Products />
            </PrivateRoute>
            <PrivateRoute exact path="/product/details/:id">
              <ProductDetails />
            </PrivateRoute>
            <PrivateRoute exact path="/product/my-cart">
              <MyOwnCart />
            </PrivateRoute>
            <PrivateRoute exact path={routes.budget.path}>
              <Budget />
            </PrivateRoute>
            <PrivateRoute exact path={routes.pricingCondition.path}>
              <PricingConditions />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.pricingCondition.path}/detail/:id`}>
              <PricingConditionsDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.marketSegment.path}>
              <MarketSegment />
            </PrivateRoute>
            <PrivateRoute exact path={routes.deliveryTicket.path}>
              <DeliveryTicket />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.deliveryTicket.path}/detail/:id`} >
              <DeliveryTicketDetailsPage />
            </PrivateRoute>
            <PrivateRoute exact path={routes.repairJob.path}>
              <RepairJob />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.repairJobDetail.path}/:id`} >
              <RepairJobDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.receivingTicket.path}>
              <ReceivingTicket />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.receivingTicketDetail.path}/:id`} >
              <ReceivingTicketDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.salesOrder.path}>
              <SalesOrder />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.salesOrderDetail.path}/:id`} >
              <SalesOrderDetails />
            </PrivateRoute>
            <PrivateRoute exact path={routes.packages.path}>
              <PackageList />
            </PrivateRoute>
            <PrivateRoute exact path={`${routes.packagesDetail.path}/:id`} >
              <PackageDetails />
            </PrivateRoute>

            <Route path="*" component={NotFound} />
            {/* <Route exact path="/crm/account" component={Account} /> */}
          </Switch>
        </ErrorBoundaryComponent>
      </AnimatePresence>
      {
        toast?.toastConfig?.open && (
          ["notFoundError"].some(s => s !== toast?.toastConfig?.type) ? <CustomToaster
            type={toast.toastConfig.type}
            message={toast.toastConfig.message}
            anchorOrigin={toast.toastConfig?.anchorOrigin || null}
            open={toast.toastConfig.open}
            close={() => {
              toast.setToastConfig({ open: false });
            }}
          /> : (toast.toastConfig.type === "notFoundError" ? <RecordDeletedDialog /> : "")
        )
      }
      {/* {
        isOffline ?
          <OfflineStatusDialog /> : null
      } */}
    </ThemeProvider>
  );
}

export default App;