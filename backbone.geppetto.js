// Backbone.Geppetto v0.2.0
//
// Copyright (C) 2012 Model N, Inc.  
// Distributed under the MIT License
//
// Documentation and full license available at:
// http://modeln.github.com/backbone.geppetto/

/*global Backbone,_*/

Backbone.Marionette.Geppetto = (function ( Backbone, _, $ ) {

        var Geppetto = {};

        Geppetto.EVENT_CONTEXT_SHUTDOWN = "Geppetto:contextShutdown";

        var contexts = {};

        Geppetto.Context = function Context( options ) {

            this.options = options || {};

            this.parentContext = this.options.parentContext;
            this.vent = new Backbone.Marionette.EventAggregator();

            if( this.initialize ) {
                this.initialize();
            }

            this.id = _.uniqueId("Context");

            contexts[this.id] = this;
        };

        Geppetto.bindContext = function bindContext( options ) {

            this.options = options || {};

            var context = new this.options.context(this.options);
            var view = this.options.view;

            // MN: this stuff is just practical
            this.view = view;
            this.model = this.options.view.model;
            this.collection = this.options.view.collection;

            if (!view.close) {
                view.close = Backbone.Marionette.View.close;
            }

            view.on("close", function() {

                // todo: is it really necessary to unmap "close" here? 
                // todo: might already be taken care of by marionette...
                view.off("close");


                context.unmapAll();
            });

            view.context = context;
        };

        // provided to unify with backbone events
        Geppetto.Context.prototype.listen = function listen( eventName, callback, context ) {
            this.vent.bindTo( eventName, callback, context );
        };

        Geppetto.Context.prototype.on = Geppetto.Context.prototype.listen;

        Geppetto.Context.prototype.dispatch = function dispatch( eventName, eventData ) {
            this.vent.trigger( eventName, eventData );
        };

        // provided to unify with backbone events
        Geppetto.Context.prototype.trigger = Geppetto.Context.prototype.dispatch;

        Geppetto.Context.prototype.dispatchToParent = function dispatchToParent( eventName, eventData ) {
            if ( this.parentContext ) {
                this.parentContext.vent.trigger( eventName, eventData );
            }
        };

        Geppetto.Context.prototype.dispatchGlobally = function dispatchGlobally( eventName, eventData ) {

            _.each( contexts, function ( context, contextId ) {
                context.vent.trigger( eventName, eventData );
            } );
        };

        Geppetto.Context.prototype.mapCommand = function mapCommand( eventName, commandClass ) {

            this.vent.bindTo( eventName, function ( eventData ) {

                var commandInstance = new commandClass();

                commandInstance.context = this;
                commandInstance.eventName = eventName;
                commandInstance.eventData = eventData;
                if( commandInstance.execute ){
                    commandInstance.execute();
                }

            }, this );
        };

        Geppetto.Context.prototype.unmapAll = function unmapAll() {

            this.vent.unbindAll();

            delete contexts[this.id];

            this.dispatchToParent(Geppetto.EVENT_CONTEXT_SHUTDOWN);
        };

        var extend = Backbone.View.extend;
        Geppetto.Context.extend = extend;

        contexts = {};

        var debug = {

            contexts : contexts,

            countEvents : function countEvents() {

                var numEvents = 0;

                _.each(contexts, function(context, id) {
                    if (contexts.hasOwnProperty(id)) {
                        numEvents += context.vent.bindings.length;
                    }
                });

                return numEvents;
            },

            countContexts: function countContexts() {

                var numContexts = 0;

                _.each(contexts, function(context, id) {
                    if (contexts.hasOwnProperty(id)){
                        numContexts = numContexts + 1;
                    }
                });
                return numContexts;
            }

        };

        Geppetto.setDebug = function setDebug( enableDebug ) {
            if (enableDebug) {
                this.debug = debug;
            } else {
                this.debug = undefined;
            }
            return this.debug;
        };

        var counter = 0;
        var childCounter = 0;

        return Geppetto;

    })( Backbone, _, window.jQuery || window.Zepto || window.ender );

Backbone.Marionette.Geppetto.Command = function( c ){
    var newCommand = function(){};
    _.extend(newCommand.prototype, c );
    return newCommand;
};

/*_(function(){}).extend({
    extend : function( params ){
        _(this.prototype).extend(params);
        return this;
    }
});
*/