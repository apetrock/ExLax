import logo from './logo.svg';
import './App.css';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VideoFaderComponent, VideoFader } from './video_fader';

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

function App() {

  const [vSrc0, setVSrc0] = useState(null);
  const [vSrc1, setVSrc1] = useState(null);

  const videoIndex = useRef(0);
  const divTargetRef = useRef(1);
  const [vlist, setVlist] = useState([]);
  const vlist_fetched = useRef(false);

  const [fade, setFade] = useState(0.0);
  const [textureRoute, setTextureRoute] = useState({ texture: null, index: 0 });
  const videoFaderRef = useRef(null);
  const [width, height] = useWindowSize();

  const fetch_vlist = async () => {
    if (vlist_fetched.current) return;
    vlist_fetched.current = true;

    if (!videoFaderRef.current)
      videoFaderRef.current = new VideoFader();

    return fetch('http://localhost:5000/videos').then(response => response.json()).then(data => {
      console.log("vlist: ", data);
      setVlist(data)
    });
  }

  useEffect(() => {
    fetch_vlist();
  }, []);

  useEffect(() => {
    if (vlist.length === 0) return; // no videos to play
    load_next();
  }, [vlist]);

  useEffect(() => {
    console.log("window size: ", width, height);
    if (videoFaderRef.current) {
      videoFaderRef.current.setWindowSize(width, height);
    }
  }, [width, height]);
  
  function load_next() {

    let next_src = `http://localhost:5000/video/${vlist[videoIndex.current]}`;
    console.log("loading next 1: ", divTargetRef.current, next_src)

    if (divTargetRef.current === 0) {
      setVSrc1(next_src);
      divTargetRef.current = 1;
    } else {
      setVSrc0(next_src);
      divTargetRef.current = 0;
    }

    videoIndex.current = (videoIndex.current + 1) % vlist.length;
  }

  const on_load = (e) => {
    //console.log("onload", e.target)
    let video = e.target;
    video.play();
    video.addEventListener('timeupdate', time_update);
    video.addEventListener('ended', on_end);
    video.next_loaded = false;
    video.div = divTargetRef.current;
    
    videoFaderRef.current.setVideoTexture(video, divTargetRef.current);
  }

  const time_update = (e) => {
    let video = e.target;
    let ctime = video.currentTime;
    let duration = video.duration;
    let tfrac = ctime / duration;

    let fade_duration = 5.0;
    let t_trans = duration - fade_duration;
    /*
    //naively fading in the time update is a bit jittery
    //so set a goal fade on the video fader instead
    if (ctime > t_trans && video.div != divTargetRef.current) {
      let t_dur = fade_duration - (duration - ctime);
      let t = t_dur / fade_duration;
      t = divTargetRef.current === 1 ? t : 1.0 - t;
      videoFaderRef.current.setFade(t);
    }
    */
    if (ctime > t_trans && !video.next_loaded) {
      video.next_loaded = true;
      let fade_goal = divTargetRef.current === 1 ? 0.0 : 1.0;
      videoFaderRef.current.setGoalFade(fade_goal, fade_duration);
      load_next();
    }
    return true;
  }

  const on_end = (e) => {
    let video = e.target;
    video.removeEventListener('timeupdate', time_update);
    video.removeEventListener('ended', on_end);
    video.src = "";
    if (video.parentNode)
      video.parentNode.removeChild(video);
  }

  return (
    <div className="App">
      <header className="App-header">
        <video src={vSrc0} crossOrigin="anonymous" style={{ display: 'none' }} muted
          onLoadedData={on_load}
        />
        <video src={vSrc1} crossOrigin="anonymous" style={{ display: 'none' }} muted
          onLoadedData={on_load} />
        <VideoFaderComponent videoFader={videoFaderRef.current} ></VideoFaderComponent>
      </header>
    </div>
  );
}

export default App;
