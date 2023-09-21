import mysql, {Connection, MysqlError, queryCallback} from 'mysql';
import { RegisterRequest } from './types/api/user';
import { getTimestamp, twoWeeksTimestamp } from './timestamp';
import { settings } from './settings';

process.on('uncaughtException', async (exc: Error) => {
    if(settings.tests.run) {
        await new Promise<void>((resolve): void => {
            query('DROP DATABASE ' + settings.tests.database + ';', [], () => {
                resolve();
            });
        });
    }
    connection.end((err?: MysqlError): void => {
        if(err) {
            console.log('Error attempting database connection end because of other exception!');
        }
        console.log('Succesfully ended database connection because of other exception');
    });
    console.log(exc);
});

const connection: Connection = mysql.createConnection(settings.mysqlConnection);

connection.connect((err: MysqlError): void => {
    if(err) {
        console.log('Error connecting to database!');
        throw err;
    }
    console.log('Successfully connected to database');
});

export function query(query: string, values: (string | number | boolean | null)[], callback: queryCallback): void {
    connection.query(query, values, callback);
}

function logError(err: MysqlError | null, results?: any): void {
    if(err) console.log(err);
}

//// api ////

// user //

export function insertTempUser(request: RegisterRequest, verificationCode: number, callback: queryCallback): void {
    query('INSERT INTO temp_users VALUES (?, ?, ?, ?, ?);',
        [request.username, request.email, request.passwordHash, verificationCode, getTimestamp()], callback);
}

export function selectTempUser(username: string, callback: queryCallback): void {
    query('SELECT * FROM temp_users WHERE (username=?);', [username], callback);
}

export function deleteTempUser(username: string, callback: queryCallback): void {
    query('DELETE FROM temp_users WHERE (username=?);', [username], callback);
}

export function createUser(username: string, email: string, passwordHash: string, token: string, callback: (err: MysqlError | null, id: number | null) => void): void {
    query('SELECT next_id FROM ids WHERE table_name="users";', [], (err: MysqlError | null, results: any): void => {
        if(err) {
            callback(err, null);
            return;
        }
        const id = results[0].next_id;
        const timestamp: number = getTimestamp();
        query('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
            [id, username, email, passwordHash, token, timestamp + twoWeeksTimestamp, twoWeeksTimestamp, null, '{}', false, timestamp, 'New User!', '{"compactMode":false, "condensedFont":false, "aurebeshFont":false, "sharpMode":false}', 'svg'],
            (err: MysqlError | null): void => {
                if(err) {
                    callback(err, null);
                    return;
                }
                callback(null, id);
                query('UPDATE ids SET next_id=? WHERE table_name="users"', [id + 1], (err: MysqlError | null): void => {if(err) console.log(err);});
            });
    });
}

export function selectUser(id: number, callback: queryCallback): void {
    query('SELECT * FROM users WHERE (id=?);', [id], callback);
}

export function selectUserFromUsername(username: string, callback: queryCallback): void {
    query('SELECT id, email, password_hash, token, token_expiration, token_duration, tfa_key, settings FROM users WHERE (username=?);', [username], callback);
}

export function selectUserToken(id: number, callback: queryCallback): void {
    query('SELECT token, token_expiration FROM users WHERE (id=?)', [id], callback);
}

export function selectFromUsername(username: string, callback: queryCallback): void {
    query('(SELECT username FROM users WHERE (username=?)) UNION (SELECT username FROM temp_users WHERE (username=?));',
        [username, username], callback);
}

export function selectFromUsernameOrEmail(username: string, email: string, callback: queryCallback): void {
    query('(SELECT username FROM users WHERE (username=?) OR (email=?)) UNION (SELECT username FROM temp_users WHERE (username=?) OR (email=?));',
        [username, email, username, email], callback);
}

export function selectFromEmail(email: string, callback: queryCallback): void {
    query('(SELECT username FROM users WHERE (email=?)) UNION (SELECT username FROM temp_users WHERE (email=?));',
        [email, email], callback);
}

export function updateUserToken(id: number, token: string, tokenDuration: number): void {
    query('UPDATE users SET token=?, token_expiration=? WHERE id=?;', [token, getTimestamp() + tokenDuration, id], logError);
}

export function updateUserPfpType(id: number, pfpType: string): void {
    query('UPDATE users SET pfp_type=? WHERE id=?;', [pfpType, id], logError);
}

export function updateUser(id: number, username: string, email: string, passwordHash: string, tokenDuration: number, tfaKey: string | null, status: string, settings: {}): void {
    query('UPDATE users SET username=?, email=?, password_hash=?, token_duration=?, tfa_key=?, status=?, settings=? WHERE id=?;',
        [username, email, passwordHash, tokenDuration, tfaKey, status, JSON.stringify(settings), id], logError);
}

export function updateUserOnline(id: number, online: boolean, lastOnline: number): void {
    if(online)
        query('UPDATE users SET online=true WHERE id=?;', [id], logError);
    else
        query('UPDATE users SET online=false, last_online=? WHERE id=?;', [lastOnline, id], logError);
}

// chat //

export function createChat(userId: number, name: string, description: string, token: string, callback: (err: MysqlError | null, id: number | null) => void) {
    query('SELECT next_id FROM ids WHERE table_name="chats";', [], (err: MysqlError | null, results: any): void => {
        if(err) {
            callback(err, null);
            return;
        }
        const id = results[0].next_id;
        query('INSERT INTO chats VALUES (?, ?, ?, ?, ?, ?, ?);',
            [id, name, '{"' + userId + '": {"permissionLevel": 0}}', description, token, null, 'svg'],
            (err: MysqlError | null): void => {
                if(err) {
                    callback(err, null);
                    return;
                }
                callback(null, id);
                query('UPDATE users SET chats=JSON_SET(chats, \'$."?"\', ?) WHERE id=?;',
                    [id, '{"lastReadMessageId":-1}', userId], logError);
                query('CREATE TABLE chat' + id + ' (' +
                    'id INT NOT NULL,' +
                    'timestamp INT NOT NULL,' +
                    'user_id INT NOT NULL,' +
                    'message BLOB NOT NULL,' +
                    'modified BOOLEAN NOT NULL,' +
                    'PRIMARY KEY (id),' +
                    'FOREIGN KEY (user_id) REFERENCES users(id)' +
                ');', [], logError);
                query('INSERT INTO ids VALUES (?, ?)', ['chat' + id, 0], logError);
                query('UPDATE ids SET next_id=? WHERE table_name="chats";', [id + 1], logError);
            });
    });
}

export function addUserToChat(id: number, userId: number, callback: (err: MysqlError | null, permissionLevel: number) => void): void {
    query('SELECT default_permission_level FROM chats WHERE id=?;', [id], (err: MysqlError | null, results?: any): void => {
        logError(err);
        if(!err)
            query('UPDATE chats SET users=JSON_SET(users, \'$."?"\', JSON_SET("{}", \'$."permissionLevel"\', ?)) WHERE id=?;',
                [userId, results[0].default_permission_level, id], (err: MysqlError | null): void => {
                callback(err, results[0].default_permission_level)
            });
    });
    query('UPDATE users SET chats=JSON_SET(chats, \'$."?"\', JSON_SET("{}", \'$."lastReadMessageId"\', -1)) WHERE id=?;', [id, userId], logError);
}

export function selectChat(id: number, callback: queryCallback): void {
    query('SELECT * FROM chats WHERE id=?;', [id], callback);
}

export function selectMessage(id: number, messageId: number, callback: queryCallback): void {
    query('SELECT * FROM chat' + id + ' WHERE id=?;', [messageId], callback);
}

export function selectLastMessages(id: number, numberOfMessages: number, callback: queryCallback): void {
    query('SELECT * FROM (SELECT * FROM chat' + id + ' ORDER BY id DESC LIMIT ?) AS temp ORDER BY id ASC;', [numberOfMessages], callback);
}

export function insertMessage(id: number, userId: number, message: string, callback: (err: MysqlError | null, id?: number) => void): void {
    query('SELECT next_id FROM ids WHERE table_name="chat?";', [id], (err: MysqlError | null, results: any): void => {
        if(err) {
            callback(err);
            return;
        }
        const messageId = results[0].next_id;
        query('INSERT INTO chat? VALUES (?, ?, ?, ?, ?);', [id, messageId, getTimestamp(), userId, message, false],
            (err: MysqlError | null, results: any): void => {
                if(err) {
                    callback(err);
                    return;
                }
                callback(null, messageId);
                query('UPDATE ids SET next_id=? WHERE table_name="chat?";', [messageId + 1, id], logError);
            });
    });
}

export function updateChatLogoType(id: number, chatLogoType: string): void {
    query('UPDATE chats SET chat_logo_type=? WHERE id=?;', [chatLogoType, id], logError);
}

export function updateChatSettings(id: number, name: string, description: string,
    token: string, tokenExpiration: number, defaultPermissionLevel: number): void {
    query('UPDATE chats SET name=?, description=?, token=?, token_expiration=?, default_permission_level=? WHERE id=?;',
        [name, description, token, tokenExpiration, defaultPermissionLevel, id], logError);
}

export function removeUserFromChat(id: number, userId: number): void {
    query('UPDATE chats SET users=JSON_REMOVE(users, \'$."?"\') WHERE id=?', [userId, id], logError);
    query('UPDATE users SET chats=JSON_REMOVE(chats, \'$."?"\') WHERE id=?', [id, userId], logError);
}

export function updateChatUser(id: number, userId: number, permissionLevel: number) {
    query('UPDATE chats SET users=JSON_SET(users, \'$."?"."permissionLevel"\', ?) WHERE id=?;', [userId, permissionLevel, id], logError);
}