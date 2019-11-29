# React Image List Distort Component

Creates a threejs canvas which shows and distorts an image when you hover a listitem that wraps an image tag.

![preview image](https://github.com/KimPaow/react-image-list-distort/raw/master/src/images/preview.png)

## Installation

`npm install react-image-list-distort`

## Basic Usage

```js
import ImageDistort from "react-image-list-distort";

// You do not have to use ul/li tags, and you can insert other siblings. 
// What's important is the classnames and their hierarchy.
<ul className="myListRoot">
  <li className="myListItem">
    <img src="..." />
  </li>
  <li className="myListItem">
    <img src="..." />
  </li>
</ul>

<ImageDistort
  listRoot={".myListRoot"}
  itemRoot={".myListItem"}
  options={{
    strength: 0.2,
    effect: "stretch",
    geometry: {
      shape: "circle",
      radius: 0.5,
      segments: 128
    }
  }}
></ImageDistort>;
```

## Props

```js 
{String} itemRoot   // selector for the toplevel list item which holds the image
{String} listRoot   // Wrapper for the listItems in the shape of a css class selector.
{Object} [options]   // Object for option settings
{Number} [options.strength=0.25]   // How powerful the distort is
{String} [options.effect='']   // A string defining what extra effect to apply. Defaults to "redshift", can also pass "stretch"
{Object} [options.geometry]   // Object containing all options regarding the shape that holds the image
{String} [options.geometry.shape='circle'] // A string defining the shape of the geometry. Defaults to "circle", can also pass "plane". If circle then the image should be square.
{Number} [options.geometry.radius=0.6]   // A number defining the radius(size) of the shape. Only applicable when shape is 'circle'
{Number} [options.geometry.segments=64]   // Defines the number of segments of the shape when the shape is 'circle
{Number} [options.geometry.width=1]   // Defines the width of the shape when the shape is 'plane'
{Number} [options.geometry.height=1]   // Defines the height of the shape when the shape is 'plane'
{Number} [options.geometry.segmentsWidth=32]   // Defines the number of segments on the X-axis of the shape when the shape is 'plane'
{Number} [options.geometry.segmentsHeight=32]   // Defines the number of segments on the Y-axis of the shape when the shape is 'plane'
```
