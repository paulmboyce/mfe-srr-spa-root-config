/* eslint-disable no-console */
import {
  constructServerLayout,
  sendLayoutHTTPResponse,
} from "single-spa-layout/server";
import http from "http";

const serverLayout = constructServerLayout({
  filePath: "src/server/views/index.html",
});

console.log(">>>>> 1");

http
  .createServer(async (req, res) => {
    console.log("PATH: req.url", req.url);
    await sendLayoutHTTPResponse({
      res,
      serverLayout,
      urlPath: req.url,
      nonce: "yourNonceHere",
      async renderApplication({ appName, propsPromise }) {
        return {
          assets: `<link rel="stylesheet" href="/my-styles.css">`,
          content: `<button>${appName} app</button>`,
        };
      },
      async retrieveApplicationHeaders({ appName, propsPromise }) {
        return {
          "x-custom-header": "value",
        };
      },
      async renderFragment(fragmentName) {
        return `<script type="systemjs-importmap">{"imports": {}}</script>`;
      },
      async retrieveProp(propName) {
        return "prop value";
      },
      assembleFinalHeaders(allHeaders) {
        allHeaders.forEach(({ appProps, appHeaders }) => {});

        return {};
      },
    }).catch((err) => {
      console.error("OOPPS!!!!!!", err);
      res.status(500).send("A server error occurred");
    });
  })
  .listen(9000);
