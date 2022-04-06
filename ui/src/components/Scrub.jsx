import React, {useState, useEffect} from "react";

const noThumbnail = "/users/george/dev/asset_library/source/python/asset_library/icons/no_icon.png";

var style = {
  boxSizing: "border-box",
  width: "200px",
  height: "200px",
  borderRadius: "20px",
  border: "none"
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
function fit(value, sourceRangeMin, sourceRangeMax, targetRangeMin, targetRangeMax) {
  var targetRange = targetRangeMax - targetRangeMin;
  var sourceRange = sourceRangeMax - sourceRangeMin;
  return (value - sourceRangeMin) * targetRange / sourceRange + targetRangeMin;
}

export default function Scrub(props) {
  // const media = props.media;
  const thumbnail = props.thumbnail !== undefined ? props.thumbnail : noThumbnail;
  const [path, setPath] = useState(thumbnail);
  // const [progress, setProgress] = useState(0.5);

  useEffect(() => {
    setPath(thumbnail);
  }, []);

  const thumbnailStyle = {
    "borderRadius": "10px 10px 10px 10px",
    "backgroundImage": "url(ign://" + props.thumbnail + ")",
    "backgroundSize": "cover",
    "backgroundPosition": "center",
    "width": "100%",
    "height": props.size * 0.5625,
    "maxWidth": props.size,
    "position": "relative"
  };

  const barStyle = {
    "height": "100%",
    "width": "5px",
    "position": "absolute",
    "left": props.size * props.progress,
    "backgroundColor": "black"
  }

  // const handleMouseMove = (e) => {
  //   const rect = e.target.getBoundingClientRect();
  //   const width = (e.clientX - rect.left) / props.size;
  //   setProgress(width);
  //   console.log(progress);
  //   // frame = parseInt(fit(width, 0.1, 0.9, render.first, render.fend));
  //   // frame = clamp(frame, render.first, render.last);
  //   // setPath(render.path.replace("####", frame.toString()));
  // }

  return (
    <div style={thumbnailStyle} >
      <div style={barStyle} />
    </div>
    // <Paper onClick={handleClick} onMouseMove={handleMouseMove} elevation={3} style={{...style, width: props.size, height: props.size}}>
    //   <img src={`file://${path}`} className={classes.thumbnail}/>
    // </Paper>
  );
}
