/**
 * Altair Override System — Class-Merging Webpack Loader
 *
 * Scans src-altair/overrides/ for JS files and merges them with matching
 * components in src-client/app/ by filename. The override class's methods
 * are grafted onto a subclass of the original, producing a merged export.
 *
 * Convention:
 *   - The override file exports a default class with methods to add/override.
 *   - If the override has a constructor, rename it to `__altairInit`.
 *     The loader will call it after the original's constructor via super().
 *   - Use bare `game` to reference `_Game.currentGame` — the loader transforms
 *     it automatically and injects the import.
 *
 * Example: placing UiChat.js in src-altair/overrides/ will merge it with
 * src-client/app/Game/Ui/UiChat.js — the merged class extends the original
 * and overlays the override's prototype methods and statics.
 */
const fs = require("fs");
const path = require("path");
const { parse } = require("@babel/parser");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findJsFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Walk the AST to find the default-exported class.
 * Handles both `export default class Foo {}` and `class Foo {} ... export default Foo;`
 */
function findDefaultExportClass(ast) {
  // Pattern 1: export default class Foo { ... }
  for (const node of ast.program.body) {
    if (
      node.type === "ExportDefaultDeclaration" &&
      node.declaration &&
      node.declaration.type === "ClassDeclaration"
    ) {
      return { classNode: node.declaration, exportNode: node, pattern: 1 };
    }
  }
  // Pattern 2: class Foo { ... } ... export default Foo;
  for (const node of ast.program.body) {
    if (
      node.type === "ExportDefaultDeclaration" &&
      node.declaration &&
      node.declaration.type === "Identifier"
    ) {
      const name = node.declaration.name;
      for (const other of ast.program.body) {
        if (
          other.type === "ClassDeclaration" &&
          other.id &&
          other.id.name === name
        ) {
          return { classNode: other, exportNode: node, pattern: 2 };
        }
      }
    }
  }
  return null;
}

/**
 * Check whether the override class defines __altairInit (post-constructor hook).
 */
function overrideHasInit(overrideSource, overridePath) {
  let ast;
  try {
    ast = parse(overrideSource, {
      sourceType: "module",
      plugins: [
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
      ],
    });
  } catch (e) {
    console.error(
      `[override] Failed to parse override ${path.basename(overridePath)}:`,
      e.message,
    );
    return false;
  }

  const info = findDefaultExportClass(ast);
  if (!info) return false;

  for (const member of info.classNode.body.body) {
    if (
      member.type === "ClassMethod" &&
      member.key &&
      member.key.type === "Identifier" &&
      member.key.name === "__altairInit"
    ) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Plugin — injects the loader into webpack's module rules
// ---------------------------------------------------------------------------

function createOverridePlugin(rootDir) {
  const overridesDir = path.resolve(rootDir, "src-altair/overrides");
  const clientAppDir = path.resolve(rootDir, "src-client/app");

  const overridesByName = {};
  for (const file of findJsFiles(overridesDir)) {
    overridesByName[path.basename(file)] = path.resolve(file);
  }

  const altairStylesPath = path.resolve(rootDir, "src-altair/styles/index.css");
  const clientCssPath = path.resolve(rootDir, "src-client/app.css");

  return {
    apply(compiler) {
      const jsOverrideCount = Object.keys(overridesByName).length;
      const hasStyles = fs.existsSync(altairStylesPath);

      if (jsOverrideCount === 0 && !hasStyles) return;

      if (jsOverrideCount > 0) {
        console.log(`[AltairOverrides] Found ${jsOverrideCount} JS override(s).`);

        // Loader 1: Transform override files (game → _Game.currentGame)
        compiler.options.module.rules.push({
          test: /\.js$/,
          include: overridesDir,
          enforce: "pre",
          use: [
            {
              loader: __filename,
              options: {
                mode: "transform",
                rootDir,
              },
            },
          ],
        });

        // Loader 2: Merge override classes into original components
        compiler.options.module.rules.push({
          test: /\.js$/,
          include: clientAppDir,
          enforce: "pre",
          use: [
            {
              loader: __filename,
              options: {
                mode: "merge",
                overridesByName,
                rootDir,
              },
            },
          ],
        });
      }

      // Loader 3: Merge altair CSS into the original app.css
      if (hasStyles) {
        console.log(`[AltairOverrides] Found CSS override: src-altair/styles/index.css`);
        compiler.options.module.rules.push({
          test: /app\.css$/,
          include: path.dirname(clientCssPath),
          enforce: "pre",
          use: [
            {
              loader: __filename,
              options: {
                mode: "css",
                altairStylesPath,
                rootDir,
              },
            },
          ],
        });
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Loader entry point — dispatches based on mode
// ---------------------------------------------------------------------------
function altairLoader(source) {
  const options = this.getOptions();

  if (options.mode === "transform") return transformOverrideSource.call(this, source, options);
  if (options.mode === "merge") return mergeOverrideClass.call(this, source, options);
  if (options.mode === "css") return mergeOverrideCss.call(this, source, options);

  return source;
}

// ---------------------------------------------------------------------------
// Transform loader — rewrites `game` → `_Game.currentGame` in override files
// ---------------------------------------------------------------------------

/**
 * Uses @babel/parser to find bare `game` identifiers and replace them with
 * `_Game.currentGame`. Automatically injects `import _Game from "..."` when
 * any replacements are made. AST-based to avoid false positives inside
 * strings, comments, property names, etc.
 */
function transformOverrideSource(source, options) {
  let ast;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: [
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
      ],
    });
  } catch (e) {
    // If parsing fails, skip the transform — babel-loader will report the error
    return source;
  }

  // Collect positions of `game` identifiers to replace (in reverse order)
  const replacements = [];
  walkAST(ast.program, (node, parent, parentKey) => {
    if (node.type !== "Identifier" || node.name !== "game") return;

    // Skip: property access like `obj.game`
    if (
      parent.type === "MemberExpression" &&
      parentKey === "property" &&
      !parent.computed
    ) {
      return;
    }

    // Skip: object key like `{ game: value }`
    if (parent.type === "Property" && parentKey === "key" && !parent.computed) {
      return;
    }

    // Skip: class method name
    if (parent.type === "ClassMethod" && parentKey === "key") return;

    // Skip: import specifier
    if (
      parent.type === "ImportSpecifier" ||
      parent.type === "ImportDefaultSpecifier" ||
      parent.type === "ImportNamespaceSpecifier"
    ) {
      return;
    }

    // Skip: variable declaration name (left side of `const game = ...`)
    if (parent.type === "VariableDeclarator" && parentKey === "id") return;

    // Skip: function parameter name
    if (parent.type === "FunctionDeclaration" && parentKey === "params") return;
    if (parent.type === "ArrowFunctionExpression" && parentKey === "params")
      return;
    if (parent.type === "FunctionExpression" && parentKey === "params") return;
    if (parent.type === "ClassMethod" && parentKey === "params") return;

    replacements.push({ start: node.start, end: node.end });
  });

  if (replacements.length === 0) return source;

  // Apply replacements in reverse order to preserve positions
  replacements.sort((a, b) => b.start - a.start);
  let transformed = source;
  for (const { start, end } of replacements) {
    transformed =
      transformed.slice(0, start) +
      "_Game.currentGame" +
      transformed.slice(end);
  }

  // Inject the _Game import
  const gameModulePath = path.resolve(
    options.rootDir,
    "src-client/app/Engine/Game/Game",
  );
  let relPath = path
    .relative(path.dirname(this.resourcePath), gameModulePath)
    .replace(/\\/g, "/");
  if (!relPath.startsWith(".")) relPath = "./" + relPath;

  transformed = `import _Game from "${relPath}";\n${transformed}`;

  const basename = path.basename(this.resourcePath);
  console.log(
    `[override] Transformed ${replacements.length} \`game\` reference(s) in ${basename}`,
  );

  return transformed;
}

/**
 * Simple recursive AST walker. Calls `visitor(node, parent, parentKey)` for
 * every node in the tree.
 */
function walkAST(node, visitor, parent = null, parentKey = null) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((child) => walkAST(child, visitor, parent, parentKey));
    return;
  }
  if (node.type) {
    visitor(node, parent, parentKey);
    for (const key of Object.keys(node)) {
      if (key === "type" || key === "start" || key === "end" || key === "loc")
        continue;
      walkAST(node[key], visitor, node, key);
    }
  }
}

// ---------------------------------------------------------------------------
// Merge loader — runs on original components in src-client/app/
// ---------------------------------------------------------------------------

/**
 * For matched files, this loader:
 *   1. Strips `export default` from the original class
 *   2. Imports the override class
 *   3. Generates a merged subclass that extends the original
 *   4. Copies override prototype methods + statics onto the merged class
 *   5. Exports the merged class as default
 */
function mergeOverrideClass(source, options) {
  const basename = path.basename(this.resourcePath);
  const overridePath = options.overridesByName[basename];

  if (!overridePath) return source;

  // Add override file as a watched dependency (for HMR / rebuild)
  this.addDependency(overridePath);

  // Parse the original source to find the class
  let ast;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: [
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
      ],
    });
  } catch (e) {
    console.error(
      `[override] Failed to parse original ${basename}:`,
      e.message,
    );
    return source;
  }

  const info = findDefaultExportClass(ast);
  if (!info) {
    console.warn(
      `[override] ${basename}: no default-exported class found, skipping merge`,
    );
    return source;
  }

  const className = info.classNode.id ? info.classNode.id.name : null;
  if (!className) {
    console.warn(
      `[override] ${basename}: anonymous default-exported class, skipping merge`,
    );
    return source;
  }

  // Read override to check for constructor
  const overrideSource = fs.readFileSync(overridePath, "utf8");
  const hasInit = overrideHasInit(overrideSource, overridePath);

  // --- Transform the source ---
  let newSource = source;

  if (info.pattern === 1) {
    // `export default class Foo { ... }` → `class Foo { ... }`
    // Replace from the export statement start to the class keyword
    const exportStart = info.exportNode.start;
    const classKeywordIndex = source.indexOf("class", exportStart);
    newSource =
      source.slice(0, exportStart) + source.slice(classKeywordIndex);
  } else {
    // `export default Foo;` at the end → remove it
    const exportStart = info.exportNode.start;
    const exportEnd = info.exportNode.end;
    newSource =
      source.slice(0, exportStart).trimEnd() +
      "\n" +
      source.slice(exportEnd);
  }

  // Normalise override path for import (forward slashes, no backslashes)
  const importPath = overridePath.replace(/\\/g, "/");

  const mergedName = `${className}__Altair`;

  // Build the merge snippet
  let snippet = "\n/* --- ALTAIR OVERRIDE --- */\n";
  snippet += `import __AltairOverride from "${importPath}";\n\n`;
  snippet += `class ${mergedName} extends ${className} {\n`;

  if (hasInit) {
    snippet += `  constructor(...__args) {\n`;
    snippet += `    super(...__args);\n`;
    snippet += `    __AltairOverride.prototype.__altairInit.call(this, ...__args);\n`;
    snippet += `  }\n`;
  }

  snippet += `}\n\n`;

  // Copy prototype methods (excluding constructor)
  snippet += `const __overrideProto = Object.getOwnPropertyDescriptors(__AltairOverride.prototype);\n`;
  snippet += `delete __overrideProto.constructor;\n`;
  snippet += `delete __overrideProto.__altairInit;\n`;
  snippet += `Object.defineProperties(${mergedName}.prototype, __overrideProto);\n\n`;

  // Copy static members
  snippet += `const __overrideStatic = Object.getOwnPropertyDescriptors(__AltairOverride);\n`;
  snippet += `delete __overrideStatic.prototype;\n`;
  snippet += `delete __overrideStatic.length;\n`;
  snippet += `delete __overrideStatic.name;\n`;
  snippet += `Object.defineProperties(${mergedName}, __overrideStatic);\n\n`;

  snippet += `export default ${mergedName};\n`;

  newSource += snippet;

  const relOrig = path.relative(options.rootDir, this.resourcePath);
  const relOver = path.relative(options.rootDir, overridePath);
  console.log(`[override] Merged ${relOrig} ← ${relOver}`);

  return newSource;
}

// ---------------------------------------------------------------------------
// CSS merge loader — appends altair styles to src-client/app.css
// ---------------------------------------------------------------------------

/**
 * Appends the contents of src-altair/styles/index.css to the original
 * app.css at build time. The altair styles file is added as a watched
 * dependency so changes trigger a rebuild.
 */
function mergeOverrideCss(source, options) {
  const altairStylesPath = options.altairStylesPath;

  // Watch the altair styles file for changes
  this.addDependency(altairStylesPath);

  const altairCss = fs.readFileSync(altairStylesPath, "utf8").trim();
  if (!altairCss) return source;

  const relPath = path.relative(options.rootDir, altairStylesPath);
  console.log(`[override] Merged CSS ← ${relPath}`);

  return source + "\n\n/* --- ALTAIR STYLES --- */\n\n" + altairCss + "\n";
}

module.exports = altairLoader;
module.exports.createOverridePlugin = createOverridePlugin;
