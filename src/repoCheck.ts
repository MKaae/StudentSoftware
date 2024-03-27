import { searchFindingsJava, formatResultsJava } from "./javaCheck.js";
const fs = require('fs');
const path = require('path');
const downloadDir = path.join(__dirname, 'temp_repo');
const simpleGit = require('simple-git');

export function checkRepo(input : string) {
    downloadRepository(input);
}

async function downloadRepository(input : string) {
    try {
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        fs.writeFileSync(path.join(__dirname, '../resultFile.txt'), 'New Repo Check\n\n');

        const git = simpleGit(downloadDir);
        await git.clone(input);
        await traverseDirectory(downloadDir);
        await deleteTempRepo();
        await formatResultsJava();
    } catch (error) {
        console.error("Error downloading repository:", error);
    }
}

async function traverseDirectory(directoryPath: string) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err : NodeJS.ErrnoException | null, files : string[]) => {
            if (err) {
                console.error('Error reading directory:', err);
                reject(err);
                return;
            }

            let promises: Promise<any>[] = [];
            files.forEach(file => {
                const filePath = path.join(directoryPath, file);
                promises.push(new Promise((resolve, reject) => {
                    fs.stat(filePath, (err : string, fileStats : string) => {
                        if (err) {
                            console.error('Error stating file:', err);
                            reject(err);
                            return;
                        }

                        const stats = fs.statSync(filePath);
                        if (stats.isDirectory()) {
                            traverseDirectory(filePath).then(resolve).catch(reject);
                        } else if (stats.isFile()) {
                            if (filePath.endsWith('.java')) {
                                searchFindingsJava(filePath);
                            }
                            if (filePath.endsWith('.properties')) {
                                searchFindingsJava(filePath);
                            }
                            resolve(void 0);
                        }
                    });
                }));
            });
            Promise.all(promises).then(resolve).catch(reject);
        });
    });
}

async function deleteTempRepo() {
    return new Promise((resolve, reject) => {
        fs.rm(downloadDir, { recursive: true }, (err : string) => {
            if (err) {
                console.error('Error deleting temp_repo:', err);
                reject(err);
                return;
            }
            console.log('temp_repo deleted successfully');
            resolve(void 0);
        });
    });
}
