import { buildApp } from "./src/app";

async function run() {
  const app = await buildApp();
  await app.ready();

  try {
    const res = await app.inject({
      method: "GET",
      url: "/documentation/json",
    });
    console.log("Status Code:", res.statusCode);
    if (res.statusCode !== 200) {
      console.log("Payload:", res.payload);
    }
  } catch (err) {
    console.error(err);
  }
  await app.close();
}

run();
