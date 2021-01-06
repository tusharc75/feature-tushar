import { ThemeProvider } from "@material-ui/core";
import { theme } from "./constants/AppConfig";
import Leads from "./pages/Leads";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Leads />
    </ThemeProvider>
  );
}

export default App;
