import path from 'path';
import * as fs from 'fs';
import mysql, {Connection, MysqlError, queryCallback} from 'mysql';
import { RegisterRequest } from './types/api/User';

process.on('uncaughtException', (exc: Error) => {
    connection.end((err?: MysqlError): void => {
        if(err) {
            console.log('Error attempting database connection end because of other exception!');
            throw err;
        }
        console.log('Succesfully ended database connection because of other exception');
    });
    throw exc;
});

const connection: Connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: fs.readFileSync(path.resolve(__dirname, '../passwords/database.txt')).toString(),
    database: 'simplychat'
});

connection.connect((err: MysqlError): void => {
    if(err) {
        console.log('Error connecting to database!');
        throw err;
    }
    console.log('Successfully connected to database');
});

export function query(query: string, values: (string | number)[], callback: queryCallback): void {
    connection.query(query, values, callback);
}

//// api ////

// user //

export function insertTempUser(request: RegisterRequest, verificationCode: number, timestamp: number, callback: queryCallback): void {
    query('INSERT INTO temp_users VALUES (?, ?, ${request.passwordHash}, ${verificationCode}, ${timestamp});',
    [request.username, request.email, request.passwordHash, verificationCode, timestamp], callback);
}