var path = require('path');
module.exports = {
    SQLITE_CONFIG: {
        client: 'sqlite3',
        connection: {
            filename: path.resolve(__dirname, "./database.db")
        },
        useNullAsDefault: false,
        debug: false
    },
    SAVE_BASE_PATH: path.resolve(__dirname, "./data"),
    ROOT_PATH: __dirname,
    LOG_SAVE_PATH: path.resolve(__dirname, "./log"),
}