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

import { projectUtils } from "@atomist/automation-client";
import {
    AutofixRegistration,
    CodeInspectionRegistration,
    goals,
    isMaterialChange,
    LogSuppressor,
} from "@atomist/sdm";
import {
    cachePut,
    cacheRemove,
    cacheRestore,
    GoalCacheOptions,
    Tag,
    Version,
} from "@atomist/sdm-core";
import {
    AutofixRegisteringInterpreter,
    CodeInspectionRegisteringInterpreter,
    Interpretation,
    Interpreter,
} from "@atomist/sdm-pack-analysis";
import { Build } from "@atomist/sdm-pack-build";
import {
    DockerBuild,
    DockerProgressReporter,
} from "@atomist/sdm-pack-docker";
import {
    gradleBuilder,
    GradleVersionInspection,
} from "@atomist/sdm-pack-spring";
import {
    GradleBuild,
    GradleDefaultOptions,
    GradleProjectVersioner,
    GradleVersion,
} from "@atomist/sdm-pack-spring/lib/gradle/build/helpers";
import {
    BuildSystem,
    BuildSystemStack,
} from "./buildSystemScanner";

/**
 * Interpreter that adds a gradle build goal when Gradle is found in the project's interpretation.
 * @see buildSystemScanner
 */
export class GradleBuildInterpreter implements Interpreter, AutofixRegisteringInterpreter, CodeInspectionRegisteringInterpreter {

    private readonly gradleJarCache: GoalCacheOptions = {
        entries: [{classifier: "jars", pattern: "**/build/libs/*.jar"}],
        onCacheMiss: [GradleVersion, GradleBuild],
    };

    // This includes test goal
    private readonly gradleBuildGoal: Build = new Build()
        .with({
            ...GradleDefaultOptions,
            builder: gradleBuilder(),
        })
        .withProjectListener(GradleVersion)
        .withProjectListener(cachePut(this.gradleJarCache));

    private readonly tagGoal: Tag = new Tag();

    private readonly gradleVersionGoal: Version = new Version()
        .with({
            ...GradleDefaultOptions,
            versioner: GradleProjectVersioner,
        });

    private readonly dockerBuildGoal: DockerBuild = new DockerBuild()
        .with({
            progressReporter: DockerProgressReporter,
            logInterpreter: LogSuppressor,
        })
        .withProjectListener(cacheRestore(this.gradleJarCache))
        .withProjectListener(cacheRemove(this.gradleJarCache));

    public async enrich(interpretation: Interpretation): Promise<boolean> {
        const buildSystemStack = interpretation.reason.analysis.elements.javabuild as BuildSystemStack;
        if (!buildSystemStack) {
            return false;
        }
        if (buildSystemStack.buildSystem !== BuildSystem.Gradle) {
            return false;
        }
        const buildGoals = goals("build")
            .plan(this.gradleVersionGoal)
            .plan(this.gradleBuildGoal).after(this.gradleVersionGoal);
        if (buildSystemStack.hasDockerFile) {
            interpretation.containerBuildGoals = goals("docker build")
                .plan(this.dockerBuildGoal);
        }
        interpretation.buildGoals = buildGoals;
        interpretation.releaseGoals = goals("release").plan(this.tagGoal);
        interpretation.materialChangePushTests.push(isMaterialChange({
            extensions: ["java", "kt", "kts", "xml", "properties", "gradle", "yml", "json", "pug", "html", "css", "Dockerfile"],
            directories: [".atomist"],
        }));
        interpretation.inspections.push(...this.codeInspections);
        return true;
    }

    get autofixes(): AutofixRegistration[] {
        return [];
    }

    get codeInspections(): Array<CodeInspectionRegistration<any>> {
        return [
            GradleVersionInspection,
        ];
    }
}
