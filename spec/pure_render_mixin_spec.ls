mixin = require '../src/mixins/pure-render'

fake-cursor = (data) ->
  eq: -> true
  deref: -> data

describe "pure render mixin" (_) ->
  it "compares with cursor.eq when cursor is detected in props" ->
    component =
      props: data: fake-cursor!
      state: {}

    next = data: fake-cursor!

    spy-on component.props.data, 'eq'
    mixin.should-component-update.call component, next, {}
    expect component.props.data.eq .to-have-been-called-with next.data

  it "compares with cursor.eq when cursor is detected in state" ->
    component =
      props: {}
      state: data: fake-cursor!

    next = data: fake-cursor!

    spy-on component.state.data, 'eq'
    mixin.should-component-update.call component, {}, next
    expect component.state.data.eq .to-have-been-called-with next.data

  it "compares with deep-equality check when a key isn't a cursor" ->
    component =
      props: data: deep: nested: data: structure: 'carrots'
      state: {}

    expect mixin.should-component-update.call component, (data: deep: nested: data: structure: 'bananas'), {}
    .to-be true

    expect mixin.should-component-update.call component, (data: deep: nested: data: structure: 'carrots'), {}
    .to-be false

  it "accepts primitives as well as structures as a prop/state" ->
    component =
      props: number: 1
      state: number: 2

    expect mixin.should-component-update.call component, (number: 2), (number: 1)
    .to-be true