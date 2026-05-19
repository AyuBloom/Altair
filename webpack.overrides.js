/**
 * Altair Override System — Macro-based Webpack Loader
 *
 * Scans src-altair/ recursively for JS files containing macro comments:
 *
 *   /* @override Game/Path/To/Component *​/
 *     Overrides a method on an existing component class.
 *
 *   /* @script *​/
 *     Registers a game.script module (e.g. game.script.AHRC = {...}).
 *
 *   /* @options *​/
 *     Registers game.options.options defaults.
 *
 *   /* @helper *​/
 *     Registers a utility function/class on game.helpers.
 *
 *   /* @init *​/
 *     Runs initialization code after the game is fully set up.
 *
 * The loader extracts annotated code, transforms `game` references to
 * `_Game.currentGame`, and injects everything into the client build.
 *
 * @override grafts methods onto component subclass prototypes.
 * @script/@options/@helper/@init are collected into a bootstrap method
 * on the Game class that runs at the end of Game.init().
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

// ---------------------------------------------------------------------------
// Macro extraction — scans source files for all macro annotations
// ---------------------------------------------------------------------------

const MACRO_PATTERN = /^[\s*]*@(override|replace|script|options|helper|init)(?:\s+(.+?))?\s*$/;

/**
 * Parse a single source file and extract all macro-annotated code.
 *
 * Returns:
 *   { overrides: [...], scripts: [...], options: [...], helpers: [...], inits: [...] }
 */
function extractMacrosFromSource(source, filePath) {
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
    console.warn(
      `[macro] Failed to parse ${path.basename(filePath)}: ${e.message}`,
    );
    return { overrides: [], scripts: [], options: [], helpers: [], inits: [] };
  }

  const result = { overrides: [], scripts: [], options: [], helpers: [], inits: [] };

  for (const node of ast.program.body) {
    if (!node.leadingComments || node.leadingComments.length === 0) continue;

    for (const comment of node.leadingComments) {
      const match = comment.value.trim().match(MACRO_PATTERN);
      if (!match) continue;

      const macroType = match[1];
      const macroArg = match[2] ? match[2].trim() : null;

      switch (macroType) {
        case "override":
        case "replace":
          extractOverrideMacro(node, macroType, macroArg, source, filePath, result);
          break;
        case "script":
          extractScriptMacro(node, source, filePath, result);
          break;
        case "options":
          extractOptionsMacro(node, source, filePath, result);
          break;
        case "helper":
          extractHelperMacro(node, source, filePath, result);
          break;
        case "init":
          extractInitMacro(node, source, filePath, result);
          break;
      }
    }
  }

  return result;
}

function extractOverrideMacro(node, macroType, componentPath, source, filePath, result) {
  if (!componentPath) {
    console.warn(`[macro] @${macroType} in ${path.basename(filePath)} missing component path — skipping`);
    return;
  }
  if (node.type !== "ExpressionStatement" || node.expression.type !== "AssignmentExpression") {
    console.warn(`[macro] @${macroType} in ${path.basename(filePath)} is not followed by an assignment — skipping`);
    return;
  }
  const left = node.expression.left;
  let methodName = null;
  if (left.type === "MemberExpression" && left.property) {
    methodName = left.property.name || left.property.value;
  }
  if (!methodName) {
    console.warn(`[macro] @${macroType} in ${path.basename(filePath)}: could not extract method name — skipping`);
    return;
  }
  const rhs = node.expression.right;
  result.overrides.push({
    componentPath,
    methodName,
    functionSource: source.slice(rhs.start, rhs.end),
    macroType,
    sourceFile: filePath,
  });
}

function extractScriptMacro(node, source, filePath, result) {
  // Expects: game.script.X = { ... };
  if (node.type !== "ExpressionStatement" || node.expression.type !== "AssignmentExpression") {
    console.warn(`[macro] @script in ${path.basename(filePath)} is not followed by an assignment — skipping`);
    return;
  }
  const left = node.expression.left;
  // Extract the module name from game.script.X
  let scriptName = null;
  if (left.type === "MemberExpression" && left.property) {
    scriptName = left.property.name || left.property.value;
  }
  if (!scriptName) {
    console.warn(`[macro] @script in ${path.basename(filePath)}: could not extract script name — skipping`);
    return;
  }
  const rhs = node.expression.right;
  result.scripts.push({
    name: scriptName,
    source: source.slice(rhs.start, rhs.end),
    sourceFile: filePath,
  });
}

function extractOptionsMacro(node, source, filePath, result) {
  // Expects: game.options.options = { ... };
  if (node.type !== "ExpressionStatement" || node.expression.type !== "AssignmentExpression") {
    console.warn(`[macro] @options in ${path.basename(filePath)} is not followed by an assignment — skipping`);
    return;
  }
  const rhs = node.expression.right;
  result.options.push({
    source: source.slice(rhs.start, rhs.end),
    sourceFile: filePath,
  });
}

function extractHelperMacro(node, source, filePath, result) {
  // Expects: const/let/var X = ...; OR function X() {} OR class X {}
  let helperName = null;
  let helperSource = null;

  if (node.type === "VariableDeclaration") {
    const decl = node.declarations[0];
    if (decl && decl.id && decl.id.type === "Identifier") {
      helperName = decl.id.name;
      // Extract the initializer source
      if (decl.init) {
        helperSource = source.slice(decl.init.start, decl.init.end);
      }
    }
  } else if (node.type === "FunctionDeclaration" && node.id) {
    helperName = node.id.name;
    helperSource = source.slice(node.start, node.end);
  } else if (node.type === "ClassDeclaration" && node.id) {
    helperName = node.id.name;
    helperSource = source.slice(node.start, node.end);
  }

  if (!helperName || !helperSource) {
    console.warn(`[macro] @helper in ${path.basename(filePath)}: could not extract helper — skipping`);
    return;
  }

  result.helpers.push({
    name: helperName,
    source: helperSource,
    kind: node.type,
    sourceFile: filePath,
  });
}

function extractInitMacro(node, source, filePath, result) {
  // Extract the full statement source
  result.inits.push({
    source: source.slice(node.start, node.end),
    sourceFile: filePath,
  });
}

/**
 * Scan an entire directory recursively for macro annotations.
 */
function extractAllMacros(dir) {
  const all = { overrides: [], scripts: [], options: [], helpers: [], inits: [] };
  const sourceFiles = new Set();

  for (const filePath of findJsFiles(dir)) {
    const source = fs.readFileSync(filePath, "utf8");
    const macros = extractMacrosFromSource(source, filePath);

    const hasAny = macros.overrides.length + macros.scripts.length +
      macros.options.length + macros.helpers.length + macros.inits.length > 0;
    if (hasAny) sourceFiles.add(filePath);

    all.overrides.push(...macros.overrides);
    all.scripts.push(...macros.scripts);
    all.options.push(...macros.options);
    all.helpers.push(...macros.helpers);
    all.inits.push(...macros.inits);
  }

  // Group overrides by component path → basename
  const overridesByComponent = new Map();
  for (const o of all.overrides) {
    const key = o.componentPath;
    if (!overridesByComponent.has(key)) overridesByComponent.set(key, []);
    overridesByComponent.get(key).push({
      methodName: o.methodName,
      functionSource: o.functionSource,
      macroType: o.macroType,
      sourceFile: o.sourceFile,
    });
  }

  return {
    overridesByComponent,
    scripts: all.scripts,
    options: all.options,
    helpers: all.helpers,
    inits: all.inits,
    sourceFiles,
  };
}

// ---------------------------------------------------------------------------
// Plugin — injects the loader into webpack's module rules
// ---------------------------------------------------------------------------

function createOverridePlugin(rootDir) {
  const altairDir = path.resolve(rootDir, "src-altair");
  const clientAppDir = path.resolve(rootDir, "src-client/app");

  // Extract all macros from src-altair/ recursively
  const macros = extractAllMacros(altairDir);

  // Build overridesByBasename for @override merging
  const overridesByBasename = {};
  for (const [componentPath, methods] of macros.overridesByComponent) {
    const basename = path.basename(componentPath) + ".js";
    if (!overridesByBasename[basename]) {
      overridesByBasename[basename] = { componentPath, methods: [] };
    }
    overridesByBasename[basename].methods.push(...methods);
  }

  // Check if we have bootstrap macros (@script, @options, @helper, @init)
  const hasBootstrap = macros.scripts.length > 0 || macros.options.length > 0 ||
    macros.helpers.length > 0 || macros.inits.length > 0;

  if (hasBootstrap) {
    // Add Game.js as a merge target for the bootstrap
    if (!overridesByBasename["Game.js"]) {
      overridesByBasename["Game.js"] = { componentPath: "Engine/Game/Game", methods: [] };
    }
    overridesByBasename["Game.js"].bootstrap = {
      scripts: macros.scripts,
      options: macros.options,
      helpers: macros.helpers,
      inits: macros.inits,
    };
  }

  const macroSourceFiles = Array.from(macros.sourceFiles);

  const altairStylesPath = path.resolve(rootDir, "src-altair/styles/index.css");
  const clientCssPath = path.resolve(rootDir, "src-client/app.css");

  return {
    apply(compiler) {
      const overrideCount = Array.from(macros.overridesByComponent.values())
        .reduce((sum, arr) => sum + arr.length, 0);
      const hasStyles = fs.existsSync(altairStylesPath);
      const hasMacros = overrideCount > 0 || hasBootstrap;

      if (!hasMacros && !hasStyles) return;

      if (hasMacros) {
        // Log override macros
        if (overrideCount > 0) {
          console.log(`[AltairOverrides] Found ${overrideCount} @override macro(s):`);
          for (const [comp, methods] of macros.overridesByComponent) {
            console.log(`  → ${comp}: ${methods.map((m) => m.methodName).join(", ")}`);
          }
        }

        // Log bootstrap macros
        if (hasBootstrap) {
          const counts = [];
          if (macros.scripts.length) counts.push(`${macros.scripts.length} @script`);
          if (macros.options.length) counts.push(`${macros.options.length} @options`);
          if (macros.helpers.length) counts.push(`${macros.helpers.length} @helper`);
          if (macros.inits.length) counts.push(`${macros.inits.length} @init`);
          console.log(`[AltairOverrides] Found bootstrap macros: ${counts.join(", ")}`);
          if (macros.scripts.length) {
            console.log(`  → scripts: ${macros.scripts.map((s) => s.name).join(", ")}`);
          }
          if (macros.helpers.length) {
            console.log(`  → helpers: ${macros.helpers.map((h) => h.name).join(", ")}`);
          }
        }

        // Loader: Merge macros into original components (and Game.js for bootstrap)
        compiler.options.module.rules.push({
          test: /\.js$/,
          include: clientAppDir,
          enforce: "pre",
          use: [
            {
              loader: __filename,
              options: {
                mode: "macro-merge",
                overridesByBasename,
                macroSourceFiles,
                rootDir,
              },
            },
          ],
        });
      }

      // Loader: Merge altair CSS into the original app.css
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

  if (options.mode === "macro-merge")
    return macroMergeLoader.call(this, source, options);
  if (options.mode === "css")
    return mergeOverrideCss.call(this, source, options);

  return source;
}

// ---------------------------------------------------------------------------
// Macro-merge loader — runs on original components in src-client/app/
// ---------------------------------------------------------------------------

/**
 * For matched files, this loader:
 *   1. Strips `export default` from the original class
 *   2. Generates a merged subclass that extends the original
 *   3. For @override: grafts methods onto the subclass prototype
 *   4. For bootstrap (Game.js): adds an init() override that calls __altairBootstrap()
 *   5. Exports the merged class as default
 */
function macroMergeLoader(source, options) {
  const basename = path.basename(this.resourcePath);
  const entry = options.overridesByBasename[basename];

  if (!entry) return source;

  // Add all macro source files as watched dependencies
  for (const sourceFile of options.macroSourceFiles) {
    this.addDependency(sourceFile);
  }

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
    console.error(`[override] Failed to parse original ${basename}:`, e.message);
    return source;
  }

  const info = findDefaultExportClass(ast);
  if (!info) {
    console.warn(`[override] ${basename}: no default-exported class found, skipping merge`);
    return source;
  }

  const className = info.classNode.id ? info.classNode.id.name : null;
  if (!className) {
    console.warn(`[override] ${basename}: anonymous default-exported class, skipping merge`);
    return source;
  }

  // --- Transform the source: strip export default ---
  let newSource = source;
  if (info.pattern === 1) {
    const exportStart = info.exportNode.start;
    const classKeywordIndex = source.indexOf("class", exportStart);
    newSource = source.slice(0, exportStart) + source.slice(classKeywordIndex);
  } else {
    const exportStart = info.exportNode.start;
    const exportEnd = info.exportNode.end;
    newSource = source.slice(0, exportStart).trimEnd() + "\n" + source.slice(exportEnd);
  }

  const mergedName = `${className}__Altair`;

  // Ensure _Game import exists
  const hasGameImport = /import\s+_Game\s+from/.test(source);
  let snippet = "\n/* --- ALTAIR MACRO OVERRIDES --- */\n";
  if (!hasGameImport) {
    const gameModulePath = path.resolve(options.rootDir, "src-client/app/Engine/Game/Game");
    let relPath = path.relative(path.dirname(this.resourcePath), gameModulePath).replace(/\\/g, "/");
    if (!relPath.startsWith(".")) relPath = "./" + relPath;
    snippet = `import _Game from "${relPath}";\n` + snippet;
  }

  // --- Build the merged subclass ---
  const hasBootstrap = !!entry.bootstrap;

  if (hasBootstrap) {
    // Game.js: override init() to call bootstrap after original init
    snippet += `class ${mergedName} extends ${className} {\n`;
    snippet += `  init(callback) {\n`;
    snippet += `    super.init((...__initArgs) => {\n`;
    snippet += `      this.__altairBootstrap();\n`;
    snippet += `      callback(...__initArgs);\n`;
    snippet += `    });\n`;
    snippet += `  }\n`;
    snippet += `}\n\n`;

    // Generate the bootstrap method
    snippet += generateBootstrapMethod(mergedName, entry.bootstrap);
  } else {
    snippet += `class ${mergedName} extends ${className} {}\n\n`;
  }

  // Graft @override methods onto prototype
  if (entry.methods && entry.methods.length > 0) {
    for (const method of entry.methods) {
      const transformedBody = transformGameRefs(method.functionSource);
      snippet += `${mergedName}.prototype.${method.methodName} = ${transformedBody};\n`;
    }
    snippet += "\n";
  }

  snippet += `export default ${mergedName};\n`;
  newSource += snippet;

  // Log
  const relOrig = path.relative(options.rootDir, this.resourcePath);
  const parts = [];
  if (entry.methods && entry.methods.length > 0) {
    parts.push(`overrides: ${entry.methods.map((m) => m.methodName).join(", ")}`);
  }
  if (hasBootstrap) {
    parts.push("bootstrap");
  }
  console.log(`[override] Merged into ${relOrig}: ${parts.join("; ")}`);

  return newSource;
}

// ---------------------------------------------------------------------------
// Bootstrap code generation — builds __altairBootstrap for the Game class
// ---------------------------------------------------------------------------

/**
 * Generates the __altairBootstrap method that runs after Game.init().
 * Execution order: helpers → options → scripts → inits
 */
function generateBootstrapMethod(mergedName, bootstrap) {
  let body = "";

  // --- Helpers ---
  if (bootstrap.helpers.length > 0) {
    body += "  // --- @helper ---\n";
    body += "  _Game.currentGame.helpers = _Game.currentGame.helpers || {};\n";
    for (const helper of bootstrap.helpers) {
      const transformed = transformGameRefs(helper.source);
      if (helper.kind === "VariableDeclaration") {
        // const measureDistance = (...) => {...}  →  game.helpers.measureDistance = (...)
        body += `  _Game.currentGame.helpers.${helper.name} = ${transformed};\n`;
      } else if (helper.kind === "FunctionDeclaration") {
        // function foo() {}  →  game.helpers.foo = function foo() {}
        // The source already includes the full function declaration
        body += `  _Game.currentGame.helpers.${helper.name} = ${transformed};\n`;
      } else if (helper.kind === "ClassDeclaration") {
        // class Foo {}  →  game.helpers.Foo = class Foo {}
        body += `  _Game.currentGame.helpers.${helper.name} = ${transformed};\n`;
      }
    }
    body += "\n";
  }

  // --- Options ---
  if (bootstrap.options.length > 0) {
    body += "  // --- @options ---\n";
    body += "  _Game.currentGame.options = _Game.currentGame.options || {};\n";
    for (const opt of bootstrap.options) {
      const transformed = transformGameRefs(opt.source);
      body += `  _Game.currentGame.options.options = ${transformed};\n`;
    }
    body += "\n";
  }

  // --- Scripts ---
  if (bootstrap.scripts.length > 0) {
    body += "  // --- @script ---\n";
    body += "  _Game.currentGame.script = _Game.currentGame.script || {};\n";
    for (const script of bootstrap.scripts) {
      const transformed = transformGameRefs(script.source);
      body += `  _Game.currentGame.script.${script.name} = ${transformed};\n`;
    }
    body += "\n";
  }

  // --- Inits ---
  if (bootstrap.inits.length > 0) {
    body += "  // --- @init ---\n";
    for (const init of bootstrap.inits) {
      const transformed = transformGameRefs(init.source);
      body += `  ${transformed}\n`;
    }
    body += "\n";
  }

  return `${mergedName}.prototype.__altairBootstrap = function() {\n${body}};\n\n`;
}

// ---------------------------------------------------------------------------
// game → _Game.currentGame transform (AST-based)
// ---------------------------------------------------------------------------

/**
 * Transform bare `game` identifiers to `_Game.currentGame` in source text.
 */
function transformGameRefs(source) {
  let ast;
  try {
    ast = parse(`(${source})`, {
      sourceType: "module",
      plugins: [
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
      ],
    });
  } catch (e) {
    return source.replace(/\bgame\b/g, "_Game.currentGame");
  }

  const replacements = [];
  walkAST(ast.program, (node, parent, parentKey) => {
    if (node.type !== "Identifier" || node.name !== "game") return;
    if (parent.type === "MemberExpression" && parentKey === "property" && !parent.computed) return;
    if (parent.type === "Property" && parentKey === "key" && !parent.computed) return;
    if (parent.type === "ClassMethod" && parentKey === "key") return;
    if (parent.type === "ImportSpecifier" || parent.type === "ImportDefaultSpecifier" || parent.type === "ImportNamespaceSpecifier") return;
    if (parent.type === "VariableDeclarator" && parentKey === "id") return;
    if (parent.type === "FunctionDeclaration" && parentKey === "params") return;
    if (parent.type === "ArrowFunctionExpression" && parentKey === "params") return;
    if (parent.type === "FunctionExpression" && parentKey === "params") return;
    if (parent.type === "ClassMethod" && parentKey === "params") return;
    replacements.push({ start: node.start - 1, end: node.end - 1 });
  });

  if (replacements.length === 0) return source;

  replacements.sort((a, b) => b.start - a.start);
  let transformed = source;
  for (const { start, end } of replacements) {
    transformed = transformed.slice(0, start) + "_Game.currentGame" + transformed.slice(end);
  }
  return transformed;
}

/**
 * Simple recursive AST walker.
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
      if (key === "type" || key === "start" || key === "end" || key === "loc") continue;
      walkAST(node[key], visitor, node, key);
    }
  }
}

// ---------------------------------------------------------------------------
// CSS merge loader — appends altair styles to src-client/app.css
// ---------------------------------------------------------------------------

function mergeOverrideCss(source, options) {
  const altairStylesPath = options.altairStylesPath;
  this.addDependency(altairStylesPath);

  const altairCss = fs.readFileSync(altairStylesPath, "utf8").trim();
  if (!altairCss) return source;

  const relPath = path.relative(options.rootDir, altairStylesPath);
  console.log(`[override] Merged CSS ← ${relPath}`);

  return source + "\n\n/* --- ALTAIR STYLES --- */\n\n" + altairCss + "\n";
}

module.exports = altairLoader;
module.exports.createOverridePlugin = createOverridePlugin;
