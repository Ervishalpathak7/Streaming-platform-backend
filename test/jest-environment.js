const NodeEnvironment = require("jest-environment-node").TestEnvironment;
const dotenv = require("dotenv");
const path = require("path");

class CustomEnvironment extends NodeEnvironment {
    constructor(config, context) {
        // Load environment variables BEFORE calling super
        dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
        super(config, context);
    }

    async setup() {
        await super.setup();
    }

    async teardown() {
        await super.teardown();
    }
}

module.exports = CustomEnvironment;
