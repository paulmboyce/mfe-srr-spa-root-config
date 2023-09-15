// NOTE: This serves a basic HTTP server for our SSR single-spa setup.
// IMPORTANT: root-config/dist/pmat-org-root-config.js is not exposed.
// For PROD our root-config/dist/pmat-org-root-config.js would be deployed to S3.
import {
  constructServerLayout,
  sendLayoutHTTPResponse,
} from "single-spa-layout/server";
import http from "http";
import fetch from "node-fetch";
import axios from "axios";

const developmentMode = process.env.NODE_ENV === "development";

let CACHED_CONFIG = {};

let servicesConfigDEV = {
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
      // "@pmat-org/root-config": "http://localhost:9002/pmat-org-root-config.js",
      "@pmat-org/root-config":
        "https://eu-west-1-ssr.s3.eu-west-1.amazonaws.com/pmat-org-root-config.js",
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

let servicesConfig = {};
let lastFetched = 0;

async function getServicesConfig() {
  if (process.env.NODE_ENV === "production") {
    return getServicesConfigWithCache();
  } else {
    console.log("Using DEV Services Config...");
    return Promise.resolve(servicesConfigDEV);
  }
}

async function getServicesConfigWithCache() {
  if (Date.now() > lastFetched + 30000) {
    const config = await getServicesConfigPROD();
    lastFetched = Date.now();
    console.log("Using LIVE CONFIG from AWS S3...");
    return Promise.resolve(config);
  } else {
    console.log("Using CACHED CONFIG...");
    return Promise.resolve(CACHED_CONFIG);
  }
}

async function getServicesConfigPROD() {
  console.log("PRODUCTION MODE, getting servicesConfig from AWS S3...");
  try {
    const response = await axios.get(
      "https://eu-west-1-ssr.s3.eu-west-1.amazonaws.com/microfrontend.services.config.json"
    );
    CACHED_CONFIG = response.data;
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

const serverLayout = constructServerLayout({
  filePath: "src/server/views/index.html",
});

const injectFragment = async () => {
  return `<div id="somefragment"></div>`;
};

const getSystemJsImportMapScript = async () => {
  const servicesConfig = await getServicesConfig();
  const script = `<script type="systemjs-importmap">${JSON.stringify(
    servicesConfig["importmap"],
    null,
    2
  )}</script>`;
  return script;
};
const port = process.env.PORT || 9000;
http
  .createServer((req, res) => {
    const fetchPromises = {};

    const renderOptions = {
      res,
      serverLayout,
      urlPath: req.url,
      // async renderApplication({ appName, propsPromise }) {
      async renderApplication(args) {
        const props = await args.propsPromise;
        let content = "";
        const fetchPromise =
          fetchPromises[args.appName] ||
          (fetchPromises[args.appName] = fetchMicrofrontendStream(props));
        try {
          content = await fetchPromise;
        } catch (err) {
          content = `<div style="visibility:hidden;">ERROR: could not load SSR for ${args.appName} check app SSR endpoint is alive</div>`;
        }

        return { content };
        // return {
        //   assets: `<link rel="stylesheet" href="/my-styles.css">`,
        //   content: `<button>${appName} app</button>`,
        // };
      },
      async retrieveApplicationHeaders({ appName, propsPromise }) {
        return {
          //     "x-custom-header": "value",
        };
      },
      async retrieveProp(propName) {
        return "prop value";
      },
      assembleFinalHeaders(allHeaders) {
        return Object.assign({}, Object.values(allHeaders));
      },
      async renderFragment(name) {
        let result = "<!-- injecting multiple fragments -->";
        await Promise.all([
          injectFragment(),
          getSystemJsImportMapScript(),
        ]).then((fragments) => {
          fragments.forEach((f) => (result = result.concat("\n").concat(f)));
        });
        return result;
      },
    };

    // const layoutResponse = sendLayoutHTTPResponse(serverLayout, {
    sendLayoutHTTPResponse(renderOptions);

    // if (layoutResponse) {
    //   console.log(layoutResponse);
    //   const bodyStream = layoutResponse.bodyStream;
    //   bodyStream.pipe(res);
    // }
  })
  .listen(port);

// eslint-disable-next-line no-console
console.log(`Server started on port ${port}`);

async function fetchMicrofrontendStream(props) {
  const servicesConfig = await getServicesConfig();

  const serviceEndpoint = servicesConfig["server-side-render"][props.name].url;

  // r.body is a Readable stream when you use node-fetch,
  // which is best for performance when using single-spa-layout
  return fetch(`http://${serviceEndpoint}`, {
    headers: props,
  })
    .then((r) => {
      if (r.ok) {
        // console.log("RESPONSE HEADERS:", r.headers.raw());
        const dataStream = r.body;
        // Listen for the 'data' event and log each chunk
        dataStream.on("data", (chunk) => {
          // console.log("STREAM DATA", chunk.toString());
        });
        return dataStream;
      } else {
        throw Error(
          `ERROR: Received http response ${r.status} from microfrontend ${props.name}`
        );
      }
    })
    .catch((err) => {
      return Promise.reject(
        `No response from [${serviceEndpoint}] for app [${props.name}]`
      );
    });
}
