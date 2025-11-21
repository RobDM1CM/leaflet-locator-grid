

  /***  Maidenhead Locator Grid Layer, using Layer  ***/

  L.LocatorGrid = L.Layer.extend({

    /******************************************************/
    initialize: function (options = {}) {
        L.setOptions(this, options);
    },


    /******************************************************/
    onAdd(map) {

        this._map = map;
        this._container = L.DomUtil.create('div', 'locator-grid-layer');
        this._map.getPanes().overlayPane.appendChild(this._container);

        this._redrawing = false;

        this.redraw();

        mapLocatorGridVisible = true;

    },


    /******************************************************/
    onRemove(map) {

        this._clear();

        if (this._container) {
            L.DomUtil.remove(this._container);
        }
        this._map = null;

        mapLocatorGridVisible = false;

    },


    /******************************************************/
    // <-- THIS IS THE MAGIC FOR AUTO-UPDATE...
    getEvents() {
        return {
            moveend: this.redraw,
            //zoomend: this.redraw
        };
    },


    /******************************************************/
    redraw() {

        if (this._redrawing) return;
        this._redrawing = true;

        L.Util.requestAnimFrame(() => {
            this._clear();
            this._drawGridLines();
            this._drawGridLabels();
            this._redrawing = false;
        });

    },


    /******************************************************/
    _clear() {
        while (this._container.firstChild) {
            this._container.removeChild(this._container.firstChild);
        }
    },


    /******************************************************/
    _update() {

        // Clear existing content...
        setTimeout(() => {
                            this._clear();
                            this._container.innerHTML = "";
                          }, 10);

        setTimeout(() => {
                            this._drawGridLines();
                            this._drawGridLabels();
                          }, 20);

    },


    /******************************************************/
    _drawGridLines() {

        let t, r, b, l, xl, xr, yt, yb, lineY, lineX, detLvl, line;
        let sw, ne, latStep, lngStep, locStr;
        let err = Math.pow(10, -4);


        // Get map bounds and top, right, bottom and left values.....
        const zoomLevel = this._map.getZoom();
        const bnds = this._map.getBounds();       // Geographical bounds visible in the current map view...
        //console.log("Map bounds: ", bnds);

        ne = bnds.getNorthEast();
        sw = bnds.getSouthWest();
        tLat = ne.lat;
        bLat = sw.lat;
        lLng = sw.lng;
        rLng = ne.lng;
        if (tLat == bLat) { bLat = -90.0; tLat = 90.0; }
        if (lLng == rLng) { lLng = -180.0; rLng = 180.0; }


        // Get start and stop pixel-positions for lines.....
        if (zoomLevel < 3) {
          // Don't draw the grid at very low zoom levels...
          return;
        } else {
          // Full pixel dimensions of the map area in the browser window...
          // latLngToLayerPoint gives "...the corresponding pixel coordinate relative to the origin pixel."
          xl = parseInt(this._map.latLngToLayerPoint(sw).x) - 100;
          xr = parseInt(this._map.latLngToLayerPoint(ne).x) + 100;
          yt = parseInt(this._map.latLngToLayerPoint(ne).y) - 100;
          yb = parseInt(this._map.latLngToLayerPoint(sw).y) + 100;
          //console.log("Left = " + xl + ", Right = " + xr);
          //console.log("Top = " + yt + ", Bottom = " + yb);
        }


        // Level of grid detail shown depends on the zoom level.....
        if (zoomLevel < 3) {
          // Don't draw the grid at very low zoom levels...
          return;
        } else if ((zoomLevel >= 3) && (zoomLevel < 4)) {
          // Show "field" blocks (e.g. "JN")...
          latStep = 10.0;
          lngStep = 20.0;
          detLvl = 1;
        } else if ((zoomLevel >= 4) && (zoomLevel < 8)) {
          // Show "square" blocks (e.g. "JN57")...
          latStep = 1.0;
          lngStep = 2.0;
          detLvl = 2;
        } else if ((zoomLevel >= 8) && (zoomLevel < 12)) {
          // Show "subsquare" blocks (e.g. "JN57ur")...
          latStep = 0.04166666;    // 2.5'...
          lngStep = 0.08333333;    // 5'...
          detLvl = 3;
        } else if (zoomLevel >= 12) {
          // Show "extended square" blocks (e.g. "JN57ur47")...
          latStep = 0.004166666;    // 0.25'...
          lngStep = 0.008333333;    // 0.5'...
          detLvl = 4;
        }

        // round iteration limits to the computed grid interval
        // These are lat and long values!!!!!
        //console.log("Longs: Left = " + lLng + ", Right = " + rLng);
        //console.log("Lats : Top = " + tLat + ", Bottom = " + bLat);
        //console.log("---");
        tLat = Math.ceil(tLat / latStep) * latStep;
        rLng = Math.ceil(rLng / lngStep) * lngStep;
        bLat = Math.floor(bLat / latStep) * latStep;
        lLng = Math.floor(lLng / lngStep) * lngStep;
        if (rLng == lLng) lLng += lngStep;
        if (rLng < lLng) rLng += 360.0;
        //console.log("Longs: Left = " + lLng + ", Right = " + rLng + ", Step = " + lngStep);
        //console.log("Lats : Top = " + tLat + ", Bottom = " + bLat + ", Step = " + latStep);
        //console.log("---");




        /*****  Latitudes, bottom to top *****/
        for (let lineLat = bLat; lineLat <= tLat; lineLat += latStep) {
          lineY = this._latLngToPixel(lineLat, lLng).y;

          switch (detLvl) {
          case 1:
            // Lats in ten degree steps...
            thk = 1;
            break;
          case 2:
            // Lats in one degree steps...
            if (this._eqE((lineLat % 10), 0, err)) {
              thk = 3;
            } else {
              thk = 1;
            }
            break;
          case 3:
            // Lats in 2.5 minutes steps...
            // We're dealing with floats here, so we need to equate
            // some small number like 0.00000001 to zero.....
            if ( (this._eqE((lineLat % 10), 0, err)) || (this._eqE((lineLat % 10), 10, err)) ) {      // LATS....
              thk = 5;
            } else if (this._eqE((lineLat % 1), 1, err)) {
              thk = 3;
            } else {
              thk = 1;
            }
            break;
          case 4:
            // Lats in 0.25 minutes steps...
            // We're dealing with floats here, so we need to equate
            // some small number like 0.00000001 to zero.....
            if ( (this._eqE((lineLat % 10), 0, err)) || (this._eqE((lineLat % 10), 10, err)) ) {      // LATS....
              thk = 5;
            } else if ( (this._eqE((lineLat % 1), 1, err)) || (this._eqE((lineLat % 1), 1, err)) ) {
              thk = 5;
            } else if ( this._eqE(((lineLat/0.04166666) - Math.floor(lineLat/0.04166666)), 0, err) )  {
              thk = 3;
            } else {
              thk = 1;
            }
            break;
          }

          this._addLatLine(lineY, xl, xr, thk);

        }  // for each latitude line...



        /*****  Longitudes, left to right  *****/
        for (let lineLng = lLng; lineLng < rLng; lineLng += lngStep) {
          if (lineLng > 180.0) {
            rLng -= 360.0;
            lineLng -= 360.0;
          }
          lineX = this._latLngToPixel(bLat, lineLng).x;

          switch (detLvl) {
          case 1:
            // Longs in twenty degree steps...
            thk = 1;
            break;
          case 2:
            // Lats in two degree steps...
            if ( (this._eqE(Math.abs(lineLng % 20), 0, err)) || (this._eqE(Math.abs(lineLng % 20), 20, err)) ) {        // LONGS.......
              thk = 3;
            } else {
              thk = 1;
            }
            break;
          case 3:
            // Longs in 5 minutes steps...
            // We're dealing with floats here, so we need to equate
            // some small number like 0.00000001 to zero.....
            if ( (this._eqE(Math.abs(lineLng % 20), 0, err)) || (this._eqE(Math.abs(lineLng % 20), 20, err)) ) {        // LONGS.......
              thk = 5;
            } else if ( (this._eqE(Math.abs(lineLng % 2), 0, err)) || (this._eqE(Math.abs(lineLng % 2), 2, err)) ) {
              thk = 3;
            } else {
              thk = 1;
            }
            break;

          case 4:
            // Longs in 0.5 minutes steps...
            // We're dealing with floats here, so we need to equate
            // some small number like 0.00000001 to zero.....
            if ( (this._eqE(Math.abs(lineLng % 20), 0, err)) || (this._eqE(Math.abs(lineLng % 20), 20, err)) ) {      // LONGS....
              thk = 5;
            } else if ( (this._eqE(Math.abs(lineLng % 2), 0, err)) || (this._eqE(Math.abs(lineLng % 2), 2, err)) ) {
              thk = 5;
            } else if ( this._eqE((Math.abs(lineLng / 0.0833333) - Math.floor(Math.abs(lineLng / 0.0833333))), 0, err) )  {
              thk = 3;
            } else {
              thk = 1;
            }
            break;

          }
          this._addLngLine(lineX, yt, yb, thk);

        }  // for each Longitude line...


    },

    /******************************************************/
    _drawGridLabels() {

        var t, r, b, l;
        var sw, ne, latStep, lngStep, locStr, label;
        var locAccuracy;

        // Get bounds and top, right, bottom and left values.....
        var bnds = this._map.getBounds();
        ne = bnds.getNorthEast();
        sw = bnds.getSouthWest();
        tLat = ne.lat;
        rLng = ne.lng;
        bLat = sw.lat;
        lLng = sw.lng;
        if (tLat == bLat) { bLat = -90.0; tLat = 90.0; }
        if (lLng == rLng) { lLng = -180.0; rLng = 180.0; }
        //console.log("Left = " + lLng + ", Right = " + rLng);

        // Get viewport bounds.....
        var zoomLevel = this._map.getZoom();
        if (zoomLevel < 3) {
          return;
        } /* else {
          // These never change, either on zoom or pan...
//          xl = parseInt(this._map.latLngToContainerPoint(sw).x);
//          xr = parseInt(this._map.latLngToContainerPoint(ne).x);
//          yt = parseInt(this._map.latLngToContainerPoint(ne).y);
//          yb = parseInt(this._map.latLngToContainerPoint(sw).y);

          // These change ONLY on pan...
          xl = parseInt(this._map.latLngToLayerPoint(sw).x);
          xr = parseInt(this._map.latLngToLayerPoint(ne).x);
          yt = parseInt(this._map.latLngToLayerPoint(ne).y);
          yb = parseInt(this._map.latLngToLayerPoint(sw).y);
        }
        //console.log("Left = " + xl + ", Right = " + xr);   */





        // Which texts, and when to draw them, depends on the zoom level.....
        if (zoomLevel < 10) {

          // We're dealing with integer degree values.....
          if (zoomLevel < 3) {
            // Don't draw the grid.....
            return;
          } else if ((zoomLevel >= 3) && (zoomLevel < 5)) {
            // Show only "field" blocks (e.g. "JN")...
            latStep = 10.0;
            lngStep = 20.0;
            locAccuracy = 2;
          } else if ((zoomLevel >= 5) && (zoomLevel < 10)) {
            // Show only "square" blocks (e.g. "JN57")...
            latStep = 1.0;
            lngStep = 2.0;
            locAccuracy = 4;
          }

          // round iteration limits to the computed grid interval
          tLat = Math.ceil(tLat / latStep) * latStep;
          rLng = Math.ceil(rLng / lngStep) * lngStep;
          bLat = Math.floor(bLat / latStep) * latStep;
          lLng = Math.floor(lLng / lngStep) * lngStep;
          if (rLng == lLng) lLng += lngStep;
          if (rLng < lLng) rLng += 360.0;

        } else if ((zoomLevel >= 10) && (zoomLevel <= 14)) {

          // Show "subsquare" blocks (e.g. "JN57ur")...
          // We're now dealing with fractions of degrees - multiply
          // everything by 24 (=60/2.5) so the loop runs on integer values......
          latStep = 1;    // 2.5'...
          lngStep = 2;    // 5'...
          locAccuracy = 6;

          tLat = Math.ceil(tLat*24 / latStep) * latStep;
          rLng = Math.ceil(rLng*24 / lngStep) * lngStep;
          bLat = Math.floor(bLat*24 / latStep) * latStep;
          lLng = Math.floor(lLng*24 / lngStep) * lngStep;
          if (lLng == rLng) lLng += lngStep;
          if (lLng > rLng) rLng += 360.0*24;

        } else if ((zoomLevel > 14)) {

          // Show "extended square" blocks (e.g. "JN57ur25")...

          // We're now dealing with fractions of degrees - multiply
          // everything by 240 (=60/0.25) so the loop runs on integer values......
          latStep = 1;    // 0.25'...
          lngStep = 2;    // 0.5'...
          locAccuracy = 8;

          tLat = Math.ceil(t*240 / latStep) * latStep;
          rLng = Math.ceil(r*240 / lngStep) * lngStep;
          bLat = Math.floor(b*240 / latStep) * latStep;
          lLng = Math.floor(l*240 / lngStep) * lngStep;
          if (lLng == rLng) lLng += lngStep;
          if (lLng > rLng) rLng += 360.0*240;

        }
        console.log("Top = " + tLat + ", Bottom = " + bLat);
        console.log("Left = " + lLng + ", Right = " + rLng);




        // Locator texts - locator position is actually the southwest
        // corner of the locator box, but the text div is constructed
        // from its' top-left (northwest) corner.....................
        let zahl = 0;
        for (let labelLng = lLng; labelLng < rLng; labelLng += lngStep) {

          // We may be crossing the dateline somewhere, so test and adjust for it...
          if (locAccuracy < 6) {
            if (labelLng >= 180.0) {
              labelLng -= 360.0;
              rLng -= 360.0;
            }
          } else if (locAccuracy == 6) {
            if (labelLng >= 180.0*24) {
              labelLng -= 360.0*24;
              rLng -= 360.0*24;
            }
          } else {
            // locAccuracy = 8...
            if (labelLng >= 180.0*240) {
              labelLng -= 360.0*240;
              rLng -= 360.0*240;
            }
          }

          for (let labelLat = bLat; labelLat <=tLat; labelLat += latStep) {

            zahl++;

            if (locAccuracy < 6) {
              iLt = labelLat;   // Bottom...
              iLg = labelLng;   // Left...
              dLt = latStep;   // Height...
              dLg = lngStep;   // Width...
              tinyShift = 0.02;
            } else if (locAccuracy == 6) {
              iLt = roundNum((labelLat / 24.0), 6);   // Bottom...
              iLg = roundNum((labelLng / 24.0), 6);   // Left...
              dLt = roundNum((latStep / 24.0), 6);   // Height...
              dLg = roundNum((lngStep / 24.0), 6);   // Width...
              tinyShift = 0.02;
            } else {
              // locAccuracy = 8...
              iLt = roundNum((labelLat / 240), 6);   // Bottom...
              iLg = roundNum((labelLng / 240), 6);   // Left...
              dLt = roundNum((latStep / 240), 6);   // Height...
              dLg = roundNum((lngStep / 240), 6);   // Width...
              tinyShift = 0.002;
            }


            // Add tinyShift to guarantee a position within the block.....
            locStr = getLocatorStringFromCoordinates(iLt + tinyShift, iLg + tinyShift*2, locAccuracy);


            if ((locStr.substr(0, 1) == "S") || (locStr.substr(1, 1) == "S")) {
              // We can't have "SAxxxx" or "ASxxxx".....
            } else {

              // Don't even try to show those outside of the extreme N/S bounds.....
              if ( (iLt >= 85) || ((iLt + dLt) < -85) ) {
                continue;
              }

              // Make some alterations for those on or near the extreme N/S bounds.....
              if ((iLt + dLt) > 85) {
                // Top of this block greater than 85, so set it to 85...
                dLt = 85 - iLt;
              } else if (iLt < -85) {
                // Bottom of this block less than -85, so set it to -85...
                iLt = 85;
              }
              var aPixNW = this._latLngToPixel((iLt + dLt), iLg);
              var aPixSE = this._latLngToPixel(iLt, (iLg + dLg));

              divX = Math.floor(aPixNW.x);
              divY = Math.floor(aPixNW.y);
              w = Math.floor(Math.abs(aPixNW.x - aPixSE.x));
              h = Math.floor(Math.abs(aPixNW.y - aPixSE.y));
              if (locAccuracy == 6) {
                dummy = 1;
              }
              //console.log("divX = " + divX + ", divY = " + divY);


              // But only create texts which will be visible in the viewport (ytop < ybottom).....
//              var cenX = divX + parseInt((w / 2));
//              var cenY = divY + parseInt((h / 2));
//              if ( (cenX >= (xl - 400)) && (cenX <= (xr + 400)) ) {
//                if ( (cenY >= (yt - 400)) && (cenY <= (yb + 400)) ) {



                  // To avoid the problems of having locator strings like "=N", ">N", "?N", "@N", etc.,
                  // which we get at the +180° / -180° date line, we check the string first...
                  if (locStr.substr(0, 1).match(/[A-R]/g)) {

                    label = this._addLabel(divX, divY, w, h, locStr, zoomLevel);

                  }



//                }
//              }
            }
          }  // for each latitude...
        }  // for each longitude...

    },


    /******************************************************/
    _addLatLine(lineY, xl, xr, thk) {
        const div = L.DomUtil.create('div', 'xxx', this._container);
        div.style.left = this._npx(xl);
        div.style.top = this._npx(lineY - Math.floor(thk / 2));
        div.style.width = this._npx(xr - xl);
        div.style.height = this._npx(thk);
        div.style.background = mapLocatorGridColor;
        div.style.opacity = 0.3;
        div.style.position = "absolute";
    },


    /******************************************************/
    _addLngLine(lineX, yt, yb, thk) {
        const div = L.DomUtil.create('div', 'xxx', this._container);
        div.style.left = this._npx(lineX - Math.floor(thk / 2));
        div.style.top = this._npx(yt);
        div.style.width = this._npx(thk);
        div.style.height = this._npx(yb - yt);
        div.style.background = mapLocatorGridColor;
        div.style.opacity = 0.3;
        div.style.position = "absolute";
    },


    /******************************************************/
    _addLabel(x, y, w, h, locStr, zl) {

        // Text-sizes depend on the zoom level, but vary in a
        // different manner than text-content. So do it here...
        let fs;
        if (zl < 2) {
          // This should not occur!...
          return;
        } else if ((zl >= 2) && (zl < 5)) {
          fs = Math.floor(w/(1.5*locStr.length));
        } else if (zl == 5) {
          fs = Math.floor(w/(locStr.length));
        } else if ((zl > 5) && (zl < 10)) {
          fs = Math.floor(w/(1.3*locStr.length));
        } else if (zl == 10) {
          fs = Math.floor(w*1.2/(locStr.length));
        } else if (zl >= 10) {
          fs = Math.floor(w/(1.1*locStr.length));
        }

        let txtTop = (h - (1.333 * fs)) / 2;
        //console.log("Height: ", h);


        /*  // Using a new L.marker...
        //let lblPos = [lat, lng];
        let pt = this._map.layerPointToContainerPoint([x, y]);
        let lblPos = this._map.containerPointToLatLng([pt.x, pt.y]);
        let lblHTML = '<div style="color:' + mapLocatorGridColor + '; font-family: Tahoma, Arial, Helvetica, sans-serif; font-weight:600; font-size:' + fs + 'px; text-align:center; padding-top:' + txtTop + 'px; width:' + w + 'px; height:' + h + 'px; border:3px solid red; opacity:0.8;">' + locStr + '</div>';
        label = L.marker(lblPos, {
          interactive: false,
          icon: L.divIcon({
            //className: "locator-grid-label",
            //html: locStr,
            html: lblHTML,
            iconAnchor: [0, 0],     // top-left corner...
            iconSize: null
          }),
        });   */


        console.log("x = " + x + ", y = " + y);

        // Using L.DomUtil div...
        const label = L.DomUtil.create('div', 'locator-grid-label', this._container);
        label.style.fontSize = this._npx(fs);
        label.style.left = this._npx(x);
        label.style.top  = this._npx(y + txtTop);
        label.style.width = this._npx(w);
        label.style.height = this._npx(h);
        label.innerHTML = locStr;
        label.style.color = mapLocatorGridColor;

        //return label;

    },


    /******************************************************/
    _latLngToPixel(lat, lng) {
        return this._map.latLngToLayerPoint([lat, lng]);
    },


    /******************************************************/
    _eqE(a, b, e) {
        if (!e) {
          e = Math.pow(10, -6);
        }
        if (Math.abs(a - b) < e) {
          return true;
        }
        return false;
    },


    /******************************************************/
    _npx(n) {
        return n.toString() + 'px';
    }


  });


  L.locatorGrid = function () {
    return new L.LocatorGrid();
  };

