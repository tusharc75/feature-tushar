import React, { useContext, useEffect, useState } from "react";
import { ThemeProvider } from "@material-ui/core";
import { Redirect, Route, Switch, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { theme } from "./constants/AppConfig";
import Login from "./pages/Auth/Login";
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
import PasswordSetup from "./pages/Auth/PasswordSetup";
import ProductCategory from "./pages/ProductCategory";
import CreateProductCategory from "./pages/ProductCategory/CreateProductCategory";
import User from "./pages/User";
import Entity from "./pages/Entity";
import EntityDetailPage from "./pages/Entity/EntityDetailPage";
import UserDetailsPage from "./pages/User/UserDetailsPage";

import { CustomToastContext } from "./StateProvider/CustomToastContext/CustomToastContext";
import Roles from "./pages/Role";
import RoleDetailsPage from "./pages/Role/RoleDetailsPage";
import Product from "./pages/Product";
import TermsAndConditions from "./pages/TermsAndConditions";
import {
  termsAndCondition,
  customerAccount,
  customerContact,
  supplierAccount,
  supplierContact,
  vapidKey,
} from "./constants/helpers";
import routes from "./components/Helpers/Routes";
import Dashboard from "./pages/Dashboard";

import FormBuilder from "./pages/FormBuilder";
import CreateFormBuilder from "./pages/FormBuilder/CreateFormBuilder";
import firebase, { onMessageListener } from "./firebase";
import CustomNotification from "./components/CustomNotification/CustomNotification";

function App() {
  const toast = useContext(CustomToastContext);
  const [notification, setNotification] = useState({ open: false, title: null, message: null })

  // const messaging = firebase.messaging();
  // messaging.getToken({ vapidKey: vapidKey }).then((token) => {
  //   if (token) {
  //     localStorage.setItem("notificationToken", token)
  //   } else {
  //     toast.setToastConfig({
  //       open: true,
  //       type: "error",
  //       message: "No registration token available. Request permission to generate one."
  //     })
  //   }
  // }).catch((err) => {
  //   console.log('An error occurred while retrieving token. ', err);
  //   // catch error while creating client token
  // });

  onMessageListener().then((payload: any) => {
    setNotification({
      open: true,
      title: payload.notification.title,
      message: payload.notification.body
    })

    // toast.setToastConfig({
    //   open: true,
    //   type: "success",
    //   message: payload.notification.body
    // });
    // setNotification({ title: payload.notification.title, body: payload.notification.body })
    console.log(payload);
  }).catch(err => console.log('failed: ', err));

  const location = useLocation();
  const {
    state: { user },
  }: any = useData();

  const conditionalRedirect = (Comp, location) => {
    return !user ? (
      <Comp />
    ) : (
      <Redirect to={{ pathname: "/", state: { from: location } }} />
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <AnimatePresence initial={false} exitBeforeEnter>
        {/* <Switch location={location} key={location.key}> */}
        <Switch>
          <Route
            exact
            path="/login"
            render={({ location }) => conditionalRedirect(Login, location)}
          />
          <Route
            exact
            path="/create-password"
            render={({ location }) =>
              conditionalRedirect(PasswordSetup, location)
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
          <PrivateRoute exact path="/user">
            <User />
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
          <PrivateRoute exact path="/activity/email">
            <Email />
          </PrivateRoute>
          <PrivateRoute exact path="/activity/note">
            <Note />
          </PrivateRoute>
          <PrivateRoute exact path="/activity/:type">
            <Activity />
          </PrivateRoute>

          <PrivateRoute exact path="/product-category">
            <ProductCategory />
          </PrivateRoute>
          <PrivateRoute exact path="/product-category/:id">
            <CreateProductCategory />
          </PrivateRoute>
          <PrivateRoute exact path={routes.product.path}>
            <Product />
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

      {
        notification.open && <CustomNotification open={notification.open}
          title={notification.title} message={notification.message}
          close={() => { setNotification({ open: false, title: null, message: null }) }} />
      }
    </ThemeProvider>
  );
}

export default App;
