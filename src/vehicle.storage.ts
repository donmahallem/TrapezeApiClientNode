import { getVehicleLocations } from "./api";
export interface VehicleLocation {
    category: string;
    id: string;
    latitude: number;
    longitude: number;
    name: string;
    shortName: string;
}

export class VehicleStorage {

    private lastUpdate: number = -1;
    private storage: Map<string, VehicleLocation> = new Map();
    private tripStorage: Map<string, VehicleLocation> = new Map();
    constructor(private updateDelay: number = 10000) {

    }

    public potentialUpdate(): Promise<boolean> {
        if (this.lastUpdate + this.updateDelay > Date.now()) {
            return Promise.resolve(true);
        }
        return getVehicleLocations()
            .then(result => {
                this.tripStorage.clear();
                this.storage.clear();
                for (let entry of result.vehicles) {
                    if (entry == null) {
                        continue;
                    }
                    if (entry.isDeleted == true) {
                        continue
                    }
                    this.storage.set(entry.id, entry);
                    this.tripStorage.set(entry.tripId, entry);
                }
                this.lastUpdate = Date.now();
                return Promise.resolve(true);
            });
    }
    public getVehicleByTripId(id: string): Promise<VehicleLocation> {
        return this.potentialUpdate()
            .then((success: boolean) => {
                if (this.tripStorage.has(id)) {
                    return Promise.resolve(this.tripStorage.get(id));
                } else {
                    return Promise.reject(null)
                }
            });
    }
    public getVehicle(id: string): Promise<VehicleLocation> {
        return this.potentialUpdate()
            .then((success: boolean) => {
                if (this.storage.has(id)) {
                    return Promise.resolve(this.storage.get(id));
                } else {
                    return Promise.reject(null)
                }
            });
    }

    public getVehicles(left: number, right: number, top: number, bottom: number): Promise<VehicleLocation[]> {
        return this.potentialUpdate()
            .then((value) => {
                const vehicleList: VehicleLocation[] = new Array();
                for (let key of Array.from(this.storage.keys())) {
                    let vehicle: VehicleLocation = this.storage.get(key);
                    //console.log("test", key, vehicle.longitude, left, right)
                    if (vehicle.longitude < left || vehicle.longitude > right) {
                        //console.log("longitude out")
                        continue;
                    } else if (vehicle.latitude > top || vehicle.latitude < bottom) {
                        //console.log("latitude out", top, vehicle.latitude, bottom);
                        //console.log("test lat", key, vehicle.latitude, vehicle.latitude < top, vehicle.latitude > bottom)
                        continue;
                    } else {
                        //console.log("inside");
                        vehicleList.push(vehicle);
                    }
                }
                return vehicleList;
            });
    }

}