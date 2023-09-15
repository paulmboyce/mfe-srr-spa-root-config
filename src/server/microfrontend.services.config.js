/**
 * importmap is extracted by sendLayoutHTTPResponse() renderFragment parameter
 */
export const servicesConfig = {
  importmap: {
    imports: {
      "react-dom":
        "https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js",
      react:
        "https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js",
      "single-spa":
        "https://cdn.jsdelivr.net/npm/single-spa@5.5.3/lib/system/single-spa.min.js",
      /*   
      styled-components,react-is
      ==========================
      Move styled-components (+ dependency react-is) to webpack externals[]
        and add here to root-config import-map.
        Avoids webpack dev server issues and makes app bundles smaller.
        SRC: https://cdn.jsdelivr.net/npm/styled-components@5.3.11/dist/
        SRC: https://cdn.jsdelivr.net/npm/react-is@18.2.0/umd/
      */
      "react-is":
        "https://cdn.jsdelivr.net/npm/react-is@18.2.0/umd/react-is.production.min.js",
      "styled-components":
        "https://cdn.jsdelivr.net/npm/styled-components@5.3.11/dist/styled-components.min.js",
      // From webpack dev server:
      // "@pmat-org/app1": "http://localhost:3010/pmat-org-app1.js",
      // "@pmat-org/app1pink": "http://localhost:4010/pmat-org-app1pink.js",
      // From webpack /dist:
      "@pmat-org/app1": "http://localhost:3011/pmat-org-app1.js",
      "@pmat-org/app1pink": "http://localhost:4011/pmat-org-app1pink.js",
      // "@pmat-org/app1red": "http://localhost:3002/pmat-org-app1red.js",
      "@pmat-org/root-config": "http://localhost:9876/pmat-org-root-config.js",
    },
  },
  "server-side-render": {
    "@pmat-org/app1": {
      url: "localhost:3011/ssr",
    },
    "@pmat-org/app1pink": {
      url: "localhost:4011/ssr",
    },
    "@pmat-org/app1red": {
      url: "localhost:3001/ssr",
    },
  },
};
