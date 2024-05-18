const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const port = 8000;

const BASE_PATH =
  "https://web-template-project.s3.ap-south-1.amazonaws.com/__outputs";

const proxy = httpProxy.createProxy();

app.use((req, res) => {
  const hostname = req.hostname;
  const subDomain = hostname.split(".")[0];

  console.log(subDomain);

  const resolvesTo = `${BASE_PATH}/${subDomain}`;

  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

app.listen(port, () => console.log(`Reverse proxy running at port: ${port}`));
