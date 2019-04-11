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
    Interpreter,
} from "@atomist/sdm-pack-analysis";
import {
    Categories,
    HardcodedPropertyReviewer,
    ImportDotStarReviewer,
    ImportIoFileReviewer,
    MutableInjectionsReviewer,
    NonSpecificMvcAnnotationsReviewer,
    OldSpringBootVersionReviewer,
    ProvidedDependencyReviewer,
    UnnecessaryComponentScanReviewer,
} from "@atomist/sdm-pack-spring";
import { SpringBootStack } from "./springBootScanner";

/**
 * Review every push with with Spring specific support.
 */
export class SpringBootInterpreter implements Interpreter, CodeInspectionRegisteringInterpreter {

    public readonly categories: Categories;

    public constructor(categories: Categories) {
        this.categories = categories;
    }

    public async enrich(interpretation: Interpretation, sdmContext: SdmContext): Promise<boolean> {
        const springBootStack = interpretation.reason.analysis.elements.springboot as SpringBootStack;
        if (!springBootStack) {
            return false;
        }

        interpretation.inspections.push(...this.codeInspections);
        return true;
    }

    get codeInspections(): Array<AutoInspectRegistration<any, any>> {
        const codeInspections: Array<AutoInspectRegistration<any, any>> = [];
        if (this.categories.cloudNative) {
            codeInspections.push(ImportIoFileReviewer);
            codeInspections.push(ImportDotStarReviewer);
            codeInspections.push(HardcodedPropertyReviewer);
            codeInspections.push(ProvidedDependencyReviewer);
        }
        if (this.categories.springStyle) {
            codeInspections.push(OldSpringBootVersionReviewer);
            codeInspections.push(UnnecessaryComponentScanReviewer);
            codeInspections.push(MutableInjectionsReviewer);
            codeInspections.push(NonSpecificMvcAnnotationsReviewer);
        }
        return codeInspections;
    }

    // TODO add support for Spring Format
}
