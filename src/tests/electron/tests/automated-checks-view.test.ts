// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as fs from 'fs';
import * as path from 'path';
import { createApplication } from 'tests/electron/common/create-application';
import {
    AutomatedChecksViewSelectors,
    ScreenshotViewSelectors,
} from 'tests/electron/common/element-identifiers/automated-checks-view-selectors';
import { scanForAccessibilityIssues } from 'tests/electron/common/scan-for-accessibility-issues';
import { AppController } from 'tests/electron/common/view-controllers/app-controller';
import { AutomatedChecksViewController } from 'tests/electron/common/view-controllers/automated-checks-view-controller';
import { testResourceServerConfig } from '../setup/test-resource-server-config';

describe('AutomatedChecksView', () => {
    let app: AppController;
    let automatedChecksView: AutomatedChecksViewController;

    beforeEach(async () => {
        app = await createApplication();
        automatedChecksView = await app.openAutomatedChecksView();
        await automatedChecksView.waitForScreenshotViewVisible();
    });

    afterEach(async () => {
        automatedChecksView = null;
        if (app != null) {
            await app.stop();
        }
    });

    it('displays automated checks results collapsed by default', async () => {
        const ruleGroups = await automatedChecksView.queryRuleGroups();
        expect(ruleGroups).toHaveLength(4);

        const collapsibleContentElements = await automatedChecksView.queryRuleGroupContents();
        expect(collapsibleContentElements).toHaveLength(0);
    });

    async function countHighlightBoxes(): Promise<number> {
        const boxes = await automatedChecksView.client.$$(ScreenshotViewSelectors.highlightBox);
        return boxes.length;
    }

    it('supports expanding and collapsing rule groups', async () => {
        expect(await countHighlightBoxes()).toBe(5);
        expect(await automatedChecksView.queryRuleGroupContents()).toHaveLength(0);

        await automatedChecksView.toggleRuleGroupAtPosition(1);
        await automatedChecksView.toggleRuleGroupAtPosition(2);
        await automatedChecksView.toggleRuleGroupAtPosition(3);

        expect(await countHighlightBoxes()).toBe(4);
        expect(await automatedChecksView.queryRuleGroupContents()).toHaveLength(3);
        await assertExpandedRuleGroup(1, 'ImageViewName', 1);
        await assertExpandedRuleGroup(2, 'ActiveViewName', 2);
        await assertExpandedRuleGroup(3, 'TouchSizeWcag', 1);

        await automatedChecksView.toggleRuleGroupAtPosition(1);
        await automatedChecksView.toggleRuleGroupAtPosition(2);

        expect(await countHighlightBoxes()).toBe(1);
        expect(await automatedChecksView.queryRuleGroupContents()).toHaveLength(1);
        await assertExpandedRuleGroup(3, 'TouchSizeWcag', 1);
    });

    it('should not contain any accessibility issues', async () => {
        const violations = await scanForAccessibilityIssues(automatedChecksView);
        expect(violations).toStrictEqual([]);
    });

    async function assertExpandedRuleGroup(position: number, expectedTitle: string, expectedFailures: number): Promise<void> {
        const title = await automatedChecksView.client.$(AutomatedChecksViewSelectors.getRuleDetailsIdSelector(position)).getText();
        expect(title).toEqual(expectedTitle);

        const failures = await automatedChecksView.client.$$(AutomatedChecksViewSelectors.getLiFailuresSelector(position));
        expect(failures).toHaveLength(expectedFailures);
    }

    it('ScreenshotView renders screenshot image from specified source', async () => {
        const resultExamplePath = path.join(testResourceServerConfig.absolutePath, 'axe/result.json');
        const axeRuleResultExample = JSON.parse(fs.readFileSync(resultExamplePath, { encoding: 'utf-8' }));

        const expectedScreenshotImage = 'data:image/png;base64,' + axeRuleResultExample.axeContext.screenshot;

        const actualScreenshotImage = await automatedChecksView.findElement(ScreenshotViewSelectors.screenshotImage).getAttribute('src');

        expect(actualScreenshotImage).toEqual(expectedScreenshotImage);
    });

    it('ScreenshotView renders expected number/size of highlight boxes in expected positions', async () => {
        await automatedChecksView.waitForScreenshotViewVisible();

        const highlightBoxes = await automatedChecksView.client.$$(ScreenshotViewSelectors.highlightBox);

        const highlightBoxStyles: PositionStyles[] = [];
        for (let i = 1; i <= highlightBoxes.length; i++) {
            const style = await automatedChecksView.findElement(ScreenshotViewSelectors.getHighlightBoxByIndex(i)).getAttribute('style');
            highlightBoxStyles.push(extractPositionStyles(style));
        }

        expect(highlightBoxes).toHaveLength(5);
        verifyHighlightBoxStyles(highlightBoxStyles);
    });

    type PositionStyles = {
        width: number;
        height: number;
        top: number;
        left: number;
    };

    function extractPositionStyles(styleValue: string): PositionStyles {
        return {
            width: extractStyleProperty(styleValue, 'width'),
            height: extractStyleProperty(styleValue, 'height'),
            top: extractStyleProperty(styleValue, 'top'),
            left: extractStyleProperty(styleValue, 'left'),
        };
    }

    function extractStyleProperty(styleValue: string, propertyName: string): number {
        return parseFloat(RegExp(`${propertyName}: (-?\\d+(\\.\\d+)?)%`).exec(styleValue)[1]);
    }

    function verifyHighlightBoxStyles(highlightBoxStyles: PositionStyles[]): void {
        const expectedStyles: PositionStyles[] = [
            createHighlightBoxPositionStyle(10.7407, 6.04167, 3.28125, 89.2593),
            createHighlightBoxPositionStyle(10.7407, 6.04167, 3.28125, 89.2593),
            createHighlightBoxPositionStyle(10.7407, 6.04167, 10.4167, 13.4259),
            createHighlightBoxPositionStyle(48.6111, 4.94792, 23.5417, 25.6481),
            createHighlightBoxPositionStyle(49.8148, 16.4063, 30.1042, 0),
        ];

        highlightBoxStyles.forEach((boxStyle, index) => {
            expect(boxStyle.top).toBeCloseTo(expectedStyles[index].top);
            expect(boxStyle.left).toBeCloseTo(expectedStyles[index].left);
            expect(boxStyle.width).toBeCloseTo(expectedStyles[index].width);
            expect(boxStyle.height).toBeCloseTo(expectedStyles[index].height);
        });
    }

    function createHighlightBoxPositionStyle(width: number, height: number, top: number, left: number): PositionStyles {
        return {
            width: width,
            height: height,
            top: top,
            left: left,
        };
    }
});
