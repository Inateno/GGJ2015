define( [ 'DREAM_ENGINE', 'shared', 'data', 'Saw' ],
function( DE, shared, data, Saw )
{
  function createComponent( el, scene )
  {
    var component = shared.components[ el.name ];
    
    // AI / monsters or whatever you like
    if ( component.tag == "character" )
    {
      throw new Error ( "no character in code" );
      /*var character = null;
      switch( component.name )
      {
        character = new AI( "super-monster" )
      }
      scene.mobs.push( character );
      scene.add( character );*/
    }
    else
    {
      var sprite = null;
      if ( !component.sprite )
      {}
      else if ( component.isTile )
        sprite = new DE.TileRenderer( {
          "imageName": component.sprite
          , "w": component.w, "h": component.h
          , "tilesizes": { "w": component.tw || component.w, "h": component.th || component.h }
          , "tileposition": { "x": component.sx, "y": component.sy }
        } );
      else
        sprite = new DE.SpriteRenderer( { "spriteName": component.sprite, "w": component.w, "h": component.h } );
      
      // sprite = new DE.BoxRenderer( { "fillColor": "green" }, component.w, component.h );
      var collider = undefined;
      if ( component.collider && el.zindex >= 0 )
      {
        if ( component.collider.type == "circle" )
          collider = new DE.CircleCollider( component.collider.r,
              { "offsetLeft": component.collider.l, "offsetTop": component.collider.t } );
        else
          collider = new DE.FixedBoxCollider( component.collider.w, component.collider.h,
              { "offsetLeft": component.collider.l, "offsetTop": component.collider.t } );
      }
      
      var o;
      switch( component.tag )
      {
        // example how to made "custom component"
        // case "lava-block":
        //   o = new entities.Door( {
        //     "name": el.name, "tag": component.tag
        //     , "x": el.x >> 0,"y": el.y >> 0, "zindex": el.zindex || component.zindex
        //     ,"renderer": sprite, "collider": collider
        //     ,"destination": el.destination || component.defaultDestination
        //   } );
        //   scene.doors.push( o );
        //   break;
        case "saw-block":
          o = new Saw( el, component, sprite, collider );
          break;
        default:
          o = new DE.GameObject( {
            "name": el.name, "tag": component.tag
            , "x": el.x >> 0,"y": el.y >> 0
            , "z": el.z || component.z || 0
            , "zindex": el.zindex || component.zindex
            , "renderer": sprite, "collider": collider
          } );
      }
      if ( component.tag.match( "ice" ) )
      {
        component.physicCoefReductor = data.coefIceReductor;
        component.physicCoefImpulsion= data.coefIceImpulsion;
      }
      else if ( component.tag.match( "slow" ) )
      {
        component.physicCoefReductor = data.coefSlowReductor;
        component.physicCoefImpulsion= data.coefSlowImpulsion;
      }
      
      switch( component.tag )
      {
        case "lava-block":
          o.on( "collision-enter", function( player )
          {
            player.onFloor = false;
            player.gravity.y = -3;
            player.gravity.x = 2;
            shared[ "camera" + player.playerId ].shake( 10, 10,  500 );
            player.setAnim( "hurt" );
            DE.trigger( "play-random-fx", "big-hurt" );
          } );
          break;
        case "spike-block":
          o.on( "collision-enter", function( player )
          {
            player.onFloor = false;
            player.gravity.y = -1.5;
            player.gravity.x = 1;
            shared[ "camera" + player.playerId ].shake( 5, 5,  500 );
            player.setAnim( "hurt" );
            DE.trigger( "play-random-fx", "hurt" );
          } );
          break;
        case "bounce-block":
          o.on( "collision-enter", function( player )
          {
            player.onFloor = false;
            player.gravity.y = -5;
            player.setAnim( "jump" );
            DE.trigger( "play-random-fx", "happy" );
          } );
          break;
        case "fuck-block":
          o.on( "collision-enter", function( player )
          {
            if ( player.position.y + player.collider.height / 2 - 10 > this.position.y - 10
              || this.lastUse - DE.Time.currentTime < 5000 )
              return;
            this.lastUse = Date.now();
            player.locked = true;
            setTimeout( function()
            {
              player.locked = false;
            }, 3000 );
            shared[ "camera" + player.playerId ].shake( 10, 10, 2500 );
            player.setAnim( "hurt" );
            DE.trigger( "play-random-fx", "rage" );
          } );
      }
      
      o.physicCoefReductor = component.physicCoefReductor || data.coefFloorReductor;
      o.physicCoefImpulsion = component.physicCoefImpulsion || data.coefFloorImpulsion;
      
      // if the tag of the object match with those you can collide with, push inside
      if ( data.environmentCollidersTag.indexOf( o.tag ) !== -1 )
        scene.collideObjects.push( o );
      else if ( o.tag === "event_trigger" )
      {
        o.event_target = el.target || component.target;
        scene.event_triggers.push( o );
      }
      scene.add( o );
      
      if ( o.customInit )
        o.customInit();
      
      return o;
    }
  }
  
  return createComponent;
} );