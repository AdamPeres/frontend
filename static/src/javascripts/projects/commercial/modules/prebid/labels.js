// @flow strict

import config from 'lib/config';
import { getCookie } from 'lib/cookies';
import type {
    PrebidBidLabel,
    PrebidLabel,
    PrebidSlotLabel,
} from 'commercial/modules/prebid/types';
import {
    getBreakpointKey,
    getRandomIntInclusive,
} from 'commercial/modules/prebid/utils';

const slotLabels: PrebidSlotLabel[] = [];

switch (getBreakpointKey()) {
    case 'M':
        slotLabels.push('mobile');
        break;
    case 'T':
        slotLabels.push('tablet');
        break;
    case 'D':
        slotLabels.push('desktop');
        break;
    default:
    // do nothing
}

if (config.get('page.contentType') === 'Article') {
    slotLabels.push('article');
} else {
    slotLabels.push('non-article');
}

const bidLabels: PrebidBidLabel[] = [];

switch (config.get('page.edition')) {
    case 'UK':
        bidLabels.push('edn-UK');
        break;
    case 'INT':
        bidLabels.push('edn-INT');
        break;
    default:
    // do nothing
}

switch (getCookie('GU_geo_continent')) {
    case 'NA':
        bidLabels.push('geo-NA'); // North America
        break;
    default:
    // do nothing
}

if (config.get('page.isDev') || getRandomIntInclusive(1, 10) === 1)
    bidLabels.push('deal-FirstLook');

export const labels: PrebidLabel[] = slotLabels.concat(bidLabels);
