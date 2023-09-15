import {
  registerApplication,
  start,
  addErrorHandler,
  getAppStatus,
  LOAD_ERROR,
} from "single-spa";
import {
  constructRoutes,
  constructApplications,
  constructLayoutEngine,
} from "single-spa-layout";

import { stubAppFailedToLoad } from "./stubAppFailedToLoad.js";

addErrorHandler((err) => {
  //https://single-spa.js.org/docs/api/#handling-load_error-status-to-retry-module
  if (getAppStatus(err.appOrParcelName) === LOAD_ERROR) {
    System.delete(System.resolve(err.appOrParcelName));
  }
});

const routes = constructRoutes(document.querySelector("#single-spa-layout"));
const applications = constructApplications({
  routes,
  loadApp({ name }) {
    return System.import(name).catch((b) => {
      /* 
        Add error handling
        ================== 
        because SystemJS 
        crashes the whole app if one of our apps fails to load.  
        (Clearly bad for UX.)
        This solution is imperfect and can be improved.
        Return a [stubAppFailedToLoad] object with expected 
        api (bootstrap/mount/unmount) to prevent immediate crash.
      */

      // eslint-disable-next-line no-console
      console.log(`ERROR: (could not load) app ${name}`);
      return stubAppFailedToLoad;
    });
  },
});
const layoutEngine = constructLayoutEngine({ routes, applications });
applications.forEach(registerApplication);
start();
