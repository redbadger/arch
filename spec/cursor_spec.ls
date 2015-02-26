require! '../src/cursor'

{map} = require 'prelude-ls'

raw-data =
  person:
    first_name: "John"
    last_name: "Johnson"
    age: 35
    pets:
      * animal: "cat"
        name: "Tom"
      * animal: "dog"
        name: "Huckleberry"

data = cursor raw-data

describe "cursor" (_) ->
  describe "to object" (_) ->
    it "derefs the same on any level" ->
      name = data.get \person.first_name

      expect name.deref! .toBe raw-data.person.first_name

    it "doesn't affect original data when the derefed data is changed" ->
      person = data.get \person
      person.deref!.first_name = "George"

      expect data.deref!.person.first_name .toBe "John"

    it "returns undefined if the path doesn't exist" ->
      foo = data.get \this.doesnt.exist.at.all

      expect foo .to-be null

  describe "to array" (_) ->
    it "derefs a array item" ->
      tom = data.get \person.pets.0

      expect tom.deref!.name .toBe "Tom"

    it "iterates over an array cursor as if it was a simple array" ->
      names = (data.get \person.pets ) |> map (.deref!.name)

      expect names.0 .toBe "Tom"
      expect names.1 .toBe "Huckleberry"

  describe "raw access" (_) ->
    it "returns raw data" ->
      person = data.get \person .raw!

      expect person.get-in [\first_name] .to-be "John"
      expect (person.get-in [\pets] .toJS!) .to-equal raw-data.person.pets

    it "passes a reference equality check" ->
      tom1 = data.get \person.pets.0 .raw!
      tom2 = data.get \person .raw!.get-in ['pets', 0]
      not-tom = data.get \person.pets .raw!

      expect tom1 .to-be tom2
      expect not-tom .not.to-be tom1
      expect not-tom .not.to-be tom2

  describe "stateful updates" (_) ->
    it "updates with a callback" ->
      data = cursor raw-data

      name = data.get \person.first_name
      name.update -> "Ringo"

      expect data.deref!.person.first_name .toBe "Ringo"

    it "allows atomic updates" ->
      data = cursor raw-data

      age = data.get \person.age
      age.update -> it + 1

      expect data.deref!.person.age .toBe 36

    it "allows atomic updates even for composite values" ->
      data = cursor raw-data

      person = data.get \person
      person.update -> it import first_name: "Paul"

      expect data.deref!.person.first_name .toBe "Paul"

    it "allows for larger cumulative updates" ->
      data = cursor raw-data
      pets = data.get \person.pets

      pets.update ->
        [
          * animal: "cat"
            name: "Professor Catus"
          * animal: "dog"
            name: "Baron Woofson"
        ]

      expect (pets.get \0.name .deref!) .toBe "Professor Catus"
      expect (pets.get \1.name .deref!) .toBe "Baron Woofson"

  describe "observation" (_) ->
    it "notifies on change to a path" ->
      data = cursor raw-data
      name = data.get \person.first_name

      observer = jasmine.create-spy "observer"
      name.on-change observer

      name.update -> "George"

      expect observer .to-have-been-called-with "George"

    it "notifies on all parents with the respective value" ->
      data = cursor raw-data

      person = data.get \person
      name = person.get \first_name

      person-observer = jasmine.create-spy "person-observer"
      person.on-change person-observer

      name-observer = jasmine.create-spy "name-observer"
      name.on-change name-observer

      name.update -> "George"

      expect name-observer .to-have-been-called-with "George"

      payload = person-observer.calls.args-for 0 .0
      expect payload.first_name .toBe "George"

    it "notifies on all parents even with a list in the path" ->
      data = cursor raw-data

      pets = data.get \person.pets
      cat-name = pets.get \0.name

      pets-observer = jasmine.create-spy "pets-observer"
      pets.on-change pets-observer

      cat-name.update -> "Professor Catus"

      payload = pets-observer.calls.args-for 0 .0
      expect payload.0.name .toBe 'Professor Catus'

    it "does not update when simple value is the same after update" ->
      data = cursor raw-data
      name = data.get \person.first_name
      raw-name-a = name.raw!

      observer = jasmine.create-spy "observer"
      name.on-change observer

      name.update -> "John"
      raw-name-b = name.raw!

      expect raw-name-b .to-be raw-name-a
      expect observer .not.to-have-been-called!

    it "does not update when composite value is the same after update" ->
      data = cursor raw-data
      tom = data.get \person.pets.0
      raw-tom-a = tom.raw!

      observer = jasmine.create-spy "observer"
      tom.on-change observer

      tom.update -> it import name: 'Tom'
      raw-tom-b = tom.raw!

      expect raw-tom-b .to-be .raw-tom-a
      expect observer .not.to-have-been-called!

    it "serialises recursive updates" ->
      data = cursor raw-data
      age = data.get \person.age

      trace = []

      age.on-change ->
        return if it > 40

        trace.push it
        age.update -> it + 1
        trace.push it

      age.update -> it + 1

      expect trace .to-equal [36, 36, 37, 37, 38, 38, 39, 39, 40, 40]

  # This logic may change in the future once we establish how we'll handle cursor change propagation through application state.
  # For now, it compares the equality of 2 cursors' raw data.
  describe "equality" (_) ->
    it "passes on two cursors with a shared tree and same data" ->
      data1 = cursor raw-data
      data2 = cursor raw-data
      expect (data1.eq data2) .to-be true

    it "passes on two subcursors with a shared tree and same data" ->
      data1 = cursor raw-data .get \person.first_name
      data2 = cursor raw-data .get \person.first_name
      expect (data1.eq data2) .to-be true

    it "fails on cursors with different data" ->
      data1 = cursor raw-data .get \person.first_name
      data2 = cursor raw-data .get \person.first_name .update -> \Billy
      expect (data1.eq data2) .to-be false
