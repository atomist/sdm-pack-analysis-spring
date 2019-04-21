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

import { SdmContext } from "@atomist/sdm";
import {
    Dependency,
    FastProject,
    TechnologyScanner,
    TechnologyStack,
} from "@atomist/sdm-pack-analysis";
import {
    PhasedTechnologyScanner,
    TechnologyClassification,
} from "@atomist/sdm-pack-analysis/lib/analysis/TechnologyScanner";
import {
    findDependenciesFromEffectivePom,
    HasSpringBootPom,
    IsMaven,
    SpringBootProjectStructure,
    SpringBootVersionInspection,
} from "@atomist/sdm-pack-spring";
import { logger } from "@atomist/automation-client";

export interface SpringBootStack extends TechnologyStack {

    name: "springboot";

    /**
     * Version of Spring Boot in use
     */
    version: string;

    structure: SpringBootProjectStructure;

    /**
     * If this is a full analysis, the Spring Boot starters we found in the effective POM
     */
    starters?: Dependency[];

}

export class SpringBootScanner implements PhasedTechnologyScanner<SpringBootStack> {

    public async classify(p: FastProject, ctx: SdmContext): Promise<TechnologyClassification | undefined> {
        const pom = await p.getFile("pom.xml");
        if (!!pom) {
            const isBoot = (await pom.getContent()).includes("spring-boot");
            if (!isBoot) {
                return {
                    name: "springboot",
                    tags: ["spring", "spring-boot"],
                    messages: [],
                };
            }
        }
        return undefined;
    }

    get scan(): TechnologyScanner<SpringBootStack> {
        return springBootScanner;
    }
}

export const springBootScanner: TechnologyScanner<SpringBootStack> = async (p, ctx, analysis, opts) => {
    const isMaven = await IsMaven.predicate(p);
    if (isMaven) {
        const isBoot = await HasSpringBootPom.predicate(p);
        if (!isBoot) {
            return undefined;
        }
        const structure = await SpringBootProjectStructure.inferFromJavaOrKotlinSource(p);
        if (!structure) {
            return undefined;
        }
        const versions = await SpringBootVersionInspection(p, undefined);

        // Only compute dependencies in a full analysis
        let dependencies: Dependency[];
        try {
            dependencies = opts.full ?
                await findDependenciesFromEffectivePom(p) :
                undefined;
        } catch (err) {
            logger.warn("Unable to find dependencies for project at %s", p.id.url, err.msg);
        }
        const starters = !!dependencies ?
            dependencies.filter(s => s.artifact.includes("starter")) :
            undefined;

        return {
            // TODO get from Maven POM
            projectName: structure.applicationClass,
            name: "springboot",
            tags: ["spring", "spring-boot"],
            structure,
            dependencies,
            starters,
            version: versions.versions.length > 0 ? versions.versions[0].version : undefined,
            // TODO gather this from properties and YAML
            referencedEnvironmentVariables: [],
        };
    } else {
        return undefined;
    }
};
