import { createResultWindow } from './index';
const fs = require('fs');
const path = require('path');

export function searchFindingsJava(filePath : string) {
    fs.readFile(filePath, 'utf8', (err : string, data : string) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        if (filePath.endsWith('.properties')) {
            const propertiesToCheck = ['spring.datasource.url', 'spring.datasource.username', 'spring.datasource.password', 'app.secret-key'];
            propertiesToCheck.forEach(property => {
                const propertyRegex = new RegExp(`${property}=\\$\\{.*\\}`, 'g');
                const matches = data.match(propertyRegex);
                if (matches) {
                    matches.forEach(match => {
                        let newFilePath = splitPath(filePath);
                        fs.appendFile(path.join(__dirname, '../resultFile.txt'), `Env. variable "${match}" in file "${newFilePath}"\n`, (err : string) => {
                            if (err) {
                                console.error('Error appending to result file from properties:', err);
                            }
                        });
                    });
                }
            });
        }
        if (filePath.endsWith('.java')) {
            const annotationRegex = /@(\w+)\(([^)]*)\)/g;
            let match;
            while ((match = annotationRegex.exec(data)) !== null) {
                let newFilePath = splitPath(filePath);
                fs.appendFile(path.join(__dirname, '../resultFile.txt'), `Annotation "${match[1]}" with arguments "${match[2]}" in file "${newFilePath}"\n`, (err : string) => {
                    if (err) {
                        console.error('Error appending to result file from java file:', err);
                    }
                });
            }
        }
        if (filePath.endsWith('.xml')) {
            const artifactIdRegex = /<artifactId>(.*?)<\/artifactId>/g;
            let match;
            while ((match = artifactIdRegex.exec(data)) !== null) {
                let newFilePath = splitPath(filePath);
                fs.appendFile(path.join(__dirname, '../resultFile.txt'), `Artifact ID "${match[1]}"\n`, (err : string) => {
                    if (err) {
                        console.error('Error appending to result file from XML file:', err);
                    }
                });
            }
        }
    });
}
function splitPath(string : string){
    let matchJ = string.match(/src(.*)/);
    let matchP = string.match(/src(.*)/);
    if (matchJ) {
        let remainingString = matchJ[1];
        return (remainingString);
    } else {
        console.log("Not correct code for Spring Boot Project.");
    }
    if(matchP) {
        let remainingString = matchP[1];
        return (remainingString);
    } else {
        console.log("Not correct code for Spring Boot Project.")
    }
}

export async function formatResultsJava(){
    try {
        const filePath = path.join(__dirname, '../resultFile.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');
        let lastJavaFileName = '';
        let data = '';
        let error = "";
        let counter = 0;
        let active = false;
        const matches = ["@GetMapping", "@PostMapping", "@PutMapping", "@PatchMapping", "@DeleteMapping"];
        const replacements = {
            "spring-boot-starter-parent": `"spring-boot-starter-parent:" ${springBbootStarterParent}`,
            "spring-boot-starter-data-jpa":`"spring-boot-starter-data-jp:" ${springBootStarterDataJpa}`,
            "spring-boot-starter-web": `"spring-boot-starter-web:" ${springBootStarterWeb}`,
            "h2": `"h2:" ${h2}`,
            "spring-boot-devtools": `"spring-boot-devtools:" ${springBootDevtools}`,
            "mysql-connector-j": `"mysql-connector-j:" ${mysqlConnectorJ}`,
            "lombok": `"lombok:" ${lombok}`,
            "spring-boot-starter-oauth2-resource-server": `"spring-boot-starter-oauth2-resource-server:" ${springBootStarterOauth2ResourceServer}`,
            "spring-security-test": `"spring-security-test:" ${springSecurityTest}`,
            "spring-boot-starter-security": `"spring-boot-starter-security:" ${springBootStarterSecurity}`,
            "spring-boot-starter-test": `"spring-boot-starter-test:" ${springBootStarterTest}`,
            "spring-boot-maven-plugin": `"spring-boot-maven-plugin:" ${springBootMavenPlugin}`
        };

        // Process lines except artifact IDs
        lines.forEach((line: string)  => {
            const javaFileNameMatch = line.match(/\\([^\\]+\.java)/);
            if (javaFileNameMatch) {
                const javaFileName = javaFileNameMatch[1];
                if (javaFileName !== lastJavaFileName) {
                    data += `${error} \n`
                    error = "";
                    active = false;
                    lastJavaFileName = javaFileName;
                    data += `\nDirectory: ${javaFileName}\n`;
                }
            }
            if(line.includes("Controller")){
                active = true;
                counter = 0;   
            }
            if (active) {
                const mappingAnnotation = matches.find(mapping => line.includes(mapping));
                if (mappingAnnotation !== undefined) {
                    if (matches.indexOf(mappingAnnotation) === counter) {
                        data += line + '\n';
                        counter++;
                    } else {
                        error += `!!! ERROR: Not using REST API conventions !!!`
                    }
                }
            }
            data += line + '\n';
        });

        // Process and replace artifact IDs or skip lines
        lines.forEach((line: string) => {
            const artifactIdMatch = line.match(/Artifact ID "(.*?)"/);
            if (artifactIdMatch) {
                const artifactId = artifactIdMatch[1];
                if (artifactId in replacements) {
                    const replacement = replacements[artifactId as keyof typeof replacements];
                    data = data.replace(`Artifact ID "${artifactId}"`, `${replacement}`);
                } else {
                    // Skip lines with artifact IDs not present in the replacements list
                    console.error(`Artifact ID "${artifactId}" does not correlate with any specified replacements. Skipping...`);
                    data = data.replace(new RegExp(`Artifact ID "${artifactId}"\\n`, "g"), "");
                }
            }
        });

        createResultWindow(data);
    } catch (error) {
        console.error('Error reading result file:', error);
    }
}

const springBbootStarterParent = "\nThe spring-boot-starter-parent is a special starter that provides useful Maven defaults.\n It also provides a dependency-management section so that you can omit version tags for “blessed” dependencies.\n";
const springBootStarterDataJpa = "\nSpring Data JPA focuses on using JPA to store data in a relational database.\n Its most compelling feature is the ability to create repository implementations automatically, at runtime,\n from a repository interface. CustomerRepository extends the CrudRepository interface.\n";
const springBootDevtools = "\nWith DevTools when we make changes to Java code or properties file, the application\n gets updated with new changes. It monitors for changes and automatically restarts the application\n";
const mysqlConnectorJ = "\nConnector/J implements the Java Database Connectivity (JDBC) API, as well as a number of\n value-adding extensions of it. It also supports the new X DevAPI.\n MySQL Connector/J is a JDBC Type 4 driver, implementing the JDBC 4.2 specification.\n";
const springBootStarterWeb = "\nUses Spring MVC, REST, and Tomcat as a default embedded server. The single \nspring-boot-starter-web dependency can pull in all dependencies related to web development.\n It also reduces the count of build dependency.\n";
const springBootStarterTest = "\nThe spring-boot-starter-test is the primary dependency that contains the majority\n of elements required for our tests. The H2 DB is our in-memory database.\n It eliminates the need for configuring and starting an actual database for test purposes.\n";
const springBootStarterOauth2ResourceServer = "\nThe spring-boot-starter-oauth2-resource-server starter module simplifies the setup\n and configuration of a Spring Boot application to act as an OAuth 2.0 resource server.\n It includes all the necessary dependencies, configurations, and default implementations to\n secure your application's resources using OAuth 2.0 protocols.\n";
const lombok = "\nLombok provides a set of annotations that you can use to trigger code generation.\n For example, @Getter generates getter methods for fields, @Setter generates setter methods,\n @NoArgsConstructor generates a no-argument constructor, and so on.\n";
const springSecurityTest = "\nSpring Security encourages writing tests to verify the behavior of security configurations\n and features in your application. The spring-security-test module facilitates integration testing\n by providing mock authentication mechanisms, security test utilities, and other tools to simulate security scenarios during testing.\n";
const springBootStarterSecurity = "\nWith spring-boot-starter-security, developers can easily implement authentication and\n authorization mechanisms in their applications. It supports various\n authentication methods such as form-based authentication, HTTP basic authentication, OAuth, and more.\n";
const h2 = "\nH2 is a lightweight, in-memory database engine that is commonly used for development and testing purposes.\n It allows developers to quickly spin up a database instance without requiring any external dependencies or setup.\n";
const springBootMavenPlugin = "\nspring-boot-maven-plugin is to package Spring Boot applications for deployment.\n It allows developers to create executable JAR or WAR files that contain\n all the necessary dependencies to run the application.\n";