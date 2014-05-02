define(function (require, exports, module) {

  var View = require('famous/core/View');
  var _ = require('lodash');
  var Engine = require('famous/core/Engine');
  var ImageSurface = require('famous/surfaces/ImageSurface');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Surface = require('famous/core/Surface');
  var Transform = require('famous/core/Transform');

  var dmid = 0;
  function DirtMonster(i, j, k, world) {
    View.call(this);
    this.dmid = ++dmid;
    this.loc = {i: i, j: j, k: k};
    this.options.world = world;
    this._rn = this._node.add(this.mod());
    this._rn.add(this.surface());
    world.add_item(this, i, j, k);

    this._eventInput.on('stacking', this.stacking.bind(this));
    this.startGrowing();
  }

  function _101(v, range) {
    var rand = Math.floor(Math.random() * 3 - 1);
    if (!rand) return 0;

    if (rand == -1) {
      if (v <= 0) {
        return 0;
      }
    }

    if (rand == 1) {
      if (v >= range - 1) {
        return 0;
      }
    }

    return rand;
  }

  DirtMonster.DEFAULT_OPTIONS = _.extend({CELL_SIZE: 100}, View.DEFAULT_OPTIONS);
  DirtMonster.constructor = DirtMonster;

  _.extend(DirtMonster.prototype, View.prototype);

  _.extend(DirtMonster.prototype, {
    STYPE: 'DirtMonster',

    constructor: DirtMonster,

    stacking: function (index, count, items) {
      if (count > 1 && index) {
        this.options.world.remove_item(this.loc.i, this.loc.j, this.loc.k, this);
        this.detach();
      }
    },

    growTransform: function () {
      return Transform.multiply(
        Transform.scale(this.growSize, this.growSize, this.growSize),
        Transform.moveThen([0, -this.size(), 0], Transform.rotateX(Math.PI/-4))
      );

    },

    startGrowing: function () {
      this.growSize = 0.05;
      this._grassModifier = new StateModifier({
        transform: this.growTransform(),
        size: [this.size() / 2, this.size()]
      });

      this.grass = new Surface({
        classes: ['yonngGrass']
      });

      this._rn.add(this._grassModifier).add(this.grass);

      this._growing = setInterval(function(){

        this.updateSize();
        this.updateColor();
        if (this.growSize >= 1){
          clearInterval(this._growing);
          this._growing = null;
        }
      }.bind(this), 200);
    },

    updateSize: function(){

      this.growSize += 0.05;
      this._grassModifier.setTransform(this.growTransform());
    },

    updateColor: function(){
      if (this.growSize > 0.5){
        this.grass.removeClass('youngGrass');
        if (this.growSize > 0.85){
          this.grass.addClass(_.shuffle(['tallGrass', 'tallGrass2', 'tallGrass3']).pop());
          this.grass.removeClass('mediumGrass');
        } else {
          this.grass.addClass('mediumGrass');
        }
      }
    },

    detach: function () {
      this.stopMoving();
      if (this._growing) {
        clearInterval(this._growing);
      }
      this.mod().halt();
      this.surface().setContent('X');
      this.options.world.detach_item(this); // should orphan the item.
    },

    setContent: function (item) {
      this.surface().setContent(item);
    },

    stopMoving: function () {
      if (this._moving) {
        this.clearInterval(this._moving);
      }
      this._moving = null;
    },

    startMoving: function (time) {
      time = time || 200;

      if (this._moving) {
        this.stopMoving();
      }

      this._moving = setInterval(this.move.bind(this), time);
    },

    move: function () {
      var ii = _101(this.loc.i, this.options.world.i);
      var jj = _101(this.loc.j, this.options.world.j);
      var kk = _101(this.loc.k, this.options.world.k);

      //  console.log('offsetting: ', ii, jj, kk);

      ii += this.loc.i;
      jj += this.loc.j;
      kk += this.loc.k;

      var c = this.options.world.contents(ii, jj, kk);

      if (c && c[this.STYPE]) {
        return;
      }

      this.options.world.move_item(
        this,
        ii,
        jj,
        kk,
        this.loc.i,
        this.loc.j,
        this.loc.k
      );

      this.move_to(ii, jj, kk);

      var monster = new DirtMonster(this.loc.i, this.loc.j, this.loc.k, this.options.world);

      setTimeout(monster.startMoving.bind(monster), 3000);

      this.growSize = 0.05;
    },

    mod: function () {
      if (!this._mod) {
        this._mod = new StateModifier({
          transform: Transform.translate(this.loc.i * this.size(), this.loc.j * this.size(), this.loc.k * this.size())
        });
      }
      return this._mod;
    },

    size: function () {
      return this.options.world.options.CELL_SIZE;
    },

    surface: function () {
      if (!this._surface) {
        var size = this.size();
        //  console.log('size of dirt monster: ', size);
        this._surface = new Surface({
          size: [size, size],
          origin: [0.5, 0.5],
          properties: {
            backgroundColor: 'rgb(102,51,0)'
          },
          content: ''
        });
      }
      ;

      return this._surface;
    },

    move_to: function (i, j, k, dur, ease) {
      dur = dur || 100;
      ease = ease || 'easeIn';

      var x = i * this.size();
      var y = j * this.size();
      var z = k * this.size();

      this.loc.i = i;
      this.loc.j = j;
      this.loc.k = k;

      var goto = Transform.translate(x, y, z);
      this.mod().setTransform(goto, {duration: dur, easing: ease}, function () {
      }.bind(this));
    }
  });

  module.exports = DirtMonster;
})
;