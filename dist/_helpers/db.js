"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = initialize;
const promise_1 = __importDefault(require("mysql2/promise"));
const sequelize_1 = require("sequelize");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const account_model_1 = require("../accounts/account.model");
const refresh_token_model_1 = require("../accounts/refresh-token.model");
const db = {};
exports.default = db;
function loadDatabaseConfig() {
    const configPath = path_1.default.join(process.cwd(), 'config.json');
    if (!fs_1.default.existsSync(configPath)) {
        return {};
    }
    try {
        const config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
        return config.db || {};
    }
    catch (err) {
        console.warn('Could not load database config from config.json:', err);
        return {};
    }
}
async function initialize() {
    const fileConfig = loadDatabaseConfig();
    const host = process.env.DB_HOST || fileConfig.host || 'localhost';
    const port = parseInt(process.env.DB_PORT || String(fileConfig.port || 3306));
    const user = process.env.DB_USER || fileConfig.user || 'root';
    const password = process.env.DB_PASSWORD || fileConfig.password || '';
    const database = process.env.DB_NAME || fileConfig.database || 'manto_db';
    const servername = process.env.DB_SERVERNAME || fileConfig.servername || host;
    const sslEnabled = process.env.DB_SSL
        ? process.env.DB_SSL === 'true'
        : fileConfig.ssl ?? host !== 'localhost';
    const dialectOptions = sslEnabled ? {
        ssl: {
            servername,
            require: true,
            rejectUnauthorized: false
        }
    } : {};
    console.log('Connecting to DB:', { host, port, user, database });
    const connection = await promise_1.default.createConnection({
        host,
        port,
        user,
        password,
        database,
        ...dialectOptions
    });
    if (process.env.NODE_ENV !== 'production' && host === 'localhost') {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    }
    await connection.end();
    const sequelize = new sequelize_1.Sequelize(database, user, password, {
        host: host,
        port: port,
        dialect: 'mysql',
        dialectOptions
    });
    db.Account = (0, account_model_1.initAccount)(sequelize);
    db.RefreshToken = (0, refresh_token_model_1.initRefreshToken)(sequelize);
    await sequelize.sync();
}
