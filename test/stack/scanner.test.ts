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
    GitCommandGitProject,
    GitHubRepoRef,
    InMemoryProject,
    InMemoryProjectFile,
    Project,
} from "@atomist/automation-client";
import * as assert from "power-assert";
import { springBootScanner } from "../../lib/stack/springBootScanner";

describe("springBootScanner", () => {

    it("finds no starters in non-full scan", async () => {
        const p = await GitCommandGitProject.cloned(undefined, SpringRestSeed);
        const projectAnalysis = await springBootScanner(p, undefined, undefined, { full: false });
        assert(!projectAnalysis.starters);
    }).timeout(10000);

    it("finds starters in full scan", async () => {
        const p = await GitCommandGitProject.cloned(undefined, SpringRestSeed);
        const projectAnalysis = await springBootScanner(p, undefined, undefined, { full: true });
        assert(!!projectAnalysis.dependencies);
        assert(projectAnalysis.starters.length > 0);
        projectAnalysis.starters.forEach(s =>
            assert(s.artifact.includes("starter"), `Non-starter \`${s.artifact}\``));
    }).timeout(10000);

});

export const SpringRestSeed = GitHubRepoRef.from({ owner: "atomist-seeds", repo: "spring-rest-seed" });

export const javaSource =
    `package com.smashing.pumpkins;

@SpringBootApplication
class GishApplication {
    //1
}

`;

export const kotlinSource =
    `package com.smashing.pumpkins

@SpringBootApplication
class GishApplication {
}

`;

const SimplePom = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>flux-flix-service</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>flux-flix-service</name>
    <description>Demo project for Spring Boot</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.0.0.BUILD-SNAPSHOT</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
</project>
`;

export const GishJavaPath = "src/main/java/com/smashing/pumpkins/Gish.java";

export const gishProject: () => Project = () => InMemoryProject.from(
    { owner: "smashing-pumpkins", repo: "gish", url: "" },
    {
        path: GishJavaPath,
        content: javaSource,
    }, {
        path: "pom.xml",
        content: SimplePom,
    },
);
