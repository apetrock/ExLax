# ExLax

Quick and dirty project to serve MP4 files from npm and render them using Threejs.

## features

- Movies are served in the order they appear in the public/videos folder
- Videos can be linked via symlinkds
- Threejs shader fades between videos using hard coded duration
- JS Heap size seems to remain constant, so hopefully it will run stably 

## TODO
- instead of serving in file system order, allow user provide a manifest/playlist
- set duration in playlist, maybe globally
- one could potentially add more transition styles... but that would be making this thing too complicated
- remove dependency on threejs and react.  This would probably benefit from bare webgl and a static index page.
