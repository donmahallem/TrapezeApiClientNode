import { expect } from 'chai';
import { TrapezeApiClient } from './trapeze-api-client';
import 'mocha';

describe('index', () => {
    it('should contain FlowApiValidator', () => {
        const testUrl: string = "test.url";
        const a = new TrapezeApiClient(testUrl);
        expect(a.endpoint).to.equal(testUrl);
    });
});