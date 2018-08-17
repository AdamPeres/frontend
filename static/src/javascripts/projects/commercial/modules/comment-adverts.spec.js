// @flow
import mediator from 'lib/mediator';
import fastdom from 'lib/fastdom-promise';
import { addSlot } from 'commercial/modules/dfp/add-slot';
import { isUserLoggedIn as isUserLoggedIn_ } from 'common/modules/identity/api';
import { commercialFeatures } from 'common/modules/commercial/commercial-features';
import { initCommentAdverts, _ } from 'commercial/modules/comment-adverts';

// Workaround to fix issue where dataset is missing from jsdom, and solve the
// 'cannot set property [...] which has only a getter' TypeError
Object.defineProperty(HTMLElement.prototype, 'dataset', {
    writable: true,
    value: {},
});

jest.mock('lib/config', () => ({ page: {}, get: () => false }));

jest.mock('commercial/modules/dfp/add-slot', () => ({
    addSlot: jest.fn(),
}));

jest.mock('common/modules/commercial/commercial-features', () => ({
    commercialFeatures: {
        commentAdverts: true,
    },
}));

jest.mock('common/modules/identity/api', () => ({
    isUserLoggedIn: jest.fn(),
}));

const { createCommentSlot } = _;

const commercialFeaturesMock: any = commercialFeatures;
const isUserLoggedIn: any = isUserLoggedIn_;

const mockHeight = (height: number) => {
    jest.spyOn(fastdom, 'read').mockReturnValue(Promise.resolve(height));
};

describe('createCommentSlot', () => {
    beforeEach(() => {
        if (document.body) {
            document.body.innerHTML = `<div class="js-comments">
            <div class="content__main-column">
                <div class="js-discussion__ad-slot"></div></div></div>`;
        }
    });

    afterEach(() => {
        if (document.body) {
            document.body.innerHTML = '';
        }
        jest.resetAllMocks();
    });

    it('should return an ad slot with the correct sizes', () => {
        const commentMpu: HTMLElement = createCommentSlot(false);
        const commentDmpu: HTMLElement = createCommentSlot(true);
        expect(commentMpu.getAttribute('data-desktop')).toBe(
            '1,1|2,2|300,250|620,1|620,350|300,274|fluid'
        );
        expect(commentMpu.getAttribute('data-mobile')).toBe(
            '1,1|2,2|300,250|300,274|fluid'
        );
        expect(commentDmpu.getAttribute('data-desktop')).toBe(
            '1,1|2,2|300,250|620,1|620,350|300,274|fluid|300,600'
        );
        expect(commentDmpu.getAttribute('data-mobile')).toBe(
            '1,1|2,2|300,250|300,274|fluid'
        );
    });

    it('should add js-sticky-mpu to the class list', () => {
        const commentMpu: HTMLElement = createCommentSlot(false);
        const commentDmpu: HTMLElement = createCommentSlot(true);
        expect(commentMpu.classList).toContain('js-sticky-mpu');
        expect(commentDmpu.classList).toContain('js-sticky-mpu');
    });
});

describe('initCommentAdverts', () => {
    beforeEach(() => {
        isUserLoggedIn.mockReturnValue(false);
        commercialFeaturesMock.commentAdverts = true;
        if (document.body) {
            document.body.innerHTML = `<div class="js-comments">
            <div class="content__main-column">
                <div class="js-discussion__ad-slot"></div></div></div>`;
        }
    });

    afterEach(() => {
        if (document.body) {
            document.body.innerHTML = '';
        }
        jest.resetAllMocks();
    });

    it('should return false if commentAdverts are switched off', () => {
        commercialFeaturesMock.commentAdverts = false;
        expect(initCommentAdverts()).toBe(false);
    });

    it('should return false if there is no comments ad slot container', () => {
        if (document.body) {
            document.body.innerHTML = `<div class="js-comments">
                <div class="content__main-column"></div></div>`;
        }
        expect(initCommentAdverts()).toBe(false);
    });

    it('should insert a DMPU slot if there is enough space', done => {
        mockHeight(800);
        initCommentAdverts();
        mediator.emit('modules:comments:renderComments:rendered');
        mediator.once('page:defaultcommercial:comments', () => {
            const adSlot: HTMLElement = (document.querySelector(
                '.js-ad-slot'
            ): any);
            expect(addSlot).toHaveBeenCalledTimes(1);
            expect(adSlot.getAttribute('data-desktop')).toBe(
                '1,1|2,2|300,250|620,1|620,350|300,274|fluid|300,600'
            );
            done();
        });
    });

    it('should insert a DMPU slot if there is space, and the user is logged in', done => {
        mockHeight(600);
        isUserLoggedIn.mockReturnValue(true);
        initCommentAdverts();
        mediator.emit('modules:comments:renderComments:rendered');
        mediator.once('page:defaultcommercial:comments', () => {
            const adSlot: HTMLElement = (document.querySelector(
                '.js-ad-slot'
            ): any);
            expect(addSlot).toHaveBeenCalledTimes(1);
            expect(adSlot.getAttribute('data-desktop')).toBe(
                '1,1|2,2|300,250|620,1|620,350|300,274|fluid|300,600'
            );
            done();
        });
    });

    it('should insert a MPU if a DMPU does not fit, and the user is logged in', done => {
        mockHeight(300);
        isUserLoggedIn.mockReturnValue(true);
        initCommentAdverts();
        mediator.emit('modules:comments:renderComments:rendered');
        mediator.once('page:defaultcommercial:comments', () => {
            const adSlot: HTMLElement = (document.querySelector(
                '.js-ad-slot'
            ): any);
            expect(addSlot).toHaveBeenCalledTimes(1);
            expect(adSlot.getAttribute('data-desktop')).toBe(
                '1,1|2,2|300,250|620,1|620,350|300,274|fluid'
            );
            done();
        });
    });

    it('should upgrade the MPU to a DMPU when there is space', done => {
        mockHeight(800);
        initCommentAdverts();
        mediator.emit('modules:comments:renderComments:rendered');
        mediator.once('page:defaultcommercial:comments', () => {
            const adSlot: HTMLDivElement = (document.querySelector(
                '.js-ad-slot'
            ): any);
            expect(addSlot).toHaveBeenCalledTimes(1);
            expect(adSlot.getAttribute('data-desktop')).toBe(
                '1,1|2,2|300,250|620,1|620,350|300,274|fluid|300,600'
            );
            done();
        });
    });
});
