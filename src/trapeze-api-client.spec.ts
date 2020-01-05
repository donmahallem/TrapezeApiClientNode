/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { TripId, VehicleId } from "@donmahallem/trapeze-api-types";
import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { SettingsBodyTransformMethod, StopMode, TrapezeApiClient } from "./trapeze-api-client";

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
                                colorType: "ROUTE_BASED",
                                lastUpdate: undefined,
                                positionType: "CORRECTED",
                            },
                            url: testUrl + "/internetservice/geoserviceDispatcher/services/vehicleinfo/vehicles",
                        }]);
                    });
            });
            it("should query the correct endpoint with provided parameters", () => {
                getStub.resolves(testValue);
                return instance.getVehicleLocations("RAW", 12345)
                    .then((result) => {
                        expect(result).to.deep.equal(testValue);
                        expect(getStub.callCount).to.equal(1);
                        const callArgs: any[] = getStub.getCall(0).args;
                        expect(callArgs).to.deep.equal([{
                            qs: {
                                colorType: "ROUTE_BASED",
                                lastUpdate: 12345,
                                positionType: "RAW",
                            },
                            url: testUrl + "/internetservice/geoserviceDispatcher/services/vehicleinfo/vehicles",
                        }]);
                    });
            });
        });
        describe("getRouteByRouteId(vehicleId: string)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                ["testDirection1", "testDirection2"].forEach((testDirection: string): void => {
                    it('should query the correct endpoint with id "' + testId + '" and direction "' + testDirection + '"', () => {
                        postStub.resolves(testValue);
                        return instance.getRouteByRouteId(testId as TripId, testDirection)
                            .then((result) => {
                                expect(result).to.deep.equal(testValue);
                                expect(postStub.callCount).to.equal(1);
                                const callArgs: any[] = postStub.getCall(0).args;
                                expect(callArgs).to.deep.equal([{
                                    qs: {
                                        direction: testDirection,
                                        id: testId,
                                    },
                                    url: testUrl + "/internetservice/geoserviceDispatcher/services/pathinfo/route",
                                }]);
                            });
                    });
                });
            });
        });
        describe("getRouteByTripId(vehicleId: string)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getRouteByTripId(testId as TripId)
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
                    return instance.getRouteByVehicleId(testId as VehicleId)
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
        describe("getStopPointInfo(stopPointId, mode)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getStopPointInfo(testId as VehicleId)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                form: {
                                    mode: "departure",
                                    stopPoint: testId,
                                },
                                url: testUrl + "/internetservice/services/stopInfo/stopPoint",
                            }]);
                        });
                });

                ["arrival", "departure"].forEach((testDepartureMode: string): void => {

                    it('should query the correct endpoint with id "' + testId + '" and  "'
                        + testDepartureMode + '"', () => {
                            postStub.resolves(testValue);
                            return instance.getStopPointInfo(testId as VehicleId,
                                testDepartureMode as StopMode)
                                .then((result) => {
                                    expect(result).to.deep.equal(testValue);
                                    expect(postStub.callCount).to.equal(1);
                                    const callArgs: any[] = postStub.getCall(0).args;
                                    expect(callArgs).to.deep.equal([{
                                        form: {
                                            mode: testDepartureMode,
                                            stopPoint: testId,
                                        },
                                        url: testUrl + "/internetservice/services/stopInfo/stopPoint",
                                    }]);
                                });
                        });
                });
            });
        });
        describe("getStopInfo(stopId, mode)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getStopInfo(testId as VehicleId)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                form: {
                                    mode: "departure",
                                    stop: testId,
                                },
                                url: testUrl + "/internetservice/services/stopInfo/stop",
                            }]);
                        });
                });

                ["arrival", "departure"].forEach((testDepartureMode: string): void => {

                    it('should query the correct endpoint with id "' + testId + '" and  "'
                        + testDepartureMode + '"', () => {
                            postStub.resolves(testValue);
                            return instance.getStopInfo(testId as VehicleId,
                                testDepartureMode as StopMode)
                                .then((result) => {
                                    expect(result).to.deep.equal(testValue);
                                    expect(postStub.callCount).to.equal(1);
                                    const callArgs: any[] = postStub.getCall(0).args;
                                    expect(callArgs).to.deep.equal([{
                                        form: {
                                            mode: testDepartureMode,
                                            stop: testId,
                                        },
                                        url: testUrl + "/internetservice/services/stopInfo/stop",
                                    }]);
                                });
                        });
                });
            });
        });
        describe("getSettings()", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint and return "' + testId + '"', () => {
                    getStub.resolves(testValue);
                    return instance.getSettings()
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(getStub.callCount).to.equal(1);
                            const callArgs: any[] = getStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                transform: SettingsBodyTransformMethod,
                                url: testUrl + "/internetservice/settings",
                            }]);
                        });
                });
            });
        });
    });
    describe("SettingsBodyTransformMethod", () => {
        const testObjects: any[] = [
            { test: true },
            { test: false },
            { test: "any value" }, {
                nested: {
                    value: true,
                },
            },
        ];
        const prefixes: string[] = [
            "",
            "a lot of",
            "javascript_variable = ",
        ];
        const suffixes: string[] = [
            ";",
            "",
        ];
        testObjects.forEach((testObject: any): void => {
            describe("used with testObject: " + JSON.stringify(testObject), () => {
                prefixes.forEach((prefix: string) => {
                    suffixes.forEach((suffix: string) => {
                        it('should pass with prefix "' + prefix + '" and suffix "' + suffix + '"', () => {
                            const testBody: string = prefix + JSON.stringify(testObject) + suffix;
                            expect(SettingsBodyTransformMethod(testBody)).to.deep.equal(testObject);
                        });
                    });
                });
            });
        });
    });
});
