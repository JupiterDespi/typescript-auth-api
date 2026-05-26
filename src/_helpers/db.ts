// v1.0 - Updated May 2026
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { initAccount } from '../accounts/account.model';
import { initRefreshToken } from '../accounts/refresh-token.model';

const db: any = {};
export default db;

type DatabaseConfig = {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
    servername?: string;
};

function loadDatabaseConfig(): DatabaseConfig {
    const configPath = path.join(process.cwd(), 'config.json');

    if (!fs.existsSync(configPath)) {
        return {};
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.db || {};
    } catch (err) {
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

    const connection = await mysql.createConnection({
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

    const sequelize = new Sequelize(database, user, password, {
        host: host,
        port: port,
        dialect: 'mysql',
        dialectOptions
    });

    db.Account = initAccount(sequelize);
    db.RefreshToken = initRefreshToken(sequelize);

    await sequelize.sync({ alter: true });
}

export { initialize };
