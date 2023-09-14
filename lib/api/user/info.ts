import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { UserInfoRequest, isUserInfoRequestValid } from '../../types/api/user';
import { validateTokenAndProceed } from './authentication';
import { selectUser } from '../../database';

export function userInfo(req: Request, res: Response): void {
    const request: UserInfoRequest = req.body;
    if(!isUserInfoRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        selectUser(request.userId, (err: MysqlError | null, results: any): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                return;
            }
            const selected = results[0];
            res.status(200).send({
                username: selected.username,
                online: user.online,
                status: selected.status,
                pfpType: selected.pfp_type
            });
        });
    });
}