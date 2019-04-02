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
    AutofixRegistration,
    CodeInspectionRegistration,
    goals,
    Goals,
    GoalsBuilder,
    isMaterialChange,
} from "@atomist/sdm";
import {
    AutofixRegisteringInterpreter,
    CodeInspectionRegisteringInterpreter,
    Interpretation,
    Interpreter,
} from "@atomist/sdm-pack-analysis";
import { Build } from "@atomist/sdm-pack-build";
import {
    gradleBuilder,
} from "@atomist/sdm-pack-spring";
import { GradleDefaultOptions } from "@atomist/sdm-pack-spring/lib/gradle/build/helpers";
import { BuildSystemStack } from "./buildSystemScanner";

export class GradleBuildInterpreter implements Interpreter, AutofixRegisteringInterpreter, CodeInspectionRegisteringInterpreter {

    // This includes test goal
    private readonly mavenBuildGoal: Build = new Build()
        .with({
            ...GradleDefaultOptions,
            builder: gradleBuilder(),
        });

    public async enrich(interpretation: Interpretation): Promise<boolean> {
        const buildSystemStack = interpretation.reason.analysis.elements.javabuild as BuildSystemStack;
        if (buildSystemStack.buildSystem !== "gradle") {
            return false;
        }
        interpretation.buildGoals = goals("build")
        // .plan(this.versionGoal)
            .plan(this.mavenBuildGoal); // .after(this.versionGoal);

        let checkGoals: Goals & GoalsBuilder = goals("checks");
        if (!!interpretation.checkGoals) {
            checkGoals = goals("checks").plan(interpretation.checkGoals).plan(interpretation.checkGoals);
        }
        interpretation.checkGoals = checkGoals;

        interpretation.materialChangePushTests.push(isMaterialChange({
            extensions: ["java", "kt", "kts", "xml", "properties", "gradle", "yml", "json", "pug", "html", "css", "Dockerfile"],
            directories: [".atomist"],
        }));

        return true;
    }

    get autofixes(): AutofixRegistration[] {
        return [];
    }

    get codeInspections(): Array<CodeInspectionRegistration<any>> {
        return [];
    }
}
