/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    AutoInspectRegistration,
    SdmContext,
} from "@atomist/sdm";
import {
    CodeInspectionRegisteringInterpreter,
    Interpretation,
} from "@atomist/sdm-pack-analysis";
import {
    Categories,
    HardcodedPropertyReviewer,
    ImportDotStarReviewer,
    ImportIoFileReviewer,
    ProvidedDependencyReviewer,
} from "@atomist/sdm-pack-spring";
import { NonSpecificMvcAnnotationsReviewer } from "@atomist/sdm-pack-spring/lib/spring/review/findNonSpecificMvcAnnotations";
import { MutableInjectionsReviewer } from "@atomist/sdm-pack-spring/lib/spring/review/mutableInjectionsReviewer";
import { OldSpringBootVersionReviewer } from "@atomist/sdm-pack-spring/lib/spring/review/oldSpringBootVersionReviewer";
import { UnnecessaryComponentScanReviewer } from "@atomist/sdm-pack-spring/lib/spring/transform/removeUnnecessaryComponentScanAnnotations";
/**
 * Review every push with the given inspections, based on configuration
 */
export class SpringReviewInterpreter implements CodeInspectionRegisteringInterpreter {

    public readonly codeInspections: Array<AutoInspectRegistration<any, any>>;

    public async enrich(interpretation: Interpretation, sdmContext: SdmContext): Promise<boolean> {
        interpretation.inspections.push(...this.codeInspections);
        return true;
    }

    public constructor(categories: Categories) {
        this.codeInspections = [];
        if (categories.cloudNative) {
            this.codeInspections.push(ImportIoFileReviewer);
            this.codeInspections.push(ImportDotStarReviewer);
            this.codeInspections.push(HardcodedPropertyReviewer);
            this.codeInspections.push(ProvidedDependencyReviewer);
        }
        if (categories.springStyle) {
            this.codeInspections.push(OldSpringBootVersionReviewer);
            this.codeInspections.push(UnnecessaryComponentScanReviewer);
            this.codeInspections.push(MutableInjectionsReviewer);
            this.codeInspections.push(NonSpecificMvcAnnotationsReviewer);
        }
    }

}
