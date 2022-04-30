// Put your database code here
const database = require('better-sqlite3')

const fs = require('fs');
const datadir = './data/db';

if (!fs.existsSync(datadir)){
    fs.mkdirSync(datadir);
}

const logdb = new database(datadir+'log.db')

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get();
if (row === undefined) {
    console.log('Your database appears to be empty. I will initialize it now.')

    const sqlInit = `
        CREATE TABLE accesslog ( 
            id INTEGER PRIMARY KEY, 
            remoteaddr TEXT,
            remoteuser TEXT,
            time TEXT,
            method TEXT,
            url TEXT,
            protocol TEXT,
            httpversion TEXT,
            status TEXT, 
            referrer TEXT,
            useragent TEXT
        );
    `

    logdb.exec(sqlInit)
    console.log('Your database has been initialized with a new table and two entries containing a username and password.')
} else {
    console.log('Database exists.')
}

module.exports = logdb

