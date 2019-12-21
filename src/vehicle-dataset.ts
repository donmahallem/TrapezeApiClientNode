import {
    IVehicleLocationList,
    IVehicleLocation
} from "@donmahallem/trapeze-api-types";
type DatabaseEntry = IVehicleLocation & {
    lastUpdate: number;
}
export class VehicleDataset {
    private mDataset: DatabaseEntry[] = [];
    private mDataTTL: number;
    /**
     * 
     * @param ttl in miliseconds
     */
    public constructor(ttl: number = 300000) {
        this.dataTTL = ttl;
    }
    public get dataTTL(): number {
        return this.dataTTL;
    }
    public set dataTTL(ttl: number) {
        if (ttl < 0) {
            throw new Error("ttl must be >=0");
        }
        this.dataTTL = ttl;
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
            .map((value: IVehicleLocation): DatabaseEntry => {
                return Object.assign(value, {
                    lastUpdate: vehicleResponse.lastUpdate
                });
            });

    }
    public add(vehicleResponse: IVehicleLocationList): void {
        const converted: DatabaseEntry[] = this.convertToDatabaseEntries(vehicleResponse);
        let inserted: boolean = false;
        for (let fromIdx: number = 0; fromIdx < converted.length; fromIdx++) {
            inserted = false;
            for (let toIdx: number = 0; toIdx < this.mDataset.length; toIdx++) {
                if (converted[fromIdx].id === this.mDataset[toIdx].id) {
                    this.mDataset[toIdx] = converted[fromIdx];
                    inserted = true;
                    break;
                }
            }
            if (!inserted)
                this.mDataset.push(converted[fromIdx]);
        }
        this.purgeOldEntries();
    }
    public isExpired(entry: DatabaseEntry): boolean {
        return entry.lastUpdate < Date.now() - this.mDataTTL;
    }

    public getVehicleById(id: string, useTTL: boolean = true): DatabaseEntry | undefined {
        const idx: number = this.mDataset.findIndex((value: DatabaseEntry) => {
            return value.id === id;
        });
        return idx >= 0 ? this.mDataset[idx] : undefined;
    }
    public getVehicleByTripId(tripId: string, useTTL: boolean = true): DatabaseEntry | undefined {
        const idx: number = this.mDataset.findIndex((value: DatabaseEntry) => {
            return value.tripId === tripId;
        });
        return idx >= 0 ? this.mDataset[idx] : undefined;
    }
    public purgeOldEntries(): void {
        this.mDataset = this.mDataset.filter((value: DatabaseEntry): boolean => {
            return !this.isExpired(value);
        });
    }

}