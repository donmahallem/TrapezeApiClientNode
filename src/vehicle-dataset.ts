/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import {
    IVehicleLocation,
    IVehicleLocationList,
} from "@donmahallem/trapeze-api-types";
import * as Loki from "lokijs";
type DatabaseEntry = IVehicleLocation & {
    lastUpdate: number;
};
export class VehicleDataset {
    private mLokiDb: Loki;
    private mVehicleCollection: Loki.Collection<DatabaseEntry>;
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
    public convertToDatabaseEntries(vehicleResponse: IVehicleLocationList): DatabaseEntry[] {
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
            .map((value: IVehicleLocation): DatabaseEntry =>
                Object.assign(value, {
                    lastUpdate: vehicleResponse.lastUpdate,
                }));

    }
    public addLocationResponse(vehicleResponse: IVehicleLocationList): void {
        const converted: DatabaseEntry[] = this.convertToDatabaseEntries(vehicleResponse);
        this.mVehicleCollection
            .insert(converted);
    }
    public getVehicleById(id: string): DatabaseEntry | undefined {
        return this.removeLoki(this.mVehicleCollection.by("id", id));
    }
    public getVehicleByTripId(tripId: string): DatabaseEntry | undefined {
        return this.removeLoki(this.mVehicleCollection.findOneUnindexed("tripId", tripId));
    }
    public getUpdatesSince(update: number): DatabaseEntry[] {
        return this.mVehicleCollection
            .find({ lastUpdate: { $gte: update } })
            .map(this.removeLoki);
    }
    public getVehiclesInBox(left: number,
                            right: number,
                            top: number,
                            bottom: number,
                            updatedSince: number = 0): DatabaseEntry[] {
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
