import moduleAlias = require("module-alias");
import path from "path";

// Register module aliases based on environment
const isProd = process.env.NODE_ENV === "production";
const root = isProd ? "dist" : "src";

console.log(
  `[INIT] Running in ${process.env.NODE_ENV} mode, using root: ${root}`,
);

moduleAlias.addAliases({
  "@modules": path.join(process.cwd(), root, "modules"),
  "@common": path.join(process.cwd(), root, "common"),
});

import { startServer } from "./app";

startServer();
