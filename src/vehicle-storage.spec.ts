import { IVehicleLocation, IVehicleLocationList } from "@donmahallem/trapeze-api-types";
import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { NotFoundError } from "./not-found-error";
import { TrapezeApiClient } from "./trapeze-api-client";
import { ISuccessStatus, IVehicleLocationResponse, LoadStatus, Status, VehicleStorage } from "./vehicle-storage";

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
        describe("getVehicle(id)", () => {
            let fetchSuccessStub: sinon.SinonStub;
            const testError: Error = new Error("Test Error");
            const testData: ISuccessStatus = {
                lastUpdate: 235236,
                status: Status.SUCCESS,
                storage: new Map(Object.entries({ testId: { id: 1, sum: 2 } as any })),
                timestamp: 993,
                tripStorage: new Map(),
            };
            beforeEach(() => {
                fetchSuccessStub = sandbox.stub(instance, "fetchSuccessOrThrow");
            });
            describe("fetch throws an error", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.reject(testError));
                });
                it("should pass the error on", () => {
                    return instance.getVehicle("any id")
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.deep.equal(testError);
                        });
                });
            });
            describe("an unknown vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                });
                it("should throw an NotFoundError", () => {
                    return instance.getVehicle("any id")
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any | NotFoundError) => {
                            expect(err).to.instanceOf(NotFoundError);
                            expect(err.statusCode).to.equal(404);
                        });
                });
            });
            describe("an known vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                });
                it("should return the id", () => {
                    return instance.getVehicle("testId")
                        .then((vehicle: IVehicleLocationResponse) => {
                            expect(vehicle).to.deep.equal({
                                lastUpdate: testData.lastUpdate,
                                vehicle: testData.storage.get("testId"),
                            });
                        });
                });
            });
        });
        describe("getVehicleByTripId(id)", () => {
            let fetchSuccessStub: sinon.SinonStub;
            const testError: Error = new Error("Test Error");
            const testData: ISuccessStatus = {
                lastUpdate: 235236,
                status: Status.SUCCESS,
                storage: new Map(),
                timestamp: 993,
                tripStorage: new Map(Object.entries({ testId: { id: 1, sum: 2 } as any })),
            };
            beforeEach(() => {
                fetchSuccessStub = sandbox.stub(instance, "fetchSuccessOrThrow");
            });
            describe("fetch throws an error", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.reject(testError));
                });
                it("should pass the error on", () => {
                    return instance.getVehicleByTripId("any id")
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.deep.equal(testError);
                        });
                });
            });
            describe("an unknown vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                });
                it("should throw an NotFoundError", () => {
                    return instance.getVehicleByTripId("any id")
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any | NotFoundError) => {
                            expect(err).to.instanceOf(NotFoundError);
                            expect(err.statusCode).to.equal(404);
                        });
                });
            });
            describe("an known vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                });
                it("should return the id", () => {
                    return instance.getVehicleByTripId("testId")
                        .then((vehicle: IVehicleLocationResponse) => {
                            expect(vehicle).to.deep.equal({
                                lastUpdate: testData.lastUpdate,
                                vehicle: testData.tripStorage.get("testId"),
                            });
                        });
                });
            });
        });
        describe("getVehicles(left, right, top, bottom)", () => {
            it("needs to be implemented");
        });
    });
});
