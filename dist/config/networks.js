"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networks = exports.mainnet = exports.testnet = exports.NetworkConfigSchema = void 0;
exports.getNetworkConfig = getNetworkConfig;
const zod_1 = require("zod");
exports.NetworkConfigSchema = zod_1.z.object({
    horizonUrl: zod_1.z.string().url(),
    sorobanRpcUrl: zod_1.z.string().url(),
    friendbotUrl: zod_1.z.string().url().optional(),
});
exports.testnet = {
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
};
exports.mainnet = {
    horizonUrl: "https://horizon.stellar.org",
    sorobanRpcUrl: "https://soroban-rpc.mainnet.stellar.gateway.fm",
};
exports.networks = {
    testnet: exports.testnet,
    mainnet: exports.mainnet,
};
function getNetworkConfig(name) {
    const parsed = zod_1.z.enum(["testnet", "mainnet"]).safeParse(name);
    if (!parsed.success) {
        throw new Error(`Invalid network: ${name}. Use "testnet" or "mainnet".`);
    }
    return exports.networks[parsed.data];
}
//# sourceMappingURL=networks.js.map