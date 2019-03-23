import {
    IDeletedVehicleLocation,
    IVehicleLocation,
    IVehicleLocationList,
    VehicleLocations,
} from "@donmahallem/trapeze-api-types";
import { LockHandler } from "./lock-handler";
import { TrapezeApiClient } from "./trapeze-api-client";

export enum Status {
    SUCCESS = 1,
    ERROR = 2,
}

export interface IBaseStatus {
    status: Status;
}

export interface IErrorStatus {
    status: Status.ERROR;
    error: any;
}

export interface ISuccessStatus {
    status: Status.SUCCESS;
    storage: Map<string, IVehicleLocation>;
    tripStorage: Map<string, IVehicleLocation>;
}

export type LoadStatus = ISuccessStatus | IErrorStatus;

export class VehicleStorage {

    private lastUpdate: number = -1;
    private lock: LockHandler = new LockHandler(false);
    private currentStatus: LoadStatus;
    constructor(private trapezeClient: TrapezeApiClient, private updateDelay: number = 10000) {

    }

    public fetch(): Promise<LoadStatus> {
        if (this.lastUpdate + this.updateDelay > Date.now()) {
            return Promise.resolve(this.currentStatus);
        }
        if (this.lock.locked) {
            return this.lock.promise().then(() => this.currentStatus);
        }
        this.lock.locked = true;
        return this.trapezeClient.getVehicleLocations()
            .then((result: IVehicleLocationList): ISuccessStatus => {
                const loadStatus: ISuccessStatus = {
                    status: Status.SUCCESS,
                    storage: new Map(),
                    tripStorage: new Map(),
                };
                for (const entry of result.vehicles) {
                    if (entry === null) {
                        continue;
                    }
                    if (entry.isDeleted === true) {
                        continue;
                    }
                    const vehicleLocation: IVehicleLocation = entry as IVehicleLocation;
                    loadStatus.storage.set(vehicleLocation.id, vehicleLocation);
                    loadStatus.tripStorage.set(vehicleLocation.tripId, vehicleLocation);
                }
                this.lastUpdate = Date.now();
                this.currentStatus = loadStatus;
                this.lock.locked = false;
                return loadStatus;
            }, (err: any): IErrorStatus => {
                const errorStatus: IErrorStatus = {
                    error: err,
                    status: Status.ERROR,
                };
                this.currentStatus = errorStatus;
                this.lock.locked = false;
                return errorStatus;
            });
    }

    public getVehicleByTripId(id: string): Promise<IVehicleLocation> {
        return this.fetch()
            .then((status: LoadStatus) => {
                if (status.status === Status.SUCCESS) {
                    if (status.tripStorage.has(id)) {
                        return Promise.resolve(status.tripStorage.get(id));
                    } else {
                        return Promise.reject(null);
                    }
                } else {
                    throw status.error;
                }
            });
    }
    public getVehicle(id: string): Promise<IVehicleLocation> {
        return this.fetch()
            .then((status: LoadStatus) => {
                if (status.status === Status.SUCCESS) {
                    if (status.storage.has(id)) {
                        return status.storage.get(id);
                    }
                    throw new Error("not found");
                }
                throw status.error;
            });
    }

    public getVehicles(left: number, right: number, top: number, bottom: number): Promise<IVehicleLocation[]> {
        return this.fetch()
            .then((status: LoadStatus) => {
                if (status.status === Status.SUCCESS) {
                    const vehicleList: IVehicleLocation[] = new Array();
                    for (const key of Array.from(status.storage.keys())) {
                        const vehicle: IVehicleLocation = status.storage.get(key);
                        if (vehicle.longitude < left || vehicle.longitude > right) {
                            continue;
                        } else if (vehicle.latitude > top || vehicle.latitude < bottom) {
                            continue;
                        } else {
                            vehicleList.push(vehicle);
                        }
                    }
                    return vehicleList;
                }
                throw status.error;
            });
    }

}
