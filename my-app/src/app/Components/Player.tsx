"use client"
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css'
import '@videojs/http-streaming'
import './Style.css'


export default function Player() {

  const [manifestUrl, serManifestUrl] = useState('');
  const [video, setVideo] = useState('');
  const videoRef = useRef(null);

  async function fetchManifest() {

    const formData = new FormData();
    formData.append('video', video);

    const res = await fetch('http://localhost:3007/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json();
    console.log(data.manifest)
    return data.manifest;
  }

  const handleVideoChange = (e: any) => {
    console.log(e.target.files[0]);
    setVideo(e.target.files[0]);
  }

  const handelSubmit = async (e: any) => {
    e.preventDefault();
    const manifest = await fetchManifest();
    console.log(manifest)
    serManifestUrl(`http://localhost:3007/stream/${manifest}`)
  }

  useEffect(() => {
    if (manifestUrl) {

      console.log(manifestUrl);
      const player = videojs(videoRef.current!, {
        controls: true, 
        sources: [
          {
            src: manifestUrl, 
            type: 'application/x-mpegURL', 
          },
        ],
      })
      return () => {
        if (player) {
          player.dispose();
        }
      }

    }
  }, [manifestUrl]);

  return (
    <div className="container">
  <form
    className="upload-form"
    action="http://localhost:3007/upload"
    method="post"
    encType="multipart/form-data"
    onSubmit={handelSubmit}
  >
    <input
      className="file-input"
      type="file"
      name="video"
      accept="video/mp4"
      onChange={handleVideoChange}
    />
    <button className="upload-button" type="submit">
      Upload
    </button>
  </form>

  <section className="video-container" style={{ width: "500px", height: "500px" }}>
    <video ref={videoRef} className="video-js vjs-default-skin" />
  </section>
</div>

  )
}
