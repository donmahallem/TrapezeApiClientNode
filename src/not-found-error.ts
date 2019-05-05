
export class NotFoundError extends Error {
    public readonly statusCode: number = 404;
    public constructor(msg: string) {
        super(msg);
    }
}
