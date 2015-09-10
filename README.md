Arch
======

[![Circle CI](https://circleci.com/gh/arch-js/arch.svg?style=svg)](https://circleci.com/gh/arch-js/arch)

Web application framework for React.

## About

Arch is a single page web application framework using React as its
UI layer. Arch takes a functional style approach with central immutable state
architecture inspired by [Om](https://github.com/omcljs/om).

Arch applications are written in [LiveScript](http://livescript.net)
by default (read more about [the reasoning](docs/07-livescript.md)
behind the decision), they are fully isomorphic out of the box and
Arch comes with it's own Node.js based server, Webpack bundler
and a CLI to help you get started.

## Video

Watch Arch [introduction talk](https://www.youtube.com/watch?v=uHNv1ymaXSU) by Viktor and Tiago at React London Meetup.

## Examples

For example code, see [demos from the introduction talk](http://github.com/charypar/arch-talk)
at London React Meetup.

## Get Started

Start by installing the Arch CLI

```
$ npm install -g arch-cli
```

Then create a directory for your new application and go inside

```
$ mkdir my-app && cd my-app
```

You can then generate a new app by running

```
arch-cli init
```

and following the steps. When done start the application by running

```
arch-cli serve
```

your application is now running on <http://localhost:3000>.

## Configuration

Arch is configurable by environment variables or a `arch.config.js` / `arch.config.ls` file in your project root.

Hardcoded config (passed to arch.server) takes precedence over environment variables.

##### List of configuration options

| option      | env variable               | description                                             | default                           |
|-------------|----------------------------|---------------------------------------------------------|-----------------------------------|
| appPath     | arch_app_path              | absolute path to app directory **                       | your app's package.json directory |
| archPath    | arch_arch_path             | absolute path to arch directory **                      | arch's package.json directory     |
| bundle      | arch_bundle                | handle bundling of js in arch                           | true in development               |
| debug       | arch_debug                 | show debug output                                       | false                             |
| environment | arch_environment, NODE_ENV | environment for arch to target                          | development                       |
| minify      | arch_minify                | minify client output                                    | true in production                |
| public      | arch_public                | asset path (relative to app path)                       | 'dist'                            |
| port        | arch_port, ARCH_PORT*      | port to listen on                                       | 3000                              |
| watch       | arch_watch                 | watch for fs changes and reload server + rebuild client | true in development               |

<sub> * Will be deprecated </sub>
<sub> ** You probably never need to touch this </sub>

## Documentation

Arch doesn't have a website yet, but you can [read the
documentation](docs/) (which is mostly complete)
