import config from 'config/config';
import create from 'utils/create';
import Fragment from 'virtualdom/Fragment';
import getElement from 'utils/getElement';
import getNextNumber from 'utils/getNextNumber';
import Hook from 'Ractive/prototype/shared/hooks/Hook';
import HookQueue from 'Ractive/prototype/shared/hooks/HookQueue';
import Viewmodel from 'viewmodel/Viewmodel';
import circular from 'circular';

var constructHook = new Hook( 'construct' ),
	configHook = new Hook( 'config' ),
	initHook = new HookQueue( 'init' );

circular.initialise = initialiseRactiveInstance;
export default initialiseRactiveInstance;

function initialiseRactiveInstance ( ractive, userOptions = {}, options = {} ) {

	var el;

	initialiseProperties( ractive, options );

	// make this option do what would be expected if someone
	// did include it on a new Ractive() or new Component() call.
	// Silly to do so (put a hook on the very options being used),
	// but handle it correctly, consistent with the intent.
	constructHook.fire( config.getConstructTarget( ractive, userOptions ), userOptions );

	// init config from Parent and options
	config.init( ractive.constructor, ractive, userOptions );

	configHook.fire( ractive );

	initHook.begin( ractive );

	// TEMPORARY. This is so we can implement Viewmodel gradually
	ractive.viewmodel = new Viewmodel( ractive, options.mappings );

	// hacky circular problem until we get this sorted out
	// if viewmodel immediately processes computed properties,
	// they may call ractive.get, which calls ractive.viewmodel,
	// which hasn't been set till line above finishes.
	ractive.viewmodel.init();

	// Render our *root fragment*
	if ( ractive.template ) {
		ractive.fragment = new Fragment({
			template: ractive.template,
			root: ractive,
			owner: ractive, // saves doing `if ( this.parent ) { /*...*/ }` later on
		});
	}

	initHook.end( ractive );

	// render automatically ( if `el` is specified )
	if ( el = getElement( ractive.el ) ) {
		ractive.render( el, ractive.append );
	}
}

function initialiseProperties ( ractive, options ) {
	// Generate a unique identifier, for places where you'd use a weak map if it
	// existed
	ractive._guid = getNextNumber();

	// events
	ractive._subs = create( null );

	// storage for item configuration from instantiation to reset,
	// like dynamic functions or original values
	ractive._config = {};

	// two-way bindings
	ractive._twowayBindings = create( null );

	// animations (so we can stop any in progress at teardown)
	ractive._animations = [];

	// nodes registry
	ractive.nodes = {};

	// live queries
	ractive._liveQueries = [];
	ractive._liveComponentQueries = [];

	// properties specific to inline components
	if ( options.component ) {
		ractive.parent = options.parent;
		ractive.container = options.container || null;
		ractive.root = ractive.parent.root;

		ractive._yield = options.yieldTemplate;

		ractive.component = options.component;
		options.component.instance = ractive;
	} else {
		ractive.root = ractive;
		ractive.parent = ractive.container = null;
	}
}
