(function(){
  var domUtils, ref$, difference, filter, first, keys, Obj, each, ReactServerRenderingTransaction, ReactDefaultBatchingStrategy, instantiateReactComponent, ReactUpdates, redirectLocation, configureReact, renderTree, fakeEvent, changeInputs, submitForm, processForm, routeMetadata, resetRedirect, redirect;
  domUtils = require('./virtual-dom-utils');
  ref$ = require('prelude-ls'), difference = ref$.difference, filter = ref$.filter, first = ref$.first, keys = ref$.keys, Obj = ref$.Obj, each = ref$.each;
  ReactServerRenderingTransaction = require('react/lib/ReactServerRenderingTransaction');
  ReactDefaultBatchingStrategy = require('react/lib/ReactDefaultBatchingStrategy');
  instantiateReactComponent = require('react/lib/instantiateReactComponent');
  ReactUpdates = require('react/lib/ReactUpdates');
  redirectLocation = null;
  configureReact = function(){
    ReactDefaultBatchingStrategy.isBatchingUpdates = true;
    ReactUpdates.injection.injectReconcileTransaction(ReactServerRenderingTransaction);
    return ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);
  };
  renderTree = function(element){
    var transaction, instance;
    transaction = ReactServerRenderingTransaction.getPooled(true);
    instance = instantiateReactComponent(element, null);
    try {
      transaction.perform(function(){
        return instance.mountComponent("canBeAynthingWhee", transaction, {});
      });
    } finally {
      ReactServerRenderingTransaction.release(transaction);
    }
    return instance._instance;
  };
  fakeEvent = function(element, opts){
    var target, ref$;
    opts == null && (opts = {});
    target = (ref$ = element.props.type) === 'checkbox' || ref$ === 'radio'
      ? {
        checked: !!opts.value
      }
      : {
        value: opts.value
      };
    return {
      stopPropagation: function(){},
      preventDefault: function(){},
      target: target
    };
  };
  changeInputs = function(inputs, postData){
    return each(function(it){
      if (it.props.onChange) {
        it.props.onChange(fakeEvent(it, {
          value: postData[it.props.name]
        }));
      }
      return ReactUpdates.flushBatchedUpdates();
    })(
    inputs);
  };
  submitForm = function(form){
    form.props.onSubmit(fakeEvent(form));
    return ReactUpdates.flushBatchedUpdates();
  };
  processForm = function(rootElement, initialState, postData, path){
    var instance, inputNames, ref$, form, inputs, that;
    configureReact();
    resetRedirect();
    instance = renderTree(rootElement);
    inputNames = keys(postData);
    ref$ = domUtils.formElements(instance, path, inputNames), form = ref$[0], inputs = ref$[1];
    changeInputs(inputs, postData);
    submitForm(form);
    if (that = redirectLocation) {
      return that;
    }
    return null;
  };
  routeMetadata = function(rootElement, initialState){
    var instance;
    configureReact();
    instance = renderTree(rootElement);
    return domUtils.routeMetadata(instance);
  };
  resetRedirect = function(){
    return redirectLocation = null;
  };
  redirect = function(path){
    return redirectLocation = path;
  };
  module.exports = {
    routeMetadata: routeMetadata,
    processForm: processForm,
    redirect: redirect
  };
}).call(this);
