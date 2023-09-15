import {
  constructServerLayout,
  sendLayoutHTTPResponse,
} from "single-spa-layout/server";
import http from "http";
import fetch from "node-fetch";
import { servicesConfig } from "./microfrontend.services.config.js";

const developmentMode = process.env.NODE_ENV === "development";

const serverLayout = constructServerLayout({
  filePath: "src/server/views/index.html",
});

const injectFragment = async () => {
  return `<div id="somefragment"></div>`;
};

const getSystemJsImportMapScript = async () => {
  const script = `<script type="systemjs-importmap">${JSON.stringify(
    servicesConfig["importmap"],
    null,
    2
  )}</script>`;
  return script;
};
const port = process.env.PORT || 9000;
// eslint-disable-next-line no-console
console.log(`Server starting on port ${port}...`);
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

async function fetchMicrofrontendStream(props) {
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
