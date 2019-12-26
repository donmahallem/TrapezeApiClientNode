/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import {
    IVehicleLocation,
    IVehicleLocationList,
} from "@donmahallem/trapeze-api-types";
import { LockHandler } from "./lock-handler";
import { NotFoundError } from "./not-found-error";
import { TrapezeApiClient, PositionType } from "./trapeze-api-client";
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
                    timestamp: Date.now()
                };
            })
            .catch((err: any): IErrorStatus => {
                const errorStatus: IErrorStatus = {
                    error: err,
                    status: Status.ERROR,
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
                const vehicle: DatabaseEntry = this.mVehicleDatabase.getVehicleByTripId(id);
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
    public getVehicle(id: string): Promise<IVehicleLocationResponse> {
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocationResponse => {
                if (status.storage.has(id)) {
                    return {
                        lastUpdate: status.lastUpdate,
                        vehicle: status.storage.get(id) as IVehicleLocation,
                    };
                }
                throw new NotFoundError("Vehicle not found");
            });
    }

    /**
     * @since 2.0.0
     * @param left
     * @param right
     * @param top
     * @param bottom
     */
    public getVehicles(left: number, right: number, top: number, bottom: number): Promise<IVehicleLocationList> {
        if (left >= right) {
            return Promise.reject(new Error("left must be smaller than right"));
        }
        if (top <= bottom) {
            return Promise.reject(new Error("top must be greater than bottom"));
        }
        return this.fetchSuccessOrThrow()
            .then((status: ISuccessStatus): IVehicleLocationList => {
                const vehicleList: IVehicleLocationList = {
                    lastUpdate: status.lastUpdate,
                    vehicles: new Array(),
                };
                for (const key of Array.from(status.storage.keys())) {
                    const vehicle: IVehicleLocation = status.storage.get(key) as IVehicleLocation;
                    if (vehicle.longitude < left || vehicle.longitude > right) {
                        continue;
                    } else if (vehicle.latitude > top || vehicle.latitude < bottom) {
                        continue;
                    } else {
                        vehicleList.vehicles.push(vehicle);
                    }
                }
                return vehicleList;
            });
    }

}
