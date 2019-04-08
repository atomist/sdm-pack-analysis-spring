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
import { Version } from "@atomist/sdm-core";
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
    mavenBuilder,
    MavenDefaultOptions,
    MavenProjectVersioner,
    MvnPackage,
    MvnVersion,
} from "@atomist/sdm-pack-spring";
import {
    BuildSystem,
    BuildSystemStack,
} from "./buildSystemScanner";

/**
 * Interpreter that adds a Maven build goal when Maven is found in the project's interpretation.
 * @see buildSystemScanner
 */
export class MavenBuildInterpreter implements Interpreter, AutofixRegisteringInterpreter, CodeInspectionRegisteringInterpreter {

    // This includes test goal
    private readonly mavenBuildGoal: Build = new Build()
        .with({
            ...MavenDefaultOptions,
            builder: mavenBuilder(),
        });

    private readonly mavenVersionGoal: Version = new Version()
        .with({
            ...MavenDefaultOptions,
            versioner: MavenProjectVersioner,
        });

    private readonly dockerBuildGoal: DockerBuild = new DockerBuild()
        .with({
            progressReporter: DockerProgressReporter,
            logInterpreter: LogSuppressor,
            options: {
                dockerfileFinder: async p => {
                    let dockerfile: string = "Dockerfile";
                    await projectUtils.doWithFiles(p, "**/Dockerfile", async f => {
                        dockerfile = f.path;
                    });
                    return dockerfile;
                },
            },
        })
        .withProjectListener(MvnVersion)
        .withProjectListener(MvnPackage);

    public async enrich(interpretation: Interpretation): Promise<boolean> {
        const buildSystemStack = interpretation.reason.analysis.elements.javabuild as BuildSystemStack;
        if (!buildSystemStack) {
            return false;
        }
        if (buildSystemStack.buildSystem !== BuildSystem.maven) {
            return false;
        }
        interpretation.buildGoals = goals("build")
            .plan(this.mavenVersionGoal)
            .plan(this.mavenBuildGoal).after(this.mavenVersionGoal);
        if (buildSystemStack.hasDockerFile) {
            interpretation.containerBuildGoals = goals("docker-build")
                .plan(this.dockerBuildGoal);
        }
        interpretation.materialChangePushTests.push(isMaterialChange({
            extensions: ["java", "kt", "kts", "xml", "properties", "yml", "json", "pug", "html", "css", "Dockerfile"],
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
