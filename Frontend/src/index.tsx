import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import storeRedux from './redux/store/storeRedux';
import "react-toastify/dist/ReactToastify.css";
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
let persistor = persistStore(storeRedux);

root.render(
  <Provider store={storeRedux}>
    <BrowserRouter>
      <PersistGate persistor={persistor}>
        <ToastContainer />
        <App />
      </PersistGate>
    </BrowserRouter>
  </Provider>
);