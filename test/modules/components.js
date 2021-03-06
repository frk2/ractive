define([ 'ractive', 'helpers/Model', 'utils/log' ], function ( Ractive, Model, log ) {

	'use strict';

	return function () {

		var fixture;

		module( 'Components' );

		// some set-up
		fixture = document.getElementById( 'qunit-fixture' );

		test( 'Static data is propagated from parent to child', t => {
			var Widget, ractive, widget;

			Widget = Ractive.extend({
				template: '<p>{{foo}}</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="blah"/>',
				components: {
					widget: Widget
				}
			});

			widget = ractive.findComponent( 'widget' );

			t.equal( widget.get( 'foo' ), 'blah' );
			t.htmlEqual( fixture.innerHTML, '<p>blah</p>' );
		});

		test( 'Static object data is propagated from parent to child', t => {
			var Widget, ractive, widget;

			Widget = Ractive.extend({
				template: '<p>{{foo.bar}}</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{ { bar: \'biz\' } }}"/>',
				components: {
					widget: Widget
				}
			});

			widget = ractive.findComponent( 'widget' );
			t.deepEqual( widget.get( 'foo' ), { bar: 'biz' } );
			t.htmlEqual( fixture.innerHTML, '<p>biz</p>' );

			widget.set('foo.bar', 'bah')
			t.deepEqual( widget.get( 'foo' ), { bar: 'bah' } );
			t.htmlEqual( fixture.innerHTML, '<p>bah</p>' );
		});

		test( 'Dynamic data is propagated from parent to child, and (two-way) bindings are created', t => {
			var Widget, ractive, widget;

			Widget = Ractive.extend({
				template: '<p>{{foo}}</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{bar}}"/>',
				components: {
					widget: Widget
				},
				data: {
					bar: 'blah'
				}
			});

			widget = ractive.findComponent( 'widget' );

			t.equal( widget.get( 'foo' ), 'blah' );
			t.htmlEqual( fixture.innerHTML, '<p>blah</p>' );

			ractive.set( 'bar', 'flup' );
			t.equal( widget.get( 'foo' ), 'flup' );
			t.htmlEqual( fixture.innerHTML, '<p>flup</p>' );

			widget.set( 'foo', 'shmup' );
			t.equal( ractive.get( 'bar' ), 'shmup' );
			t.htmlEqual( fixture.innerHTML, '<p>shmup</p>' );
		});

		// Commenting out this test for the moment - is this a desirable feature?
		// It prevents JavaScript closure-like behaviour with data contexts
		/*test( 'Missing data on the parent is not propagated', t => {
			var Widget, ractive, widget;

			Widget = Ractive.extend({
				template: '<p>{{foo}}</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{missing}}"/>',
				components: {
					widget: Widget
				}
			});

			widget = ractive.findComponent( 'widget' );

			t.ok( !( widget.data.hasOwnProperty( 'foo' ) ) );
			t.htmlEqual( fixture.innerHTML, '<p></p>' );
		});*/

		test( 'Missing data on the parent is added when set', t => {
			var Widget, ractive, widget;

			Widget = Ractive.extend({
				template: '<p>{{foo}}</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{missing}}"/>',
				components: {
					widget: Widget
				}
			});

			widget = ractive.findComponent( 'widget' );

			t.htmlEqual( fixture.innerHTML, '<p></p>' );

			ractive.set('missing', 'found')
			t.htmlEqual( fixture.innerHTML, '<p>found</p>' );

		});

		test( 'Data on the child is propagated to the parent, if it is not missing', t => {
			var Widget, ractive, widget;

			Widget = Ractive.extend({
				template: '<p>{{foo}}{{bar}}</p>',
				data: {
					foo: 'yes'
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{one}}" bar="{{two}}"/>',
				components: {
					widget: Widget
				}
			});

			widget = ractive.findComponent( 'widget' );

			t.equal( ractive.get( 'one' ), 'yes' );
			t.ok( !( ractive.data.hasOwnProperty( 'two' ) ) );
			t.htmlEqual( fixture.innerHTML, '<p>yes</p>' );
		});

		test( 'Parent data overrides child data during child model creation', t => {
			var Widget, ractive, widget;

			Widget = Ractive.extend({
				template: '<p>{{foo}}{{bar}}</p>',
				data: {
					foo: 'yes',
					bar: 'no'
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{one}}" bar="{{two}}"/>',
				components: {
					widget: Widget
				},
				data: {
					one: 'uno',
					two: 'dos'
				}
			});

			widget = ractive.findComponent( 'widget' );

			t.equal( ractive.get( 'one' ), 'uno' );
			t.equal( ractive.get( 'two' ), 'dos' );
			t.equal( widget.get( 'foo' ), 'uno' );
			t.equal( widget.get( 'bar' ), 'dos' );

			t.htmlEqual( fixture.innerHTML, '<p>unodos</p>' );
		});

		test( 'Components are rendered in the correct place', t => {
			var Component, ractive;

			Component = Ractive.extend({
				template: '<p>this is a component!</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<h2>Here is a component:</h2><component/><p>(that was a component)</p>',
				components: {
					component: Component
				}
			});

			t.htmlEqual( fixture.innerHTML, '<h2>Here is a component:</h2><p>this is a component!</p><p>(that was a component)</p>' );
		});

		test( 'Top-level sections in components are updated correctly', t => {
			var ractive, Component, component;

			Component = Ractive.extend({
				template: '{{#foo}}foo is truthy{{/foo}}{{^foo}}foo is falsy{{/foo}}'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<component foo="{{foo}}"/>',
				components: {
					component: Component
				}
			});

			t.htmlEqual( fixture.innerHTML, 'foo is falsy' );

			ractive.set( 'foo', true );
			t.htmlEqual( fixture.innerHTML, 'foo is truthy' );
		});

		test( 'Element order is maintained correctly with components with multiple top-level elements', t => {
			var ractive, TestComponent;

			TestComponent = Ractive.extend({
				template: '{{#bool}}TRUE{{/bool}}{{^bool}}FALSE{{/bool}}'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<p>before</p> <test bool="{{bool}}"/> <p>after</p>',
				components: { test: TestComponent }
			});

			t.htmlEqual( fixture.innerHTML, '<p>before</p> FALSE <p>after</p>' );

			ractive.set( 'bool', true );
			t.htmlEqual( fixture.innerHTML, '<p>before</p> TRUE <p>after</p>' );

			ractive.set( 'bool', false );
			t.htmlEqual( fixture.innerHTML, '<p>before</p> FALSE <p>after</p>' );
		});

		test( 'Regression test for #317', t => {
			var Widget, widget, ractive, items;

			Widget = Ractive.extend({
				template: '<ul>{{#items:i}}<li>{{i}}: {{.}}</li>{{/items}}</ul>',
				oninit: function () {
					widget = this;
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget items="{{items}}"/><p>{{ items.join( " " ) }}</p>',
				data: { items: [ 'a', 'b', 'c', 'd' ] },
				components: {
					widget: Widget
				}
			});

			items = ractive.get( 'items' );

			t.equal( fixture.innerHTML, '<ul><li>0: a</li><li>1: b</li><li>2: c</li><li>3: d</li></ul><p>a b c d</p>' );

			items.push( 'e' );
			t.equal( fixture.innerHTML, '<ul><li>0: a</li><li>1: b</li><li>2: c</li><li>3: d</li><li>4: e</li></ul><p>a b c d e</p>' );

			items.splice( 2, 1 );
			t.equal( fixture.innerHTML, '<ul><li>0: a</li><li>1: b</li><li>2: d</li><li>3: e</li></ul><p>a b d e</p>' );

			items.pop();
			t.equal( fixture.innerHTML, '<ul><li>0: a</li><li>1: b</li><li>2: d</li></ul><p>a b d</p>' );

			ractive.set( 'items[0]', 'f' );
			t.equal( fixture.innerHTML, '<ul><li>0: f</li><li>1: b</li><li>2: d</li></ul><p>f b d</p>' );


			// reset items from within widget
			widget.set( 'items', widget.get( 'items' ).slice() );
			items = ractive.get( 'items' );

			items.push( 'g' );
			t.equal( fixture.innerHTML, '<ul><li>0: f</li><li>1: b</li><li>2: d</li><li>3: g</li></ul><p>f b d g</p>' );

			items.splice( 1, 1 );
			t.equal( fixture.innerHTML, '<ul><li>0: f</li><li>1: d</li><li>2: g</li></ul><p>f d g</p>' );

			items.pop();
			t.equal( fixture.innerHTML, '<ul><li>0: f</li><li>1: d</li></ul><p>f d</p>' );

			widget.set( 'items[0]', 'h' );
			t.equal( fixture.innerHTML, '<ul><li>0: h</li><li>1: d</li></ul><p>h d</p>' );
		});

		asyncTest( 'Component oncomplete() methods are called', t => {
			var ractive, Widget, counter, done;

			expect( 2 );

			counter = 2;
			done = function () { --counter || start(); };

			Widget = Ractive.extend({
				oncomplete: function () {
					t.ok( true, 'oncomplete in component' );
					done();
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				oncomplete: function () {
					t.ok( true, 'oncomplete in ractive' );
					done();
				},
				components: {
					widget: Widget
				}
			});
		});

		test( 'Components can access outer data context, in the same way JavaScript functions can access outer lexical scope', t => {
			var ractive, Widget;

			Widget = Ractive.extend({
				template: '<p>{{foo || "missing"}}</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget/><widget foo="{{bar}}"/><widget foo="{{baz}}"/>',
				data: {
					foo: 'one',
					bar: 'two'
				},
				components: {
					widget: Widget
				}
			});

			t.htmlEqual( fixture.innerHTML, '<p>one</p><p>two</p><p>missing</p>' );

			ractive.set({
				foo: 'three',
				bar: 'four',
				baz: 'five'
			});

			t.htmlEqual( fixture.innerHTML, '<p>three</p><p>four</p><p>five</p>' );
		});


		test( 'Nested components can access outer-most data context', t => {
			var ractive, Widget;

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				components: {
					widget: Ractive.extend({
						template: '<grandwidget/>',
						components: {
							grandwidget: Ractive.extend({
								template: 'hello {{world}}'
							})
						},
					})
				},
				data: { world: 'mars' }
			});

			t.htmlEqual( fixture.innerHTML, 'hello mars' );
			ractive.set('world', 'venus');
			t.htmlEqual( fixture.innerHTML, 'hello venus' );
		});

		test( 'Nested components registered at global Ractive can access outer-most data context', t => {
			var ractive, Widget;

			Ractive.components.widget = Ractive.extend({ template: '<grandwidget/>' });
			Ractive.components.grandwidget = Ractive.extend({ template: 'hello {{world}}' });

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				data: { world: 'mars' }
			});

			t.htmlEqual( fixture.innerHTML, 'hello mars' );
			ractive.set('world', 'venus');
			t.htmlEqual( fixture.innerHTML, 'hello venus' );

			delete Ractive.components.widget
			delete Ractive.components.grandwidget
		});

		if ( Ractive.magic ) {
			// As of 0.7.0, the `data` object only contains properties that
			// are owned by a given instance. Commenting out for now, but
			// this test probably needs to be deleted
			/*asyncTest( 'Data passed into component updates inside component in magic mode', t => {
				var ractive, Widget;

				expect( 1 );

				Widget = Ractive.extend({
					template: '{{world}}',
					magic: true,
					oncomplete: function(){
						this.data.world = 'venus'
						t.htmlEqual( fixture.innerHTML, 'venusvenus' );
						start();
					}
				});

				var data = { world: 'mars' }

				ractive = new Ractive({
					el: fixture,
					template: '{{world}}<widget world="{{world}}"/>',
					magic: true,
					components: { widget: Widget },
					data: data
				});
			});*/

			test( 'Data passed into component updates from outside component in magic mode', t => {
				var ractive, Widget;

				Widget = Ractive.extend({
					template: '{{world}}',
					magic: true
				});

				var data = { world: 'mars' }
				ractive = new Ractive({
					el: fixture,
					template: '{{world}}<widget world="{{world}}"/>',
					magic: true,
					components: { widget: Widget },
					data: data
				});

				data.world = 'venus'

				t.htmlEqual( fixture.innerHTML, 'venusvenus' );
			});

			test( 'Indirect changes propagate across components in magic mode (#480)', t => {
				var Blocker, ractive, blocker;

				Blocker = Ractive.extend({
					template: '{{foo.bar.baz}}'
				});

				ractive = new Ractive({
					el: fixture,
					template: '<input value="{{foo.bar.baz}}"><blocker foo="{{foo}}"/>',
					data: { foo: { bar: { baz: 50 } } },
					magic: true,
					components: { blocker: Blocker }
				});

				ractive.set( 'foo.bar.baz', 42 );
				t.equal( ractive.get( 'foo.bar.baz' ), 42 );

				ractive.data.foo.bar.baz = 1337;
				t.equal( ractive.data.foo.bar.baz, 1337 );
				t.equal( ractive.get( 'foo.bar.baz' ), 1337 );

				blocker = ractive.findComponent( 'blocker' );

				blocker.set( 'foo.bar.baz', 42 );
				t.equal( blocker.get( 'foo.bar.baz' ), 42 );

				//blocker.data.foo.bar.baz = 1337;
				blocker.set( 'foo.bar.baz', 1337 ); // TODO necessary since #1373. Might need to review some of these tests
				//t.equal( blocker.data.foo.bar.baz, 1337 );
				t.equal( blocker.get( 'foo.bar.baz' ), 1337 );
			});
		}

		test( 'Component data passed but non-existent on parent data', t => {
			var ractive, Widget;

			Widget = Ractive.extend({
				template: '{{exists}}{{missing}}'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget exists="{{exists}}" missing="{{missing}}"/>',
				components: { widget: Widget },
				data: { exists: 'exists' }
			});

			t.htmlEqual( fixture.innerHTML, 'exists' );
		});

		test( 'Some component data not included in invocation parameters', t => {
			var ractive, Widget;

			Widget = Ractive.extend({
				template: '{{exists}}{{missing}}',
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget exists="{{exists}}"/>',
				components: { widget: Widget },
				data: { exists: 'exists' }
			});

			t.htmlEqual( fixture.innerHTML, 'exists' );
		});

		test( 'Some component data not included, with implicit sibling', t => {
			var ractive, Widget;

			Widget = Ractive.extend({
				template: '{{exists}}{{also}}{{missing}}',
			});

			ractive = new Ractive({
				el: fixture,
				template: '{{#stuff:exists}}<widget exists="{{exists}}" also="{{.}}"/>{{/stuff}}',
				components: { widget: Widget },
				data: {
					stuff: {
						exists: 'also'
					}
				 }
			});

			t.htmlEqual( fixture.innerHTML, 'existsalso' );
		});

		test( 'Isolated components do not interact with ancestor viewmodels', t => {
			var ractive, Widget;

			Widget = Ractive.extend({
				template: '{{foo}}.{{bar}}',
				isolated: true
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{foo}}"/>',
				components: { widget: Widget },
				data: {
					foo: 'you should see me',
					bar: 'but not me'
				}
			});

			t.htmlEqual( fixture.innerHTML, 'you should see me.' );
		});

		test( 'Top-level list sections in components do not cause elements to be out of order (#412 regression)', t => {
			var Widget, ractive;

			Widget = Ractive.extend({
				template: '{{#numbers:o}}<p>{{.}}</p>{{/numbers}}'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<h1>Names</h1><widget numbers="{{first}}"/><widget numbers="{{second}}"/>',
				components: {
					widget: Widget
				},
				data: {
					first: { one: 'one', two: 'two' },
					second: { three: 'three', four: 'four' }
				}
			});

			t.htmlEqual( fixture.innerHTML, '<h1>Names</h1><p>one</p><p>two</p><p>three</p><p>four</p>' );
		});

		test( 'Children do not nuke parent data when inheriting from ancestors', t => {
			var Widget, Block, ractive;

			Widget = Ractive.extend({
				template: '<p>value: {{thing.value}}</p>'
			});

			Block = Ractive.extend({
				template: '<widget thing="{{things.one}}"/><widget thing="{{things.two}}"/><widget thing="{{things.three}}"/>',
				components: { widget: Widget }
			});

			// YOUR CODE GOES HERE
			ractive = new Ractive({
				el: fixture,
				template: '<block/>',
				data: {
					things: {
						one: { value: 1 },
						two: { value: 2 },
						three: { value: 3 }
					}
				},
				components: {
					block: Block
				}
			});

			t.deepEqual( ractive.get( 'things' ), { one: { value: 1 }, two: { value: 2 }, three: { value: 3 } } )
		});

		test( 'Uninitialised implicit dependencies of evaluators that use inherited functions are handled', t => {
			var Widget, ractive;

			Widget = Ractive.extend({
				template: '{{status()}}'
			});

			ractive = new Ractive({
				el: fixture,
				template: '{{status()}}-<widget/>',
				data: {
					status: function () {
						return this.get( '_status' );
					}
				},
				components: {
					widget: Widget
				}
			});

			t.htmlEqual( fixture.innerHTML, '-' );

			ractive.set( '_status', 'foo' );
			t.htmlEqual( fixture.innerHTML, 'foo-foo' );

			ractive.set( '_status', 'bar' );
			t.htmlEqual( fixture.innerHTML, 'bar-bar' );
		});

		asyncTest( 'Instances with multiple components still fire oncomplete() handlers (#486 regression)', t => {
			var Widget, ractive, counter, done;

			Widget = Ractive.extend({
				template: 'foo',
				oncomplete: function () {
					t.ok( true );
					done();
				}
			});

			expect( 3 );

			counter = 3;
			done = function () { --counter || start(); };

			ractive = new Ractive({
				el: fixture,
				template: '<widget/><widget/>',
				components: { widget: Widget },
				oncomplete: function () {
					t.ok( true );
					done();
				}
			});
		});

		test( 'findComponent and findAllComponents work through {{>content}}', t => {

			var Wrapper, Component, ractive;

			Component = Ractive.extend({});
			Wrapper = Ractive.extend({
				template: '<p>{{>content}}</p>',
				components: {
					component: Component
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<wrapper><component/></wrapper>',
				components: {
					wrapper: Wrapper,
					component: Component
				}
			});

			var find = ractive.findComponent('component'),
				findAll = ractive.findAllComponents('component');

			t.ok( find, 'component not found' );
			t.equal( findAll.length, 1);
		});

		test( 'Correct value is given to node._ractive.keypath when a component is torn down and re-rendered (#470)', t => {
			var ractive;

			ractive = new Ractive({
				el: fixture,
				template: '{{#foo}}<widget visible="{{visible}}"/>{{/foo}}',
				data: { foo: {}, visible: true },
				components: {
					widget: Ractive.extend({
						template: '{{#visible}}<p>{{test}}</p>{{/visible}}'
					})
				}
			});

			t.equal( ractive.find( 'p' )._ractive.keypath, '' );

			ractive.set( 'visible', false );
			ractive.set( 'visible', true );

			t.equal( ractive.find( 'p' )._ractive.keypath, '' );
		});

		test( 'Nested components fire the oninit() event correctly (#511)', t => {
			var ractive, Outer, Inner, outerInitCount = 0, innerInitCount = 0;

			Inner = Ractive.extend({
				oninit: function () {
					innerInitCount += 1;
				}
			});

			Outer = Ractive.extend({
				template: '<inner/>',
				oninit: function () {
					outerInitCount += 1;
				},
				components: { inner: Inner }
			});

			ractive = new Ractive({
				el: fixture,
				template: '{{#foo}}<outer/>{{/foo}}',
				data: { foo: false },
				components: { outer: Outer }
			});

			ractive.set( 'foo', true );

			// initCounts should have incremented synchronously
			t.equal( outerInitCount, 1, '<outer/> component should call oninit()' );
			t.equal( innerInitCount, 1, '<inner/> component should call oninit()' );
		});

		test( 'foo.bar should stay in sync between <one foo="{{foo}}"/> and <two foo="{{foo}}"/>', t => {
			var ractive = new Ractive({
				el: fixture,
				template: '<one foo="{{foo}}"/><two foo="{{foo}}"/>',
				components: {
					one: Ractive.extend({ template: '<p>{{foo.bar}}</p>' }),
					two: Ractive.extend({ template: '<p>{{foo.bar}}</p>' })
				}
			});

			ractive.set( 'foo', {} );
			t.htmlEqual( fixture.innerHTML, '<p></p><p></p>' );

			ractive.findComponent( 'one' ).set( 'foo.bar', 'baz' );
			t.htmlEqual( fixture.innerHTML, '<p>baz</p><p>baz</p>' );

			ractive.findComponent( 'two' ).set( 'foo.bar', 'qux' );
			t.htmlEqual( fixture.innerHTML, '<p>qux</p><p>qux</p>' );
		});

		test( 'Index references propagate down to non-isolated components', t => {
			var ractive = new Ractive({
				el: fixture,
				template: '{{#items:i}}<widget letter="{{.}}"/>{{/items}}',
				data: { items: [ 'a', 'b', 'c' ] },
				components: {
					widget: Ractive.extend({
						template: '<p>{{i}}: {{letter}}</p>'
					})
				}
			});

			t.htmlEqual( fixture.innerHTML, '<p>0: a</p><p>1: b</p><p>2: c</p>' );

			ractive.get( 'items' ).splice( 1, 1 );
			t.htmlEqual( fixture.innerHTML, '<p>0: a</p><p>1: c</p>' );
		});

		test( 'Component removed from DOM on tear-down with teardown override that calls _super', t => {

			var Widget = Ractive.extend({
					template: 'foo',
					teardown: function(){
						this._super();
					}
				});
			var ractive = new Ractive({
					el: fixture,
					template: '{{#item}}<widget/>{{/item}}',
					data: { item: {} },
					components: {
						widget: Widget
					}
				});

			t.htmlEqual( fixture.innerHTML, 'foo' );

			ractive.set( 'item' );
			t.htmlEqual( fixture.innerHTML, '' );
		});

		test( 'Component names cannot include underscores (#483)', t => {
			var Component, ractive;

			expect( 1 );

			Component = Ractive.extend({ template: '{{foo}}' });

			try {
				ractive = new Ractive({
					el: fixture,
					template: '<no_lo_dash/>',
					components: {
						no_lo_dash: Component
					}
				});
				t.ok( false );
			} catch ( err ) {
				t.ok( true );
			}
		});

		test( 'Data will propagate up through multiple component boundaries (#520)', t => {
			var ractive, Outer, Inner, inner;

			Inner = Ractive.extend({
				template: '{{input.value}}',
				update: function ( val ) {
					this.set( 'input', { value: val });
				}
			});

			Outer = Ractive.extend({
				template: '{{#inputs}}<inner input="{{this}}"/>{{/inputs}}',
				components: { inner: Inner }
			});

			ractive = new Ractive({
				el: fixture,
				template: '{{#simulation}}<outer inputs="{{inputs}}"/>{{/simulation}}',
				components: { outer: Outer },
				data: {
					simulation: { inputs: [{ value: 1 }] }
				}
			});

			t.equal( ractive.get( 'simulation.inputs[0].value' ), 1 );

			inner = ractive.findComponent( 'inner' );

			inner.update( 2 );
			t.equal( ractive.get( 'simulation.inputs[0].value' ), 2 );
			t.htmlEqual( fixture.innerHTML, '2' );

		});

		test( 'Components can have names that happen to be Array.prototype or Object.prototype methods', t => {
			var Map, ractive;

			Map = Ractive.extend({
				template: '<div class="map"></div>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<map/>',
				components: {
					map: Map
				}
			});

			t.htmlEqual( fixture.innerHTML, '<div class="map"></div>' );
		});

		test( 'Component in template has data function called on initialize', t => {
			var Component, ractive, data = { foo: 'bar' } ;

			Component = Ractive.extend({
				template: '{{foo}}',
				data: function(){ return data }
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				components: { widget: Component },
				data: { foo: 'no' }
			});

			t.equal( fixture.innerHTML, 'bar' );
		});

		test( 'Component in template having data function with no return uses existing data instance', t => {
			var Component, ractive, data = { foo: 'bar' } ;

			Component = Ractive.extend({
				template: '{{foo}}{{bim}}',
				data: function(d){
					d.bim = 'bam'
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				components: { widget: Component },
				data: { foo: 'bar' }
			});

			t.equal( fixture.innerHTML, 'barbam' );
		});

		// Commented out temporarily, see #1381
		/*test( 'Component in template passed parameters with data function', t => {
			var Component, ractive, data = { foo: 'bar' } ;

			Component = Ractive.extend({
				template: '{{foo}}{{bim}}',
				data: function(d){
					d.bim = d.foo
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{outer}}"/>',
				components: { widget: Component },
				data: { outer: 'bar' }
			});

			t.equal( fixture.innerHTML, 'barbar' );
		});*/

		test( 'Component in template with dynamic template function', t => {
			var Component, ractive;

			Component = Ractive.extend({
				template: function( data, parser ){
					return data.useFoo ? '{{foo}}' : '{{fizz}}'
				}
			});


			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{{one}}" fizz="{{two}}" useFoo="true"/>',
				components: { widget: Component },
				data: { one: 'bar', two: 'bizz' }
			});

			t.equal( fixture.innerHTML, 'bar' );
		});

		test( 'Set operations inside an inline component\'s onrender method update the DOM synchronously', t => {
			var ListWidget, ractive, previousHeight = -1;

			ListWidget = Ractive.extend({
				template: '<ul>{{#visibleItems}}<li>{{this}}</li>{{/visibleItems}}</ul>',
				onrender: function () {
					var ul, lis, items, height, i;

					ul = this.find( 'ul' );
					lis = this.findAll( 'li', { live: true });

					items = this.get( 'items' );

					for ( i = 0; i < items.length; i += 1 ) {
						this.set( 'visibleItems', items.slice( 0, i ) );

						t.equal( lis.length, i );

						height = ul.offsetHeight;
						t.ok( height > previousHeight );
						previousHeight = height;
					}
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<list-widget items="{{items}}"/>',
				data: { items: [ 'a', 'b', 'c', 'd' ]},
				components: { 'list-widget': ListWidget }
			});
		});

		test( 'Inline component attributes are passed through correctly', t => {
			var Widget, ractive;

			Widget = Ractive.extend({
				template: '<p>{{foo.bar}}</p><p>{{typeof answer}}: {{answer}}</p><p>I got {{string}} but type coercion ain\'t one</p><p>{{dynamic.yes}}</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget foo="{bar:10}" answer="42 " string="99 problems" dynamic="{yes:{{but}}}"/>',
				data: { but: 'no' },
				components: { widget: Widget }
			});

			t.htmlEqual( fixture.innerHTML, '<p>10</p><p>number: 42</p><p>I got 99 problems but type coercion ain\'t one</p><p>no</p>' );

			ractive.set( 'but', 'maybe' );
			t.htmlEqual( fixture.innerHTML, '<p>10</p><p>number: 42</p><p>I got 99 problems but type coercion ain\'t one</p><p>maybe</p>' );
		});

		// See issue #681
		test( 'Inline component attributes update the value of bindings pointing to them even if they are old values', t => {
			var Widget, ractive;

			Widget = Ractive.extend({
				template: '{{childdata}}'
			});

			ractive = new Ractive({
				el: fixture,
				template: '{{parentdata}} - <widget childdata="{{parentdata}}" />',
				data: { parentdata: 'old' },
				components: { widget: Widget }
			});

			t.htmlEqual( fixture.innerHTML, 'old - old' );

			ractive.findComponent( 'widget' ).set( 'childdata', 'new' );
			t.htmlEqual( fixture.innerHTML, 'new - new' );

			ractive.set( 'parentdata', 'old' );
			t.htmlEqual( fixture.innerHTML, 'old - old' );
		});

		test( 'Insane variable shadowing bug doesn\'t appear (#710)', t => {
			var List, ractive;

			List = Ractive.extend({
				template: '{{#items:i}}<p>{{i}}:{{ foo.bar.length }}</p>{{/items}}'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<list items="{{sorted_items}}"/>',
				components: {
					list: List
				},
				computed: {
					sorted_items: function () {
						return this.get( 'items' ).slice().sort( function ( a, b ) {
							return ( a.rank - b.rank );
						});
					}
				}
			});

			ractive.set( 'items', [
				{ rank: 2, "foo": {"bar": []} },
				{ rank: 1, "foo": {} },
				{ rank: 3, "foo": {"bar": []} }
			]);

			t.htmlEqual( fixture.innerHTML, '<p>0:</p><p>1:0</p><p>2:0</p>' );
		});

		test( 'Components found in view hierarchy', t => {
			var FooComponent, BarComponent, ractive;

			FooComponent = Ractive.extend({
				template: 'foo'
			});

			BarComponent = Ractive.extend({
				template: '<foo/>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<bar/>',
				components: {
					foo: FooComponent,
					bar: BarComponent
				}
			});

			t.equal( fixture.innerHTML, 'foo' );
		});

		test( 'Components not found in view hierarchy when isolated is true', t => {
			var FooComponent, BarComponent, ractive;

			FooComponent = Ractive.extend({
				template: 'foo'
			});

			BarComponent = Ractive.extend({
				template: '<foo/>',
				isolated: true
			});

			ractive = new Ractive({
				el: fixture,
				template: '<bar/>',
				components: {
					foo: FooComponent,
					bar: BarComponent
				}
			});

			t.equal( fixture.innerHTML, '<foo></foo>' );
		});

		test( 'Evaluator in against in component more than once (gh-844)', t => {
			var Component, BarComponent, ractive;


			Component = Ractive.extend({
				template: '{{getLabels(foo)}}{{getLabels(boo)}}',
				data: {
					getLabels: function (x) { return x; },
					foo: 'foo',
					boo: 'boo'
				}
			});

			var r = new Ractive({
				el: fixture,
				components: { c: Component },
				template: '<c>'
			});

			t.equal( fixture.innerHTML, 'fooboo' );
		});

		test( 'Removing inline components causes teardown events to fire (#853)', t => {
			var ractive = new Ractive({
				el: fixture,
				template: '{{#if foo}}<widget/>{{/if}}',
				data: {
					foo: true
				},
				components: {
					widget: Ractive.extend({
						template: 'widget',
						oninit: function () {
							this.on( 'teardown', function () {
								t.ok( true );
							})
						}
					})
				}
			});

			expect( 1 );
			ractive.toggle( 'foo' );
		});

		test( 'Regression test for #871', t => {
			var ractive = new Ractive({
				el: fixture,
				template: '{{#items:i}}<p>outside component: {{i}}-{{uppercase(.)}}</p><widget text="{{uppercase(.)}}" />{{/items}}',
				data: {
					items: [ 'a', 'b', 'c' ],
					uppercase: function ( letter ) {
						return letter.toUpperCase();
					}
				},
				components: {
					widget: Ractive.extend({
						template: '<p>inside component: {{i}}-{{text}}</p>'
					})
				}
			});

			ractive.splice( 'items', 1, 1 );

			t.htmlEqual( fixture.innerHTML, '<p>outside component: 0-A</p><p>inside component: 0-A</p><p>outside component: 1-C</p><p>inside component: 1-C</p>' );
		});

		test( 'Specify component by function', t => {
			var Widget1, Widget2, ractive;

			Widget1 = Ractive.extend({ template: 'widget1' });
			Widget2 = Ractive.extend({ template: 'widget2' });

			ractive = new Ractive({
				el: fixture,
				template: '{{#items}}<widget/>{{/items}}',
				components: {
					widget: function( data ) {
						return data.foo ? Widget1 : Widget2;
					}
				},
				data: {
					foo: true,
					items: [1]
				}
			});

			t.htmlEqual( fixture.innerHTML, 'widget1' );
			ractive.set( 'foo', false );
			ractive.push( 'items', 2);
			t.htmlEqual( fixture.innerHTML, 'widget1widget1', 'Component pinned until reset' );

			ractive.reset( ractive.data );
			t.htmlEqual( fixture.innerHTML, 'widget2widget2' );
		});

		test( 'Specify component by function as string', t => {
			var Widget, ractive;

			Widget = Ractive.extend({ template: 'foo' });

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				components: {
					widget: function( data ) {
						return 'widget1';
					},
					widget1: Widget
				}
			});

			t.htmlEqual( fixture.innerHTML, 'foo' );
		});

		if ( console && console.warn ) {

			test( 'no return of component warns in debug', t => {

				var ractive, warn = console.warn;

				expect( 1 );

				console.warn = function( msg ) {
					t.ok( msg );
				}

				ractive = new Ractive({
					el: fixture,
					template: '<widget/>',
					debug: true,
					components: {
						widget: function( data ) {
							// where's my component?
						}
					}
				});

				console.warn = warn;

			});
		}

		test( '`this` in function refers to ractive instance', t => {

			var thisForFoo, thisForBar, ractive, Component;

			Component = Ractive.extend({})

			ractive = new Ractive({
				el: fixture,
				template: '<foo/><widget/>',
				data: { foo: true },
				components: {
					widget: Ractive.extend({
						template: '<bar/>'
					}),
					foo: function ( ) {
						thisForFoo = this;
						return Component;
					},
					bar: function ( ) {
						thisForBar = this;
						return Component;
					}
				}
			});

			t.equal( thisForFoo, ractive );
			t.equal( thisForBar, ractive );

		});

		asyncTest( 'oninit() only fires once on a component (#943 #927), oncomplete fires each render', t => {

			var Component, component, inited = false, completed = 0, rendered = 0;

			expect( 5 );

			Component = Ractive.extend({
				oninit: function () {
					t.ok( !inited, 'oninit should not be called second time' );
					inited = true;
				},
				onrender: function() {
					rendered++;
					t.ok( true );
				},
				oncomplete: function() {
					completed++;
					t.ok( true );
					if( rendered === 2 && completed === 2 ) { start(); }
				}
			});

			component = new Component({
				el: fixture,
				template: function( data ){
					return data.foo ? 'foo' : 'bar';
				}
			});

			component.reset( { foo: true } );
		});

		if ( Ractive.svg ) {
			test( 'Top-level elements in components have the correct namespace (#953)', function ( t ) {
				var ractive = new Ractive({
					el: fixture,
					template: '<svg><widget message="yup"/></svg>',
					components: {
						widget: Ractive.extend({
							template: '<text>{{message}}</text>'
						})
					}
				});

				t.equal( ractive.find( 'text' ).namespaceURI, 'http://www.w3.org/2000/svg' );
				t.htmlEqual( fixture.innerHTML, '<svg><text>yup</text></svg>' );
			});
		}

		test( 'Component bindings propagate the underlying value in the case of adaptors (#945)', function ( t ) {
			var Widget, ractive;

			Widget = Ractive.extend({
				adapt: [ Model.adaptor ],
				template: '{{#model}}Title: {{title}}{{/model}}'
			});

			ractive = new Ractive({
				el: fixture,
				template: '{{#model}}<widget model="{{this}}"/>{{/model}}',
				data: {
					model: new Model({"title": "aaa", "something": ""})
				},
				components: {
					widget: Widget
				}
			});

			ractive.get("model").set("something", "anything");
			t.ok( ractive.get( 'model' ) instanceof Model );
		});

		test( 'Implicit bindings are created at the highest level possible (#960)', function ( t ) {
			var ractive, widget;

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				data: { person: {} },
				components: {
					widget: Ractive.extend({
						template: '<input value="{{person.first}}"/><input value="{{person.last}}"/>'
					})
				}
			});

			widget = ractive.findComponent( 'widget' );

			widget.findAll( 'input' )[0].value = 'Buzz';
			widget.findAll( 'input' )[1].value = 'Lightyear';
			widget.updateModel();

			t.deepEqual( ractive.get( 'person' ), { first: 'Buzz', last: 'Lightyear' });
			t.equal( ractive.get( 'person' ), widget.get( 'person' ) );
		});

		test( 'Implicit bindings involving context (#975)', function ( t ) {
			var ractive = new Ractive({
				el: fixture,
				template: '{{#context}}<widget/>{{/}}',
				components: {
					widget: Ractive.extend({
						template: 'works? {{works}}'
					})
				},
				data: {
					context: {
						works: 'yes'
					}
				}
			});

			t.htmlEqual( fixture.innerHTML, 'works? yes' );
		});

		test( 'Reference expressions default to two-way binding (#996)', function ( t ) {
			var ractive, widgets, output;

			ractive = new Ractive({
				el: fixture,
				template: `
					{{#each rows:r}}
						{{#columns}}
							<widget row="{{rows[r]}}" column="{{this}}" />
						{{/columns}}
					{{/each}}
					<pre>{{JSON.stringify(rows)}}</pre>`,
				data: {
					rows: [
						{ name: 'Alice', age: 30 }
					],
					columns: [ 'name', 'age' ]
				},
				components: {
					widget: Ractive.extend({ template: '<input value="{{row[column]}}" />' })
				}
			});

			output = ractive.find( 'pre' );
			widgets = ractive.findAllComponents( 'widget', { live: true });

			widgets[0].find( 'input' ).value = 'Angela';
			widgets[0].updateModel();
			t.deepEqual( JSON.parse( output.innerHTML ), [{ name: 'Angela', age: 30 }] );

			ractive.unshift( 'rows', { name: 'Bob', age: 54 });
			widgets[0].find( 'input' ).value = 'Brian';
			widgets[0].updateModel();
			t.deepEqual( JSON.parse( output.innerHTML ), [{ name: 'Brian', age: 54 }, { name: 'Angela', age: 30 }] );
		});

		test( 'Inline components disregard `el` option (#1072) (and print a warning in debug mode)', function ( t ) {
			var warn = console.warn;

			expect( 1 );

			console.warn = function () {
				t.ok( true );
			};

			var ractive = new Ractive({
				el: fixture,
				data: { show: true },
				template: '{{#if show}}<widget/>{{/if}}',
				components: {
					widget: Ractive.extend({
					    el: fixture,
					    template: '{{whatever}}'
					})
				},
				debug: true
			});

			ractive.set( 'show', false );
			console.warn = warn;
		});

		test( 'Double teardown is handled gracefully (#1218)', function ( t ) {
			var Widget, ractive;

			expect( 0 );

			Widget = Ractive.extend({
				template: '<p>foo: {{foo}}</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: `
					{{#visible}}
						<widget autoclose='1000' on-teardown='hideChild' />
					{{/visible}}`,
				data: {
					visible: true
				},
				components: { widget: Widget }
			});

			ractive.on( 'hideChild', () => ractive.set( 'visible', false ) );
			ractive.findComponent( 'widget' ).teardown();
		});

		test( 'component.teardown() causes component to be removed from the DOM (#1223)', function ( t ) {
			var Widget, ractive, _fixture;

			Widget = Ractive.extend({
				template: '<p>I am here!</p>'
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				components: { widget: Widget }
			});

			ractive.findComponent( 'widget' ).teardown();
			t.htmlEqual( fixture.innerHTML, '' );
		});

		test( 'Data that does not exist in a parent context binds to the current instance on set (#1205)', function ( t ) {
			var ractive = new Ractive({
				el: fixture,
				template: '<widget/><widget/>',
				components: {
					widget: Ractive.extend({
						template: '<p>title:{{title}}</p>'
					})
				}
			});

			ractive.findComponent( 'widget' ).set( 'title', 'foo' );

			t.htmlEqual( fixture.innerHTML, '<p>title:foo</p><p>title:</p>' );
		});

		test( 'Inter-component bindings can be created via this.get() and this.observe(), not just through templates', function ( t ) {
			var Widget, ractive;

			Widget = Ractive.extend({
				template: '<p>message: {{proxy}}</p>',

				oninit: function () {
					this.observe( 'message', function ( message ) {
						this.set( 'proxy', message );
					});

					t.equal( this.get( 'answer' ), 42 );
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				data: {
					message: 'hello',
					answer: 42
				},
				components: {
					widget: Widget
				}
			});

			t.htmlEqual( fixture.innerHTML, '<p>message: hello</p>' );
			ractive.set( 'message', 'goodbye' );
			t.htmlEqual( fixture.innerHTML, '<p>message: goodbye</p>' );
		});

		test( 'Component CSS is added to the page before components (#1046)', function ( t ) {
			var Box, ractive;

			Box = Ractive.extend({
				template: '<div class="box"></div>',
				css: '.box { width: 100px; height: 100px; }',
				onrender: function () {
					var div = this.find( '.box' );
					t.equal( div.offsetHeight, 100 );
					t.equal( div.offsetWidth, 100 );
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '{{#if showBox}}<box/>{{/if}}',
				components: { box: Box }
			});

			ractive.set( 'showBox', true );
		});

		test( 'Sibling components do not unnessarily update on refinement update of data. (#1293)', function ( t ) {
			var ractive, Widget1, Widget2, noCall = false, warn = console.warn;

			expect( 3 );

			console.warn = function (err) { throw err };

			try {
				Widget1 = Ractive.extend({
					debug: true,
					template: 'w1:{{tata.foo}}{{tata.bar}}'
				});

				Widget2 = Ractive.extend({
					debug: true,
					template: 'w2:{{schmata.foo}}{{calc}}',
					computed: {
						calc: function () {
							if( noCall ) { throw new Error('"calc" should not be recalculated!')}
							return this.get('schmata.bar')
						}
					},
					oninit: function () {
						this.observe('schmata.bar', function (n,o,k) {
							throw new Error('observe on schmata.bar should not fire')
						}, { init: false } )
					}
				});

				ractive = new Ractive({
					el: fixture,
					template: '{{data.foo}}{{data.bar}}<widget1 tata="{{data}}"/><widget2 schmata="{{data}}"/>',
					data: {
						data: {
							foo: 'foo',
							bar: 'bar'
						}
					},
					components: {
						widget1: Widget1,
						widget2: Widget2
					},
					oninit: function () {
						this.observe('data.bar', function (n,o,k) {
							throw new Error('observe on data.bar should not fire')
						}, { init: false } )
					}
				});

				t.htmlEqual( fixture.innerHTML, 'foobarw1:foobarw2:foobar' );
				noCall = true;
				ractive.findComponent('widget1').set( 'tata.foo', 'update' );
				t.htmlEqual( fixture.innerHTML, 'updatebarw1:updatebarw2:updatebar' );

				t.ok( true );

			} catch(err){
				t.ok( false, err );
			} finally {
				console.warn = warn;
			}

		});

		test( 'Component bindings respect smart updates (#1209)', function ( t ) {
			var Widget, ractive, intros = {}, outros = {};

			Widget = Ractive.extend({
				template: '{{#each items}}<p intro-outro="log">{{this}}</p>{{/each}}',
				transitions: {
					log: function ( t ) {
						var x = t.node.innerHTML, count = t.isIntro ? intros : outros;

						if ( !count[x] ) count[x] = 0;
						count[x] += 1;

						t.complete();
					}
				}
			});

			ractive = new Ractive({
				el: fixture,
				template: '<widget/>',
				components: { widget: Widget },
				data: { items: [ 'a', 'b', 'c' ]}
			});

			t.deepEqual( intros, { a: 1, b: 1, c: 1 });

			ractive.merge( 'items', [ 'a', 'c' ]);
			t.deepEqual( outros, { b: 1 });

			ractive.shift( 'items' );
			t.deepEqual( outros, { a: 1, b: 1 });
		});

		test( 'Decorators and transitions are only initialised post-render, when components are inside elements (#1346)', function ( t ) {
			var ractive, inDom = {};

			ractive = new Ractive({
				el: fixture,
				template: '<div decorator="check:div"><widget><p decorator="check:p"></p></div>',
				components: {
					widget: Ractive.extend({
						template: '<div decorator="check:widget">{{yield}}</div>'
					})
				},
				decorators: {
					check: function ( node, id ) {
						inDom[ id ] = fixture.contains( node );
						return { teardown: function () {} };
					}
				}
			});

			t.deepEqual( inDom, { div: true, widget: true, p: true });
		});

		test( 'Multiple related values propagate across component boundaries (#1373)', function ( t ) {
			var ractive = new Ractive({
				el: fixture,
				template: '<tweedle dee="{{dee}}" dum="{{dum}}"/>',
				data: {
					dee: 'spoiled',
					dum: 'rattle'
				},
				components: {
					tweedle: Ractive.extend({
						template: '{{ dee ? dee : "lewis"}} {{dum ? dum : "carroll"}}'
					})
				}
			});

			ractive.set({
				dee: 'forget',
				dum: 'quarrel'
			});

			t.htmlEqual( fixture.innerHTML, 'forget quarrel' );
		});

		test( 'Components unbind their resolvers while they are unbinding (#1428)', t => {
			let ractive = new Ractive({
				el: fixture,
				template: '{{#list}}<cmp item="{{foo[.]}}" />{{/}}',
				components: {
					cmp: Ractive.extend({
						template: '{{item}}'
					})
				},
				data: {
					list: [ 'a', 'b', 'c', 'd' ],
					foo: {
						a: 'rich',
						b: 'john ',
						c: 'jacob ',
						d: 'jingleheimerschmidt'
					}
				}
			});

			ractive.splice('list', 0, 1);

			t.htmlEqual( fixture.innerHTML, 'john jacob jingleheimerschmidt' );
		});

		// Commented out temporarily, see #1381
		/*test( 'Binding from parent to computation on child that is bound to parent should update properly (#1357)', ( t ) => {
			var ractive = new Ractive({
				el: fixture,
				template: '{{b}} <component a="{{a}}" b="{{b}}" />',
				data: { a: 'a' },
				components: {
					component: Ractive.extend({
						template: '{{a}} {{b}}',
						computed: {
							b: function() { return 'foo' + this.get('a'); }
						}
					})
				}
			});

			t.htmlEqual( fixture.innerHTML, 'fooa a fooa' );
			ractive.set( 'a', 'bar' );
			t.htmlEqual( fixture.innerHTML, 'foobar bar foobar' );
		});*/

	};

});
