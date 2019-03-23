export type LockListener = () => void;

export class LockHandler {
    private lockListeners: LockListener[] = [];

    public constructor(private mLocked: boolean = false) {

    }

    public addListener(lockListener: LockListener): void {
        if (this.mLocked === false) {
            lockListener();
            return;
        }
        this.lockListeners.push(lockListener);
    }

    public set locked(l: boolean) {
        if (l !== true) {
            this.releaseLocks();
        }
        this.mLocked = l === true;
    }

    public get locked(): boolean {
        return this.mLocked;
    }

    public releaseLocks(): void {
        for (const l of this.lockListeners) {
            l();
        }
        this.lockListeners = [];
    }

    public promise(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.addListener(resolve);
        });
    }
}
