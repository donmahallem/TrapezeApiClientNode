import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { TrapezeApiClient } from "./trapeze-api-client";

describe("trapeze-api-client.ts", () => {
    describe("TrapezeApiClient", () => {
        const testUrl: string = "test.url";
        let instance: TrapezeApiClient;
        let sandbox: sinon.SinonSandbox;
        let getStub: sinon.SinonStub;
        let postStub: sinon.SinonStub;
        const testValue: any = {
            randomString: "randomString",
            test: 1,
        };
        before("create Sandbox", () => {
            sandbox = sinon.createSandbox();
            getStub = sandbox.stub();
            postStub = sandbox.stub();
        });
        beforeEach(() => {
            instance = new TrapezeApiClient(testUrl);
            (instance as any).httpClient = {
                get: getStub,
                post: postStub,
            };
        });

        afterEach("clear history", () => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
        });
        describe("constructor(public readonly endpoint: string)", () => {
            it("should set the endpoint url correctly", () => {
                expect(instance.endpoint).to.equal(testUrl);
            });
        });
        describe("getVehicleLocations()", () => {
            it("should query the correct endpoint", () => {
                getStub.resolves(testValue);
                return instance.getVehicleLocations()
                    .then((result) => {
                        expect(result).to.deep.equal(testValue);
                        expect(getStub.callCount).to.equal(1);
                        const callArgs: any[] = getStub.getCall(0).args;
                        expect(callArgs).to.deep.equal([{
                            qs: {
                                colorType: "ROUTE",
                                positionType: "CORRECTED",
                            },
                            url: testUrl + "/internetservice/geoserviceDispatcher/services/vehicleinfo/vehicles",
                        }]);
                    });
            });
        });
        describe("getRouteByTripId(vehicleId: string)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getRouteByTripId(testId as any)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                qs: {
                                    id: testId,
                                },
                                url: testUrl + "/internetservice/geoserviceDispatcher/services/pathinfo/trip",
                            }]);
                        });
                });
            });
        });
        describe("getRouteByVehicleId(vehicleId: string)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getRouteByVehicleId(testId as any)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                qs: {
                                    id: testId,
                                },
                                url: testUrl + "/internetservice/geoserviceDispatcher/services/pathinfo/vehicle",
                            }]);
                        });
                });
            });
        });
        describe("getSettings()", () => {
            it("still needs tests");
        });
    });
});
