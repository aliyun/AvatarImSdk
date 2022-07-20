import Media from '@ali/media-to-data';

const mediaLib = new Media({
  video: true,
  audio: true,
});

mediaLib.on('data', data => {
  const { audio, video } = data;
  // base64数据
  console.log(audio.data, video.data);
})

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
})
.then(function(stream) {
  mediaLib.setStream(stream);
});