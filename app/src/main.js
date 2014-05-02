/*globals define*/
define(function (require, exports, module) {
  'use strict';
  // import dependencies
  var Engine = require('famous/core/Engine');
  var World = require('surface-life/World');
  var DirtMonster = require('surface-life/DirtMonster');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Transform = require('famous/core/Transform');

  // create the main context
  var mainContext = Engine.createContext();

  mainContext.setPerspective(1000);

  var world = new World(5, 5, 1, 20);

  var monster = new DirtMonster(0, 0, 0, world);

  var mod = new StateModifier({
    origin: [0, 0],
    transform: Transform.moveThen( [250, -100, -100], Transform.rotateX(Math.PI/6))
  });
  mainContext.add(mod).add(world);

  setInterval(function(){
    console.log('world snapshot')
    console.log(world.snapshot());
  }, 5000);

  monster.startMoving();
});
