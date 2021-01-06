import { ThemeProvider } from "@material-ui/core";
import { theme } from "./constants/AppConfig";
import Opportunities from "./pages/Opportunities";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Opportunities />
    </ThemeProvider>
  );
}

export default App;
