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

import { SoftwareDeliveryMachine } from "@atomist/sdm";
import { StackSupport } from "@atomist/sdm-pack-analysis";
import { Categories } from "@atomist/sdm-pack-spring";
import * as _ from "lodash";
import { BuildSystemScanner } from "./buildSystemScanner";
import { GradleBuildInterpreter } from "./GradleBuildInterpreter";
import { MavenBuildInterpreter } from "./MavenBuildInterpreter";
import { SpringBootInterpreter } from "./SpringBootInterpreter";
import { SpringBootMavenTransformRecipeContributor } from "./SpringBootMavenTransformRecipeContributor";
import { SpringBootScanner } from "./springBootScanner";

/**
 * Java stack support based on sdm-pack-analysis. Used in Uhura-based SDMs.
 * @return {StackSupport}
 */
export function javaStackSupport(sdm: SoftwareDeliveryMachine): StackSupport {
    return {
        scanners: [new BuildSystemScanner()],
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
export function springBootStackSupport(sdm: SoftwareDeliveryMachine): StackSupport {
    const reviewCategories: Categories = _.get(sdm.configuration, "sdm.spring.review", {
        springStyle: true,
        cloudNative: true,
    });

    return {
        scanners: [new SpringBootScanner()],
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
