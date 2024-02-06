const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();


app.use(cors()); // Enable CORS

app.use('/public', express.static('public', { followSymlinks: true }));

app.get('/videos', (req, res) => {
    const videosDirectory = path.join(__dirname, 'public', 'videos');
    fs.readdir(videosDirectory, (err, files) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        
        const mp4Files = files.filter(file => path.extname(file) === '.mp4');
        res.json(mp4Files);
    });
});

app.get('/video/:filename', (req, res) => {
    const videoPath = path.join(__dirname, 'public', 'videos', req.params.filename); // Modify this line with your video file name
    console.log("retrieving: ", videoPath);
    //const videoPath = 'path/to/your/video.mp4'; // Path to your video file
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));