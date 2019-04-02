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
    isMaterialChange,
} from "@atomist/sdm";
import { Version } from "@atomist/sdm-core";
import {
    AutofixRegisteringInterpreter,
    CodeInspectionRegisteringInterpreter,
    Interpretation,
    Interpreter,
} from "@atomist/sdm-pack-analysis";
import { Build } from "@atomist/sdm-pack-build";
import { DockerBuild } from "@atomist/sdm-pack-docker";
import {
    gradleBuilder,
} from "@atomist/sdm-pack-spring";
import {
    GradleBuild,
    GradleDefaultOptions,
    GradleProjectVersioner,
    GradleVersion,
} from "@atomist/sdm-pack-spring/lib/gradle/build/helpers";
import { BuildSystemStack } from "./buildSystemScanner";

/**
 * Interpreter that adds a gradle build goal when Gradle is found in the project's interpretation.
 * @see buildSystemScanner
 */
export class GradleBuildInterpreter implements Interpreter, AutofixRegisteringInterpreter, CodeInspectionRegisteringInterpreter {

    // This includes test goal
    private readonly gradleBuildGoal: Build = new Build()
        .with({
            ...GradleDefaultOptions,
            builder: gradleBuilder(),
        });

    private readonly gradleVersionGoal: Version = new Version()
        .with({
            ...GradleDefaultOptions,
            versioner: GradleProjectVersioner,
        });

    private readonly dockerBuildGoal: DockerBuild = new DockerBuild()
        .with({
        })
        .withProjectListener(GradleVersion)
        .withProjectListener(GradleBuild);

    public async enrich(interpretation: Interpretation): Promise<boolean> {
        const buildSystemStack = interpretation.reason.analysis.elements.javabuild as BuildSystemStack;
        if (buildSystemStack.buildSystem !== "gradle") {
            return false;
        }
        const buildGoals = goals("build")
            .plan(this.gradleVersionGoal)
            .plan(this.gradleVersionGoal)
            .plan(this.gradleBuildGoal).after(this.gradleVersionGoal);
        if (buildSystemStack.hasDockerFile) {
            interpretation.containerBuildGoals = goals("docker-build")
                .plan(this.dockerBuildGoal);
        }
        interpretation.buildGoals = buildGoals;
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
