#Instrument Context Module

A utility for adding instrumentation to [Webpack] dynamic [context modules](https://webpack.js.org/guides/dependency-management/#require-context).

[![license](http://img.shields.io/npm/l/instrument-context-module.svg?style=flat)](https://www.npmjs.com/package/instrument-context-module)
[![version](http://img.shields.io/npm/v/instrument-context-module.svg?style=flat)](https://www.npmjs.com/package/instrument-context-module)
[![downloads](http://img.shields.io/npm/dm/instrument-context-module.svg?style=flat)](https://www.npmjs.com/package/instrument-context-module)

## Usage

Certain Webpack plugins use a set of regular expressions to filter modules, a context expression to match a directory and a module expression to filter files within the directory.

`instrumentContextModule` is used to wrap a set of regular expressions used by webpack plugins to enable monitoring the matches found by the plugins.

```js

const handleContext = (context, contextRegEx, moduleRegEx) =>
  console.log('in context ' + context);

const handleModule = (module, context, contextRegEx, moduleRegEx) =>
  console.log('include module ' + module);

const wrap = instrumentContextModule(handleContext, handleModule);

const moduleRegExp = wrap.module(/(foo|bar)\.js$/);
const contextRegExp = wrap.module(/some_module/);

const plugin = new webpack.ContextReplacementPlugin(
  contextRegExp,
  moduleRegExp,
);
```

The `handleContext` function is called for the first module match within a context. It receives as arguments in order:
 - The path of the context.
 - The regular expression that matched the context.
 - The regular expression that matched the module.

The `handleModule` function is called for every module match. It receives as arguments in order:

 - The require path of the module, this may be relative to the context.
 - The path of the context.
 - The regular expression that matched the context.
 - The regular expression that matched the module.

 Since the result of `instrumentContextModule` is stateful, a new instance must be created for each plugin to be instrumented.

## Examples

### Logging dynamically included modules.

With a non-restrictive module regular expression, an instrumented [`ContextReplacementPlugin`] can be used to simply observe and log what is included in a certain context.

**Webpack config**

```js
// webpack.config.babel.js
// 
import {join, relative, dirname} from 'path';
import webpack from 'webpack';
import instrumentContextModule from 'instrument-context-module';
import escapeRegExp from 'escape-string-regexp';
import nearest from 'find-nearest-file';

const ROOT = dirname(nearest('package.json'));

const logInclude = instrumentContextModule(
  (context, contextRegEx, moduleRegEx) =>
    console.log(`🗃  Including ${moduleRegEx} in ${relative(ROOT, context)}`),
  (module, context) => console.log(`   ${module.slice(2)}`),
);

const iconPath = join(ROOT, 'src', 'asset', 'icon');

export default {

  // Existing webpack config.
  
  context: ROOT,
  plugins: [
    new webpack.definePlugin({
      process.env.ICON_PATH: JSON.stringify(iconPath),
    }),
    new webpack.ContextReplacementPlugin(
      logInclude.context(new RegExp(`^${escapeRegExp(iconPath)}$`, 'i')),
      logInclude.module(/\.icon\.svg$/),
    )
  ],
};
```

**Component file**

```js
const icons = require.context(process.env.ICON_PATH, false, /\.icon\.svg$/);
```

**Console output**

```
🗃 Including /\.icon\.svg$/ in src/asset/icon
   arrow-down.icon.svg
   arrow-left.icon.svg
   arrow-right.icon.svg
   arrow-up.icon.svg
   chevron-left.icon.svg
   ...
```

--

### Logging dynamically ignored modules.

(Waiting on https://github.com/webpack/webpack/pull/4418)

[`IgnorePlugin`] can be instrumented to log which modules are excluded.

> Note that the arguments to `IgnorePlugin` reversed compared to `ContextReplacementPlugin`.

**Webpack config**

```js
// webpack.config.babel.js
// 
import {join, relative, dirname} from 'path';
import webpack from 'webpack';
import instrumentContextModule from 'instrument-context-module';
import nearest from 'find-nearest-file';

const ROOT = dirname(nearest('package.json'));

const LOCALES = ['en', 'fr'];

const logIngore = instrumentContextModule(
  (context, contextRegEx, moduleRegEx) =>
    console.log(`🚫  Ignoring ${moduleRegEx} in ${relative(ROOT, context)}`),
  (module) => console.log(`   ${module.slice(2)}`),
);

export default {

  // Existing webpack config.
  
  context: ROOT,
  plugins: [
    new new webpack.IgnorePlugin(
      logIngore.module(new RegExp(`^\\.\\/(?!${LOCALES.join('|')}).*\\.js$`)),
      logIngore.context(/moment[\/\\]locale$/),
    )
  ],
};
```

**Console output**

```
🚫 Ignoring /^\.\/(?!en|fr).*\.js$/ in node_modules/moment/locale
   af.js
   ar-dz.js
   ar-ly.js
   ar-ma.js
   ar-sa.js
   ar-tn.js
   ar.js
   az.js
   be.js
   bg.js
   bn.js
   bo.js
   br.js
   ...
```


[Webpack]: https://webpack.github.io
[context modules]: https://webpack.js.org/guides/dependency-management/#require-contextextract-text-webpack-plugin
[`ContextReplacementPlugin`]: https://github.com/webpack/docs/wiki/list-of-plugins#contextreplacementplugin
[`IgnorePlugin`]: https://github.com/webpack/docs/wiki/list-of-plugins#ignoreplugin
