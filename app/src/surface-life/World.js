define(function (require, exports, module) {

  var View = require('famous/core/View');
  var _ = require('lodash');
  var Transform = require('famous/core/Transform');
  var Surface = require('famous/core/Surface');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Engine = require('famous/core/Engine');
  var Fools = require('fools');


  function Registry(){
    this._content = {};
  }

  _.extend(Registry.prototype, {

    add: function (key, item){
      this._content[key] = item;
    },

    has: function(key){
      return !! this._content[key];
    },

    get: function(key){
      return this.has(key) ? this._content[key] : null;
    },

    remove: function(key){
      if (this._content[key]){
        delete this._content[key];
      }
    }

  });

  function _generate_cells(i, j, k) {
    var data = _.map(_.range(0, i), function (ii) {
      return _.map(_.range(0, j), function (jj) {
        return _.map(_.range(0, k), function(kk){
          return new Registry();
        })
      })
    });
    console.log('data:', data);
    return data;
  }

  function World(i, j, k, size) {
    View.call(this);
    this.i = Math.max(1, Math.round(i)); // the horizontal extent
    this.j = Math.max(1, Math.round(j)); // the depth extent
    this.k = Math.max(1, Math.round(k)); // the vertical extent
    if (size) {
      this.options.CELL_SIZE = size;
    }
    this.beings = [];

    this.cells = _generate_cells(this.i, this.j, this.k);

    this._node.add(new StateModifier({
      transform: Transform.translate(0, 0, -0.5)
    })).add(new Surface({
      size: [i * this.options.CELL_SIZE, j * this.options.CELL_SIZE],
      properties: {
        backgroundColor: 'rgb(0, 51, 153)'
      }
    }));

    Engine.on('prerender', this.update_content.bind(this));
  }

  World.DEFAULT_OPTIONS = _.extend({CELL_SIZE: 100}, View.DEFAULT_OPTIONS);
  World.constructor = World;

  _.extend(World.prototype, View.prototype);

  _.extend(World.prototype, {

    snapshot: function(){
      var self = this;
      return Fools.loop(function(iter){
        return _.map(_.range(0, this.i), function(i){
          return _.map(_.range(0, this.j), function(j){
            var c = self.contents(i, j, iter.k);
            if (c.has('DirtMonster')){
              return 'dm ' + c.get('DirtMonster').dmid;
            } else {
              return '..';
            }
          }).join(',    ');
        }, this).join("\n");
      }.bind(this))
        .dim('k', 0, this.k - 1)();
    },

    update_content: function () {
      Fools.loop(function (iter) {
        var data = this.contents(iter.i, iter.j, iter.k);
        // @TODO ???
      }.bind(this)).dim('i', 0, this.i - 1).dim('j', 0, this.j - 1).dim('k', 0, this.k - 1)();
    },

    constructor: World,

    /**
     * this method removes a reference in world data to an item.
     * it does NOT remove the item from the scene.
     * meaht to be used as part of moving an object from one cell to another
     *
     * @param i
     * @param j
     * @param k
     * @param item
     */
    remove_item: function (item, i, j, k) {
      var data = this.contents(i, j, k);
      data.remove(item.STYPE);
    },

    /**
     * delets an item from ALL cells and the render node.
     * @param item
     */
    detach_item: function (item) {
      this._node._child = _.difference(this._node._chlld, [item]);
      Fools.loop(function(iter){
        this.remove_item(item, iter.i, iter.j, iter.k)
      }.bind(this))
        .dim('i', 0, this.i)
        .dim('j', 0, this.j)
        .dim('k', 0, this.k)();
    },

    _put_item: function (item, i, j, k) {

      if (!(item && item.STYPE)) {
        throw new Error('bad entry to _put_item');
      }

      data = this.contents(i, j, k);

      if (data.has(item.STYPE)) {
        throw new Error('attempt to put item into occupied cell -- ' + item.STYPE);
      }

      data.add(item.STYPE, item);
    },

    contents: function (i, j, k) {

      var row = this.cells[i];
      if (!row) {
        throw new Error('cannot find row ' + i);
      }
      var vert = row[j];
      if (!vert) {
        throw new Error('cannot find col ' + j);
      }

      var data = vert[k];
      if (!data) {
        throw new Error('cannot find data ' + k);
      }

      if (!(_.isObject(data) && (!_.isArray(data)))) {
        throw new Error('bad data');
      }

      return data;
    },

    add_item: function (item, i, j, k) {
      this._put_item(item, i, j, k);
      this._node.add(item);
    },

    /**
     * resets the storage of an item from one cell to another.
     * Does NOT take responsibility for animating the item or changing
     * its display coordinates.
     *
     * @param item
     * @param i
     * @param j
     * @param k
     * @param from_i
     * @param from_j
     * @param from_k
     */
    move_item: function (item, i, j, k, from_i, from_j, from_k) {
      if (!_.isNumber(i) && _.isNumber(j) && _.isNumber(k)){
        throw new Error('bad coordinates');
      }

      var contents = this.contents(i, j, k);

      if (contents[item.STYPE]) {
        throw new Error('attempt to move into occupied space');
      } else {
        this.remove_item(item, from_i, from_j, from_k);
        this._put_item(item, i, j, k);
      }
    }

  });

  module.exports = World;
});