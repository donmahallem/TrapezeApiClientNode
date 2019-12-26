/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { IVehicleLocationExtended } from "@donmahallem/trapeze-api-client-types";
import {
    IVehicleLocation,
    IVehicleLocationList,
} from "@donmahallem/trapeze-api-types";
import { LockHandler } from "./lock-handler";
import { NotFoundError } from "./not-found-error";
import { PositionType, TrapezeApiClient } from "./trapeze-api-client";
import { VehicleDataset } from "./vehicle-dataset";

export enum Status {
    SUCCESS = 1,
    ERROR = 2,
}

export interface IBaseStatus {
    status: Status;
    timestamp?: number;
}

export interface IErrorStatus extends IBaseStatus {
    status: Status.ERROR;
    error: any;
}

export interface ISuccessStatus extends IBaseStatus {
    status: Status.SUCCESS;
    lastUpdate: number;
}

export type LoadStatus = ISuccessStatus | IErrorStatus;

export interface IVehicleLocationResponse {
    lastUpdate: number;
    vehicle: IVehicleLocation;
}

export class VehicleStorage {

    private lock: LockHandler = new LockHandler(false);
    private mStatus: LoadStatus;
    private mVehicleDatabase: VehicleDataset = new VehicleDataset();
    constructor(private trapezeClient: TrapezeApiClient, private updateDelay: number = 10000) { }

    public updateRequired(): boolean {
        if (this.status && this.status.timestamp !== undefined) {
            if (!isNaN(this.status.timestamp)) {
                return this.status.timestamp + this.updateDelay < Date.now();
            }
        }
        return true;
    }

    public get status(): LoadStatus {
        return this.mStatus;
    }

    public fetch(accuracy: PositionType = "RAW"): Promise<LoadStatus> {
        if (!this.updateRequired()) {
            return Promise.resolve(this.status);
        }
        if (this.lock.locked) {
            return this.lock.promise().then(() => this.status);
        }
        this.lock.locked = true;
        return this.trapezeClient.getVehicleLocations(accuracy)
            .then((value: IVehicleLocationList): ISuccessStatus => {
                this.mVehicleDatabase.addLocationResponse(value);
                return {
                    lastUpdate: value.lastUpdate,
                    status: Status.SUCCESS,
                    timestamp: Date.now(),
                };
            })
            .catch((err: any): IErrorStatus => {
                const errorStatus: IErrorStatus = {
                    error: err,
                    status: Status.ERROR,
                    timestamp: Date.now(),
                };
                return errorStatus;
            })
            .finally(() => {
                this.lock.locked = false;
            });
    }

    /**
     * Gets the vehicle or rejects with undefined if not known
     */
    public getVehicleByTripId(id: string): Promise<IVehicleLocation> {
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocation => {
                const vehicle: IVehicleLocationExtended | undefined
                    = this.mVehicleDatabase.getVehicleByTripId(id);
                if (vehicle) {
                    return vehicle;
                }
                throw new NotFoundError("Trip not found");
            });
    }
    /**
     * Fetches or throws if an error status is provided
     * @since 2.0.0
     */
    public fetchSuccessOrThrow(): Promise<ISuccessStatus> {
        return this.fetch()
            .then((value: LoadStatus): ISuccessStatus => {
                if (value) {
                    if (value.status === Status.SUCCESS) {
                        return value;
                    }
                    throw value.error;
                }
                throw new Error("No status provided");
            });
    }

    /**
     * Gets the vehicle or rejects with undefined if not known
     */
    public getVehicle(id: string): Promise<IVehicleLocation> {
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocation => {
                const vehicle: IVehicleLocationExtended | undefined
                    = this.mVehicleDatabase.getVehicleById(id);
                if (vehicle) {
                    return vehicle;
                }
                throw new NotFoundError("Vehicle not found");
            });
    }

    /**
     * @since 3.0.0
     * @param left
     * @param right
     * @param top
     * @param bottom
     * @param lastUpdate
     */
    public getVehicles(left: number,
                       right: number,
                       top: number,
                       bottom: number,
                       lastUpdate: number = 0): Promise<IVehicleLocationList> {
        if (left >= right) {
            return Promise.reject(new Error("left must be smaller than right"));
        }
        if (top <= bottom) {
            return Promise.reject(new Error("top must be greater than bottom"));
        }
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocationList => {
                const vehicles: IVehicleLocationExtended[] = this.mVehicleDatabase
                    .getVehiclesInBox(left, right, top, bottom, lastUpdate);
                return {
                    lastUpdate: vehicles
                        .map((value: IVehicleLocationExtended): number => value.lastUpdate)
                        .reduce((prevValue: number, curValue: number) => Math.max(prevValue, curValue)),
                    vehicles,
                };
            });
    }

}
