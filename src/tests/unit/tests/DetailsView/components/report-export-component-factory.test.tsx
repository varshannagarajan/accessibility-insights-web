// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AssessmentsProvider } from 'assessments/types/assessments-provider';
import { AssessmentStoreData } from 'common/types/store-data/assessment-result-data';
import { CardsViewModel } from 'common/types/store-data/card-view-model';
import { FeatureFlagStoreData } from 'common/types/store-data/feature-flag-store-data';
import { TabStoreData } from 'common/types/store-data/tab-store-data';
import { VisualizationScanResultData } from 'common/types/store-data/visualization-scan-result-data';
import { VisualizationStoreData } from 'common/types/store-data/visualization-store-data';
import { VisualizationType } from 'common/types/visualization-type';
import { DetailsViewActionMessageCreator } from 'DetailsView/actions/details-view-action-message-creator';
import { DetailsViewCommandBarDeps, DetailsViewCommandBarProps } from 'DetailsView/components/details-view-command-bar';
import {
    getReportExportComponentForAssessment,
    getReportExportComponentForFastPass,
} from 'DetailsView/components/report-export-component-factory';
import { shallow } from 'enzyme';
import { ReportGenerator } from 'reports/report-generator';
import { ScanResults } from 'scanner/iruleresults';
import { IMock, Mock, MockBehavior } from 'typemoq';

describe('ReportExportComponentPropsFactory', () => {
    const theDate = new Date(2019, 2, 12, 9, 0);
    const theTimestamp = 'test timestamp';
    const thePageTitle = 'command-bar-test-tab-title';
    const theDescription = 'test description';
    const theGeneratorOutput = 'generator output';
    const thePageUrl = 'test page url';

    let assessmentsProviderMock: IMock<AssessmentsProvider>;
    let featureFlagStoreData: FeatureFlagStoreData;
    let actionMessageCreatorMock: IMock<DetailsViewActionMessageCreator>;
    let tabStoreData: TabStoreData;
    let assessmentStoreData: AssessmentStoreData;
    let reportGeneratorMock: IMock<ReportGenerator>;
    let visualizationScanResultData: VisualizationScanResultData;
    let visualizationStoreData: VisualizationStoreData;
    let cardsViewData: CardsViewModel;
    let scanResult: ScanResults;

    beforeEach(() => {
        featureFlagStoreData = {};
        actionMessageCreatorMock = Mock.ofType(DetailsViewActionMessageCreator, MockBehavior.Strict);
        tabStoreData = {
            title: thePageTitle,
            url: thePageUrl,
        } as TabStoreData;
        assessmentStoreData = {
            resultDescription: theDescription,
        } as AssessmentStoreData;
        assessmentsProviderMock = Mock.ofType<AssessmentsProvider>(undefined, MockBehavior.Loose);
        reportGeneratorMock = Mock.ofType<ReportGenerator>(undefined, MockBehavior.Loose);
        cardsViewData = null;
        scanResult = null;
        visualizationStoreData = null;
    });

    function getProps(): DetailsViewCommandBarProps {
        const deps = {
            detailsViewActionMessageCreator: actionMessageCreatorMock.object,
            getCurrentDate: () => theDate,
            reportGenerator: reportGeneratorMock.object,
            getDateFromTimestamp: value => theDate,
        } as DetailsViewCommandBarDeps;

        visualizationScanResultData = {
            issues: {
                scanResult: scanResult,
            },
        } as VisualizationScanResultData;

        return {
            deps,
            featureFlagStoreData,
            tabStoreData,
            actionMessageCreator: actionMessageCreatorMock.object,
            assessmentStoreData,
            assessmentsProvider: assessmentsProviderMock.object,
            visualizationScanResultData,
            visualizationStoreData,
            cardsViewData,
        } as DetailsViewCommandBarProps;
    }

    function setAssessmentReportGenerator(): void {
        reportGeneratorMock
            .setup(reportGenerator =>
                reportGenerator.generateAssessmentReport(
                    assessmentStoreData,
                    assessmentsProviderMock.object,
                    featureFlagStoreData,
                    tabStoreData,
                    theDescription,
                ),
            )
            .returns(() => theGeneratorOutput);
    }

    function setAutomatedChecksReportGenerator(): void {
        reportGeneratorMock
            .setup(reportGenerator =>
                reportGenerator.generateFastPassAutomateChecksReport(
                    scanResult,
                    theDate,
                    tabStoreData.title,
                    tabStoreData.url,
                    cardsViewData,
                    theDescription,
                ),
            )
            .returns(() => theGeneratorOutput);
    }

    function setSelectedFastPassDetailsView(test: VisualizationType): void {
        visualizationStoreData = {
            selectedFastPassDetailsView: test,
        } as VisualizationStoreData;
    }

    function setScanResults(): void {
        scanResult = {
            timestamp: theTimestamp,
        } as ScanResults;
    }

    test('getReportExportComponentForAssessment expected properties are set', () => {
        setAssessmentReportGenerator();
        const props = getProps();
        const wrapper = shallow(getReportExportComponentForAssessment(props));

        expect(wrapper.debug()).toMatchSnapshot();

        reportGeneratorMock.verifyAll();
        actionMessageCreatorMock.verifyAll();
    });

    test('getReportExportComponentForFastPass, scanResults is null, props is null', () => {
        const props = getProps();
        const component: JSX.Element = getReportExportComponentForFastPass(props);

        expect(component).toBeNull();
    });

    test('getReportExportComponentForFastPass, scanResults is not null, test is Tabstop, props is null', () => {
        setScanResults();
        setSelectedFastPassDetailsView(VisualizationType.TabStops);
        const props = getProps();
        const component: JSX.Element = getReportExportComponentForFastPass(props);

        expect(component).toBeNull();
    });

    test('getReportExportComponentForFastPass, scanResults is not null, test is Issues, properties are set', () => {
        cardsViewData = {} as CardsViewModel;
        setScanResults();
        setSelectedFastPassDetailsView(VisualizationType.Issues);
        setAutomatedChecksReportGenerator();
        const props = getProps();
        const wrapper = shallow(getReportExportComponentForFastPass(props));

        expect(wrapper.debug()).toMatchSnapshot();

        reportGeneratorMock.verifyAll();
        actionMessageCreatorMock.verifyAll();
    });
});
