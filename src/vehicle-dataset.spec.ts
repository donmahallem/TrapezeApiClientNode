/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { IVehicleLocationList } from "@donmahallem/trapeze-api-types";
import { expect } from "chai";
import * as Loki from "lokijs";
import "mocha";
import * as sinon from "sinon";
import { VehicleDataset } from "./vehicle-dataset";

describe("vehicle-dataset.ts", () => {
    describe("VehicleDataset", () => {
        let instance: VehicleDataset;
        let sandbox: sinon.SinonSandbox;
        let clock: sinon.SinonFakeTimers;
        const clockNowTimestamp: number = 123456;
        let internalDb: Loki;
        let internalVehicleCollection: Loki.Collection;
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
            internalVehicleCollection = (instance as any).mVehicleCollection;
            testVehicles.forEach((value) => {
                internalVehicleCollection.insert(value);
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
        describe("convertToDatabaseEntries(result)", () => {
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
                        latitude: 1,
                        tripId: "tripId1",
                    } as any,
                    {
                        id: "testId2",
                        longitude: 2,
                        tripId: "tripId2",
                    } as any,
                    {
                        id: "testId3",
                        latitude: 3,
                        longitude: 4,
                        tripId: "tripId3",
                    } as any,
                ],
            };
            it("should parse the items correctly", () => {
                const result: any[] = instance.convertToDatabaseEntries(testData);
                expect(result.length).to.equal(1);
                expect(result.every((value) => value.lastUpdate === 235236)).to.equal(true);
                expect(result).to.deep.equal([{
                    id: "testId3",
                    lastUpdate: 235236,
                    latitude: 3,
                    longitude: 4,
                    tripId: "tripId3",
                }]);
            });
        });
        describe("addLocationResponse(vehicles)", () => {
            let convertStub: sinon.SinonStub;
            let insertStub: sinon.SinonSpy;
            let updateStub: sinon.SinonSpy;
            let byStub: sinon.SinonSpy;
            const testItems: any = [1, 2, 3, 4].map((val) =>
                ({
                    id: val + "" + val,
                }));
            beforeEach(() => {
                convertStub = sandbox.stub(instance, "convertToDatabaseEntries");
                insertStub = sandbox.spy((instance as any).mVehicleCollection, "insert");
                updateStub = sandbox.spy((instance as any).mVehicleCollection, "update");
                byStub = sandbox.spy((instance as any).mVehicleCollection, "by");
            });
            it("should insert and convert all items correctly if previously unknown", () => {
                const convertedItems: any = testItems.map((value) => {
                    const newObj: any = Object.assign({}, value);
                    return Object.assign(newObj, { tripId: "tripId" + value.id, id: "new" + value.id });
                });
                convertStub.returns(convertedItems);
                instance.addLocationResponse(testItems);
                expect(convertStub.callCount).to.equal(1);
                expect(convertStub.getCall(0).args).to.deep.equal([testItems]);
                expect(insertStub.callCount).to.equal(4);
                expect(byStub.callCount).to.equal(4);
                expect(byStub.args).to.deep.equal(convertedItems.map((val) => ["id", val.id]));
                expect(insertStub.args).to.deep.equal(convertedItems.map((val) => [val]));
                expect(updateStub.callCount).to.equal(0);
            });
            it("should upsert duplicate entries", () => {
                const newTestItems: any[] = testItems.map((val) =>
                    Object.assign({ newKey: 55 }, val));
                convertStub.returns(newTestItems);
                instance.addLocationResponse(testItems);
                expect(convertStub.callCount).to.equal(1);
                expect(convertStub.getCall(0).args).to.deep.equal([testItems]);
                expect(byStub.callCount).to.equal(4);
                expect(insertStub.callCount).to.equal(0);
                expect(updateStub.callCount).to.equal(4);
                expect(updateStub.args).to.deep
                    .equal(byStub.returnValues.map((val) => [Object.assign({ newKey: 55 }, val)]));
            });
        });
        describe("getUpdatesSince(update)", () => {
            it("should return only relevant items", () => {
                const resultSet: any[] = instance.getUpdatesSince(123462);
                expect(resultSet).to.deep.equal(testVehicles.slice(6));
            });
            it("should return no items", () => {
                const resultSet: any[] = instance.getUpdatesSince(123492);
                expect(resultSet).to.deep.equal([]);
            });
            it("should return no items", () => {
                const resultSet: any[] = instance.getUpdatesSince(123412);
                expect(resultSet).to.deep.equal(testVehicles);
            });
        });
        describe("getVehiclesInBox(left, right, top, bottom, updatedSince)", () => {
            describe("invalid parameter are provided", () => {
                it("should reject if left is not smaller than right", () => {
                    expect(() => {
                        instance.getVehiclesInBox(1, 1, 2, 1);
                    }).to.throw("left must be smaller than right");
                });
                it("should reject if bottom is not smaller than top", () => {
                    expect(() => {
                        instance.getVehiclesInBox(1, 2, 2, 2);
                    }).to.throw("top must be greater than bottom");
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
                expect(instance.getVehicleById("-100")).to.be.equal(undefined);
            });
            it("should return undefined for an unknown id", () => {
                const testVehicle: any = testVehicles[5];
                expect(instance.getVehicleById(testVehicle.id)).to.deep.equal(testVehicle);
            });
        });
        describe("getVehicleByTripId(tripId)", () => {
            it("should return undefined for an unknown id", () => {
                expect(instance.getVehicleByTripId("-100")).to.be.equal(undefined);
            });
            it("should return undefined for an unknown id", () => {
                const testVehicle: any = testVehicles[6];
                expect(instance.getVehicleByTripId(testVehicle.tripId)).to.deep.equal(testVehicle);
            });
        });
    });
});
