import React, { useContext, useEffect } from "react";
import { ThemeProvider } from "@material-ui/core";
import ReactGA from "react-ga";
import { Redirect, Route, Switch, useHistory } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { theme } from "./constants/AppConfig";
import Login from "./pages/Auth/Login";
import AzureLogin from "./pages/Auth/AzureLogin";
import Leads from "./pages/Leads";
import LeadDetailsPage from "./pages/Leads/LeadDetailsPage";
import NewLead from "./pages/Leads/NewLead";
import Opportunities from "./pages/Opportunities";
import AddNewOpportunity from "./pages/Opportunities/AddNewOpportunity";
import PrivateRoute from "./components/PrivateRoute";
import { useData } from "./StateProvider/Provider";
import Doa from "./pages/DoaSetup";
import Contact from "./pages/Contact";
import Account from "./pages/Account/index";
import AccountDetailPage from "./pages/Account/AccountDetailPage";
import ContactDetailPage from "./pages/Contact/ContactDetailPage";
import CustomToaster from "./components/Helpers/CustomToast";
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

import { CustomToastContext } from "./StateProvider/CustomToastContext/CustomToastContext";
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
import QuoteDetail from "./pages/QuoteBuilderCombined/QuoteDetail";
import DOARequest from "./pages/DOA";
import CurrencyConverter from "./pages/CurrencyConverter";

import {
  termsAndCondition,
  customerAccount,
  customerContact,
  supplierAccount,
  supplierContact,
} from "./constants/helpers";
import routes from "./components/Helpers/Routes";
import Dashboard from "./pages/Dashboard";
import KpiDashboard from "./pages/KpiDashboard";
import EditDashboard from "./pages/KpiDashboard/EditDashboards";

import FormBuilder from "./pages/FormBuilder";
import CreateFormBuilder from "./pages/FormBuilder/CreateFormBuilder";
import UserProfilePage from "./pages/ProfilePage/index";
import { CustomNotificationCountContext } from "./StateProvider/CustomNotificationCountContext/CustomNotificationCountContext";
import axiosInstance from "./axios/axiosInstance";
import Event from "./pages/Activity/Event";
import DOAapproval from "./pages/DOA/DOAApproval";
import QuoteBuilderCombined from "./pages/QuoteBuilderCombined";
import Reminder from "./pages/Reminder";
import ResetPassword from "./pages/Auth/ResetPassword";
import queryString from "query-string";
import {
  USER_LOADING,
  SET_USER,
  SET_SELECTED_ENTITY,
} from "./StateProvider/actionTypes";
import NotFound from "./pages/NotFound";
import CustomInlineEditableAgGrid from "./components/AgGridComponents/CustomInlineEditableAgGrid";
import { CustomChatNotificationCountContext } from "./StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext";
import { TRACKING_ID } from "./config";
import Products from "./pages/Products";
import ProductDetails from "./pages/Products/ProductDetails";
import MarketSegment from "./pages/MarketSegment";
import MyCart from "./components/ProductList/MyCart/MyCart";
import Budget from "./pages/Budget";
import CreateQuotePdfTemplate from "./pages/QuotePdfTemplate/CreateQuotePdfTemplate";
import QuotePdfTemplate from "./pages/QuotePdfTemplate";

function App() {
  const toast = useContext(CustomToastContext);
  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);

  const {
    state: { user },
    dispatch,
  }: any = useData();
  const history = useHistory();
  ReactGA.initialize(TRACKING_ID);

  console.log(process.env.REACT_APP_ENV);

  const getVersion = () => {
    setTimeout(() => {
      axiosInstance()
        .get("/version")
        .then(({ data }) => {});
    }, 30000);
  };

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
          toast.setToastConfig(error);
        });
    }
  };

  const getChatNotification = async () => {
    if (localStorage.getItem("token")) {
      await axiosInstance()
        .get(`/user/user-notification/unseen`)
        .then(({ data: { count } }) => {
          if (count > 0) {
            chatNotification.setCount(count);
          }
        });
    }
  };

  useEffect(() => {
    try {
      getNotification();
      getChatNotification();
      history.listen((location, action) => {
        ReactGA.set({ page: location.pathname });
        ReactGA.pageview(location.pathname);
      });

      setInterval(async () => {
        await getNotification();
      }, 60000);
    } catch (e) {}

    // getVersion();
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
      <Comp />
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
          <PrivateRoute exact path="/lead">
            <Leads />
          </PrivateRoute>
          <PrivateRoute exact path="/lead/detail/:id">
            <LeadDetailsPage />
          </PrivateRoute>
          <PrivateRoute exact path="/new-lead">
            <NewLead />
          </PrivateRoute>
          <PrivateRoute exact path="/opportunity">
            <Opportunities />
          </PrivateRoute>
          <PrivateRoute exact path="/opportunity/detail/:id">
            <OpportunityDetailsPage />
          </PrivateRoute>
          <PrivateRoute exact path="/new-opp">
            <AddNewOpportunity />
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
          <PrivateRoute key="customer-account" exact path="/customer-account">
            <Account
              account={customerAccount}
              accountBreadcrumb={routes.customerAccount}
            />
          </PrivateRoute>
          <PrivateRoute
            key="customer-account-edit"
            exact
            path="/customer-account/detail/:id"
          >
            <AccountDetailPage
              account={customerAccount}
              contact={customerContact}
              accountBreadcrumb={routes.customerAccount}
            />
          </PrivateRoute>
          <PrivateRoute key="customer-contact" exact path="/customer-contact">
            <Contact
              contact={customerContact}
              account={customerAccount}
              contactBreadcrumb={routes.customerContact}
            />
          </PrivateRoute>
          <PrivateRoute
            key="customer-contact-edit"
            exact
            path="/customer-contact/detail/:id"
          >
            <ContactDetailPage
              account={customerAccount}
              contact={customerContact}
              contactBreadcrumb={routes.customerContact}
            />
          </PrivateRoute>
          <PrivateRoute key="supplier-account" exact path="/supplier-account">
            <Account
              account={supplierAccount}
              accountBreadcrumb={routes.supplierAccount}
            />
          </PrivateRoute>
          <PrivateRoute
            key="supplier-account-edit"
            exact
            path="/supplier-account/detail/:id"
          >
            <AccountDetailPage
              account={supplierAccount}
              contact={supplierContact}
              accountBreadcrumb={routes.supplierAccount}
            />
          </PrivateRoute>
          <PrivateRoute key="supplier-contact" exact path="/supplier-contact">
            <Contact
              contact={supplierContact}
              account={supplierAccount}
              contactBreadcrumb={routes.supplierContact}
            />
          </PrivateRoute>
          <PrivateRoute
            key="supplier-contact-edit"
            exact
            path="/supplier-contact/detail/:id"
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
          <PrivateRoute exact path="/email">
            <Email />
          </PrivateRoute>
          <PrivateRoute exact path="/note">
            <Note />
          </PrivateRoute>
          <PrivateRoute exact path="/attachment">
            <Attachments />
          </PrivateRoute>
          <PrivateRoute exact path="/calendar">
            <Calender />
          </PrivateRoute>
          <PrivateRoute exact path="/reminder">
            <Reminder />
          </PrivateRoute>
          <PrivateRoute path="/case">
            <Activity type="case" />
          </PrivateRoute>
          <PrivateRoute path="/task">
            <Activity type="task" />
          </PrivateRoute>
          <PrivateRoute exact path={routes.product.path}>
            <Product />
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
          <PrivateRoute exact path={routes.quotePdfTemplate.path + "/:id"}>
            <CreateQuotePdfTemplate />
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
          <PrivateRoute exact path={`${routes.quoteBuilder.path}/detail/:id`}>
            <QuoteDetail />
          </PrivateRoute>
          <Route exact path={"/dashboards"}>
            <KpiDashboard />
          </Route>
          <Route exact path={"/dashboard/detail/:id"}>
            <EditDashboard edit={true} />
          </Route>
          <Route exact path={"/dashboard/:id"}>
            <EditDashboard edit={false} />
          </Route>
          //Route available for customers to Accept Reject Quote
          <Route exact path={"/quote-approval/:id"}>
            <QuoteApproval />
          </Route>
          <PrivateRoute exact path={"/doa-request"}>
            <DOARequest />
          </PrivateRoute>
          <PrivateRoute exact path={"/doa-request/:id"}>
            <DOAapproval />
          </PrivateRoute>
          <PrivateRoute exact path={routes.quoteBuilder.path}>
            <QuoteBuilderCombined />
          </PrivateRoute>
          <Route exact path="/inline-grid">
            <CustomInlineEditableAgGrid />
          </Route>
          <Route exact path={`${routes.quotePdfTemplate.path}/:id`}>
            <CreateQuotePdfTemplate />
          </Route>
          <PrivateRoute exact path="/product-list">
            <Products />
          </PrivateRoute>
          <PrivateRoute exact path="/product/details/:id">
            <ProductDetails />
          </PrivateRoute>
          <PrivateRoute exact path="/product/my-cart">
            <MyCart />
          </PrivateRoute>
          <PrivateRoute exact path={routes.budget.path}>
            <Budget />
          </PrivateRoute>
          <PrivateRoute exact path={routes.marketSegment.path}>
            <MarketSegment />
          </PrivateRoute>
          <Route path="*" component={NotFound} />
          {/* <Route exact path="/crm/account" component={Account} /> */}
        </Switch>
      </AnimatePresence>

      {toast?.toastConfig?.open && (
        <CustomToaster
          type={toast.toastConfig.type}
          message={toast.toastConfig.message}
          open={toast.toastConfig.open}
          close={() => {
            toast.setToastConfig({ open: false });
          }}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
