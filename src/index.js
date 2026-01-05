import app from "./app.js";
import { connectDb } from "./database/index.js";
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";


connectDb(MONGO_URI).then(() => {
    app.listen(PORT , () => {
        console.log(`Server is running at http://localhost:${ PORT }`)
    })
}).catch((err) => {
    console.error( "error while starting.." , err)
    process.exit(1)
});
