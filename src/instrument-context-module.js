import regexpClone from 'regexp-clone';

/**
 * Instrument the webpack context module filtering process so that we can print
 * fancy emojis in the console as webpack dynamically adds files to the build.
 *
 * Several webpack plugins use a set of regexes to filter modules, a context
 * regex to match a directory and a module regex to match files within the
 * directory.
 *
 * A created instrumenter provides functions to wrap regexes provided to these
 * plugins to allow responding of processed module matches.
 *
 * The `handleContext` function is called for the first module match within
 * a context. It receives as arguments in order:
 *  - The path of the context.
 *  - The regular expression that matched the context.
 *  - The regular expression that matched the module.
 *
 * The `handleModule` function is called for every module match. It receives as
 * arguments in order:
 *  - The require path of the module, this may be relative to the context.
 *  - The path of the context.
 *  - The regular expression that matched the context.
 *  - The regular expression that matched the module.
 *
 * @param {Function} handleContext Log a context match.
 * @param {Function} handleModule Log a module match.
 * @returns {Object} An object with `context` and `module` regex wrapper funcs.
 */
export default (handleContext, handleModule) => {
  let contextRegex;
  let moduleRegex;
  let lastContext = null;
  let lastModule = null;
  let reportedContext = false;

  const report = () => {
    if (handleContext && lastContext && lastModule && !reportedContext) {
      handleContext(lastContext, contextRegex, moduleRegex);
      reportedContext = true;
    }

    if (handleModule && lastContext && lastModule) {
      handleModule(lastModule, lastContext, contextRegex, moduleRegex);
      lastModule = null;
    }
  };

  return {
    context: (regExp) => {
      if (contextRegex) {
        throw new Error('`context` can only be called once');
      }

      // Create a clone of the provided regExp to keep this function pure.
      const clone = regexpClone(regExp);

      contextRegex = clone;
      const test = contextRegex.test;

      contextRegex.test = function() {
        const result = test.apply(contextRegex, arguments);

        if (result && arguments[0] !== lastContext) {
          lastContext = arguments[0];
          report();
        }

        return result;
      };

      return contextRegex;
    },
    module: (regExp) => {
      if (moduleRegex) {
        throw new Error('`module` can only be called once');
      }

      // Create a clone of the provided regExp to keep this function pure.
      const clone = regexpClone(regExp);

      moduleRegex = clone;
      const test = moduleRegex.test;

      moduleRegex.test = function() {
        const result = test.apply(moduleRegex, arguments);

        if (result && arguments[0] !== lastModule) {
          lastModule = arguments[0];
          report();
        }

        return result;
      };

      return moduleRegex;
    },
  };
};
