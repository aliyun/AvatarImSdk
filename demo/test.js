import Media from '@ali/media-to-data'

const mediaLib = new Media({
  video: false,
  audio: true,
});

mediaLib.on('data', data => {
  const { audio, video } = data;
  // base64数据
  console.log(audio.data, video.data);
})

console.log('----------',navigator.mediaDevices.getUserMedia);
navigator.mediaDevices.getUserMedia({
  video: false,
  audio: true,
})
.then(function(stream) {
  mediaLib.setStream(stream);
});