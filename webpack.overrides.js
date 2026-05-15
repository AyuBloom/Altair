/**
 * Scans src-altair/scripts/ for JS files and builds a webpack
 * NormalModuleReplacementPlugin that overrides matching files in
 * src-client/app/ by filename.
 *
 * For example, placing `UiChat.js` in `src-altair/scripts/` will replace
 * every import of `src-client/app/Game/Ui/UiChat.js` with the override,
 * while preserving the original file's resolve context so that relative
 * imports inside the override resolve against the original location.
 */
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

function findJsFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findJsFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

function createOverridePlugin(rootDir) {
    const altairScriptsDir = path.resolve(rootDir, 'src-altair/overrides');
    const clientAppDir = path.resolve(rootDir, 'src-client/app');

    // Collect override files keyed by basename
    const overrideFiles = findJsFiles(altairScriptsDir);
    const overridesByName = {};
    for (const filePath of overrideFiles) {
        overridesByName[path.basename(filePath)] = filePath;
    }

    if (Object.keys(overridesByName).length === 0) {
        // No overrides — return a no-op plugin
        return { apply() { } };
    }

    // Build a map: absolute original path → absolute override path
    const clientFiles = findJsFiles(clientAppDir);
    const replacements = new Map();
    for (const clientFile of clientFiles) {
        const basename = path.basename(clientFile);
        if (overridesByName[basename]) {
            const absOriginal = path.resolve(clientFile);
            const absOverride = path.resolve(overridesByName[basename]);
            replacements.set(absOriginal, absOverride);
            console.log(
                `[override] ${basename}: ${path.relative(rootDir, clientFile)} → ${path.relative(rootDir, overridesByName[basename])}`
            );
        }
    }

    return {
        apply(compiler) {
            compiler.hooks.normalModuleFactory.tap('AltairOverridePlugin', (nmf) => {
                nmf.hooks.afterResolve.tap('AltairOverridePlugin', (result) => {
                    if (!result || !result.createData) return;
                    const resolved = result.createData.resource;
                    if (!resolved) return;
                    const absResolved = path.resolve(resolved);
                    const override = replacements.get(absResolved);
                    if (override) {
                        result.createData.resource = override;
                    }
                });
            });
        },
    };
}

module.exports = { createOverridePlugin };
