dom-utils = require './virtual-dom-utils'
{difference, filter, first, keys, Obj, each} = require 'prelude-ls'

ReactServerRenderingTransaction = require 'react/lib/ReactServerRenderingTransaction'
ReactDefaultBatchingStrategy = require 'react/lib/ReactDefaultBatchingStrategy'
instantiateReactComponent = require 'react/lib/instantiateReactComponent'
ReactUpdates = require 'react/lib/ReactUpdates'

# FIXME is there a way to do this without state?
# the form processing part is all synchronous, so
# we should be ok, but it's still nasty
redirect-location = null

configure-react = ->
  # You could read this as switching React into server-only mode
  ReactDefaultBatchingStrategy.isBatchingUpdates = true
  ReactUpdates.injection.injectReconcileTransaction ReactServerRenderingTransaction
  ReactUpdates.injection.injectBatchingStrategy ReactDefaultBatchingStrategy

render-tree = (element) ->
  # use react server rendering transaction to get the markup tree safely
  transaction = ReactServerRenderingTransaction.get-pooled true

  # simplified instantiateReactComponent (normal case for composite component)
  instance = instantiateReactComponent element, null

  try
    transaction.perform ->
      instance.mount-component "canBeAynthingWhee", transaction, {}
  finally
    ReactServerRenderingTransaction.release(transaction);

  # Unwrap the instance. We can always get back through ReactInstanceMap
  # FIXME this looks weirdly wrong, but I believe there is no other way in 0.13
  instance._instance

# FIXME this is obviously not enough of a fake event, but it will do for now
# report ALL issues you find with this
fake-event = (element, opts = {}) ->
  target = if element.props.type in ['checkbox', 'radio']
    checked: !!opts.value
  else
    value: opts.value

  stop-propagation: ->
  prevent-default: ->
  target: target

change-inputs = (inputs, post-data) ->
  inputs |> each ->
    it.props.on-change (fake-event it, value: post-data[it.props.name]) if it.props.on-change
    ReactUpdates.flushBatchedUpdates!

submit-form = (form) ->
  form.props.on-submit fake-event form
  ReactUpdates.flushBatchedUpdates!

# Public

# Processes a form server-side, returns a redirect location or null
# FIXME should we deal with the redirect in application.ls?
process-form = (root-element, initial-state, post-data, path) ->
  configure-react!
  reset-redirect!

  # WARNING! Magic ahead
  #
  # mount the component virtually, emulating server side rendering, but
  # getting the rendered instance back to be able to search it,
  # extract the correct form and input DOM components and trigger their
  # respective event handlers, which in turn updates app-state
  # finally, rerender the page

  instance = render-tree root-element

  input-names = keys post-data
  [form, inputs] = dom-utils.form-elements instance, path, input-names

  # trigger handlers
  change-inputs inputs, post-data
  submit-form form

  # end of magic

  return that if redirect-location

  null

route-metadata = (root-element, initial-state) ->
  configure-react!

  instance = render-tree root-element
  dom-utils.route-metadata instance

reset-redirect = ->
  redirect-location := null

redirect = (path) ->
  redirect-location := path

module.exports =
  route-metadata: route-metadata
  process-form: process-form
  redirect: redirect
