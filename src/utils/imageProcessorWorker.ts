self.onmessage = async function (event: MessageEvent) {
  const { file, type } = event.data;
  if (type == 'thumbnail') {
    const { maxWidth, maxHeight } = event.data;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const imageBitmap = await createImageBitmap(new Blob([arrayBuffer]));

      let width = imageBitmap.width;
      let height = imageBitmap.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height *= maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width *= maxHeight / height));
          height = maxHeight;
        }
      }


      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageBitmap, 0, 0, width, height);
      } else {
        throw new Error('Failed to get 2D context');
      }
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.7 });
      const reader = new FileReader();

      reader.onload = () => {
        self.postMessage(reader.result);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      // 错误处理
      self.postMessage(null);
    }
  }
  if (type == 'base64') {
    // 将文件转换为dataURL
    const reader = new FileReader();
    reader.onload = () => {
      self.postMessage(reader.result);
    };
    reader.readAsDataURL(file);
  }
};
