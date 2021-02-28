import { ThemeProvider } from "@material-ui/core";
import { Switch, Route, Redirect } from "react-router-dom";
import { theme } from "./constants/AppConfig";
import Login from "./pages/Auth/Login";
import Leads from "./pages/Leads";
import NewLead from "./pages/Leads/NewLead";
import Opportunities from "./pages/Opportunities";
import AddNewOpportunity from "./pages/Opportunities/AddNewOpportunity";
import PrivateRoute from "./components/PrivateRoute";
import { useData } from "./StateProvider/Provider";
import CreateBrand from "./pages/Brand/CreateBrand";
import AddDoa from "./pages/DoaSetup/AddDoa";
import Contact from "./pages/Contact";
import Account from "./pages/Account";
import CreateAccount from "./pages/Account/CreateAccount";
import CreateContact from "./pages/Contact/CreateContact"

function App() {
  const {
    state: { user },
  } = useData();

  const conditionalRedirect = (Comp, location) => {
    return !user ? (
      <Comp />
    ) : (
        <Redirect to={{ pathname: "/", state: { from: location } }} />
      );
  };

  return (
    <ThemeProvider theme={theme}>
      <Switch>
        <Route
          exact
          path="/login"
          render={({ location }) => conditionalRedirect(Login, location)}
        />
        <Route exact path="/" component={Leads} />
        <Route exact path="/new-lead" component={NewLead} />
        <Route exact path="/opportunities" component={Opportunities} />
        <Route exact path="/add-doa" component={AddDoa} />
        <PrivateRoute exact path="/new-opp">
          <AddNewOpportunity />
        </PrivateRoute>
        {/* <PrivateRoute exact path="/">
          <CreateBrand />
        </PrivateRoute> */}
        <Route exact path="/contact" component={Contact} />
        <Route exact path="/contact/new" component={CreateContact} />
        <Route exact path="/account/new" component={CreateAccount} />
        {/* <Route exact path="/crm/account" component={Account} /> */}
        <Route exact path="/account" component={Account} />
      </Switch>
    </ThemeProvider>
  );
}

export default App;
