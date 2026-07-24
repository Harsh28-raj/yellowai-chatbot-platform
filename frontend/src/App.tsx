import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { ApiProvider } from "./app/ApiProvider";
import { AppRouter } from "./app/AppRouter";

function App() {
  return (
    <ApiProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ToastProvider>
    </ApiProvider>
  );
}

export default App;
