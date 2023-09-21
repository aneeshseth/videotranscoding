import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
const app = express()
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const port = 3007;
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);


// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: false }));


// Multer Sotrage Engine
const storage = multer.diskStorage({
  destination: (res, file, cb) => {
    cb(null, './upload');
  },
  filename: (res, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
})

const upload = multer({ storage: storage });


// Routes
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    console.log(req.file);
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const inputFilePath = req.file.path;
    const outputDir = path.join(__dirname, 'public', 'hls');
    const outputFileName = `${Date.now()}.m3u8`;
    const convertTo = ['100k', '800k', '1200k', '2400k', '3000k'];
    const playlistEntries = [];
    await Promise.all(
      convertTo.map(async (bitrate) => {
        const outputFileName = `${Date.now()}_${bitrate}.m3u8`;
        const outputFilePath = path.join(outputDir, outputFileName);
        const ffmpegPromise = new Promise((resolve, reject) => {
          ffmpeg()
            .input(inputFilePath)
            .outputOptions([
              '-profile:v baseline',
              '-level 3.0',
              '-start_number 0',
              '-hls_time 4',
              '-hls_list_size 0',
              '-f hls',
            ])
            .output(outputFilePath)
            .videoBitrate(bitrate)
            .audioCodec('aac')
            .audioBitrate('128k')
            .on('end', () => {
              console.log(`Video Transcoding Complete: ${outputFileName}`);
              resolve(outputFileName);
            })
            .on('error', (err) => {
              console.error('Error transcoding:', err);
              reject(err);
            })
            .run();
        });
    
        const playlistEntry = {
          bitrate,
          url: `${outputFileName}`,
        };
    
        playlistEntries.push(playlistEntry);
        await ffmpegPromise;
      }))
      const masterPlaylistContent = playlistEntries.map((entry) => `#EXT-X-STREAM-INF:BANDWIDTH=${entry.bitrate},RESOLUTION=1280x720\n${entry.url}`)
        .join('\n');
    
      const masterPlaylistFilePath = path.join(outputDir, 'master.m3u8');
      fs.writeFileSync(masterPlaylistFilePath, masterPlaylistContent);
    
      res.status(200).json({ status: true, manifest: 'master.m3u8' });
    
  }
  catch (er) {
    console.log(er);
    res.status(500).json({status: false, msg: 'Error Trascoding'});
  }

})

app.get('/stream/:manifest', (req, res) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const manifestFileName = req.params.manifest;
  const manifestPath = path.join(__dirname, 'public', 'hls', manifestFileName);

  if ( !fs.existsSync(manifestPath) ) return res.status(400).json({status: false, msg: 'No Such Manifest file'});

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  fs.createReadStream(manifestPath).pipe(res);
})


app.listen(port, () => {
  console.log('Example app listening on port ', port)
})