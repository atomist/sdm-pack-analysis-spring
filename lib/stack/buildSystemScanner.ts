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
    TechnologyScanner,
    TechnologyStack,
} from "@atomist/sdm-pack-analysis";
import {
    IsMaven,
} from "@atomist/sdm-pack-spring";
import { IsGradle } from "@atomist/sdm-pack-spring/lib/gradle/pushtest/gradlePushTests";

export interface BuildSystemStack extends TechnologyStack {

    name: "javabuild";

    /**
     * Version of Spring Boot in use
     */
    buildSystem: "maven"|"gradle";
}

export const buildSystemScanner: TechnologyScanner<BuildSystemStack> = async p => {
    const isMaven = await IsMaven.predicate(p);
    const isGradle = await IsGradle.predicate(p);

    if (!isMaven && !isGradle) {
        return undefined;
    }

    const stack: BuildSystemStack = {
        name: "javabuild",
        buildSystem: isGradle ? "gradle" : "maven",
        tags: isGradle ? ["gradle"] : ["maven"],
    };
    return stack;
};
