test-utils = React.addons.TestUtils

{filter, find, any} = require 'prelude-ls'

extract-route = (tree) ->
  routes = test-utils.find-all-in-rendered-tree tree, ->
    return it.get-layout-template and typeof! it.get-layout-template is 'Function'

  routes[0]

form-elements = (tree, path, input-names) ->
  forms = test-utils.find-all-in-rendered-tree tree, ->
    return it.tagName is 'FORM'

  inputs = []
  form = forms
  |> filter (.props.action is path)
  |> find (form) ->
    inputs := test-utils.find-all-in-rendered-tree form, ->
      return it.tagName in ['INPUT', 'TEXTAREA', 'SELECT']

    return (inputs |> any -> it.props.name in input-names)

  [form, inputs]

route-metadata = (tree) ->
  route = extract-route tree

  title = if route.get-title then that.call route else ""

  # collect all the metadata
  title: title
  layout: route.get-layout-template! # FIXME default layout?

module.exports =
  route-metadata: route-metadata
  form-elements: form-elements
