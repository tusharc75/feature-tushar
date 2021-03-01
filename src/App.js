import { ThemeProvider } from '@material-ui/core'
import { Redirect, Route, Switch } from 'react-router-dom'
import { theme } from './constants/AppConfig'
import Login from './pages/Auth/Login'
import Leads from './pages/Leads'
import NewLead from './pages/Leads/NewLead'
import Opportunities from './pages/Opportunities'
import AddNewOpportunity from './pages/Opportunities/AddNewOpportunity'
import PrivateRoute from './components/PrivateRoute'
import { useData } from './StateProvider/Provider'
import AddDoa from './pages/DoaSetup/AddDoa'
import Contact from './pages/Contact'
import Account from './pages/Account/index'
import CreateAccount from './pages/Account/CreateAccount'
import CreateContact from './pages/Contact/CreateContact'
import AccountDetailPage from "./pages/Account/AccountDetailPage"

function App() {
    const {
        state: { user }
    } = useData()

    const conditionalRedirect = (Comp, location) => {
        return !user ? (
            <Comp />
        ) : (
                <Redirect to={{ pathname: '/', state: { from: location } }} />
            )
    }

    return (
        <ThemeProvider theme={theme}>
            <Switch>
                <Route
                    exact
                    path="/login"
                    render={({ location }) => conditionalRedirect(Login, location)}
                />
                <PrivateRoute exact path="/">
                    <Leads />
                </PrivateRoute>
                <PrivateRoute exact path="/new-lead">
                    <NewLead />
                </PrivateRoute>
                <PrivateRoute exact path="/opportunities">
                    <Opportunities />
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
                <PrivateRoute exact path="/contact/new">
                    <CreateContact />
                </PrivateRoute>
                <PrivateRoute exact path="/contact/:id">
                    <CreateContact />
                </PrivateRoute>
                <PrivateRoute exact path="/account">
                    <Account />
                </PrivateRoute>
                <PrivateRoute exact path="/account/new">
                    <CreateAccount />
                </PrivateRoute>
                <PrivateRoute exact path="/account/clone/:id">
                    <CreateAccount />
                </PrivateRoute>
                <PrivateRoute exact path="/account/detail">
                    <AccountDetailPage />
                </PrivateRoute>
                {/* <Route exact path="/crm/account" component={Account} /> */}
            </Switch>
        </ThemeProvider>
    )
}

export default App
