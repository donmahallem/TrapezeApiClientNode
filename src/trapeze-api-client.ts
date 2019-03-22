import * as req from "request";
import * as reqp from "request-promise-native";

export class TrapezeApiClient {
    private httpClient: req.RequestAPI<reqp.RequestPromise<any>, reqp.RequestPromiseOptions, req.RequiredUriUrl>;
    public constructor(public readonly endpoint: string) {
        this.httpClient = reqp.defaults({
            headers: {
                "User-Agent": "Request-Promise",
            },
            json: true,
        });
    }

    public getVehicleLocations(): reqp.RequestPromise<any> {
        const options = {
            qs: {
                colorType: "ROUTE",
                positionType: "CORRECTED",
            },
            uri: this.endpoint + "/internetservice/geoserviceDispatcher/services/vehicleinfo/vehicles",
        };
        return this.httpClient
            .get(options);
    }
    public getRouteByTripId(vehicleId: string): reqp.RequestPromise<any> {
        const options = {
            method: "POST",
            qs: {
                id: vehicleId,
            },
            uri: this.endpoint + "/internetservice/geoserviceDispatcher/services/pathinfo/trip",
        };
        return this.httpClient
            .post(options);
    }
    public getRouteByVehicleId(vehicleId): reqp.RequestPromise<any> {
        const options = {
            method: "POST",
            query: {
                id: vehicleId,
            },
            uri: this.endpoint + "/internetservice/geoserviceDispatcher/services/pathinfo/vehicle",
        };
        return this.httpClient
            .post(options);
    }

    public getTripPassages(tripId, mode) {
        const options = {
            form: {
                mode,
                tripId,
            },
            method: "POST",
            uri: this.endpoint + "/internetservice/services/tripInfo/tripPassages",
        };
        return this.httpClient
            .post(options);
    }

}
