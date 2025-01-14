// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as _ from 'lodash';

import { HeadingsTestStep } from 'assessments/headings/test-steps/test-steps';
import { LandmarkTestStep } from 'assessments/landmarks/test-steps/test-steps';
import {
    AssessmentToggleActionPayload,
    ToggleActionPayload,
    UpdateSelectedDetailsViewPayload,
    UpdateSelectedPivot,
} from 'background/actions/action-payloads';
import { InjectionActions } from 'background/actions/injection-actions';
import { TabActions } from 'background/actions/tab-actions';
import { VisualizationActions } from 'background/actions/visualization-actions';
import { VisualizationStore } from 'background/stores/visualization-store';
import { AdHocTestkeys } from '../../../../../common/configs/adhoc-test-keys';
import { VisualizationConfigurationFactory } from '../../../../../common/configs/visualization-configuration-factory';
import { StoreNames } from '../../../../../common/stores/store-names';
import { DetailsViewPivotType } from '../../../../../common/types/details-view-pivot-type';
import { VisualizationStoreData } from '../../../../../common/types/store-data/visualization-store-data';
import { VisualizationType } from '../../../../../common/types/visualization-type';
import { createStoreWithNullParams, StoreTester } from '../../../common/store-tester';
import { VisualizationStoreDataBuilder } from '../../../common/visualization-store-data-builder';

describe('VisualizationStoreTest ', () => {
    test('constructor, no side effects', () => {
        const testObject = createStoreWithNullParams(VisualizationStore);
        expect(testObject).toBeDefined();
    });

    test('getId', () => {
        const testObject = createStoreWithNullParams(VisualizationStore);
        expect(StoreNames[StoreNames.VisualizationStore]).toEqual(testObject.getId());
    });

    test('onUpdateSelectedPivotChild when pivot is different', () => {
        const actionName = 'updateSelectedPivotChild';
        const viewType = VisualizationType.TabStops;
        const initialPivot = DetailsViewPivotType.allTest;
        const finalPivot = DetailsViewPivotType.fastPass;

        const initialState = new VisualizationStoreDataBuilder()
            .with('selectedAdhocDetailsView', viewType)
            .with('selectedDetailsViewPivot', initialPivot)
            .build();

        const expectedState = new VisualizationStoreDataBuilder()
            .with('selectedAdhocDetailsView', viewType)
            .with('selectedFastPassDetailsView', viewType)
            .with('selectedDetailsViewPivot', finalPivot)
            .build();

        const payload: UpdateSelectedDetailsViewPayload = {
            detailsViewType: viewType,
            pivotType: finalPivot,
        };

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onUpdateSelectedPivotChild when old pivot doesnt have current visualization', () => {
        const actionName = 'updateSelectedPivotChild';
        const viewType = VisualizationType.Landmarks;
        const finalPivot = DetailsViewPivotType.allTest;

        const initialState = new VisualizationStoreDataBuilder()
            .with('selectedAdhocDetailsView', viewType)
            .with('selectedDetailsViewPivot', DetailsViewPivotType.fastPass)
            .build();

        const expectedState = new VisualizationStoreDataBuilder()
            .with('selectedAdhocDetailsView', viewType)
            .with('selectedDetailsViewPivot', finalPivot)
            .build();

        const payload: UpdateSelectedDetailsViewPayload = {
            detailsViewType: viewType,
            pivotType: finalPivot,
        };

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    [DetailsViewPivotType.allTest, DetailsViewPivotType.fastPass].forEach(pivotType => {
        test('onUpdateSelectedPivotChild when view & pivot are the same', () => {
            const actionName = 'updateSelectedPivotChild';
            const viewType = VisualizationType.Issues;

            const expectedState = new VisualizationStoreDataBuilder()
                .with('selectedAdhocDetailsView', viewType)
                .with('selectedDetailsViewPivot', pivotType)
                .build();

            const initialState = new VisualizationStoreDataBuilder()
                .with('selectedAdhocDetailsView', viewType)
                .with('selectedDetailsViewPivot', pivotType)
                .build();

            initialState.tests.adhoc[AdHocTestkeys.Issues] = { enabled: true };
            expectedState.tests.adhoc[AdHocTestkeys.Issues] = { enabled: true };

            const payload: UpdateSelectedDetailsViewPayload = {
                detailsViewType: viewType,
                pivotType: pivotType,
            };

            createStoreTesterForVisualizationActions(actionName)
                .withActionParam(payload)
                .testListenerToNeverBeCalled(initialState, expectedState);
        });
    });

    test('onUpdateSelectedPivotChild when view changes to null', () => {
        const actionName = 'updateSelectedPivotChild';
        const expectedState = new VisualizationStoreDataBuilder().with('selectedAdhocDetailsView', VisualizationType.Landmarks).build();
        const initialState = new VisualizationStoreDataBuilder().with('selectedAdhocDetailsView', VisualizationType.Landmarks).build();

        const payload: UpdateSelectedDetailsViewPayload = {
            detailsViewType: VisualizationType.Issues,
            pivotType: null,
        };

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onUpdateSelectedPivotChild same pivot different view', () => {
        const actionName = 'updateSelectedPivotChild';
        const selectedPivot = DetailsViewPivotType.fastPass;

        const oldView = VisualizationType.Issues;
        const newView = VisualizationType.Landmarks;

        const initialState = new VisualizationStoreDataBuilder()
            .with('selectedDetailsViewPivot', selectedPivot)
            .with('selectedFastPassDetailsView', oldView)
            .build();

        initialState.tests.adhoc[AdHocTestkeys.Issues] = { enabled: true };
        initialState.tests.adhoc[AdHocTestkeys.Color] = { enabled: true };

        const expectedState = new VisualizationStoreDataBuilder()
            .with('selectedDetailsViewPivot', selectedPivot)
            .with('selectedFastPassDetailsView', newView)
            .build();

        const payload: UpdateSelectedDetailsViewPayload = {
            detailsViewType: newView,
            pivotType: selectedPivot,
        };

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onUpdateSelectedPivotChild when view is different', () => {
        const actionName = 'updateSelectedPivotChild';
        const initialState = new VisualizationStoreDataBuilder().build();

        const expectedState = new VisualizationStoreDataBuilder().with('selectedAdhocDetailsView', VisualizationType.Issues).build();

        const payload: UpdateSelectedDetailsViewPayload = {
            detailsViewType: VisualizationType.Headings,
            pivotType: null,
        };

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onUpdateSelectedDetailsView when view is null', () => {
        const actionName = 'updateSelectedPivotChild';
        const initialState = new VisualizationStoreDataBuilder().with('selectedAdhocDetailsView', VisualizationType.Issues).build();
        const expectedState = _.cloneDeep(initialState);

        const payload: UpdateSelectedDetailsViewPayload = {
            detailsViewType: null,
            pivotType: null,
        };

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onUpdateSelectedPivot when pivot value is same as before', () => {
        const actionName = 'updateSelectedPivot';
        const oldPivotValue = DetailsViewPivotType.fastPass;
        const initialState = new VisualizationStoreDataBuilder().with('selectedDetailsViewPivot', oldPivotValue).build();

        const expectedState = new VisualizationStoreDataBuilder().with('selectedDetailsViewPivot', oldPivotValue).build();

        const payload: UpdateSelectedPivot = {
            pivotKey: oldPivotValue,
        };

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onUpdateSelectedPivot when pivot value is different', () => {
        const actionName = 'updateSelectedPivot';
        const oldPivotValue = DetailsViewPivotType.fastPass;
        const finalPivotValue = DetailsViewPivotType.allTest;
        const fakeStep = 'fake step';
        const initialState = new VisualizationStoreDataBuilder()
            .withHeadingsAssessment(true, fakeStep)
            .withLandmarksAssessment(true, fakeStep)
            .with('selectedDetailsViewPivot', oldPivotValue)
            .withAllAdhocTestsTo(true)
            .build();

        const expectedState = new VisualizationStoreDataBuilder()
            .with('selectedDetailsViewPivot', finalPivotValue)
            .withHeadingsAssessment(false, fakeStep)
            .withLandmarksAssessment(false, fakeStep)
            .withAllAdhocTestsTo(false)
            .build();

        const payload: UpdateSelectedPivot = {
            pivotKey: finalPivotValue,
        };

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableHeadings when headings is disable', () => {
        const actionName = 'enableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.Headings,
        };

        const initialState = dataBuilder.build();
        const expectedState = dataBuilder
            .withHeadingsEnable()
            .with('scanning', 'headings')
            .with('selectedAdhocDetailsView', VisualizationType.Issues)
            .with('selectedDetailsViewPivot', DetailsViewPivotType.fastPass)
            .with('injectingInProgress', true)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableHeadingsAssessment without scan', () => {
        const actionName = 'enableVisualizationWithoutScan';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: AssessmentToggleActionPayload = {
            test: VisualizationType.HeadingsAssessment,
            requirement: HeadingsTestStep.missingHeadings,
        };

        const initialState = dataBuilder.build();
        const expectedState = dataBuilder
            .withHeadingsAssessment(true, payload.requirement)
            .with('selectedAdhocDetailsView', VisualizationType.Issues)
            .with('injectingInProgress', true)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableHeadings when headings is already enable', () => {
        const actionName = 'enableVisualization';
        const payload: ToggleActionPayload = {
            test: VisualizationType.Headings,
        };

        const initialState = new VisualizationStoreDataBuilder().withHeadingsEnable().build();

        const expectedState = new VisualizationStoreDataBuilder().withHeadingsEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableHeadings when headingsAssessment is enabled', () => {
        const actionName = 'enableVisualization';
        const payload: ToggleActionPayload = {
            test: VisualizationType.Headings,
        };

        const initialState = new VisualizationStoreDataBuilder().withHeadingsAssessment(true, HeadingsTestStep.missingHeadings).build();

        const expectedState = new VisualizationStoreDataBuilder()
            .withHeadingsEnable()
            .withHeadingsAssessment(false, HeadingsTestStep.missingHeadings)
            .with('injectingInProgress', true)
            .with('scanning', 'headings')
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableHeadingsAssessment when some other visualization is already enable', () => {
        const actionName = 'enableVisualization';
        const payload: AssessmentToggleActionPayload = {
            test: VisualizationType.HeadingsAssessment,
            requirement: HeadingsTestStep.missingHeadings,
        };

        const initialState = new VisualizationStoreDataBuilder().withHeadingsEnable().build();

        const expectedState = new VisualizationStoreDataBuilder()
            .withHeadingsAssessment(true, payload.requirement)
            .withHeadingsEnable()
            .with('injectingInProgress', true)
            .with('scanning', HeadingsTestStep.missingHeadings)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableHeadingsAssessment from onEnableLandmarksAssessment', () => {
        const actionName = 'enableVisualization';
        const payload: AssessmentToggleActionPayload = {
            test: VisualizationType.HeadingsAssessment,
            requirement: HeadingsTestStep.missingHeadings,
        };

        const initialState = new VisualizationStoreDataBuilder().withLandmarksAssessment(true, LandmarkTestStep.landmarkRoles).build();

        const expectedState = new VisualizationStoreDataBuilder()
            .withLandmarksAssessment(false, LandmarkTestStep.landmarkRoles)
            .withHeadingsAssessment(true, payload.requirement)
            .with('injectingInProgress', true)
            .with('scanning', HeadingsTestStep.missingHeadings)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableHeadingsAssessment switch test steps', () => {
        const actionName = 'enableVisualization';
        const payload: AssessmentToggleActionPayload = {
            test: VisualizationType.HeadingsAssessment,
            requirement: HeadingsTestStep.missingHeadings,
        };

        const initialState = new VisualizationStoreDataBuilder().withHeadingsAssessment(true, HeadingsTestStep.headingFunction).build();

        const expectedState = new VisualizationStoreDataBuilder()
            .withHeadingsAssessment(false, HeadingsTestStep.headingFunction)
            .withHeadingsAssessment(true, payload.requirement)
            .with('injectingInProgress', true)
            .with('scanning', HeadingsTestStep.missingHeadings)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('OnDisableHeadings when headings is enable', () => {
        const actionName = 'disableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.Headings,
        };
        const expectedState = dataBuilder.build();
        const initialState = dataBuilder.withHeadingsEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload.test)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('disableAssessmentVisualizations', () => {
        const actionName = 'disableAssessmentVisualizations';
        const dataBuilder = new VisualizationStoreDataBuilder();

        const expectedState = dataBuilder.withHeadingsAssessment(false, 'teststep').build();
        const initialState = dataBuilder.withHeadingsAssessment(true, 'teststep').build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(null)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableTabStops when TabStops is disable', () => {
        const actionName = 'enableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.TabStops,
        };
        const initialState = dataBuilder.build();
        const expectedState = dataBuilder
            .withTabStopsEnable()
            .with('injectingInProgress', true)
            .with('scanning', 'tabStops')
            .with('selectedDetailsViewPivot', DetailsViewPivotType.fastPass)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableTabStops when TabStops is already enable', () => {
        const actionName = 'enableVisualization';
        const payload: ToggleActionPayload = {
            test: VisualizationType.TabStops,
        };
        const initialState = new VisualizationStoreDataBuilder().withTabStopsEnable().build();

        const expectedState = new VisualizationStoreDataBuilder().withTabStopsEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('OnDisableTabStops when TabStops is enable', () => {
        const actionName = 'disableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.TabStops,
        };
        const expectedState = dataBuilder.build();
        const initialState = dataBuilder.withTabStopsEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload.test)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('disableVisualization when already scanning', () => {
        const actionName = 'disableVisualization';
        const payload: ToggleActionPayload = {
            test: VisualizationType.Issues,
        };

        const initialState = new VisualizationStoreDataBuilder()
            .with('scanning', 'headings')
            .withIssuesEnable()
            .build();

        const expectedState = new VisualizationStoreDataBuilder()
            .with('scanning', 'headings')
            .withIssuesEnable()
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('OnDisableHeadings when headings is already disable', () => {
        const actionName = 'disableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.Headings,
        };
        const initialState = dataBuilder.build();
        const expectedState = dataBuilder.build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload.test)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onEnableLandmarks when landmarks is disable', () => {
        const actionName = 'enableVisualization';
        const payload: ToggleActionPayload = {
            test: VisualizationType.Landmarks,
        };
        const initialState = new VisualizationStoreDataBuilder().build();
        const expectedState = new VisualizationStoreDataBuilder()
            .withLandmarksEnable()
            .with('scanning', 'landmarks')
            .with('injectingInProgress', true)
            .with('selectedDetailsViewPivot', DetailsViewPivotType.fastPass)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableLandmarks when landmarks is already enable', () => {
        const actionName = 'enableVisualization';
        const payload: ToggleActionPayload = {
            test: VisualizationType.Landmarks,
        };
        const initialState = new VisualizationStoreDataBuilder().withLandmarksEnable().build();

        const expectedState = new VisualizationStoreDataBuilder().withLandmarksEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onDisableLandmarks when landmarks is enable', () => {
        const actionName = 'disableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.Landmarks,
        };
        const expectedState = dataBuilder.build();
        const initialState = dataBuilder.withLandmarksEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload.test)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onDisableLandmarks when landmarks is already disable', () => {
        const actionName = 'disableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.Landmarks,
        };
        const initialState = dataBuilder.build();
        const expectedState = dataBuilder.build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload.test)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onEnableIssues when issues is disable', () => {
        const actionName = 'enableVisualization';

        const initialState = new VisualizationStoreDataBuilder().build();

        const payload: ToggleActionPayload = {
            test: VisualizationType.Issues,
        };

        const expectedState = new VisualizationStoreDataBuilder()
            .withIssuesEnable()
            .with('scanning', 'issues')
            .with('injectingInProgress', true)
            .with('selectedAdhocDetailsView', VisualizationType.Issues)
            .with('selectedDetailsViewPivot', DetailsViewPivotType.fastPass)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onEnableIssues when issues is already enable', () => {
        const actionName = 'enableVisualization';
        const payload: ToggleActionPayload = {
            test: VisualizationType.Issues,
        };
        const initialState = new VisualizationStoreDataBuilder().withIssuesEnable().build();

        const expectedState = new VisualizationStoreDataBuilder().withIssuesEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onDisableIssues when issues is enable', () => {
        const actionName = 'disableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.Issues,
        };
        const expectedState = dataBuilder.build();
        const initialState = dataBuilder.withIssuesEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload.test)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onDisableIssues when issues is already disable', () => {
        const actionName = 'disableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.Issues,
        };
        const initialState = dataBuilder.build();
        const expectedState = dataBuilder.build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload.test)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onEnableColor when color is disable', () => {
        const actionName = 'enableVisualization';

        const initialState = new VisualizationStoreDataBuilder().build();

        const payload: ToggleActionPayload = {
            test: VisualizationType.Color,
        };

        const expectedState = new VisualizationStoreDataBuilder()
            .withColorEnable()
            .with('scanning', 'color')
            .with('selectedDetailsViewPivot', DetailsViewPivotType.fastPass)
            .with('injectingInProgress', true)
            .build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onDisableColor when color is enable', () => {
        const actionName = 'disableVisualization';
        const dataBuilder = new VisualizationStoreDataBuilder();
        const payload: ToggleActionPayload = {
            test: VisualizationType.Color,
        };
        const expectedState = dataBuilder.build();
        const initialState = dataBuilder.withColorEnable().build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload.test)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onGetCurrentState', () => {
        const actionName = 'getCurrentState';
        const initialState = new VisualizationStoreDataBuilder().build();
        const expectedState = new VisualizationStoreDataBuilder().build();

        createStoreTesterForVisualizationActions(actionName).testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('enableVisualization when already scanning', () => {
        const actionName = 'enableVisualization';
        const payload: ToggleActionPayload = {
            test: VisualizationType.Issues,
        };
        const initialState = new VisualizationStoreDataBuilder().with('scanning', 'headings').build();

        const expectedState = new VisualizationStoreDataBuilder().with('scanning', 'headings').build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onInjectionCompleted', () => {
        const actionName = 'injectionCompleted';

        const initialState = new VisualizationStoreDataBuilder().build();

        const expectedState = new VisualizationStoreDataBuilder()
            .with('injectingInProgress', false)
            .with('injectingStarted', false)
            .build();

        createStoreTesterForInjectionActions(actionName).testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onInjectionStarted when injectingStarted is false', () => {
        const actionName = 'injectionStarted';

        const initialState = new VisualizationStoreDataBuilder().with('injectingStarted', false).build();

        const expectedState = new VisualizationStoreDataBuilder()
            .with('injectingInProgress', true)
            .with('injectingStarted', true)
            .build();

        createStoreTesterForInjectionActions(actionName).testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onInjectionStarted when injectingStarted is true', () => {
        const actionName = 'injectionStarted';

        const initialState = new VisualizationStoreDataBuilder().with('injectingStarted', true).build();

        const expectedState = new VisualizationStoreDataBuilder()
            .with('injectingInProgress', null)
            .with('injectingStarted', true)
            .build();

        createStoreTesterForInjectionActions(actionName).testListenerToNeverBeCalled(initialState, expectedState);
    });

    test('onScrollRequested', () => {
        const actionName = 'scrollRequested';

        const initialState = new VisualizationStoreDataBuilder().with('focusedTarget', ['target']).build();

        const expectedState = new VisualizationStoreDataBuilder().with('focusedTarget', null).build();

        const payload = {};

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onScanColorCompleted', () => {
        const actionName = 'scanCompleted';

        const initialState = new VisualizationStoreDataBuilder().with('scanning', 'color').build();

        const expectedState = new VisualizationStoreDataBuilder().with('scanning', null).build();

        const payload = {};

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onScanIssuesCompleted', () => {
        const actionName = 'scanCompleted';
        const initialState = new VisualizationStoreDataBuilder().with('scanning', 'issues').build();

        const expectedState = new VisualizationStoreDataBuilder().with('scanning', null).build();

        const payload = {};

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onScanHeadingsCompleted', () => {
        const actionName = 'scanCompleted';
        const initialState = new VisualizationStoreDataBuilder().with('scanning', 'headings').build();

        const expectedState = new VisualizationStoreDataBuilder().with('scanning', null).build();

        const payload = {};

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onScanLandmarksCompleted', () => {
        const actionName = 'scanCompleted';
        const initialState = new VisualizationStoreDataBuilder().with('scanning', 'landmarks').build();

        const expectedState = new VisualizationStoreDataBuilder().with('scanning', null).build();

        const payload = {};

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onUpdateFocusedInstance', () => {
        const actionName = 'updateFocusedInstance';

        const initialState = new VisualizationStoreDataBuilder().build();

        const payload = ['1'];

        const expectedState = new VisualizationStoreDataBuilder().withFocusedTarget(payload).build();

        createStoreTesterForVisualizationActions(actionName)
            .withActionParam(payload)
            .testListenerToBeCalledOnce(initialState, expectedState);
    });

    test('onTabChange', () => {
        const actionName = 'tabChange';
        const visualizationType = VisualizationType.Headings;
        const pivot = DetailsViewPivotType.allTest;
        const expectedState = new VisualizationStoreDataBuilder()
            .with('selectedAdhocDetailsView', visualizationType)
            .with('selectedDetailsViewPivot', pivot)
            .build();

        const initialState = new VisualizationStoreDataBuilder()
            .with('selectedAdhocDetailsView', visualizationType)
            .with('selectedDetailsViewPivot', pivot)
            .withLandmarksEnable()
            .build();

        createStoreTesterForTabActions(actionName).testListenerToBeCalledOnce(initialState, expectedState);
    });

    function createStoreTesterForTabActions(actionName: keyof TabActions): StoreTester<VisualizationStoreData, TabActions> {
        const factory = (actions: TabActions) =>
            new VisualizationStore(new VisualizationActions(), actions, new InjectionActions(), new VisualizationConfigurationFactory());

        return new StoreTester(TabActions, actionName, factory);
    }

    function createStoreTesterForVisualizationActions(
        actionName: keyof VisualizationActions,
    ): StoreTester<VisualizationStoreData, VisualizationActions> {
        const factory = (actions: VisualizationActions) =>
            new VisualizationStore(actions, new TabActions(), new InjectionActions(), new VisualizationConfigurationFactory());

        return new StoreTester(VisualizationActions, actionName, factory);
    }

    function createStoreTesterForInjectionActions(
        actionName: keyof InjectionActions,
    ): StoreTester<VisualizationStoreData, InjectionActions> {
        const factory = (actions: InjectionActions) =>
            new VisualizationStore(new VisualizationActions(), new TabActions(), actions, new VisualizationConfigurationFactory());

        return new StoreTester(InjectionActions, actionName, factory);
    }
});
