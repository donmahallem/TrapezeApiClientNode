/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { expect } from "chai";
import "mocha";
import * as instance from "./index";

describe("index.ts", () => {
    describe("index exports", () => {
        // tslint:disable-next-line:no-unused-expression
        expect(instance).to.not.be.undefined;
        // tslint:disable-next-line:no-unused-expression
        expect(instance.TrapezeApiClient).to.not.be.undefined;
    });
});
