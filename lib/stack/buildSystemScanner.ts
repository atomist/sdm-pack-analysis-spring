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
    Project,
    projectUtils,
} from "@atomist/automation-client";
import { SdmContext } from "@atomist/sdm";
import {
    FastProject,
    TechnologyScanner,
    TechnologyStack,
} from "@atomist/sdm-pack-analysis";
import {
    PhasedTechnologyScanner,
    TechnologyClassification,
} from "@atomist/sdm-pack-analysis/lib/analysis/TechnologyScanner";
import { IsMaven } from "@atomist/sdm-pack-spring";
import { IsGradle } from "@atomist/sdm-pack-spring/lib/gradle/pushtest/gradlePushTests";

export enum BuildSystem {
    Maven,
    Gradle,
}

/**
 * Stack information on the used build system. Currently supports Gradle and Maven.
 */
export interface BuildSystemStack extends TechnologyStack {

    name: "javabuild";

    /**
     * Which build system is used.
     */
    buildSystem: BuildSystem;

    /**
     * Whether the project has a dockerfile
     */
    hasDockerFile: boolean;
}

export class BuildSystemScanner implements PhasedTechnologyScanner<BuildSystemStack> {

    public async classify(p: FastProject, ctx: SdmContext): Promise<TechnologyClassification | undefined> {
        return classify(p);
    }

    get scan(): TechnologyScanner<BuildSystemStack> {
        return buildSystemScanner;
    }
}

/**
 * Classify the provided project
 */
async function classify(p: FastProject): Promise<TechnologyClassification> {
    const isMaven = await p.hasFile("pom.xml");
    if (!!isMaven) {
        return {
            name: "maven",
            tags: ["maven"],
            messages: [],
        };
    }

    const isGradle = await p.hasFile("build.gradle") || await p.hasFile("build.gradle.kts");
    if (!!isGradle) {
        return {
            name: "gradle",
            tags: ["gradle"],
            messages: [],
        };
    }

    return undefined;
}

/**
 * Scanner that adds build system information to the interpretation.
 */
export async function buildSystemScanner(p: Project): Promise<BuildSystemStack> {
    const isMaven = await IsMaven.predicate(p);
    const isGradle = await IsGradle.predicate(p);

    const dockerFile = await p.hasFile("Dockerfile") ? "Dockerfile" : undefined;

    if (!isMaven && !isGradle) {
        return undefined;
    }

    const stack: BuildSystemStack = {
        name: "javabuild",
        buildSystem: isGradle ? BuildSystem.Gradle : BuildSystem.Maven,
        tags: isGradle ? ["gradle"] : ["maven"],
        hasDockerFile: !!dockerFile,
    };

    return stack;
}
