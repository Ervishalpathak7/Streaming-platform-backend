import app from "./app.js";
import { connectDb } from "./database/index.js";
import { gracefullShutdown } from "./utils/shutdown.js"
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";
export let server;

connectDb(MONGO_URI)
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("error while starting..", err);
    gracefullShutdown();
  });

process.on("SIGINT", gracefullShutdown);

