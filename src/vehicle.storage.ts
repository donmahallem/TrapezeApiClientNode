import { TrapezeApiClient } from "./trapeze-api-client";
import { IVehicleLocationList, IVehicleLocation, VehicleLocations, IDeletedVehicleLocation } from "@donmahallem/trapeze-api-types";

export class VehicleStorage {

    private isRequesting: boolean = false;
    private lastUpdate: number = -1;
    private storage: Map<string, IVehicleLocation> = new Map();
    private tripStorage: Map<string, IVehicleLocation> = new Map();
    constructor(private trapezeClient: TrapezeApiClient, private updateDelay: number = 10000) {

    }

    public fetch(): Promise<boolean> {
        if (this.isRequesting) {
            return Promise.resolve(false);
        }
        if (this.lastUpdate + this.updateDelay > Date.now()) {
            return Promise.resolve(false);
        }
        this.isRequesting = true;
        return this.trapezeClient.getVehicleLocations()
            .then((result: IVehicleLocationList): Promise<boolean> => {
                this.tripStorage.clear();
                this.storage.clear();
                for (const entry of result.vehicles) {
                    if (entry === null) {
                        continue;
                    }
                    if (entry['isDeleted'] === true) {
                        continue;
                    }
                    const vehicleLocation: IVehicleLocation = <IVehicleLocation>entry;
                    this.storage.set(vehicleLocation.id, vehicleLocation);
                    this.tripStorage.set(vehicleLocation.tripId, vehicleLocation);
                }
                this.lastUpdate = Date.now();
                this.isRequesting = false;
                return Promise.resolve(true);
            }, (err: any) => {
                this.isRequesting = false;
                throw err;
            });
    }

    public potentialUpdate(): Promise<boolean> {
        if (this.lastUpdate + this.updateDelay > Date.now()) {
            return Promise.resolve(true);
        }
        return this.trapezeClient.getVehicleLocations()
            .then((result: IVehicleLocationList) => {
                this.tripStorage.clear();
                this.storage.clear();
                for (const entry of result.vehicles) {
                    if (entry === null) {
                        continue;
                    }
                    if (entry['isDeleted'] === true) {
                        continue;
                    }
                    const vehicleLocation: IVehicleLocation = <IVehicleLocation>entry;
                    this.storage.set(vehicleLocation.id, vehicleLocation);
                    this.tripStorage.set(vehicleLocation.tripId, vehicleLocation);
                }
                this.lastUpdate = Date.now();
                return Promise.resolve(true);
            });
    }
    public getVehicleByTripId(id: string): Promise<IVehicleLocation> {
        return this.potentialUpdate()
            .then((success: boolean) => {
                if (this.tripStorage.has(id)) {
                    return Promise.resolve(this.tripStorage.get(id));
                } else {
                    return Promise.reject(null);
                }
            });
    }
    public getVehicle(id: string): Promise<IVehicleLocation> {
        return this.potentialUpdate()
            .then((success: boolean) => {
                if (this.storage.has(id)) {
                    return Promise.resolve(this.storage.get(id));
                } else {
                    return Promise.reject(null);
                }
            });
    }

    public getVehicles(left: number, right: number, top: number, bottom: number): Promise<IVehicleLocation[]> {
        return this.potentialUpdate()
            .then((value) => {
                const vehicleList: IVehicleLocation[] = new Array();
                for (const key of Array.from(this.storage.keys())) {
                    const vehicle: IVehicleLocation = this.storage.get(key);
                    if (vehicle.longitude < left || vehicle.longitude > right) {
                        continue;
                    } else if (vehicle.latitude > top || vehicle.latitude < bottom) {
                        continue;
                    } else {
                        vehicleList.push(vehicle);
                    }
                }
                return vehicleList;
            });
    }

}
