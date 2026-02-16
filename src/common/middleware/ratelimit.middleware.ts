import { FastifyInstance } from "fastify";
import rateLimit from "fastify-rate-limit";

// Auth Rate limit middleware 
export async function authRateLimit(app: FastifyInstance) {
    await app.register(rateLimit, {
        max: 15,
        timeWindow: "1 minute",
        keyGenerator: (req) => req.ip,
    });
}

// Video Rate limit middleware
export async function videoRateLimit(app: FastifyInstance) {
    await app.register(rateLimit, {
        max: 15,
        timeWindow: "1 minute",
        keyGenerator: (req) => req.ip,
    });
}
