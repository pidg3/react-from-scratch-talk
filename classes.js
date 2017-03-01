function Person(name) {
  this.name = name;
}

Person.prototype.getName = function() {
  console.log('Name is: ' + this.name);
}
Person.prototype.setName = function(name) {
  this.name = name;
}

const nicola = new Person('Nicola');
nicola.getName()
nicola.setName('Nicki')
console.log(nicola);
