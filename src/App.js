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
        <Route exact path="/leads" component={Leads} />
        <Route exact path="/new-lead" component={NewLead} />
        <Route exact path="/opportunities" component={Opportunities} />
        <Route exact path="/add-doa" component={AddDoa} />
        <PrivateRoute exact path="/new-opp">
          <AddNewOpportunity />
        </PrivateRoute>
        <PrivateRoute exact path="/">
          <CreateBrand />
        </PrivateRoute>
      </Switch>
    </ThemeProvider>
  );
}

export default App;
