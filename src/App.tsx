import React, { useState, useContext } from "react";
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

import { makeStyles } from "@material-ui/core/styles";
import { CustomToastContext } from "./StateProvider/CustomToastContext/CustomToastContext";
import Roles from "./pages/Role";
import RoleDetailsPage from "./pages/Role/RoleDetailsPage";
import Product from "./pages/Product";
import { customerAccount, customerContact, supplierAccount, supplierContact } from "./constants/helpers";
import routes from "./components/Helpers/Routes";

function App() {
  const toast = useContext(CustomToastContext);

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
            <Leads />
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
          <PrivateRoute exact path="/customer-account">
            <Account
              accountApi={customerAccount.api}
              accountResource={customerAccount.resource}
              accountPermission={customerAccount.permission}
              accountRoute={customerAccount.route}
              accountBreadcrumb={routes.customerAccount}
            />
          </PrivateRoute>
          <PrivateRoute exact path="/customer-account/detail/:id">
            <AccountDetailPage
              accountApi={customerAccount.api}
              accountResource={customerAccount.resource}
              accountPermission={customerAccount.permission}
              accountRoute={customerAccount.route}
              accountBreadcrumb={routes.customerAccount}
              contactResource={customerContact.resource} />
          </PrivateRoute>
          <PrivateRoute exact path="/customer-contact">
            <Contact
              contactApi={customerContact.api}
              contactResource={customerContact.resource}
              contactPermission={customerContact.permission}
              contactRoute={customerContact.route}
              contactBreadcrumb={routes.customerContact}
            />
          </PrivateRoute>
          <PrivateRoute exact path="/customer-contact/detail/:id">
            <ContactDetailPage
              contactApi={customerContact.api}
              contactResource={customerContact.resource}
              contactPermission={customerContact.permission}
              contactRoute={customerContact.route}
              contactBreadcrumb={routes.customerContact}
            />
          </PrivateRoute>
          <PrivateRoute exact path="/supplier-account">
            <Account
              accountApi={supplierAccount.api}
              accountResource={supplierAccount.resource}
              accountPermission={supplierAccount.permission}
              accountRoute={supplierAccount.route}
              accountBreadcrumb={routes.supplierAccount}
            />
          </PrivateRoute>
          <PrivateRoute exact path="/supplier-account/detail/:id">
            <AccountDetailPage
              accountApi={supplierAccount.api}
              accountResource={supplierAccount.resource}
              accountPermission={supplierAccount.permission}
              accountRoute={supplierAccount.route}
              accountBreadcrumb={routes.supplierAccount}
              contactResource={supplierContact.resource}
            />
          </PrivateRoute>
          <PrivateRoute exact path="/supplier-contact">
            <Contact
              contactApi={supplierContact.api}
              contactResource={supplierContact.resource}
              contactPermission={supplierContact.permission}
              contactRoute={supplierContact.route}
              contactBreadcrumb={routes.supplierContact}
            />
          </PrivateRoute>
          <PrivateRoute exact path="/supplier-contact/detail/:id">
            <ContactDetailPage
              contactApi={supplierContact.api}
              contactResource={supplierContact.resource}
              contactPermission={supplierContact.permission}
              contactRoute={supplierContact.route}
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
          <PrivateRoute exact path="/product">
            <Product />
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
    </ThemeProvider>
  );
}

export default App;
