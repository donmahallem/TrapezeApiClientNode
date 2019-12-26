/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { IVehicleLocationExtended } from "@donmahallem/trapeze-api-client-types";
import {
    IVehicleLocation,
    IVehicleLocationList,
} from "@donmahallem/trapeze-api-types";
import * as Loki from "lokijs";
export class VehicleDataset {
    private mLokiDb: Loki;
    private mVehicleCollection: Loki.Collection<IVehicleLocationExtended>;
    /**
     *
     * @param ttl in miliseconds
     */
    public constructor() {
        this.mLokiDb = new Loki("testloki", {
            adapter: new Loki.LokiMemoryAdapter(),
        });
        this.mVehicleCollection = this.mLokiDb
            .addCollection("vehicle", {
                clone: true,
                indices: ["id", "tripId"],
                ttl: 300000,
                ttlInterval: 60000,
                unique: ["id"],
            });
    }
    public convertToDatabaseEntries(vehicleResponse: IVehicleLocationList): IVehicleLocationExtended[] {
        return vehicleResponse
            .vehicles
            .filter((value: IVehicleLocation): boolean => {
                if (value === null || value === undefined) {
                    return false;
                }
                if (value.isDeleted === true) {
                    return false;
                }
                if (value.latitude === undefined || value.longitude === undefined) {
                    return false;
                }
                return true;
            })
            .map((value: IVehicleLocation): IVehicleLocationExtended =>
                Object.assign(value, {
                    lastUpdate: vehicleResponse.lastUpdate,
                }));

    }
    public addLocationResponse(vehicleResponse: IVehicleLocationList): void {
        const converted: IVehicleLocationExtended[] = this.convertToDatabaseEntries(vehicleResponse);
        converted.forEach((val: IVehicleLocationExtended) => {
            const res: any = this.mVehicleCollection.by("id", val.id);
            if (res) {
                this.mVehicleCollection.update(Object.assign(res, val));
            } else {
                this.mVehicleCollection.insert(val);
            }
        });
    }
    public getVehicleById(id: string): IVehicleLocationExtended | undefined {
        return this.removeLoki(this.mVehicleCollection.by("id", id));
    }
    public getVehicleByTripId(tripId: string): IVehicleLocationExtended | undefined {
        return this.removeLoki(this.mVehicleCollection.findOneUnindexed("tripId", tripId));
    }
    public getUpdatesSince(update: number): IVehicleLocationExtended[] {
        return this.mVehicleCollection
            .find({ lastUpdate: { $gte: update } })
            .map(this.removeLoki);
    }
    public getVehiclesInBox(left: number,
                            right: number,
                            top: number,
                            bottom: number,
                            updatedSince: number = 0): IVehicleLocationExtended[] {
        if (left >= right) {
            throw new Error("left must be smaller than right");
        }
        if (top <= bottom) {
            throw new Error("top must be greater than bottom");
        }
        return this.mVehicleCollection
            .find({
                lastUpdate: { $gte: updatedSince },
                latitude: { $between: [bottom, top] },
                longitude: { $between: [left, right] },
            })
            .map(this.removeLoki);
    }
    private removeLoki<T>(value: T): any {
        if (value) {
            const newObj: any = Object.assign({}, value);
            delete newObj.$loki;
            delete newObj.meta;
            return newObj;
        }
        return undefined;
    }

}
