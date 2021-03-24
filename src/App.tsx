import React, { useState } from "react";
import { ThemeProvider } from "@material-ui/core";
import { Redirect, Route, Switch } from "react-router-dom";
import { theme } from "./constants/AppConfig";
import Login from "./pages/Auth/Login";
import Leads from "./pages/Leads";
import LeadDetailsPage from "./pages/Leads/LeadDetailsPage";
import NewLead from "./pages/Leads/NewLead";
import Opportunities from "./pages/Opportunities";
import AddNewOpportunity from "./pages/Opportunities/AddNewOpportunity";
import PrivateRoute from "./components/PrivateRoute";
import { useData } from "./StateProvider/Provider";
import AddDoa from "./pages/DoaSetup/AddDoa";
import Contact from "./pages/Contact";
import Account from "./pages/Account/index";
// import CreateContact from './pages/Contact/CreateContact'
import AccountDetailPage from "./pages/Account/AccountDetailPage";
import ContactDetailPage from "./pages/Contact/ContactDetailPage";
import Entity from "./pages/Entity123";
import EntityDetailPage from "./pages/Entity123/SingleEntity";
import CustomToaster from "./components/Helpers/CustomToast";
import { CustomEventEmitter } from "./axios/events";
import OpportunityDetailsPage from "./pages/Opportunities/OpportunityDetailsPage";
import Activitydemo from "./pages/Activity/activitydemo";
import Activity from "./pages/Activity";
import Note from "./pages/Activity/Note";
import Email from "./pages/Activity/Email";
import PasswordSetup from "./pages/Auth/PasswordSetup";

function App() {
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

  const [toastConfig, setToastConfig] = useState(null);

  CustomEventEmitter.subscribe("show-toast", (toastConfig) => {
    setToastConfig({
      ...toastConfig,
      open: true,
      close: () => {
        setToastConfig(null);
      },
    });
  });

  return (
    <ThemeProvider theme={theme}>
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
        <PrivateRoute exact path="/add-doa">
          <AddDoa />
        </PrivateRoute>
        <PrivateRoute exact path="/new-opp">
          <AddNewOpportunity />
        </PrivateRoute>
        {/* <PrivateRoute exact path="/">
          <CreateBrand />
        </PrivateRoute> */}
        <PrivateRoute exact path="/contact">
          <Contact />
        </PrivateRoute>
        {/* <PrivateRoute exact path="/contact/new">
                    <CreateContact />
                </PrivateRoute>
                <PrivateRoute exact path="/contact/:id">
                    <CreateContact />
                </PrivateRoute> */}
        <PrivateRoute exact path="/account">
          <Account />
        </PrivateRoute>
        <PrivateRoute exact path="/account/detail/:id">
          <AccountDetailPage />
        </PrivateRoute>
        <PrivateRoute exact path="/contact/detail/:id">
          <ContactDetailPage />
        </PrivateRoute>
        <PrivateRoute exact path="/activity">
          <Activitydemo />
        </PrivateRoute>

        <PrivateRoute exact path="/entity">
          <Entity />
        </PrivateRoute>

        <PrivateRoute exact path="/entity/:id">
          <EntityDetailPage />
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
        {/* <Route exact path="/crm/account" component={Account} /> */}
      </Switch>

      {toastConfig && (
        <CustomToaster
          type={toastConfig.type}
          errorMsg={toastConfig.errorMsg}
          open={toastConfig.open}
          close={toastConfig.close}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
