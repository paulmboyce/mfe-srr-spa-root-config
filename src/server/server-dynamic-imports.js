/* eslint-disable no-console */
import {
  constructServerLayout,
  sendLayoutHTTPResponse,
} from "single-spa-layout/server";
import http from "http";
import { getImportMaps } from "single-spa-web-server-utils";

const serverLayout = constructServerLayout({
  filePath: "src/server/views/index.html",
});
const developmentMode = process.env.NODE_ENV === "development";

console.log("DEVELOPMENT MODE: ", developmentMode);
const props = {
  user: {
    id: 1,
    name: "Test User",
  },
};

http
  .createServer((req, res) => {
    const importMapsPromise = getImportMaps({
      // url: "https://storage.googleapis.com/isomorphic.microfrontends.app/importmap.json",
      url: "http://eu-west-1-ssr.s3.eu-west-1.amazonaws.com/importmap.json",
      nodeKeyFilter(importMapKey) {
        return importMapKey.startsWith("@isomorphic-mf");
      },
      req,
      allowOverrides: true,
    }).then(({ nodeImportMap, browserImportMap }) => {
      console.log("then.....");
      global.nodeLoader.setImportMapPromise(Promise.resolve(nodeImportMap));
      if (developmentMode) {
        browserImportMap.imports["@isomorphic-mf/root-config"] =
          "http://localhost:9876/isomorphic-mf-root-config.js";
        browserImportMap.imports["@isomorphic-mf/root-config/"] =
          "http://localhost:9876/";
      }

      console.log(">>>>> browserImportMap", browserImportMap);
      return { nodeImportMap, browserImportMap };
    });

    const fragments = {
      importmap: async () => {
        const { browserImportMap } = await importMapsPromise;
        return `<script type="systemjs-importmap">${JSON.stringify(
          browserImportMap,
          null,
          2
        )}</script>`;
      },
    };

    //const renderFragment = (name) => fragments[name]();
    const renderFragment = (name) => {
      return `<script type="systemjs-importmap">${name}</script>`;
    };

    const { bodyStream } = sendLayoutHTTPResponse({
      res,
      serverLayout,
      urlPath: req.url,
      async renderApplication({ appName, propsPromise }) {
        console.log(">>> renderApplication", appName);
        await importMapsPromise;
        console.log(">>> renderApplication 2");
        // errors using import ( arg1, arg2)
        // works using import ( arg )
        // const [app, props] = await Promise.all([
        //   import(`${props.name}/server.mjs`, propsPromise),
        // ]);
        const app = await import(`${appName}/server.mjs`);
        console.log("renderApplication", app);
        const props = await import(propsPromise);
        console.log("renderApplication", props);
        return app.serverRender(props);
      },
      async retrieveApplicationHeaders({ appName, propsPromise }) {
        console.log(">>> retrieveApplicationHeaders", appName);
        await importMapsPromise;
        console.log(">>> retrieveApplicationHeaders 2");
        // errors using import ( arg1, arg2)
        // works using import ( arg )
        // const [app, props] = await Promise.all([
        //   import(`${props.name}/server.mjs`, propsPromise),
        // ]);
        const app = await import(`${appName}/server.mjs`);
        console.log("retrieveApplicationHeaders", app);
        const props = await import(propsPromise);
        console.log("retrieveApplicationHeaders", props);
        return app.getResponseHeaders(props);
      },
      async retrieveProp(propName) {
        return props[propName] || `no value set for ${propName}`;
      },
      assembleFinalHeaders(allHeaders) {
        return Object.assign({}, Object.values(allHeaders));
      },
      renderFragment: renderFragment,
    });

    //  bodyStream.pipe(res);
  })
  .listen(9000);
