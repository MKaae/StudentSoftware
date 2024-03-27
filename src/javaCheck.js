import { createResultWindow } from './index.ts';
const fs = require('fs');
const path = require('path');

export function searchFindingsJava(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
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
                        fs.appendFile(path.join(__dirname, '../resultFile.txt'), `Env. variable "${match}" in file "${newFilePath}"\n`, (err) => {
                            if (err) {
                                console.error('Error appending to result file from properties:', err);
                            }
                        });
                    });
                }
            });
        }
        if (filePath.endsWith('.java')) {
            const annotationRegex = /@\w+\b/g;
            let match;
            while ((match = annotationRegex.exec(data)) !== null) {
                let newFilePath = splitPath(filePath);
                fs.appendFile(path.join(__dirname, '../resultFile.txt'), `Annotation "${match[0]}" in file "${newFilePath}"\n`, (err) => {
                    if (err) {
                        console.error('Error appending to result file from java file:', err);
                    }
                });
            }
        }
    });
}
function splitPath(string){
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
        const matches = ["@GetMapping", "@PostMappnig", "@PutMapping", "@PatchMapping", "@DeleteMapping"];
        lines.forEach(line => {
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
        createResultWindow(data);
    } catch (error) {
        console.error('Error reading result file:', error);
    }
}