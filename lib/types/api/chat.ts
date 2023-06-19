// create

export type CreateRequest = {
    token: string,
    id: number,
    name: string,
    description: string
};

export function isCreateRequestValid(req: CreateRequest) {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.name != undefined && typeof req.name == 'string'
        && req.name.length > 2 && req.name.length <= 64
        && req.description != undefined && typeof req.description == 'string'
        && req.description.length > 2 && req.description.length <= 128;
}