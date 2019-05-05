import { IVehicleLocation, IVehicleLocationList } from "@donmahallem/trapeze-api-types";
import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { TrapezeApiClient } from "./trapeze-api-client";
import { LoadStatus, VehicleStorage } from "./vehicle-storage";

describe("vehicle-storage.ts", () => {
    describe("VehicleStorage", () => {
        let instance: VehicleStorage;
        let sandbox: sinon.SinonSandbox;
        let getVehicleLocationsStub: sinon.SinonStub;
        let client: TrapezeApiClient;
        let clock: sinon.SinonFakeTimers;
        before("create Sandbox", () => {
            sandbox = sinon.createSandbox();
            getVehicleLocationsStub = sandbox.stub();
            clock = sandbox.useFakeTimers({
                now: 20,
                shouldAdvanceTime: false,
            });
        });
        beforeEach(() => {
            client = {
                getVehicleLocations: getVehicleLocationsStub,
            } as any;
            instance = new VehicleStorage(client);
        });

        afterEach("clear history", () => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
            clock.restore();
        });
        describe("convertResponse(result)", () => {
            const testData: IVehicleLocationList = {
                lastUpdate: 235236,
                vehicles: [
                    undefined,
                    // tslint:disable-next-line:no-null-keyword
                    null,
                    {
                        isDeleted: true,
                    },
                    {
                        id: "testId1",
                        tripId: "tripId1",
                    } as any,
                    {
                        id: "testId2",
                        tripId: "tripId2",
                    } as any,
                    {
                        id: "testId3",
                        tripId: "tripId3",
                    } as any,
                ],
            };
            const validItems: IVehicleLocation[] = testData.vehicles
                .filter((value: any) => (value ? true : false) && value.id ? true : false) as any;
            const vehicleIds: string[] = validItems.map((value) => value.id);
            const tripIds: string[] = validItems.map((value: any) => value.tripId);
            it("should parse the items correctly", () => {
                const result: LoadStatus = instance.convertResponse(testData);
                expect(result.timestamp).to.equal(clock.now, "timestamp should equal");
                expect(result.lastUpdate).to.equal(testData.lastUpdate, "last update should be taken");
                expect(Array.from(result.storage.keys())).to.deep.equal(vehicleIds);
                expect(Array.from(result.tripStorage.keys())).to.deep.equal(tripIds);
                for (const item of validItems) {
                    expect(result.storage.get(item.id)).to.deep.equal(item);
                }
                for (const item of validItems) {
                    expect(result.tripStorage.get(item.tripId)).to.deep.equal(item);
                }
            });
        });
    });
});
