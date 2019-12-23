/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { VehicleDataset } from "./vehicle-dataset";
import * as Loki from "lokijs";

describe("vehicle-dataset.ts", () => {
    describe("VehicleDataset", () => {
        let instance: VehicleDataset;
        let sandbox: sinon.SinonSandbox;
        let clock: sinon.SinonFakeTimers;
        const clockNowTimestamp: number = 123456;
        let internalDb: Loki.Collection;
        const testVehicles: any[] = [1, 2, 3, 4]
            .reduce((acc: Array<[number, number]>, x) => acc.concat([[x, 1], [x, 2], [x, 3], [x, 4]]), [])
            .map((value: [number, number], index: number) =>
                ({
                    id: "" + value[0] + value[1],
                    lastUpdate: clockNowTimestamp + index,
                    latitude: value[0],
                    longitude: value[1],
                    tripId: "" + value[0] + value[1],
                }));
        before("create Sandbox", () => {
            sandbox = sinon.createSandbox();
            clock = sandbox.useFakeTimers({
                now: clockNowTimestamp,
                shouldAdvanceTime: false,
            });
        });
        beforeEach(() => {
            instance = new VehicleDataset();
            internalDb = (instance as any).mLokiDb;
            testVehicles.forEach((value) => {
                (instance as any).mVehicleCollection.insert(value);
            });
        });

        afterEach("clear history", (done) => {
            sandbox.resetHistory();
            internalDb.removeCollection("vehicle");
            internalDb.deleteDatabase(done);

        });
        after(() => {
            sandbox.restore();
            clock.restore();
        });
        describe("getVehiclesInBox(left, right, top, bottom, updatedSince)", () => {
            describe("invalid parameter are provided", () => {
                it("should reject if left is not smaller than right", () => {
                    expect(instance.getVehiclesInBox.bind(1, 1, 1, 2)).to.throw("left must be smaller than right");
                });
                it("should reject if bottom is not smaller than top", () => {
                    expect(instance.getVehiclesInBox.bind(1, 2, 2, 2)).to.throw("left must be smaller than right");
                });
            });
            describe("vehicles bounds are provided", () => {
                it("should return no vehicle as no vehicle is inside bounds", () => {
                    expect(instance.getVehiclesInBox(20, 22, 2, 1)).to.deep.eq([]);
                });
                it("should return few vehicles and non are expired", () => {
                    const result = instance.getVehiclesInBox(1, 2, 2, 1);
                    expect(result).to.deep.equal([
                        {
                            id: "11",
                            lastUpdate: 123456,
                            latitude: 1,
                            longitude: 1,
                            tripId: "11",
                        },
                        {
                            id: "12",
                            lastUpdate: 123457,
                            latitude: 1,
                            longitude: 2,
                            tripId: "12",
                        },
                        {
                            id: "21",
                            lastUpdate: 123460,
                            latitude: 2,
                            longitude: 1,
                            tripId: "21",
                        },
                        {
                            id: "22",
                            lastUpdate: 123461,
                            latitude: 2,
                            longitude: 2,
                            tripId: "22",
                        },
                    ]);

                });
                it("should return all non expired", () => {
                    const result = instance.getVehiclesInBox(1, 2, 2, 1, 123460);
                    expect(result).to.deep.equal([
                        {
                            id: "21",
                            lastUpdate: 123460,
                            latitude: 2,
                            longitude: 1,
                            tripId: "21",
                        },
                        {
                            id: "22",
                            lastUpdate: 123461,
                            latitude: 2,
                            longitude: 2,
                            tripId: "22",
                        },
                    ]);

                });
            });
        });
        describe("getVehicleById(id)", () => {
            it("should return undefined for an unknown id", () => {
                expect(instance.getVehicleById("-100")).to.be.undefined;
            });
            it("should return undefined for an unknown id", () => {
                const testVehicle: any = testVehicles[5];
                expect(instance.getVehicleById(testVehicle.id)).to.deep.equal(testVehicle);
            });
        });
        describe("getVehicleByTripId(tripId)", () => {
            it("should return undefined for an unknown id", () => {
                expect(instance.getVehicleByTripId("-100")).to.be.undefined;
            });
            it("should return undefined for an unknown id", () => {
                const testVehicle: any = testVehicles[6];
                expect(instance.getVehicleByTripId(testVehicle.tripId)).to.deep.equal(testVehicle);
            });
        });
    });
});
