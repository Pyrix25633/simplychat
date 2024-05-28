import { Response } from "express";

export function handleException(e: any, res: Response) {
    if(e instanceof HttpResponse)
        e.send(res);
    else {
        console.error('Unexpected Internal Server Error: ', e);
        new InternalServerError().send(res);
    }
}

export type Json = {
    [index: string]: any
};

abstract class HttpResponse {
    public abstract send(res: Response): void;
}

abstract class JsonResponse extends HttpResponse {
    protected readonly body: Json;

    public constructor(body: Json) {
        super();
        this.body = body;
    }
}

export class Ok extends JsonResponse {
    public send(res: Response): void {
        res.status(200).send(this.body);
    }
}

export class Created extends JsonResponse {
    public send(res: Response): void {
        res.status(201).send(this.body);
    }
}

export class NoContent extends HttpResponse {
    public send(res: Response): void {
        res.sendStatus(204);
    }
}

export class BadRequest extends HttpResponse {
    public send(res: Response): void {
        res.sendStatus(400);
    }
}

export class Unauthorized extends HttpResponse {
    public send(res: Response): void {
        res.sendStatus(401);
    }
}

export class Forbidden extends HttpResponse {
    public send(res: Response): void {
        res.sendStatus(403);
    }
}

export class NotFound extends HttpResponse {
    public send(res: Response): void {
        res.sendStatus(404);
    }
}

export class MethodNotAllowed extends HttpResponse {
    public send(res: Response): void {
        res.sendStatus(405);
    }
}

export class UnprocessableContent extends HttpResponse {
    public send(res: Response): void {
        res.sendStatus(422);
    }
}

export class InternalServerError extends HttpResponse {
    public send(res: Response): void {
        console.log(res);
        res.sendStatus(500);
    }
}