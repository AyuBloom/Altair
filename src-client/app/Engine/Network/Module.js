function locateFile(path) {
  if (Module.locateFile) {
    return Module.locateFile(path, scriptDirectory);
  } else {
    return scriptDirectory + path;
  }
}
function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module.HEAP8 = HEAP8 = new Int8Array(b);
  Module.HEAP16 = HEAP16 = new Int16Array(b);
  Module.HEAP32 = HEAP32 = new Int32Array(b);
  Module.HEAPU8 = HEAPU8 = new Uint8Array(b);
  Module.HEAPU16 = HEAPU16 = new Uint16Array(b);
  Module.HEAPU32 = HEAPU32 = new Uint32Array(b);
  Module.HEAPF32 = HEAPF32 = new Float32Array(b);
  Module.HEAPF64 = HEAPF64 = new Float64Array(b);
}
function keepRuntimeAlive() {
  return noExitRuntime || runtimeKeepaliveCounter > 0;
}
function preRun() {
  if (Module.preRun) {
    for (
      typeof Module.preRun == "function" && (Module.preRun = [Module.preRun]);
      Module.preRun.length;
    ) {
      addOnPreRun(Module.preRun.shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function postRun() {
  if (Module.postRun) {
    for (
      typeof Module.postRun == "function" &&
      (Module.postRun = [Module.postRun]);
      Module.postRun.length;
    ) {
      addOnPostRun(Module.postRun.shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
function addRunDependency(id) {
  runDependencies++;
  if (Module.monitorRunDependencies) {
    Module.monitorRunDependencies(runDependencies);
  }
}
function removeRunDependency(id) {
  runDependencies--;
  if (Module.monitorRunDependencies) {
    Module.monitorRunDependencies(runDependencies);
  }
  if (
    runDependencies == 0 &&
    (runDependencyWatcher !== null &&
      (clearInterval(runDependencyWatcher), (runDependencyWatcher = null)),
    dependenciesFulfilled)
  ) {
    var callback = dependenciesFulfilled;
    dependenciesFulfilled = null;
    callback();
  }
}
function abort(what) {
  if (Module.onAbort) {
    Module.onAbort(what);
  }
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  what += ". Build with -sASSERTIONS for more info.";
  var e = new WebAssembly.RuntimeError(what);
  throw e;
}
function isDataURI(filename) {
  return filename.startsWith(dataURIPrefix);
}
function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
}
function getBinaryPromise(binaryFile) {
  if (
    wasmBinary ||
    (!ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) ||
    typeof fetch != "function"
  ) {
    return Promise.resolve().then(function () {
      return getBinarySync(binaryFile);
    });
  } else {
    return fetch(binaryFile, {
      credentials: "same-origin",
    })
      .then(function (response) {
        if (!response.ok) {
          throw "failed to load wasm binary file at '" + binaryFile + "'";
        }
        return response.arrayBuffer();
      })
      .catch(function () {
        return getBinarySync(binaryFile);
      });
  }
}
function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile)
    .then(function (binary) {
      return WebAssembly.instantiate(binary, imports);
    })
    .then(function (result) {
      return result;
    })
    .then(receiver, function (reason) {
      err("failed to asynchronously prepare wasm: " + reason);
      abort(reason);
    });
}
function instantiateAsync(binary, binaryFile, imports, callback) {
  if (
    binary ||
    typeof WebAssembly.instantiateStreaming != "function" ||
    binaryFile.startsWith(dataURIPrefix) ||
    typeof fetch != "function"
  ) {
    return instantiateArrayBuffer(binaryFile, imports, callback);
  } else {
    return fetch(binaryFile, {
      credentials: "same-origin",
    }).then(function (response) {
      var result = WebAssembly.instantiateStreaming(response, imports);
      return result.then(callback, function (reason) {
        err("wasm streaming compile failed: " + reason);
        err("falling back to ArrayBuffer instantiation");
        return instantiateArrayBuffer(binaryFile, imports, callback);
      });
    });
  }
}
function createWasm() {
  function receiveInstance(instance, module) {
    var wasmExports = instance.exports;
    Module.asm = wasmExports;
    wasmMemory = Module.asm.g;
    updateMemoryViews();
    wasmTable = Module.asm.k;
    addOnInit(Module.asm.h);
    removeRunDependency("wasm-instantiate");
    return wasmExports;
  }
  function receiveInstantiationResult(result) {
    receiveInstance(result.instance);
  }
  var info = {
    a: wasmImports,
  };
  addRunDependency("wasm-instantiate");
  if (Module.instantiateWasm) {
    try {
      return Module.instantiateWasm(info, receiveInstance);
    } catch (e) {
      err("Module.instantiateWasm callback failed with error: " + e);
      return false;
    }
  }
  instantiateAsync(
    wasmBinary,
    wasmBinaryFile,
    info,
    receiveInstantiationResult,
  );
  return {};
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}
function _emscripten_get_now() {
  return performance.now();
}
function getCFunc(ident) {
  var func = Module["_" + ident];
  return func;
}
function callMain(args = []) {
  var entryFunction = getEntryFunction;
  args.unshift(thisProgram);
  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv >> 2;
  args.forEach(function (arg) {
    HEAP32[argv_ptr++] = stringToUTF8OnStack(arg);
  });
  HEAP32[argv_ptr] = 0;
  try {
    var ret = entryFunction(argc, argv);
    exitJS(ret, true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}
function run() {
  function doRun() {
    if (!calledRun) {
      calledRun = true;
      Module.calledRun = true;
      if (!ABORT) {
        initRuntime();
        preMain();
        if (Module.onRuntimeInitialized) {
          Module.onRuntimeInitialized();
        }
        if (noInitialRun) {
          callMain(args);
        }
        postRun();
      }
    }
  }
  var args =
    arguments.length > 0 && arguments[0] !== undefined
      ? arguments[0]
      : arguments_;
  if (!(runDependencies > 0)) {
    preRun();
    if (!(runDependencies > 0)) {
      if (Module.setStatus) {
        Module.setStatus("Running...");
        setTimeout(function () {
          setTimeout(function () {
            Module.setStatus("");
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }
  }
}
var _typeof =
  typeof Symbol == "function" && typeof Symbol.iterator == "symbol"
    ? function (obj) {
        return typeof obj;
      }
    : function (obj) {
        if (
          obj &&
          typeof Symbol == "function" &&
          obj.constructor === Symbol &&
          obj !== Symbol.prototype
        ) {
          return "symbol";
        } else {
          return typeof obj;
        }
      };
var Module = typeof Module != "undefined" ? Module : {};
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
function quit_(status, toThrow) {
  throw toThrow;
}
var ENVIRONMENT_IS_WEB = true;
var ENVIRONMENT_IS_WORKER = false;
var scriptDirectory = "";
var doXHR;
var readAsync;
var readBinary;
var emscripten_set_window_title;
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (typeof document != "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }
  scriptDirectory =
    scriptDirectory.indexOf("blob:") !== 0
      ? scriptDirectory.substr(
          0,
          scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1,
        )
      : "";
  doXHR = function (url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
    readBinary = function (url) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
      return new Uint8Array(xhr.response);
    };
  }
  readAsync = function (url, resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
        resolve(xhr.response);
      } else {
        reject();
      }
      return;
    };
    xhr.onerror = reject;
    xhr.send(null);
  };
  emscripten_set_window_title = function (title) {
    return (document.title = title);
  };
}
var out = Module.print || console.log.bind(console);
var err = Module.printErr || console.error.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module.arguments) {
  arguments_ = Module.arguments;
}
if (Module.thisProgram) {
  thisProgram = Module.thisProgram;
}
if (Module.quit) {
  quit_ = Module.quit;
}
var wasmBinary;
if (Module.wasmBinary) {
  wasmBinary = Module.wasmBinary;
}
var noExitRuntime = Module.noExitRuntime || true;
if (
  (typeof WebAssembly == "undefined" ? "undefined" : _typeof(WebAssembly)) !=
  "object"
) {
  abort("no native wasm support detected");
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
var HEAP8;
var HEAPU8;
var HEAP16;
var HEAPU16;
var HEAP32;
var HEAPU32;
var HEAPF32;
var HEAPF64;
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeKeepaliveCounter = 0;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
var dataURIPrefix = "data:application/octet-stream;base64,";
var wasmBinaryFile;
wasmBinaryFile = "zombs_wasm.wasm";
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    callbacks.shift()(Module);
  }
}
function _abort_js() {
  abort("");
}
function __emscripten_memcpy_js(dest, src, num) {
  return HEAPU8.copyWithin(dest, src, src + num);
}
function getHeapMax() {
  return 2147483648;
}
function growMemory(size) {
  var b = wasmMemory.buffer;
  var pages = (size - b.byteLength + 65535) >>> 16;
  try {
    wasmMemory.grow(pages);
    updateMemoryViews();
    return 1;
  } catch (e) {}
}
function _emscripten_resize_heap(requestedSize) {
  var oldSize = HEAPU8.length;
  requestedSize >>>= 0;
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    return false;
  }
  function alignMemory(size, alignment) {
    return size + ((alignment - (size % alignment)) % alignment);
  }
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(
      maxHeapSize,
      alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536),
    );
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  return false;
}
var UTF8Decoder =
  typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  for (var endPtr = idx; u8Array[endPtr] && !(endPtr >= endIdx); ) {
    ++endPtr;
  }
  if (endPtr - idx > 16 && u8Array.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    var u0 = u8Array[idx++];
    if (u0 & 128) {
      var u1 = u8Array[idx++] & 63;
      if ((u0 & 224) != 192) {
        var u2 = u8Array[idx++] & 63;
        u0 =
          (u0 & 240) == 224
            ? ((u0 & 15) << 12) | (u1 << 6) | u2
            : ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
        if (u0 < 65536) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 65536;
          str += String.fromCharCode((ch >> 10) | 55296, (ch & 1023) | 56320);
        }
      } else {
        str += String.fromCharCode(((u0 & 31) << 6) | u1);
      }
    } else {
      str += String.fromCharCode(u0);
    }
  }
  return str;
}
function UTF8ToString(ptr, maxBytesToRead) {
  if (ptr) {
    return UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead);
  } else {
    return "";
  }
}
var _emscripten_run_script_int = function emscripten_run_script_int(ptr) {
  return eval(UTF8ToString(ptr)) | 0;
};
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
}
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) {
    return 0;
  }
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
    }
    if (u <= 127) {
      if (outIdx >= endIdx) {
        break;
      }
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) {
        break;
      }
      heap[outIdx++] = (u >> 6) | 192;
      heap[outIdx++] = (u & 63) | 128;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) {
        break;
      }
      heap[outIdx++] = (u >> 12) | 224;
      heap[outIdx++] = ((u >> 6) & 63) | 128;
      heap[outIdx++] = (u & 63) | 128;
    } else {
      if (outIdx + 3 >= endIdx) {
        break;
      }
      heap[outIdx++] = (u >> 18) | 240;
      heap[outIdx++] = ((u >> 12) & 63) | 128;
      heap[outIdx++] = ((u >> 6) & 63) | 128;
      heap[outIdx++] = (u & 63) | 128;
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
var _emscripten_run_script_string = function emscripten_run_script_string(ptr) {
  var s = eval(UTF8ToString(ptr));
  if (s == null) {
    return 0;
  }
  s += "";
  var me = emscripten_run_script_string;
  var len = lengthBytesUTF8(s);
  if (!me.bufferSize || me.bufferSize < len + 1) {
    if (me.bufferSize) {
      _free(me.buffer);
    }
    me.bufferSize = len + 1;
    me.buffer = _malloc(me.bufferSize);
  }
  stringToUTF8(s, me.buffer, me.bufferSize);
  return me.buffer;
};
var SYSCALLS = {
  varargs: undefined,
  get: function () {
    SYSCALLS.varargs += 4;
    var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
    return ret;
  },
  getStr: function (ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  },
};
function _proc_exit(code) {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    if (Module.onExit) {
      Module.onExit(code);
    }
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}
function exitJS(status, implicit) {
  EXITSTATUS = status;
  _proc_exit(status);
}
function handleException(e) {
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  } else {
    quit_(1, e);
    return;
  }
}
function stringToUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret;
}
function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}
function ccall(ident, returnType, argTypes, args, opts) {
  function convertReturnValue(ret) {
    if (returnType === "string") {
      return UTF8ToString(ret);
    } else if (returnType === "boolean") {
      return Boolean(ret);
    } else {
      return ret;
    }
  }
  function onDone(ret) {
    if (stack !== 0) {
      stackRestore(stack);
    }
    return convertReturnValue(ret);
  }
  var toC = {
    string: function (str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        ret = stringToUTF8OnStack(str);
      }
      return ret;
    },
    array: function (arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
  };
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) {
          stack = stackSave();
        }
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  return (ret = onDone(ret));
}
function cwrap(ident, returnType, argTypes, opts) {
  var numericArgs =
    !argTypes ||
    argTypes.every(function (type) {
      return type === "number" || type === "boolean";
    });
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  } else {
    return function () {
      return ccall(ident, returnType, argTypes, arguments, opts);
    };
  }
}
var wasmImports = {
  a: _abort_js,
  f: __emscripten_memcpy_js,
  d: _emscripten_get_now,
  e: _emscripten_resize_heap,
  c: _emscripten_run_script_int,
  b: _emscripten_run_script_string,
};
var wasmExports = createWasm();
function __wasm_call_ctors() {
  return (__wasm_call_ctors = Module.asm.h).apply(null, arguments);
}
var getEntryFunction = (Module._main = function () {
  return (getEntryFunction = Module._main = Module.asm.i).apply(
    null,
    arguments,
  );
});
var _MakeBlendField = (Module._MakeBlendField = function () {
  return (_MakeBlendField = Module._MakeBlendField = Module.asm.j).apply(
    null,
    arguments,
  );
});
function __errno_location() {
  return (__errno_location = Module.asm.__errno_location).apply(
    null,
    arguments,
  );
}
function _malloc() {
  return (_malloc = Module.asm.l).apply(null, arguments);
}
function stackSave() {
  return (stackSave = Module.asm.m).apply(null, arguments);
}
function stackRestore() {
  return (stackRestore = Module.asm.n).apply(null, arguments);
}
function stackAlloc() {
  return (stackAlloc = Module.asm.o).apply(null, arguments);
}
function _free() {
  return (_free = Module.asm.p).apply(null, arguments);
}
Module.ccall = ccall;
Module.cwrap = cwrap;
var calledRun;
dependenciesFulfilled = function runCaller() {
  if (!calledRun) {
    run();
  }
  if (!calledRun) {
    dependenciesFulfilled = runCaller;
  }
};
if (Module.preInit) {
  for (
    typeof Module.preInit == "function" && (Module.preInit = [Module.preInit]);
    Module.preInit.length > 0;
  ) {
    Module.preInit.pop()();
  }
}
var noInitialRun = true;
if (Module.noInitialRun) {
  noInitialRun = false;
}
run();
module.exports = Module;
