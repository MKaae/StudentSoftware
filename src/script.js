import { createResultWindow } from './index.ts';
const fs = require('fs');
const path = require('path');
const downloadDir = path.join(__dirname, 'temp_repo');
const simpleGit = require('simple-git');

export function checkRepo(input) {
    downloadRepository(input);
}

async function downloadRepository(input) {
    try {
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        fs.writeFileSync(path.join(__dirname, '../resultFile.txt'), 'New Repo Check\n\n');

        const git = simpleGit(downloadDir);
        await git.clone(input);
        await traverseDirectory(downloadDir);
        await deleteTempRepo();
        await formatResults();
    } catch (error) {
        console.error("Error downloading repository:", error);
    }
}

async function traverseDirectory(directoryPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                reject(err);
                return;
            }

            let promises = [];
            files.forEach(file => {
                const filePath = path.join(directoryPath, file);
                promises.push(new Promise((resolve, reject) => {
                    fs.stat(filePath, (err, stats) => {
                        if (err) {
                            console.error('Error stating file:', err);
                            reject(err);
                            return;
                        }

                        if (stats.isDirectory()) {
                            traverseDirectory(filePath).then(resolve).catch(reject);
                        } else if (stats.isFile()) {
                            if (filePath.endsWith('.java')) {
                                searchFindings(filePath);
                            }
                            if (filePath.endsWith('.properties')) {
                                searchFindings(filePath);
                            }
                            resolve();
                        }
                    });
                }));
            });
            Promise.all(promises).then(resolve).catch(reject);
        });
    });
}

function searchFindings(filePath) {
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


async function deleteTempRepo() {
    return new Promise((resolve, reject) => {
        fs.rm(downloadDir, { recursive: true }, (err) => {
            if (err) {
                console.error('Error deleting temp_repo:', err);
                reject(err);
                return;
            }
            console.log('temp_repo deleted successfully');
            resolve();
        });
    });
}

async function formatResults(){
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