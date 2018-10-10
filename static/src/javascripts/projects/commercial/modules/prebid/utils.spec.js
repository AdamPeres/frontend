// @flow
import { getSync as getSync_ } from 'lib/geolocation';
import { getBreakpoint as getBreakpoint_ } from 'lib/detect';
import config from 'lib/config';
import { testCanBeRun as testCanBeRun_ } from 'common/modules/experiments/test-can-run-checks';
import { getParticipations as getParticipations_ } from 'common/modules/experiments/utils';
import {
    getBreakpointKey,
    shouldIncludeAdYouLike,
    shouldIncludeAppNexus,
    shouldIncludeOpenx,
    shouldIncludeOzone,
    shouldIncludeTrustX,
    stripMobileSuffix,
    stripTrailingNumbersAbove1,
    stripDfpAdPrefixFrom,
    removeFalseyValues,
} from './utils';

const getSync: any = getSync_;
const getBreakpoint: any = getBreakpoint_;
const testCanBeRun: any = testCanBeRun_;
const getParticipations: any = getParticipations_;

jest.mock('lodash/once', () => a => a);

jest.mock('lib/geolocation', () => ({
    getSync: jest.fn(() => 'GB'),
}));

jest.mock('lib/detect', () => ({
    getBreakpoint: jest.fn(() => 'mobile'),
    hasPushStateSupport: jest.fn(() => true),
}));

jest.mock('common/modules/experiments/test-can-run-checks');
jest.mock('common/modules/experiments/utils');

describe('Utils', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        config.switches.prebidAppnexusUkRow = undefined;
    });

    test('stripPrefix correctly strips valid cases', () => {
        const validStrips: Array<Array<string>> = [
            ['dfp-ad--slot', 'slot'],
            ['slot', 'slot'],
            ['dfp-ad--', ''],
        ];

        validStrips.forEach(([stringToStrip, result]) => {
            expect(stripDfpAdPrefixFrom(stringToStrip)).toEqual(result);
        });
    });

    test('stripPrefix correctly behaves in invalid case', () => {
        expect(stripDfpAdPrefixFrom(' dfp-ad--slot')).toEqual(' dfp-ad--slot');
    });

    test('getBreakpointKey should find the correct key', () => {
        const breakpoints = ['mobile', 'phablet', 'tablet', 'desktop', 'wide'];
        const results = [];
        for (let i = 0; i < breakpoints.length; i += 1) {
            getBreakpoint.mockReturnValueOnce(breakpoints[i]);
            results.push(getBreakpointKey());
        }
        expect(results).toEqual(['M', 'M', 'T', 'D', 'D']);
    });

    test('shouldIncludeAppNexus should return true if geolocation is AU', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('AU');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should return true if geolocation is NZ', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('NZ');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should return false if geolocation is US', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('UK');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should return true if geolocation is CA', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('UK');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should return true if geolocation is UK', () => {
        config.switches.prebidAppnexusUkRow = true;
        getSync.mockReturnValue('UK');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should otherwise return false', () => {
        config.switches.prebidAppnexusUkRow = true;
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(shouldIncludeAppNexus()).toBe(true);
        }
    });

    test('shouldIncludeAppNexus should return false for UK region if UK switched off', () => {
        config.switches.prebidAppnexusUkRow = false;
        getSync.mockReturnValue('UK');
        expect(shouldIncludeAppNexus()).toBe(false);
    });

    test('shouldIncludeAppNexus should return false for UK region if UK switched off', () => {
        config.switches.prebidAppnexusUkRow = false;
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(shouldIncludeAppNexus()).toBe(false);
        }
    });

    test('shouldIncludeAppNexus should return true for AU region if UK region is switched off', () => {
        config.switches.prebidAppnexusUkRow = false;
        getSync.mockReturnValue('AU');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeAppNexus should return true for NZ region if UK region is switched off', () => {
        config.switches.prebidAppnexusUkRow = false;
        getSync.mockReturnValue('NZ');
        expect(shouldIncludeAppNexus()).toBe(true);
    });

    test('shouldIncludeOpenx should return true if geolocation is UK', () => {
        getSync.mockReturnValueOnce('UK');
        expect(shouldIncludeOpenx()).toBe(true);
    });

    test('shouldIncludeOpenx should return true if within ROW region', () => {
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH', 'IE'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValueOnce(testGeos[i]);
            expect(shouldIncludeOpenx()).toBe(true);
        }
    });

    test('shouldIncludeOpenx should return false if within AU/US region', () => {
        const testGeos = ['NZ', 'CA', 'US', 'AU'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValue(testGeos[i]);
            expect(shouldIncludeOpenx()).toBe(false);
        }
    });

    test('shouldIncludeTrustX should return true if geolocation is US', () => {
        getSync.mockReturnValueOnce('US');
        expect(shouldIncludeTrustX()).toBe(true);
    });

    test('shouldIncludeTrustX should otherwise return false', () => {
        const testGeos = ['FK', 'GI', 'GG', 'IM', 'JE', 'SH', 'AU'];
        for (let i = 0; i < testGeos.length; i += 1) {
            getSync.mockReturnValueOnce(testGeos[i]);
            expect(shouldIncludeTrustX()).toBe(false);
        }
    });

    xtest('shouldIncludeOzone should return false for excluded geolocations', () => {
        const excludedGeos = ['US', 'CA', 'NZ', 'AU'];
        for (let i = 0; i < excludedGeos.length; i += 1) {
            getSync.mockReturnValue(excludedGeos[i]);
            expect(shouldIncludeOzone()).toBe(false);
        }
    });

    xtest('shouldIncludeOzone should return true for UK and ROW', () => {
        const includedGeos = ['UK', 'FR', 'SA'];
        for (let i = 0; i < includedGeos.length; i += 1) {
            getSync.mockReturnValueOnce(includedGeos[i]);
            expect(shouldIncludeOzone()).toBe(true);
        }
    });

    test('stripMobileSuffix', () => {
        expect(stripMobileSuffix('top-above-nav--mobile')).toBe(
            'top-above-nav'
        );
        expect(stripMobileSuffix('inline1--mobile')).toBe('inline1');
    });

    test('stripTrailingNumbersAbove1', () => {
        expect(stripTrailingNumbersAbove1('inline1')).toBe('inline1');
        expect(stripTrailingNumbersAbove1('inline2')).toBe('inline');
        expect(stripTrailingNumbersAbove1('inline10')).toBe('inline');
        expect(stripTrailingNumbersAbove1('inline23')).toBe('inline');
        expect(stripTrailingNumbersAbove1('inline101')).toBe('inline');
        expect(stripTrailingNumbersAbove1('inline456')).toBe('inline');
    });

    test('shouldIncludeAdYouLike when not in any tests', () => {
        testCanBeRun.mockReturnValue(true);
        getParticipations.mockReturnValue(undefined);
        expect(shouldIncludeAdYouLike([[300, 250]])).toBe(false);
        expect(shouldIncludeAdYouLike([[300, 600], [300, 250]])).toBe(false);
        expect(shouldIncludeAdYouLike([[728, 90]])).toBe(false);
    });

    test('shouldIncludeAdYouLike when not in AdYouLike test', () => {
        testCanBeRun.mockReturnValue(true);
        getParticipations.mockReturnValue({
            CommercialPrebidAdYouLike: { variant: 'notintest' },
        });
        expect(shouldIncludeAdYouLike([[300, 250]])).toBe(false);
        expect(shouldIncludeAdYouLike([[300, 600], [300, 250]])).toBe(false);
        expect(shouldIncludeAdYouLike([[728, 90]])).toBe(false);
    });

    test('shouldIncludeAdYouLike when in aylStyle variant', () => {
        testCanBeRun.mockReturnValue(true);
        getParticipations.mockReturnValue({
            CommercialPrebidAdYouLike: { variant: 'aylStyle' },
        });
        expect(shouldIncludeAdYouLike([[300, 250]])).toBe(true);
        expect(shouldIncludeAdYouLike([[300, 600], [300, 250]])).toBe(true);
        expect(shouldIncludeAdYouLike([[728, 90]])).toBe(false);
    });

    test('shouldIncludeAdYouLike when in guardianStyle variant', () => {
        testCanBeRun.mockReturnValue(true);
        getParticipations.mockReturnValue({
            CommercialPrebidAdYouLike: { variant: 'guardianStyle' },
        });
        expect(shouldIncludeAdYouLike([[300, 250]])).toBe(true);
        expect(shouldIncludeAdYouLike([[300, 600], [300, 250]])).toBe(true);
        expect(shouldIncludeAdYouLike([[728, 90]])).toBe(false);
    });

    test('removeFalseyValues correctly move non-truthy values', () => {
        const result = removeFalseyValues({
            testString: 'non empty string',
            testEmptyString: '',
        });

        expect(result).toEqual({
            testString: 'non empty string',
        });
    });
});
