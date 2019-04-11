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

import { logger } from "@atomist/automation-client";
import { SoftwareDeliveryMachineConfiguration } from "@atomist/sdm";
import { StackSupport } from "@atomist/sdm-pack-analysis";
import { Categories } from "@atomist/sdm-pack-spring";
import * as _ from "lodash";
import { buildSystemScanner } from "./buildSystemScanner";
import { GradleBuildInterpreter } from "./GradleBuildInterpreter";
import { MavenBuildInterpreter } from "./MavenBuildInterpreter";
import { SpringBootMavenTransformRecipeContributor } from "./SpringBootMavenTransformRecipeContributor";
import { springBootScanner } from "./springBootScanner";
import { SpringBootInterpreter } from "./SpringBootInterpreter";

/**
 * Java stack support based on sdm-pack-analysis. Used in Uhura-based SDMs.
 * @return {StackSupport}
 */
export function javaStackSupport(): StackSupport {
    return {
        scanners: [buildSystemScanner],
        interpreters: [
            new GradleBuildInterpreter(),
            new MavenBuildInterpreter(),
        ],
        transformRecipeContributors: [],
    };
}

/**
 * Spring stack support based on sdm-pack-analysis. Used in Uhura-based SDMs.
 * Uses sdm.spring.deployLocally and sdm.spring.review, to be used with the javaSupport stack.
 * @return {StackSupport}
 */
export function springBootStackSupport(configuration: SoftwareDeliveryMachineConfiguration): StackSupport {
    const reviewCategories: Categories = _.get(configuration, "sdm.spring.review", {
        springStyle: true,
        cloudNative: true,
    });

    return {
        scanners: [springBootScanner],
        interpreters: [
            new SpringBootInterpreter(reviewCategories),
        ],
        transformRecipeContributors: [{
            originator: "spring-boot-maven",
            optional: false,
            contributor: new SpringBootMavenTransformRecipeContributor(),
        }],
    };
}
