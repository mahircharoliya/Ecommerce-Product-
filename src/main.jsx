/**
 * src/main.jsx
 * -------------
 * React entry point.
 * Wraps the app with Redux <Provider> so all components can
 * access the store via useSelector / useDispatch hooks.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider }   from "react-redux";
import store          from "./store/store";
import App            from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Provider makes the Redux store available to every component */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
